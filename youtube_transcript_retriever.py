# youtube_transcript_retrieval.py
import aiohttp
from youtube_transcript_api import YouTubeTranscriptApi


class YoutubeTranscriptRetriever:
    CONTEXT_BEGINS_DELIMITER = "=== Context Begins ==="
    TRANSCRIPT_BEGINS_DELIMITER = "=== Transcript Begins ==="

    def __init__(self):
        self.video_id = None
        self.video_title = None
        self.channel_name = None
        self.transcript_text = None

    async def get_transcript(self, video_id):
        """
        Get transcript for a YouTube video
        Args:
            video_id (str): YouTube video ID
        Returns:
            str: Formatted transcript with context
        """
        self.video_id = video_id

        # Note: In Python we'd use a library like youtube_transcript_api
        # This is a simplified version
        try:
            # Get raw transcript
            raw_transcript = await self._fetch_transcript()

            # Format transcript with context
            formatted_transcript = self._format_transcript(raw_transcript)

            return formatted_transcript

        except Exception as e:
            raise Exception(f"Failed to get transcript: {str(e)}")

    async def _fetch_transcript(self):
        """Fetch raw transcript from YouTube."""
        try:
            # Get transcript list with all available captions
            transcript_list = await YouTubeTranscriptApi.get_transcript_async(
                self.video_id, languages=["en"]  # Prioritize English captions
            )

            # Format transcript entries with timestamps
            formatted_entries = []
            for entry in transcript_list:
                # Convert seconds to HH:MM:SS format
                seconds = int(entry["start"])
                hours = seconds // 3600
                minutes = (seconds % 3600) // 60
                secs = seconds % 60
                timestamp = f"[{hours:02d}:{minutes:02d}:{secs:02d}]"

                formatted_entries.append(f"{timestamp} {entry['text']}")

            transcript_text = "\n".join(formatted_entries)
            return transcript_text

        except Exception as e:
            # Try fallback to auto-generated captions if manual captions fail
            try:
                transcript_list = await YouTubeTranscriptApi.get_transcript_async(
                    self.video_id,
                    languages=["en-US", "en-GB", "en"],
                    preserve_formatting=True,
                )

                # Format auto-generated captions with HH:MM:SS timestamps
                formatted_entries = []
                for entry in transcript_list:
                    seconds = int(entry["start"])
                    hours = seconds // 3600
                    minutes = (seconds % 3600) // 60
                    secs = seconds % 60
                    timestamp = f"[{hours:02d}:{minutes:02d}:{secs:02d}]"

                    formatted_entries.append(f"{timestamp} {entry['text']}")

                transcript_text = "\n".join(formatted_entries)
                return transcript_text

            except Exception as nested_e:
                raise Exception(
                    f"Failed to fetch transcript: {str(e)}. Auto-caption fallback also failed: {str(nested_e)}"
                )

    def _format_transcript(self, raw_transcript):
        """Format transcript with context information."""
        context = [
            self.CONTEXT_BEGINS_DELIMITER,
            f"Video Title: {self.video_title}",
            f"Channel: {self.channel_name}",
            f"Video ID: {self.video_id}",
            self.TRANSCRIPT_BEGINS_DELIMITER,
        ]

        return "\n".join(context + [raw_transcript])
