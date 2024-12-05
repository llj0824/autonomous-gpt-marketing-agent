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

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, crud
from .init_database import SessionLocal, engine
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import logging
from .youtube_service import YoutubeService
from .highlight_generator import HighlightGenerator
from .enums import ProcessingStatus


models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Highlight Review Application")

# Initialize services
youtube_service = YoutubeService()
highlight_generator = HighlightGenerator()


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
    try:
        logger.info(f"Attempting to create/update channel with handle: {channel_handle}")
        result = await crud.create_or_update_channel(db, channel_handle)
        logger.info(f"Successfully processed channel: {channel_handle}")
        return result
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
    # Check if video exists
    video = crud.get_video(db, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    # Check if already processing
    if video.processing_status == ProcessingStatus.PROCESSING:
        raise HTTPException(status_code=400, detail="Video is already being processed")
        
    try:
        # Update status to processing
        crud.update_video_processing_status(db, video_id, ProcessingStatus.PROCESSING)
        
        # Fetch and store transcript
        transcript = await youtube_service.fetch_parsed_transcript(video_id)
        crud.create_or_update_transcript(db, video_id, transcript)
        
        # Generate highlights
        await highlight_generator.generate_highlights(video_id, db)
        
        # Update status to completed
        crud.update_video_processing_status(db, video_id, ProcessingStatus.COMPLETED)
        
        return {"message": "Video processing completed successfully"}
        
    except Exception as e:
        # Update status to failed
        crud.update_video_processing_status(db, video_id, ProcessingStatus.FAILED)
        raise HTTPException(status_code=500, detail=str(e))

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
def read_all_videos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_all_videos(db, skip=skip, limit=limit)

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

@app.put("/highlights/{highlight_id}", response_model=schemas.Highlight)
def update_highlight(highlight_id: str, highlight: schemas.HighlightUpdate, db: Session = Depends(get_db)):
    db_highlight = crud.get_highlight(db, highlight_id=highlight_id)
    if not db_highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")
    return crud.update_highlight(db=db, highlight_id=highlight_id, highlight=highlight)

@app.get("/videos/{video_id}/transcript")
def read_transcript(video_id: str, db: Session = Depends(get_db)):
    transcript = crud.get_transcript(db, video_id=video_id)
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")
    return {
        "raw_transcript": transcript.raw_content,
        "processed_transcript": transcript.processed_content,
        "processing_status": transcript.processing_status
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
