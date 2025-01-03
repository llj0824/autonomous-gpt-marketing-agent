"""
FastAPI Backend Entry Point

This module serves as the main entry point for the FastAPI application.
It defines API endpoints for:
- Channel management (adding/listing YouTube channels)
- Video management (listing videos by channel)
- Highlight management (listing/updating video highlights)

The application uses SQLAlchemy for database operations and depends on
various utility modules for YouTube data processing.
"""

from fastapi import FastAPI, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, crud
from .init_database import SessionLocal, engine
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import logging
from .youtube_service import YoutubeService
from .enums import ProcessingStatus
from .llm_api_utils import LLM_API_Utils
import traceback
from yt_dlp import YoutubeDL
import os
from fastapi.responses import FileResponse
import re
from datetime import datetime
import zipfile


models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Highlight Review Application")

# Initialize services
youtube_service = YoutubeService()
llm_api_utils = LLM_API_Utils()


# If our frontend and backend are running on different origins, we need to enable CORS in the backend:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/add_channel", response_model=schemas.Channel)
async def create_channel(channel_handle: str, db: Session = Depends(get_db)):
    """Adds a channel and its recent videos"""
    try:
        logger.info(f"Attempting to create/update channel with handle: {channel_handle}")
        
        # Fetch channel and video data
        channel_data = await youtube_service.fetch_channel_data(channel_handle)
        
        # Create/update channel
        channel = await crud.create_or_update_channel(db, channel_handle)
        
        # Create/update each video
        for video_data in channel_data['videos']:
            await crud.create_or_update_video(db, video_data)
        
        return channel
        
    except Exception as e:
        logger.error(f"Error processing channel {channel_handle}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/channels", response_model=List[schemas.Channel])
def read_channels(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    channels = crud.get_channels(db, skip=skip, limit=limit)
    return channels

@app.get("/channels/{channel_id}/videos", response_model=List[schemas.Video])
def read_videos(channel_id: str, db: Session = Depends(get_db)):
    db_channel = crud.get_channel(db, channel_id=channel_id)
    if not db_channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    return db_channel.videos

@app.post("/videos/{video_id}/process")
async def process_video(video_id: str, db: Session = Depends(get_db)):
    """
    Initiates video processing:
    1. Fetches and stores transcript
    2. Generates highlights
    """
    logger.info(f"Starting video processing for video_id: {video_id}")
    
    # Check if video exists
    video = crud.get_video(db, video_id)
    if not video:
        logger.warning(f"Video not found with id: {video_id}")
        raise HTTPException(status_code=404, detail="Video not found")
        
        
    try:
        # Update status to processing
        logger.info(f"Setting video {video_id} status to PROCESSING")
        crud.update_video_processing_status(db, video_id, ProcessingStatus.PROCESSING)
        
        # 1. Fetch raw transcript
        logger.info(f"Fetching raw transcript for video {video_id}")
        raw_transcript = await youtube_service.fetch_raw_transcript(video_id)
        if not raw_transcript:
            raise Exception("Failed to fetch transcript from YouTube")
        logger.info(f"Successfully fetched raw transcript for video {video_id} (length: {len(raw_transcript)})")

        # 2. Process transcript
        logger.info(f"Starting parallel transcript processing for video {video_id}")
        processed_transcript = await llm_api_utils.process_transcript_in_parallel(raw_transcript)
        if not processed_transcript:
            raise Exception("Failed to process transcript")
        logger.info(f"Successfully processed transcript for video {video_id} (length: {len(processed_transcript)})")
        
        # 3. Store transcript
        logger.info(f"Saving transcript to database for video {video_id}")
        crud.create_or_update_transcript(
            db=db,
            video_id=video_id,
            raw_transcript=raw_transcript,
            processed_transcript=processed_transcript
        )
        logger.info(f"Successfully saved transcript for video {video_id}")
        
        # 4. Generate and store highlights
        logger.info(f"Starting highlight generation for video {video_id}")
        highlights = await llm_api_utils.generate_highlights(processed_transcript)
        for highlight in highlights:
            crud.create_highlight(
                db=db,
                video_id=video_id,
                highlight_data=highlight['content'],
                prompt=highlight['prompt'],
                    system_role=highlight['system_role']
            )
        logger.info(f"Successfully generated and stored highlights for video {video_id}")
        
        # Update status to completed
        logger.info(f"Setting video {video_id} status to COMPLETED")
        crud.update_video_processing_status(db, video_id, ProcessingStatus.COMPLETED)
        
        logger.info(f"Video processing completed successfully for video {video_id}")
        return {"message": "Video processing completed successfully"}
        
    except Exception as e:
        # Log the full exception with stack trace
        logger.error(f"Error processing video {video_id}: {str(e)}", exc_info=True)
        # Update status to failed
        crud.update_video_processing_status(db, video_id, ProcessingStatus.FAILED)
        # Raise HTTP exception with more detailed error information
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "type": type(e).__name__,
                "traceback": traceback.format_exc()
            }
        )

@app.get("/videos/{video_id}/status")
def get_video_status(video_id: str, db: Session = Depends(get_db)):
    """Returns the processing status of a video"""
    video = crud.get_video(db, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    return {
        "processing_status": video.processing_status,
        "has_transcript": video.transcript is not None,
        "highlight_count": len(video.highlights) if video.highlights else 0
    }

@app.get("/videos", response_model=List[schemas.Video])
def read_all_videos(
    filter_status: str = 'all',
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """
    Get videos with optional filtering by highlight status
    
    Args:
        filter_status: 'all', 'approved', or 'pending'
        skip: Pagination offset
        limit: Number of records to return
    """
    try:
        # Validate filter_status
        if filter_status not in ['all', 'approved', 'pending']:
            raise HTTPException(
                status_code=400, 
                detail="Invalid filter_status. Must be 'all', 'approved', or 'pending'"
            )
            
        # Get filtered videos
        videos = crud.get_videos_filterBy_highlightStatus(
            db, 
            filter_status=filter_status,
            skip=skip,
            limit=limit
        )
        
        return videos
        
    except Exception as e:
        logger.error(f"Error fetching videos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/videos/{video_id}", response_model=schemas.Video)
def read_video(video_id: str, db: Session = Depends(get_db)):
    try:
        logger.info(f"Fetching video with id: {video_id}")
        video = crud.get_video(db, video_id=video_id)
        if not video:
            logger.warning(f"Video not found with id: {video_id}")
            raise HTTPException(status_code=404, detail="Video not found")
        logger.info(f"Successfully fetched video: {video_id}")
        return video
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching video {video_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/videos/{video_id}/highlights", response_model=List[schemas.Highlight])
def read_highlights(video_id: str, db: Session = Depends(get_db)):
    db_video = crud.get_video(db, video_id=video_id)
    if not db_video:
        raise HTTPException(status_code=404, detail="Video not found")
    return db_video.highlights

@app.get("/videos/{video_id}/transcript")
def read_transcript(video_id: str, db: Session = Depends(get_db)):
    transcript = crud.get_transcript(db, video_id=video_id)
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")
    return {
        "raw_transcript": transcript.raw_transcript,
        "processed_transcript": transcript.processed_transcript
    }

@app.post("/add_video")
async def add_video(video_url: str, db: Session = Depends(get_db)):
    """Adds a single video by URL"""
    try:
        # Extract video ID from URL
        video_id = youtube_service.extract_video_id(video_url)
        if not video_id:
            raise HTTPException(status_code=400, detail="Invalid YouTube URL")
            
        # Fetch video metadata
        video_data = await youtube_service.fetch_video_metadata(video_id)
        
        # Create/update video and its channel
        video = await crud.create_or_update_video(
            db=db,
            video_data=video_data,
            fetch_recent_videos=False
        )
        
        # Process video
        await process_video(video.id, db)
        
        return {"message": "Video added successfully", "video_id": video.id}
        
    except Exception as e:
        logger.error(f"Error adding video: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/highlights/{highlight_id}", response_model=schemas.Highlight)
def update_highlight(highlight_id: str, highlight: schemas.HighlightUpdate, db: Session = Depends(get_db)):
    db_highlight = crud.get_highlight(db, highlight_id=highlight_id)
    if not db_highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")
    return crud.update_highlight(db=db, highlight_id=highlight_id, highlight=highlight)
    
@app.get("/videos/{video_id}/download")
async def download_video(video_id: str, db: Session = Depends(get_db)):
    """Download video using yt-dlp"""
    try:
        # Get video details
        video = crud.get_video(db, video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
            
        # Create downloads directory if it doesn't exist
        downloads_dir = "video_highlight_downloads"
        os.makedirs(downloads_dir, exist_ok=True)
        
        # Use video_id for internal filepath
        filepath = os.path.join(downloads_dir, f"{video_id}.mp4")
        
        # Download if file doesn't exist
        if not os.path.exists(filepath):
            ydl_opts = {
                'format': 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best',
                'cookiesfrombrowser': 'chrome',
                'outtmpl': filepath,
                'quiet': True,
                'merge_output_format': 'mp4',
                # Additional options for smaller file size
                'postprocessor_args': [
                    '-c:v', 'libx264',  # Use H.264 codec
                    '-crf', '28',       # Compression level (23-28 is good balance, higher = smaller file)
                    '-preset', 'slower', # Slower encoding = better compression
                    '-c:a', 'aac',      # Audio codec
                    '-b:a', '128k'      # Audio bitrate
                ]
            }
            with YoutubeDL(ydl_opts) as ydl:
                ydl.download([f"https://www.youtube.com/watch?v={video_id}"])
        
        return FileResponse(filepath, media_type='video/mp4')
        
    except Exception as e:
        logger.error(f"Error downloading video {video_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def time_to_seconds(time_str):
    """Convert HH:MM:SS to seconds"""
    h, m, s = map(int, time_str.split(':'))
    return h * 3600 + m * 60 + s

@app.get("/videos/{video_id}/download_clip")
async def download_video_clip(
    video_id: str, 
    start_time: str = Query(..., regex=r"^\d{2}:\d{2}:\d{2}$"),
    end_time: str = Query(..., regex=r"^\d{2}:\d{2}:\d{2}$"),
    db: Session = Depends(get_db)
):  # Note: This endpoint does not work when using VeePN VPN service
    """
    Download a specific clip of the video.

    Expected time format for `start_time` and `end_time`: HH:MM:SS
    e.g. 00:01:10 (for 1 minute and 10 seconds in), up to 99:59:59 if needed.
    """
    try:
        # Validate video existence
        video = crud.get_video(db, video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Create downloads directory
        downloads_dir = "video_highlight_downloads"
        os.makedirs(downloads_dir, exist_ok=True)
        
        # Create unique filename for the clip
        safe_title = sanitize_filename(video.title)
        base_filename = f"{video_id}_clip_{start_time}-{end_time}_{safe_title}"
        video_filepath = os.path.join(downloads_dir, f"{base_filename}.mp4")
        srt_filepath = os.path.join(downloads_dir, f"{base_filename}.srt")
        
        if not os.path.exists(video_filepath):
            # Convert time strings to seconds for the download_ranges callback
            start_seconds = time_to_seconds(start_time)
            end_seconds = time_to_seconds(end_time)
            
            def download_range_callback(info_dict, ydl):
                return [{
                    'start_time': start_seconds,
                    'end_time': end_seconds,
                }]

            ydl_opts = {
                'format': 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best',
                'outtmpl': video_filepath,
                'quiet': True,
                'merge_output_format': 'mp4',
                'download_ranges': download_range_callback,
                'force_keyframes_at_cuts': True,
                'cookies_from_browser': ('chrome',),
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                # Additional options for smaller file size
                'postprocessor_args': [
                    '-c:v', 'libx264',     # Video codec - H.264 for wide compatibility
                    '-crf', '28',          # Constant Rate Factor - Higher value (18-28) means smaller file but lower quality
                    '-preset', 'slower',    # Encoding speed preset - Slower = better compression but longer encoding time
                    '-c:a', 'aac',         # Audio codec - AAC for good quality and compatibility
                    '-b:a', '128k'         # Audio bitrate - Lower = smaller file but reduced audio quality
                ]
            }
            
            with YoutubeDL(ydl_opts) as ydl:
                ydl.download([f"https://www.youtube.com/watch?v={video_id}"])
            
            # Also download subtitles
            ydl_opts_subs = {
                'writesubtitles': True,
                'writeautomaticsub': True,
                'subtitlesformat': 'srt',
                'skip_download': True,
                'outtmpl': srt_filepath,
                'quiet': True,
            }
            
            with YoutubeDL(ydl_opts_subs) as ydl:
                ydl.download([f"https://www.youtube.com/watch?v={video_id}"])
            
            # Find and process the subtitle file
            temp_srt = os.path.join(downloads_dir, f'temp_{video_id}.en.srt')
            if not os.path.exists(temp_srt):
                temp_srt = os.path.join(downloads_dir, f'temp_{video_id}.srt')
            
            if os.path.exists(temp_srt):
                # Process subtitles for the clip timerange
                start_seconds = time_to_seconds(start_time)
                end_seconds = time_to_seconds(end_time)
                
                with open(temp_srt, 'r', encoding='utf-8') as f:
                    srt_content = f.read()
                
                # Parse and filter subtitles
                trimmed_subs = []
                current_block = []
                counter = 1
                
                for line in srt_content.split('\n'):
                    if line.strip():
                        current_block.append(line)
                    elif current_block:
                        if len(current_block) >= 3:
                            time_line = current_block[1]
                            times = time_line.split(' --> ')
                            sub_start = time_to_seconds(times[0].replace(',', '.').split('.')[0])
                            
                            if start_seconds <= sub_start <= end_seconds:
                                adjusted_block = [
                                    str(counter),
                                    time_line,
                                    *current_block[2:]
                                ]
                                trimmed_subs.extend(adjusted_block)
                                trimmed_subs.append('')
                                counter += 1
                        current_block = []
                
                # Write trimmed subtitles
                with open(srt_filepath, 'w', encoding='utf-8') as f:
                    f.write('\n'.join(trimmed_subs))
                
                # Clean up temp files
                if os.path.exists(temp_srt):
                    os.remove(temp_srt)
        
        # Create a ZIP file containing both the video and subtitles
        zip_filepath = os.path.join(downloads_dir, f"{base_filename}.zip")
        with zipfile.ZipFile(zip_filepath, 'w') as zipf:
            zipf.write(video_filepath, os.path.basename(video_filepath))
            if os.path.exists(srt_filepath):
                zipf.write(srt_filepath, os.path.basename(srt_filepath))
        
        return FileResponse(
            zip_filepath,
            media_type='application/zip',
            filename=f"{base_filename}.zip"
        )
        
    except Exception as e:
        logger.error(f"Error downloading clip for video {video_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def sanitize_filename(filename):
    """Remove invalid characters from filename"""
    # Replace invalid characters with underscore
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove any non-ASCII characters
    filename = ''.join(char for char in filename if ord(char) < 128)
    return filename.strip()

@app.post("/highlights/{highlight_id}/regenerate")
async def regenerate_highlight(
    highlight_id: str,
    system_role: str = Body(...),
    db: Session = Depends(get_db)
):
    """
    Regenerate a highlight using the same prompt but with potentially modified system role.
    
    Args:
        highlight_id: ID of the highlight to regenerate
        system_role: Modified system role for generation
        
    Returns:
        The newly generated highlight content
    """
    try:
        # Get existing highlight
        highlight = crud.get_highlight(db, highlight_id=highlight_id)
        if not highlight:
            raise HTTPException(status_code=404, detail="Highlight not found")
            
        logger.info(f"Regenerating highlight {highlight_id}")
        
        # Generate new highlight using existing prompt but new system role
        new_highlight = await llm_api_utils.regenerate_single_highlight(
            prompt=highlight.prompt,
            system_role=system_role
        )
        
        return {
            "id": highlight_id,
            "content": new_highlight['content'],
            "prompt": highlight.prompt,
            "system_role": system_role
        }
        
    except Exception as e:
        logger.error(f"Error regenerating highlight {highlight_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "type": type(e).__name__,
                "traceback": traceback.format_exc()
            }
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
