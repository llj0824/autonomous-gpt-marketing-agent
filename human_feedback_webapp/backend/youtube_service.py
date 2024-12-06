from dataclasses import dataclass
from datetime import datetime
import asyncio
from typing import List, Optional, Dict, Any
import httpx
import re
import json
import logging
from pathlib import Path
from yt_dlp import YoutubeDL

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
        # Original code unchanged
        channel_url = f"https://www.youtube.com/{channel_handle}/videos"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(channel_url)
            if not response.is_success:
                raise YouTubeError(f"Failed to fetch channel: {response.status_code}")

            match = re.search(r'var\s+ytInitialData\s*=\s*({.+?});</script>', response.text)
            if not match:
                raise YouTubeError('Channel data not found')
            
            data = json.loads(match.group(1))
            channel_metadata = data['metadata']['channelMetadataRenderer']
            metadata = {
                'title': channel_metadata['title'],
                'description': channel_metadata.get('description', ''),
                'thumbnailUrl': channel_metadata['avatar']['thumbnails'][-1]['url']
            }
            
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

    async def fetch_raw_transcript(self, video_id_or_url: str, max_retries: int = 3) -> Dict[str, Any]:
        video_id = self.extract_video_id(video_id_or_url)
        if not video_id:
            raise YouTubeError('Invalid YouTube video ID or URL')

        # Configure yt-dlp options
        # We specify subtitles format as TTML for easier XML parsing (like original code).
        ydl_opts = {
            'skip_download': True,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en'],
            'subtitlesformat': 'ttml',
            'nocheckcertificate': True,
            'cookiesfrombrowser': None,  # We'll rely on your cookies.json if needed
            # If you want to incorporate cookies, convert cookies.json to Netscape format 
            # and specify 'cookies': 'path/to/cookies.txt'
        }

        # Attempt extraction
        for attempt in range(max_retries):
            try:
                with YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
                
                # Info should contain 'subtitles' or 'automatic_captions'
                subtitles = info.get('subtitles') or {}
                automatic_captions = info.get('automatic_captions') or {}
                
                # Determine which captions to use
                # Prefer normal subtitles, fallback to automatic if no normal subtitles found
                chosen_captions = subtitles if subtitles else automatic_captions
                if not chosen_captions:
                    raise YouTubeError('NO_CAPTIONS')

                # Pick the first available track
                # Typically keys are language codes like 'en'
                lang = next(iter(chosen_captions.keys()))
                track = chosen_captions[lang][0]  # First track in that language
                
                # track['url'] points to the TTML subtitle file
                async with httpx.AsyncClient() as client:
                    transcript_response = await client.get(track['url'])
                    transcript_response.raise_for_status()
                    xml_text = transcript_response.text

                # Parse transcript XML
                transcript = self.parse_transcript_xml(xml_text)
                
                # Create context block from info’s metadata
                # Adapted from original code: we have 'title' and 'description' from info
                video_details = {
                    'title': info.get('title', 'Unknown'),
                    # Using 'description' directly as a stand-in for 'shortDescription'
                    'shortDescription': info.get('description', '')
                }
                
                context = self.create_context_block(video_details)
                raw_transcript = f"{context}\n{TRANSCRIPT_SECTION}\n{transcript}"
                return raw_transcript

            except YouTubeError as e:
                if str(e) == 'NO_CAPTIONS':
                    # No retries needed if no captions available
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
            start_match = re.search(r'start="([\d.]+)"', line)
            if not start_match:
                continue
            start = float(start_match.group(1))

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
        if re.match(r'^[a-zA-Z0-9_-]{11}$', video_id_or_url):
            return video_id_or_url

        url_match = re.search(
            r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
            video_id_or_url
        )
        return url_match.group(1) if url_match else None

    @staticmethod
    def create_context_block(video_details):
        """Parses and filters the video description to extract relevant content."""
        title = video_details.get('title', 'Unknown')
        description = video_details.get('shortDescription', '')
        if not description:
            return (
                f"{CONTEXT_SECTION}\n"
                f"Title: {title}\n"
                f"Description: No description available\n"
            )
        
        # Get first paragraph of description
        first_paragraph = description.split('\n\n')[0].strip()
        
        # Extract timestamp lines
        timestamps = '\n'.join(
            line for line in description.split('\n')
            if re.match(r'^\d+:\d+', line.strip())
        ) or 'No timestamps available'
        
        return (
            f"{CONTEXT_SECTION}\n"
            f"Title: {title}\n"
            f"Description: {first_paragraph}\n\n"
            f"Timestamps:\n{timestamps}\n"
        )