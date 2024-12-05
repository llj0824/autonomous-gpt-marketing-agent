# llm_api_utils.py
import aiohttp
from typing import List, Optional
import json

class LLM_API_Utils:
    DEFAULT_PARTITIONS = 8

    def __init__(self):
        self.config = Config()
        self.openai_endpoint = self.config.openai_endpoint
        self.anthropic_endpoint = self.config.anthropic_endpoint
        
        # API keys now loaded from config
        self.openai_api_key = self.config.openai_api_key
        self.anthropic_api_key = self.config.anthropic_api_key
        
        self.llm_system_role = """
        Take a raw video transcript and copyedit it into a world-class professionally copyedited transcript.
        [... rest of the system role prompt ...]
        """

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

    async def call_claude(self, system_role: str, prompt: str,
                         model: str = "claude-3-sonnet-20240229",
                         max_tokens: int = 8192,
                         temperature: float = 0.1) -> str:
        # Similar implementation to call_gpt4 but for Anthropic's API
        pass

    async def process_transcript_in_parallel(self, transcript: str, 
                                          model_name: str,
                                          partitions: int = DEFAULT_PARTITIONS) -> str:
        parts = self._split_transcript_for_processing(transcript, partitions)
        
        # Process all parts concurrently
        tasks = [self.call_llm(model_name=model_name, prompt=part) 
                for part in parts]
        
        results = await asyncio.gather(*tasks)
        return "\n\n".join(results)

    def _split_transcript_for_processing(self, transcript: str, n: int) -> List[str]:
        # Implementation of transcript splitting logic
        pass