import pytest
import asyncio
from ..youtube_service import YoutubeService

@pytest.mark.asyncio
async def test_fetch_parsed_transcript_with_valid_video():
    """Test fetching transcript from a known YouTube video with captions."""
    # Using a TED talk video which is likely to have English captions
    video_url = "https://www.youtube.com/watch?v=JV-m9bJTrh8"
    retriever = YoutubeService()
    breakpoint()
    transcript = await retriever.fetch_parsed_transcript(video_url)
    assert transcript is not None, "Transcript should not be None"
    assert len(transcript) > 0, "Transcript should contain at least one segment"