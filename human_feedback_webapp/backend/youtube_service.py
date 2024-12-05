from dataclasses import dataclass
from datetime import datetime
import asyncio
from typing import List, Optional, Dict, Any
import httpx
import re
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class YouTubeError(Exception):
    """Base exception for YouTube service errors"""
    pass

@dataclass(frozen=True)
class CaptionTrack:
    """Represents a single caption/subtitle track"""
    base_url: str
    name: str
    language_code: str

# Move constants to module level
TRANSCRIPT_SECTION = "*** Transcript ***"
CONTEXT_SECTION = "*** Background Context ***"

class YoutubeService:
    """
    Fetches and parses YouTube video transcripts and metadata.
    
    Key HTML/JSON Structure:
    1. Core Video Metadata (ytInitialData)
       - videoDetails: {videoId, title, lengthSeconds, channelId, author, viewCount, description}
       - Located in <script>ytInitialData = {...}</script>
    
    2. Player Configuration (ytInitialPlayerResponse) 
       - playabilityStatus: Video permissions
       - streamingData: Available video/audio formats
       - captions: Subtitle/CC track information
       - Located in <script>ytInitialPlayerResponse = {...}</script>
    
    3. Transcript/Caption Structure:
       captions: {
           playerCaptionsTracklistRenderer: {
               captionTracks: [
                   {
                       baseUrl: str,  # URL to fetch transcript XML
                       name: str,     # Language name
                       languageCode: str
                   }
               ]
           }
       }
    
    4. Important DOM Elements:
       - #player: Video player container
       - #watch7-content: Video metadata
       - #watch7-sidebar: Related videos
       - #comments: Comments section
    
    5. Metadata Tags:
       - <meta property="og:title">
       - <meta property="og:description">
       - <meta property="og:image">
       - <link rel="canonical">
       - <script type="application/ld+json">
    
    Note: YouTube's HTML structure may change. If transcript retrieval fails,
    check for updates to:
    1. ytInitialPlayerResponse location/structure
    2. Caption track format in playerCaptionsTracklistRenderer
    3. Changes to video page HTML structure
    """

    # Regex patterns for video ID extraction
    VIDEO_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_-]{11}$')
    VIDEO_URL_PATTERN = re.compile(
        r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})'
    )

    async def fetch_channel_data(self, channel_handle: str) -> Dict[str, Any]:
        """
        Fetches channel metadata and recent videos.
        
        Args:
            channel_handle: Channel handle (e.g. "@Bankless")
            
        Returns:
            Dictionary containing channel metadata and videos
        """
        channel_url = f"https://www.youtube.com/{channel_handle}/videos"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(channel_url)
            if not response.is_success:
                raise YouTubeError(f"Failed to fetch channel: {response.status_code}")

            # Extract ytInitialData
            match = re.search(r'var\s+ytInitialData\s*=\s*({.+?});</script>', response.text)
            if not match:
                raise YouTubeError('Channel data not found')
            
            data = json.loads(match.group(1))
            
            # Extract channel metadata
            channel_metadata = data['metadata']['channelMetadataRenderer']
            metadata = {
                'title': channel_metadata['title'],
                'description': channel_metadata.get('description', ''),
                'thumbnailUrl': channel_metadata['avatar']['thumbnails'][-1]['url']
            }
            
            # Extract videos
            videos = []
            try:
                tabs = data['contents']['twoColumnBrowseResultsRenderer']['tabs']
                videos_tab = next(tab for tab in tabs 
                                if 'tabRenderer' in tab 
                                and tab['tabRenderer'].get('title') == 'Videos')
                
                video_items = (videos_tab['tabRenderer']['content']
                              ['richGridRenderer']['contents'])
                
                for item in video_items:
                    if 'richItemRenderer' not in item:
                        continue
                        
                    video = item['richItemRenderer']['content']['videoRenderer']
                    videos.append({
                        'videoId': video['videoId'],
                        'title': video['title']['runs'][0]['text'],
                        'url': f"https://www.youtube.com/watch?v={video['videoId']}",
                        'thumbnailUrl': video['thumbnail']['thumbnails'][-1]['url'],
                        'duration': video.get('lengthText', {}).get('simpleText', 'N/A')
                    })
            except Exception as e:
                logger.error(f'Error parsing video data: {str(e)}')
                raise YouTubeError(f'Error parsing video data: {str(e)}')
            
            return {
                'metadata': metadata,
                'videos': videos
            }

    async def fetch_transcript(self, video_id_or_url: str, max_retries: int = 3) -> str:
        """
        Fetches and parses the transcript for a YouTube video.
        
        Args:
            video_id_or_url: Video ID or URL
            max_retries: Number of retry attempts
            
        Returns:
            Formatted transcript string
        """
        video_id = self.extract_video_id(video_id_or_url)
        if not video_id:
            raise YouTubeError('Invalid YouTube video ID or URL')

        async with httpx.AsyncClient() as client:
        for attempt in range(max_retries):
            try:
                # Fetch video page
                response = await client.get(f"https://www.youtube.com/watch?v={video_id}")
                response.raise_for_status()
                
                # Extract player data
                match = re.search(r'ytInitialPlayerResponse\s*=\s*({.+?})\s*;', response.text)
                if not match:
                    raise YouTubeError('Could not find player data')
                
                player_data = json.loads(match.group(1))
                
                # Get caption tracks
                caption_tracks = (player_data.get('captions', {})
                                .get('playerCaptionsTracklistRenderer', {})
                                .get('captionTracks', []))
                
                if not caption_tracks:
                    raise YouTubeError('NO_CAPTIONS')
                
                # Fetch transcript XML
                transcript_url = caption_tracks[0]['baseUrl']
                transcript_response = await client.get(transcript_url)
                transcript_response.raise_for_status()
                
                # Parse transcript
                transcript = self.parse_transcript_xml(transcript_response.text)
                
                # Add video context
                video_details = player_data.get('videoDetails', {})
                context = self.create_context_block(video_details)
                
                return {
                    'raw_content': transcript_response.text,
                    'processed_content': f"{context}\n{TRANSCRIPT_SECTION}\n{transcript}"
                }
            
            except YouTubeError as e:
                if str(e) == 'NO_CAPTIONS':
                    raise YouTubeError('This video does not have captions available for automatic retrieval.')
                if attempt == max_retries - 1:
                    raise YouTubeError(f'Failed to fetch transcript: {str(e)}')
                await asyncio.sleep(1)


    @staticmethod
    def parse_transcript_xml(xml_text: str) -> str:
        """Converts XML transcript to readable text with timestamps."""
        lines = re.findall(r'<text.+?>.+?</text>', xml_text) or []
        formatted_lines = []

        for line in lines:
            # Extract timestamp
            start = float(re.search(r'start="([\d.]+)"', line).group(1))
            
            # Extract and clean text
            text = re.sub(r'<.+?>', '', line).strip()
            
            # Format timestamp
            minutes = int(start // 60)
            seconds = int(start % 60)
            timestamp = f"[{minutes}:{seconds:02d}]"

            formatted_lines.append(f"{timestamp} {text}")

        return '\n'.join(formatted_lines)

    @staticmethod
    def extract_video_id(video_id_or_url):
        """Extracts the YouTube video ID from a given URL or returns the ID if provided."""
        # Check if input is already a video ID
        if re.match(r'^[a-zA-Z0-9_-]{11}$', video_id_or_url):
            return video_id_or_url

        # Extract from URL
        url_match = re.search(
            r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
            video_id_or_url
        )
        return url_match.group(1) if url_match else None

    @staticmethod
    def create_context_block(video_details):
        """Parses and filters the video description to extract relevant content."""
        if not video_details or 'shortDescription' not in video_details:
            return (f"{CONTEXT_SECTION}\n"
                f"Title: Unknown\n"
                f"Description: No description available\n")

        # Get first paragraph
        description = video_details.get('shortDescription', '')
        first_paragraph = description.split('\n\n')[0]

        # Extract timestamp lines
        timestamps = '\n'.join(
            line for line in description.split('\n')
            if re.match(r'^\d+:\d+', line.strip())
        ) or 'No timestamps available'
        
        return (
            f"{CONTEXT_SECTION}\n"
            f"Title: {video_details.get('title', 'Unknown')}\n"
            f"Description: {first_paragraph}\n\n"
            f"Timestamps:\n{timestamps}\n"
        )
