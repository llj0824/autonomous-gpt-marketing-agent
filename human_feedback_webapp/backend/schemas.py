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
    time_start: int
    time_end: int
    topic: Optional[str]
    quote: Optional[str]
    insight: Optional[str]
    takeaway: Optional[str]
    context: Optional[str]
    status: Optional[str]
    comments: Optional[str]

class HighlightCreate(HighlightBase):
    video_id: str

class HighlightUpdate(BaseModel):
    topic: Optional[str]
    quote: Optional[str]
    insight: Optional[str]
    takeaway: Optional[str]
    context: Optional[str]
    status: Optional[str]
    comments: Optional[str]

class Highlight(HighlightBase):
    id: str
    video_id: str
    status: str
    comments: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        orm_mode = True

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
    processing_status: ProcessingStatus
    created_at: datetime
    updated_at: datetime

class TranscriptCreate(BaseModel):
    video_id: str
    raw_transcript: str

class Transcript(TranscriptBase):
    id: int

    class Config:
        from_attributes = True
