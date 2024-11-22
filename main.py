from fastapi import FastAPI
from youtube_transcript_retriever import YoutubeTranscriptRetriever
from transcript_processor import process_transcript
from logger import Logger

app = FastAPI()
logger = Logger()
retriever = YoutubeTranscriptRetriever()

@app.get("/process_video/{video_id}")
async def process_video(video_id: str):
    # Step 1: Retrieve video metadata and description
    video_metadata = await retriever.get_video_metadata(video_id)
    
    # Step 2: Get autogenerated transcript
    transcript = await retriever.get_transcript(video_id)
    
    # Step 3: Process transcript (time-segmented)
    processed_transcript = process_transcript(transcript)
    
    # Step 4: Log the information
    await logger.log_event(
        logger.EVENTS['TRANSCRIPT_RETRIEVAL_ATTEMPT'],
        {
            logger.FIELDS['VIDEO_ID']: video_id,
            logger.FIELDS['TRANSCRIPT_LENGTH']: len(transcript)
        }
    )
    
    return {
        "video_metadata": video_metadata,
        "processed_transcript": processed_transcript
    } 