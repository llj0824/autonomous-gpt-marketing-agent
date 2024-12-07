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
from .enums import ProcessingStatus, HighlightStatus
from .schemas import Channel, Video, Highlight, Transcript
from uuid import uuid4

class Channel(Base):
    __tablename__ = 'channels'
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    url = Column(String)
    last_checked = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    videos = relationship("Video", back_populates="channel")

    def to_dataclass(self) -> Channel:
        """Convert ORM model to dataclass"""
        return Channel(
            id=self.id,
            name=self.name,
            url=self.url,
            last_checked=self.last_checked,
            videos=[v.to_dataclass() for v in self.videos]
        )

class Video(Base):
    __tablename__ = 'videos'
    id = Column(String, primary_key=True)
    channel_id = Column(String, ForeignKey('channels.id'))
    title = Column(String)
    duration = Column(Integer)
    processed_at = Column(DateTime, nullable=True)
    processing_status = Column(
        String, 
        CheckConstraint(f"processing_status IN {tuple(ProcessingStatus.__members__.values())}"),
        default=ProcessingStatus.PENDING.value,
        nullable=True
    )
    url = Column(String)
    thumbnail_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)
    channel = relationship("Channel", back_populates="videos")    
    highlights = relationship("Highlight", back_populates="video")

    @property
    def status(self):
        """Returns PENDING if status is NULL"""
        return ProcessingStatus(self.processing_status) if self.processing_status else ProcessingStatus.PENDING

    def to_dataclass(self) -> Video:
        """Convert ORM model to dataclass"""
        return Video(
            id=self.id,
            channel_id=self.channel_id,
            title=self.title,
            duration=self.duration,
            url=self.url,
            thumbnail_url=self.thumbnail_url,
            processed_at=self.processed_at,
            processing_status=self.processing_status,
            highlights=[h.to_dataclass() for h in self.highlights]
        )

class Highlight(Base):
    __tablename__ = 'highlights'
    id = Column(String, primary_key=True, index=True)
    video_id = Column(String, ForeignKey('videos.id'))
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)
    
    video = relationship("Video", back_populates="highlights")

    def to_dataclass(self) -> Highlight:
        """Convert ORM model to dataclass"""
        return Highlight(
            id=self.id,
            video_id=self.video_id,
            content=self.content
        )

class Transcript(Base):
    __tablename__ = "transcripts"
    id = Column(Integer, primary_key=True)
    video_id = Column(String, ForeignKey("videos.id"))
    raw_transcript = Column(Text)
    processed_transcript = Column(Text)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
