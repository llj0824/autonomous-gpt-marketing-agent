# llm_api_utils.py
import aiohttp
import asyncio
from typing import List, Optional
import sys
from pathlib import Path
import re

# Add root directory to Python path
root_dir = Path(__file__).parent.parent.parent
sys.path.append(str(root_dir))

from config import Config

class LLM_API_Utils:
    DEFAULT_PARTITIONS = 8
    GPT_4o = "chatgpt-4o-latest"
    # GPT_4o = "gpt-4o-mini"
    LINES_PER_PARTITION = 60  # Approximately 5 minutes per chunk (5s per line)

    def __init__(self):
        self.config = Config()
        self.openai_endpoint = self.config.openai_endpoint
        self.anthropic_endpoint = self.config.anthropic_endpoint
        
        # API keys now loaded from config
        self.openai_api_key = self.config.openai_api_key
        self.anthropic_api_key = self.config.anthropic_api_key
        
        self.llm_system_role = """Take a raw video transcript and copyedit it into a world-class professionally copyedited transcript.  
    Attempt to identify the speaker from the context of the conversation.
    
    IMPORTANT: Process and return the ENTIRE transcript segment. Do not truncate or ask for confirmation to continue.
    
    # Steps
    1. **Speaker Identification**: Identify who is speaking at each segment based on context clues within the transcript.
    2. **Copyediting**:
       - Correct any grammatical or typographical errors.
       - Ensure coherence and flow of conversation.
       - Maintain the original meaning while enhancing clarity.
    3. **Structure**: Format the transcript with each speaker's name followed by their dialogue.
    
    # Output Format
    [Time Range]
    [Speaker Name]:
    [Dialogue]
    
    **Requirements:**
    - **Time Range:** Combine the start and end timestamps in the format [Start Time -> End Time].
    - **Speaker Name:** Followed by a colon (:) and a newline.
    - **Dialogue:** Starts on a new line beneath the speaker's name. Ensure the dialogue is free of filler words and is professionally phrased.
    - **Completeness:** Process and return the entire transcript segment without truncation.
    
    # Example Input/Output Format
    Input:  
    [00:06] uh so um today were going to be talking about, uh, 
    [00:12] mental health and, um, ideas of, uh, self with, um, 
    [00:15] Dr. Paul Conti. uh welcome."
    
    Output:  
    [00:06 -> 00:15]
    Andrew Huberman:
    Today we are going to be talking about mental health and ideas of self with Dr. Paul Conti. Welcome.
    
    # Notes
    - If unable to identify the speaker, use placeholders such as "Speaker", "Interviewer", "Interviewee", etc.
    - Break long segments into smaller time ranges, clearly identify when speakers change, even within the same time range.
    - Return the complete copyedited transcript without any meta-commentary, introductions, or confirmations. Ensure that the final transcript reads smoothly and maintain the integrity of the original dialogue.
    - Never truncate the output or ask for permission to continue - process the entire input segment"""

        self.llm_highlights_system_role = """Extract segments where the speaker expresses a controversial opinion, challenges conventional wisdom, or engages in philosophical reflections, or statements that could inspire thought, provides expert analysis on complex topics 

Identify moments that are:
- Highly quotable
- Contrarian/surprising
- Data-driven
- Actionable
- Story-driven

Look for:
- Unpopular or bold statements
- Memorable one-liners
- Counterarguments to common beliefs
- Advanced strategies or methodologies
- Clarification of common misconceptions
- Confirmation of existing beliefs.

Note: Please return without any markdown syntax. 

Format each highlight as:
[Time Range - i.e [01:00:06 -> 01:02:15]]
🔬 Topic: Brief title

✨ Quote (if applicable) : "Exact words from the speaker"
💎 Insight: Summary of the explanation or analysis
🎯 TAKEAWAY: Why this matters
📝 CONTEXT: Key supporting details

--- 

Two sentence summary of highlight in viewpoint of the reader."""

    async def call_gpt4(self, system_role: str, prompt: str, 
                        model: str = "gpt-4", 
                        max_tokens: int = 10000,
                        temperature: float = 0.1) -> str:
        if not self.openai_api_key:
            raise ValueError("OpenAI API key is not set.")

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_role},
                {"role": "user", "content": prompt}
            ],
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.openai_endpoint,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.openai_api_key}"
                },
                json=payload
            ) as response:
                if not response.ok:
                    error_data = await response.json()
                    raise Exception(f"OpenAI API error: {response.status} - {error_data}")
                
                data = await response.json()
                return data["choices"][0]["message"]["content"].strip()
            
    def _split_transcript_for_processing(self, transcript: str, lines_per_partition: int = LINES_PER_PARTITION) -> List[str]:
        """
        Partition the transcript into chunks of ~10 minutes each by line count.
        Default: LINES_PER_PARTITION = 120
        """

        lines = transcript.strip().split("\n")
        partitions = []
        for i in range(0, len(lines), lines_per_partition):
            partition_chunk = lines[i:i + lines_per_partition]
            partitions.append("\n".join(partition_chunk))

        return partitions

    async def process_in_partitions(self,
                                    transcript: str,
                                    system_role: str,
                                    model_name: str = GPT_4o,
                                    max_tokens: int = 10000,
                                    temperature: float = 0.1) -> List[str]:
        """
        A common method to process the transcript in partitions.
        This can be used both for transcript editing and highlight generation.
        """
        parts = self._split_transcript_for_processing(transcript)
        
        tasks = [
            self.call_gpt4(
                system_role=system_role,
                prompt=part,
                model=model_name,
                max_tokens=max_tokens,
                temperature=temperature
            ) for part in parts
        ]
        return await asyncio.gather(*tasks)

    async def process_transcript_in_parallel(self, transcript: str, 
                                             model_name: str = GPT_4o) -> str:
        """
        Process the transcript using the transcript system role.
        Returns a single joined string since this is for transcript processing.
        """
        results = await self.process_in_partitions(
            transcript=transcript,
            system_role=self.llm_system_role,
            model_name=model_name,
            max_tokens=10000,
            temperature=0.1
        )
        return "\n\n".join(results)

    async def generate_highlights(self, 
                                processed_transcript: str, 
                                model_name: str = GPT_4o,
                                max_tokens: int = 10000,
                                temperature: float = 0.4) -> List[dict]:
        """
        Generate highlights from a processed transcript using the highlights system role.
        Returns a list of highlights with their associated prompts and system role.
        
        Returns:
            List of dicts containing:
            - content: The highlight text
            - prompt: The transcript segment used to generate this highlight
            - system_role: The system role used to generate this highlight
        """
        # Split transcript into manageable chunks
        transcript_chunks = self._split_transcript_for_processing(processed_transcript)
        
        # Process each chunk with GPT-4
        tasks = [
            self.call_gpt4(
                system_role=self.llm_highlights_system_role,
                prompt=chunk,
                model=model_name,
                max_tokens=max_tokens,
                temperature=temperature
            ) for chunk in transcript_chunks
        ]
        raw_highlights = await asyncio.gather(*tasks)
        
        # Process the results
        individual_highlights = []
        for raw_highlight, prompt_chunk in zip(raw_highlights, transcript_chunks):
            # Match both [MM:SS] and [HH:MM:SS] formats with flexible spacing
            timestamp_pattern = r'(?=\[(?:\d{2}:)?\d{2}:\d{2}\s*->\s*(?:\d{2}:)?\d{2}:\d{2}\])'
            segments = re.split(timestamp_pattern, raw_highlight)
            # Filter out empty segments and add non-empty ones to the list
            for segment in segments:
                if segment.strip():
                    individual_highlights.append({
                        'content': segment.strip(),
                        'prompt': prompt_chunk,
                        'system_role': self.llm_highlights_system_role
                    })
        
        return individual_highlights

    # TODO: REFACTOR generate_hightlights to reuse @regenerate_single_highlight...
    async def regenerate_single_highlight(
        self,
        prompt: str,
        system_role: Optional[str] = None,
        model_name: str = GPT_4o,
        max_tokens: int = 10000,
        temperature: float = 0.4
    ) -> dict:
        """
        Regenerate a single highlight using provided prompt and optional custom system role.
        
        Args:
            prompt: The transcript segment to generate highlight from
            system_role: Optional custom system role. If None, uses default highlights role
            model_name: The model to use for generation
            max_tokens: Maximum tokens for response
            temperature: Temperature for generation
            
        Returns:
            dict containing:
            - content: The highlight text
            - prompt: The transcript segment used
            - system_role: The system role used
        """
        # Use provided system role or default to highlights system role
        system_role = system_role or self.llm_highlights_system_role
        
        # Generate new highlight
        response = await self.call_gpt4(
            system_role=system_role,
            prompt=prompt,
            model=model_name,
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        return {
            'content': response.strip(),
            'prompt': prompt,
            'system_role': system_role
        }