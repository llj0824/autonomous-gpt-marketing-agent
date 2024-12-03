"""
Highlight Generation Service

This module handles the automatic generation of video highlights by:
1. Retrieving video transcripts from YouTube
2. Processing transcripts into meaningful segments
3. Analyzing segments to identify potential highlights
4. Saving highlights to the database

It works asynchronously to handle multiple videos efficiently.
"""

import asyncio
from typing import List
from .youtube_transcript_retriever import YoutubeTranscriptRetriever
from .transcript_processor import process_transcript
from .highlight_analyzer import HighlightAnalyzer
from . import crud
from sqlalchemy.orm import Session

async def generate_highlights(video_id: str, db: Session):
    retriever = YoutubeTranscriptRetriever()
    analyzer = HighlightAnalyzer()

    # Step 1: Retrieve video metadata and transcript
    video_metadata = await retriever.get_video_metadata(video_id)
    transcript = await retriever.get_transcript(video_id)

    # Step 2: Process transcript into segments
    processed_segments = process_transcript(transcript)

    # Step 3: Analyze segments for highlights
    analyzed_segments = await analyzer.analyze_transcript(processed_segments)

    # Save video and highlights to the database
    db_video = crud.create_video(db, video_metadata)
    for segment in analyzed_segments:
        crud.create_highlight(db, video_id=db_video.id, highlight_data=segment)