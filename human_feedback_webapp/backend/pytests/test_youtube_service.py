import pytest
import asyncio
from ..youtube_service import YoutubeTranscriptRetriever

@pytest.mark.skip(reason="Test disabled until we need to fetch transcript.")
@pytest.mark.asyncio
async def test_fetch_parsed_transcript_with_valid_video():
    """Test fetching transcript from a known YouTube video with captions."""
    # Using a TED talk video which is likely to have English captions
    video_url = "https://www.youtube.com/watch?v=JV-m9bJTrh8"
    retriever = YoutubeTranscriptRetriever()
    transcript = await retriever.fetch_parsed_transcript(video_url)
    assert transcript is not None, "Transcript should not be None"
    assert len(transcript) > 0, "Transcript should contain at least one segment"

@pytest.mark.asyncio
async def test_fetch_channel_data():
    """Test fetching channel data from a known YouTube channel."""
    # Using TED's YouTube channel as it's likely to remain active
    channel_handle = "@TED"
    
    channel_data = await YoutubeTranscriptRetriever.fetch_channel_data(channel_handle)
    
    # Test metadata structure
    assert isinstance(channel_data, dict), "Channel data should be a dictionary"
    assert 'metadata' in channel_data, "Channel data should contain metadata"
    assert 'videos' in channel_data, "Channel data should contain videos"
    
    # Test metadata fields
    metadata = channel_data['metadata']
    assert metadata['title'], "Channel should have a title"
    
    # Test videos array
    videos = channel_data['videos']
    assert len(videos) > 0, "Channel should have at least one video"
    
    # Test first video structure
    first_video = videos[0]
    assert first_video['videoId'], "Video should have an ID"
    assert first_video['title'], "Video should have a title"
    assert first_video['url'].startswith('https://www.youtube.com/watch?v='), "Video URL should be valid"
    assert first_video['thumbnailUrl'].startswith('https://'), "Video thumbnail URL should be valid"
    assert first_video['duration'], "Video should have a duration"