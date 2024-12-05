"""
Database Models

This module defines SQLAlchemy ORM models for the application:
- Channel: YouTube channel information
- Video: Individual video metadata
- Highlight: Extracted video highlights with review status

These models represent the database schema and relationships between
different entities in the application.
"""

from datetime import datetime
from typing import List
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from .init_database import Base

class Channel(Base):
    __tablename__ = 'channels'
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    url = Column(String)
    last_checked = Column(DateTime, default=datetime.utcnow)

    videos = relationship("Video", back_populates="channel")

class Video(Base):
    __tablename__ = 'videos'
    id = Column(String, primary_key=True)
    channel_id = Column(String, ForeignKey('channels.id'))
    title = Column(String)
    duration = Column(Integer)
    processed_at = Column(DateTime, nullable=True)
    url = Column(String)
    thumbnail_url = Column(String)

    channel = relationship("Channel", back_populates="videos")    
    highlights = relationship("Highlight", back_populates="video")

class Highlight(Base):
    __tablename__ = 'highlights'
    id = Column(String, primary_key=True, index=True)
    video_id = Column(String, ForeignKey('videos.id'))
    time_start = Column(Integer)
    time_end = Column(Integer)
    topic = Column(Text)
    quote = Column(Text)
    insight = Column(Text)
    takeaway = Column(Text)
    context = Column(Text)
    status = Column(String, CheckConstraint("status IN ('pending', 'approved', 'rejected')"))
    comments = Column(Text)
    reviewed_at = Column(DateTime)

    video = relationship("Video", back_populates="highlights")

class Transcript(Base):
    __tablename__ = "transcripts"
    id = Column(Integer, primary_key=True)
    video_id = Column(String, ForeignKey("videos.id"))
    raw_content = Column(Text)
    processed_content = Column(Text)
    processing_status = Column(String)  # pending, processing, completed, failed
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
