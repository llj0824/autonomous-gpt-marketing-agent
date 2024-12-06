"""
Pydantic Schemas

This module defines the Pydantic models used for:
- API Request/response validation
- Data serialization/deserialization
- API documentation

These schemas mirror the database models but are specifically for API interactions.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from .enums import ProcessingStatus

# Highlight Schemas
class HighlightBase(BaseModel):
    id: str
    video_id: str
    content: str

class HighlightCreate(BaseModel):
    video_id: str
    content: str

class HighlightUpdate(BaseModel):
    content: Optional[str]

class Highlight(HighlightBase):
    class Config:
        from_attributes = True

# Video Schemas
class VideoBase(BaseModel):
    title: str
    duration: int
    url: str
    thumbnail_url: str

class VideoCreate(VideoBase):
    id: str
    channel_id: str

class Video(VideoBase):
    id: str
    channel_id: str
    processing_status: Optional[str] = None
    processed_at: Optional[datetime] = None
    highlights: List[Highlight] = []

    class Config:
        from_attributes = True

# Channel Schemas
class ChannelBase(BaseModel):
    name: str
    url: str

class ChannelCreate(ChannelBase):
    id: str

class Channel(ChannelBase):
    id: str
    last_checked: datetime
    videos: List[Video] = []

    class Config:
        from_attributes = True

# Add these new schemas
class TranscriptBase(BaseModel):
    video_id: str
    raw_transcript: str
    processed_transcript: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class TranscriptCreate(BaseModel):
    video_id: str
    raw_transcript: str

class Transcript(TranscriptBase):
    id: int

    class Config:
        from_attributes = True
