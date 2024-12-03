import re
import time
import requests
import json

class YoutubeTranscriptRetriever:
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
    
    TRANSCRIPT_BEGINS_DELIMITER = "*** Transcript ***"
    CONTEXT_BEGINS_DELIMITER = "*** Background Context ***"

    @staticmethod
    async def fetch_channel_data(channel_handle):
        """
        Fetches channel metadata and recent videos and its metadata.
        
        Args:
            channel_handle (str): Channel handle (e.g. "@Bankless")
            
        Returns:
            dict: Channel metadata and videos
            {
                'metadata': {
                    'title': str,
                    'description': str,
                    'subscriberCount': str,
                    'thumbnailUrl': str
                },
                'videos': [{
                    'videoId': str,
                    'title': str,
                    'url': str,
                    'thumbnailUrl': str,
                    'publishedAt': str,
                    'viewCount': str,
                    'duration': str
                }]
            }
        """
        channel_url = f"https://www.youtube.com/{channel_handle}/videos"
        response = requests.get(channel_url)
        if not response.ok:
            raise Exception(f"Failed to fetch channel: {response.status_code}")

        # Extract ytInitialData
        match = re.search(r'var\s+ytInitialData\s*=\s*({.+?});</script>', response.text)
        if not match:
            raise Exception('Channel data not found')
        
        data = json.loads(match.group(1))
        print("ytInitialData:", json.dumps(data, indent=2))
        
        # Extract metadata from channelMetadataRenderer
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
        except (KeyError, IndexError, StopIteration) as e:
            raise Exception(f'Error parsing video data: {str(e)}')
        
        return {
            'metadata': metadata,
            'videos': videos
        }

    @staticmethod
    async def fetch_parsed_transcript(video_id_or_url, retry_attempts=3):
        """
        Fetches the transcript for the specified YouTube video and transforms to desired format.
        
        Args:
            video_id_or_url (str): The YouTube video ID or full URL
            retry_attempts (int): Number of retry attempts if fetching fails
            
        Returns:
            str: The raw transcript as a single string
            
        Raises:
            Exception: If the transcript cannot be retrieved
        """
        for attempt in range(1, retry_attempts + 1):
            try:
                video_id = YoutubeTranscriptRetriever.extract_video_id(video_id_or_url)
                if not video_id:
                    raise ValueError('Invalid YouTube video ID or URL.')

                html = await YoutubeTranscriptRetriever.fetch_video_page(video_id)
                initial_data = YoutubeTranscriptRetriever.extract_initial_data(html)
                caption_tracks = YoutubeTranscriptRetriever.extract_caption_tracks(initial_data)
                
                if not caption_tracks:
                    raise Exception('NO_CAPTIONS')

                transcript_url = caption_tracks[0]['baseUrl']
                xml_transcript = await YoutubeTranscriptRetriever.fetch_transcript_xml(transcript_url)
                parsed_transcript = YoutubeTranscriptRetriever.parse_transcript_xml(xml_transcript)

                video_details = initial_data.get('videoDetails', {})
                context_block = YoutubeTranscriptRetriever.parse_transcript_context(video_details)
                
                return context_block + parsed_transcript

            except Exception as error:
                if str(error) == 'NO_CAPTIONS':
                    raise Exception('This video does not have captions available for automatic retrieval.')
                
                if attempt == retry_attempts:
                    # Note: In Python we might want to handle this differently since we don't have window.alert
                    print('Unable to load the transcript automatically.\n\n'
                          'Please try:\n'
                          '1) Toggling off the extension\n'
                          '2) Refreshing the YouTube page')
                    raise
                
                # Wait before retrying
                time.sleep(1)

    @staticmethod
    async def fetch_video_page(video_id):
        """Fetches the HTML content of the YouTube video page."""
        video_url = f"https://www.youtube.com/watch?v={video_id}"
        response = requests.get(video_url)
        if not response.ok:
            raise Exception(f"Failed to fetch video page: {response.status_code}")
        return response.text

    @staticmethod
    def extract_initial_data(html):
        """
        Extracts the initial JSON data from the YouTube video page HTML.
        
        The data is found in a <script> tag containing 'ytInitialPlayerResponse'.
        This contains video metadata, playback info, and caption/transcript data.
        
        Structure:
        {
            videoDetails: {...},
            playabilityStatus: {...},
            streamingData: {...},
            captions: {
                playerCaptionsTracklistRenderer: {
                    captionTracks: [...]
                }
            }
        }
        
        Args:
            html (str): Raw HTML content of the YouTube video page
            
        Returns:
            dict: Parsed ytInitialPlayerResponse data
            
        Raises:
            Exception: If the initial data cannot be found or parsed
        """
        match = re.search(r'ytInitialPlayerResponse\s*=\s*({.+?})\s*;', html)
        if not match:
            raise Exception('Initial data not found in the page.')
        return eval(match.group(1))  # Note: In production, use json.loads with proper sanitization

    @staticmethod
    def extract_caption_tracks(initial_data):
        """
        Extracts caption track information from the initial player data.
        
        Caption tracks are found in:
        initial_data['captions']['playerCaptionsTracklistRenderer']['captionTracks']
        
        Each track contains:
        {
            baseUrl: str,      # URL to fetch transcript XML
            name: str,         # Language name
            languageCode: str, # ISO language code
            ...
        }
        
        Args:
            initial_data (dict): Parsed ytInitialPlayerResponse data
            
        Returns:
            list: Available caption tracks with URLs and metadata
        """
        captions = initial_data.get('captions', {})
        if not captions:
            return None
            
        return captions.get('playerCaptionsTracklistRenderer', {}).get('captionTracks', [])

    @staticmethod
    async def fetch_transcript_xml(transcript_url):
        """Fetches the XML transcript from the provided URL."""
        response = requests.get(transcript_url)
        return response.text

    @staticmethod
    def parse_transcript_xml(xml_transcript):
        """Parses the XML transcript and formats it into a readable string."""
        lines = re.findall(r'<text.+?>.+?</text>', xml_transcript) or []
        current_timestamp = 0
        formatted_lines = []

        for line in lines:
            start_match = re.search(r'start="([\d.]+)"', line)
            start = float(start_match.group(1)) if start_match else current_timestamp
            current_timestamp = start

            text = re.sub(r'<.+?>', '', line).strip()
            
            minutes = int(start // 60)
            seconds = int(start % 60)
            formatted_time = f"[{minutes}:{seconds:02d}]"

            formatted_lines.append(f"{formatted_time} {text}")

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
    def parse_transcript_context(video_details):
        """Parses and filters the video description to extract relevant content."""
        if not video_details or 'shortDescription' not in video_details:
            return (f"{YoutubeTranscriptRetriever.CONTEXT_BEGINS_DELIMITER}\n"
                   f"Title: Unknown\n"
                   f"Description: No description available\n"
                   f"{YoutubeTranscriptRetriever.TRANSCRIPT_BEGINS_DELIMITER}\n")

        # Get first paragraph
        first_paragraph = video_details['shortDescription'].split('\n\n')[0]

        # Extract timestamp lines
        chapter_timestamps = '\n'.join(
            line for line in video_details['shortDescription'].split('\n')
            if re.match(r'^\d+:\d+', line.strip())
        )

        description = f"{first_paragraph}\n\nTimestamps:\n{chapter_timestamps}"

        return (f"{YoutubeTranscriptRetriever.CONTEXT_BEGINS_DELIMITER}\n"
                f"Title: {video_details.get('title', 'Unknown')}\n"
                f"Description: {description}\n"
                f"{YoutubeTranscriptRetriever.TRANSCRIPT_BEGINS_DELIMITER}\n")

