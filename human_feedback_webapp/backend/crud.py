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
from datetime import datetime

# Channel operations
def get_channel(db: Session, channel_id: str):
    return db.query(models.Channel).filter(models.Channel.id == channel_id).first()

def get_channels(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Channel).offset(skip).limit(limit).all()

def create_channel(db: Session, channel: schemas.ChannelCreate):
    db_channel = models.Channel(**channel.dict())
    db.add(db_channel)
    db.commit()
    db.refresh(db_channel)
    return db_channel

# Video operations
def get_video(db: Session, video_id: str):
    return db.query(models.Video).filter(models.Video.id == video_id).first()

def create_video(db: Session, video_metadata: dict):
    db_video = models.Video(**video_metadata)
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    return db_video

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