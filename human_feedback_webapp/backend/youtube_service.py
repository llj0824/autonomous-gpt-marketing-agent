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
                # Use English captions ("en-orig", else "en"). If none exists fail with message saying captions don't exist.
                if 'en-orig' in chosen_captions:
                    lang = 'en-orig'
                elif 'en' in chosen_captions:
                    lang = 'en'
                else:
                    raise YouTubeError('No English captions available for this video.')
                # Example TTML format:
                # <div>
                #     <p begin="00:00:03.800" end="00:00:07.279">welcome to the final Talk of the bank</p>
                #     <p begin="00:00:05.520" end="00:00:08.599">list Summit which was a series of talks</p>
                #     ...
                # </div>
                track = next(
                    (t for t in chosen_captions[lang] if t.get('ext') == 'ttml'), 
                    chosen_captions[lang][0]
                )
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
        """Converts TTML transcript to readable text with timestamps."""
        # Find all <p> elements with begin/end timestamps
        lines = re.findall(r'<p\s+begin="([^"]+)"\s+end="([^"]+)"[^>]*>(.*?)</p>', xml_text) or []
        formatted_lines = []

        def parse_timestamp(ts: str) -> float:
            """Convert timestamp from HH:MM:SS.mmm or MM:SS.mmm to seconds"""
            parts = ts.split(':')
            if len(parts) == 3:  # HH:MM:SS.mmm
                h, m, s = parts
                return float(h) * 3600 + float(m) * 60 + float(s)
            elif len(parts) == 2:  # MM:SS.mmm
                m, s = parts
                return float(m) * 60 + float(s)
            else:
                raise ValueError(f"Invalid timestamp format: {ts}")

        for begin, end, text in lines:
            try:
                start = parse_timestamp(begin)
                end = parse_timestamp(end)

                # Clean text - remove any remaining XML tags and normalize whitespace
                text = re.sub(r'<[^>]+>', '', text)
                text = ' '.join(text.split())

                # Format timestamp range for LLM processing
                start_min, start_sec = divmod(int(start), 60)
                end_min, end_sec = divmod(int(end), 60)
                timestamp = f"[{start_min:02d}:{start_sec:02d} -> {end_min:02d}:{end_sec:02d}]"
                
                formatted_lines.append(f"{timestamp} {text}")
            except ValueError as e:
                print(f"Warning: Failed to parse timestamp - {e}")
                continue

        return '\n'.join(formatted_lines)

    @staticmethod
    def extract_video_id(video_id_or_url):
        """Extracts the YouTube video ID from a given URL or returns the ID if provided."""
        if re.match(r'^[a-zA-Z0-9_-]{11}$', video_id_or_url):
            return video_id_or_url

        url_match = re.search(
            r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})(?:&\S*)?',
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

    async def fetch_video_metadata(self, video_id: str) -> Dict[str, Any]:
        """Fetches metadata for a single video"""
        # Use yt-dlp to get video info
        ydl_opts = {
            'skip_download': True,
            'extract_flat': True,
        }
        
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            
            return {
                'videoId': info['id'],
                'title': info['title'],
                'channelId': info['channel_id'],
                'channelHandle': info['channel_url'].split('/')[-1],
                'duration': info['duration'],
                'url': f"https://www.youtube.com/watch?v={info['id']}",
                'thumbnailUrl': info['thumbnail'],
            }