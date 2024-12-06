from .youtube_service import YoutubeService
from .llm_api_utils import LLM_API_Utils

class TranscriptProcessor:
    def __init__(self):
        self.llm_utils = LLM_API_Utils()

    async def process_transcript(self, video_id: str):
        # Fetch raw transcript using YoutubeService
        raw_transcript = await YoutubeService.fetch_raw_transcript(video_id)
        # Process transcript using LLM
        processed_transcript = await self.llm_utils.process_transcript(raw_transcript)
        return processed_transcript