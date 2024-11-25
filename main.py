from fastapi import FastAPI, HTTPException
from highlight_analyzer import HighlightAnalyzer
from youtube_transcript_retriever import YoutubeTranscriptRetriever
from transcript_processor import process_transcript
from logger import Logger
import time

app = FastAPI()
logger = Logger()
retriever = YoutubeTranscriptRetriever()
analyzer = HighlightAnalyzer()

@app.get("/process_video/{video_id}")
async def process_video(video_id: str):
    start_time = time.time()
    
    try:
        # Step 1: Retrieve video metadata and transcript
        video_metadata = await retriever.get_video_metadata(video_id)
        transcript = await retriever.get_transcript(video_id)
        
        # Step 2: Process transcript into segments
        processed_segments = process_transcript(transcript)
        
        # Step 3: Analyze segments for highlights
        analyzed_segments = await analyzer.analyze_transcript(processed_segments)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Log success
        await logger.log_event(
            logger.EVENTS['PROCESS_TRANSCRIPT_SUCCESS'],
            {
                logger.FIELDS['VIDEO_ID']: video_id,
                logger.FIELDS['PROCESSING_TIME']: processing_time,
                logger.FIELDS['SUCCESS']: True
            }
        )
        
        return {
            "status": "success",
            "processing_time_seconds": processing_time,
            "data": {
                "video_metadata": video_metadata,
                "highlights": analyzed_segments[:5],  # Top 5 highlights
                "all_segments": analyzed_segments,
                "statistics": {
                    "total_segments": len(analyzed_segments),
                    "highlight_worthy_segments": sum(
                        1 for seg in analyzed_segments 
                        if seg['analysis']['highlight_worthy']
                    )
                }
            }
        }
    except Exception as e:
        await logger.log_event(
            logger.EVENTS['PROCESS_TRANSCRIPT_FAILURE'],
            {
                logger.FIELDS['VIDEO_ID']: video_id,
                logger.FIELDS['ERROR']: str(e)
            }
        )
        raise HTTPException(status_code=500, detail=str(e))
