"""
Database CRUD Operations

This module provides Create, Read, Update, Delete operations for:
- Channels
- Videos
- Highlights

It uses SQLAlchemy for database operations and handles all direct
database interactions for the application.
"""

from sqlalchemy.orm import Session
from typing import List
from . import models, schemas
from datetime import datetime, timezone
from .youtube_service import YoutubeService
from .enums import ProcessingStatus

# Add at the top of the file, after the imports
MAX_VIDEOS_PER_CHANNEL = 10  # Configurable constant

# Create a module-level instance of YoutubeService
youtube_service = YoutubeService()

# Channel operations
def get_channel(db: Session, channel_id: str):
    return db.query(models.Channel).filter(models.Channel.id == channel_id).first()

def get_channels(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Channel).offset(skip).limit(limit).all()

async def create_or_update_channel(db: Session, channel_handle: str):
    """
    Creates or updates a channel and its videos by fetching data from YouTube.
    Limited to MAX_VIDEOS_PER_CHANNEL most recent videos.
    
    Args:
        db: Database session
        channel_handle: YouTube channel handle (e.g. "@Bankless")
    """
    try:
        # Fetch data from YouTube
        channel_data = await YoutubeService.fetch_channel_data(channel_handle)
        
        # Create/update channel
        db_channel = models.Channel(
            id=channel_handle,
            name=channel_data['metadata']['title'],
            url=f"https://www.youtube.com/{channel_handle}",
            last_checked=datetime.now(timezone.utc)
        )
        db.merge(db_channel)
        
        # Create/update videos (limited to MAX_VIDEOS_PER_CHANNEL)
        for video in channel_data['videos'][:MAX_VIDEOS_PER_CHANNEL]:
            duration = parse_duration(video.get('duration', '0:00'))
            db_video = models.Video(
                id=video['videoId'],
                channel_id=channel_handle,
                title=video['title'],
                duration=duration,
                url=f"https://www.youtube.com/watch?v={video['videoId']}",
                thumbnail_url=video.get('thumbnailUrl', '')
            )
            db.merge(db_video)
            
        db.commit()
        return db_channel
        
    except Exception as e:
        db.rollback()
        raise Exception(f"Failed to create/update channel: {str(e)}")

# Video operations
def create_or_update_videos(db: Session, videos_data: list, channel_id: str):
    for video in videos_data:
        duration = parse_duration(video.get('duration', '0:00'))
        db_video = models.Video(
            id=video['videoId'],
            channel_id=channel_id,
            title=video['title'],
            duration=duration,
            url=video['url'],
            thumbnail_url=video['thumbnailUrl']
        )
        db.merge(db_video)
    db.commit()

def get_video(db: Session, video_id: str):
    return db.query(models.Video).filter(models.Video.id == video_id).first()

def create_video(db: Session, video_metadata: dict):
    db_video = models.Video(**video_metadata)
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    return db_video

# Hydration function
async def hydrate_channel_and_videos(db: Session, channel_handle: str):
    """
    Fetches channel and video data using YoutubeTranscriptRetriever and stores them.
    """
    # Fetch data from YouTube
    channel_data = await youtube_service.fetch_channel_data(channel_handle)

    # Prepare channel metadata
    metadata = channel_data['metadata']
    channel_dict = {
        'id': channel_handle,  # Assuming the handle as the channel ID
        'name': metadata['title'],
        'url': f"https://www.youtube.com/{channel_handle}"
    }

    # Store or update the channel
    db_channel = create_or_update_channel(db, channel_dict)

    # Store or update videos
    videos_data = channel_data['videos']
    create_or_update_videos(db, videos_data, db_channel.id)

# Highlight operations
def get_highlight(db: Session, highlight_id: str):
    return db.query(models.Highlight).filter(models.Highlight.id == highlight_id).first()

def create_highlight(db: Session, video_id: str, highlight_data: dict):
    db_highlight = models.Highlight(**highlight_data, video_id=video_id)
    db.add(db_highlight)
    db.commit()
    db.refresh(db_highlight)
    return db_highlight

def update_highlight(db: Session, highlight_id: str, highlight: schemas.HighlightUpdate):
    db_highlight = get_highlight(db, highlight_id)
    update_data = highlight.dict(exclude_unset=True)
    update_data['reviewed_at'] = datetime.utcnow()
    
    for key, value in update_data.items():
        setattr(db_highlight, key, value)
    
    db.commit()
    db.refresh(db_highlight)
    return db_highlight

def get_all_videos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Video).offset(skip).limit(limit).all()

# Helper functions to parse data
def parse_duration(duration_str: str) -> int:
    """Converts duration string (HH:MM:SS or MM:SS) to seconds."""
    parts = duration_str.split(':')
    if len(parts) == 2:
        m, s = parts
        h = 0
    else:
        h, m, s = parts
    return int(h) * 3600 + int(m) * 60 + int(s)

def get_transcript(db: Session, video_id: str):
    db_transcript = db.query(models.Transcript).filter(models.Transcript.video_id == video_id).first()
    if db_transcript:
        return schemas.Transcript(id=db_transcript.id, video_id=video_id, transcript=db_transcript.content)
    else:
        return None

def create_or_update_transcript(db: Session, video_id: str, raw_transcript: str, processed_transcript: str):
    """
    Creates or updates a transcript for a video
    
    Args:
        db: Database session
        video_id: Video ID
        raw_content: Raw transcript content from YouTube
    """
    # Check if transcript exists
    db_transcript = db.query(models.Transcript).filter(
        models.Transcript.video_id == video_id
    ).first()
    
    if db_transcript:
        # Update existing transcript
        db_transcript.raw_transcript = raw_transcript
        db_transcript.processed_transcript = processed_transcript
        db_transcript.updated_at = datetime.now(timezone.utc)
    else:
        # Create new transcript, not yet processed.
        db_transcript = models.Transcript(
            video_id=video_id,
            raw_transcript=raw_transcript,
            processing_status=ProcessingStatus.PENDING,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(db_transcript)
    
    db.commit()
    return db_transcript

def update_video_processing_status(db: Session, video_id: str, status: ProcessingStatus):
    """
    Updates the processing status of a video
    
    Args:
        db: Database session
        video_id: Video ID
        status: ProcessingStatus enum value： "pending", "processing", "completed", "failed"
    """
    db_video = get_video(db, video_id)
    if db_video:
        db_video.processing_status = status
        db_video.processed_at = datetime.now(timezone.utc) if status == ProcessingStatus.COMPLETED else None
        db.commit()
        return db_video
    return None
