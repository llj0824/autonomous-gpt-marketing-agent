"""
Pydantic Schemas

This module defines the Pydantic models used for:
- Request/response validation
- Data serialization/deserialization
- API documentation

These schemas mirror the database models but are specifically for API interactions.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# Channel Schemas
class ChannelBase(BaseModel):
    name: str
    url: str

class ChannelCreate(ChannelBase):
    id: str

class Channel(ChannelBase):
    id: str
    last_checked: datetime

    class Config:
        from_attributes = True

# Video Schemas
class VideoBase(BaseModel):
    title: str
    duration: int

class VideoCreate(VideoBase):
    id: str
    channel_id: str

class Video(VideoBase):
    id: str
    channel_id: str
    processed_at: datetime

    class Config:
        from_attributes = True

# Highlight Schemas
class HighlightBase(BaseModel):
    time_start: int
    time_end: int
    topic: str
    quote: str
    insight: str
    takeaway: str
    context: str

class HighlightCreate(HighlightBase):
    video_id: str

class HighlightUpdate(BaseModel):
    status: str
    comments: Optional[str] = None

class Highlight(HighlightBase):
    id: str
    video_id: str
    status: str
    comments: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True