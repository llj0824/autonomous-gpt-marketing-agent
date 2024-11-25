from llm_api_utils import LLM_API_Utils
from typing import List, Dict, Any

# Note to self: This will be the hardest part of the entire workflow.
# Please converse with the LLM often, and have ~3 good examples & ~3 bad examples.
class HighlightAnalyzer:
    def __init__(self):
        self.llm_utils = LLM_API_Utils()
        
        self.analysis_prompt = """
        Analyze this video transcript segment and provide:
        1. Engagement Score (0-100): How engaging/interesting is this content
        2. Strategic Relevance Score (0-100): How relevant is this for marketing purposes
        3. Key Topics: Main topics/themes discussed
        4. Highlight Worthy (Yes/No): Should this be considered for highlights
        
        Transcript Segment:
        {transcript}
        
        Respond in JSON format:
        {
            "engagement_score": number,
            "strategic_score": number,
            "key_topics": string[],
            "highlight_worthy": boolean,
            "reasoning": string
        }
        """

    async def analyze_segment(self, segment: Dict[str, Any]) -> Dict[str, Any]:
        prompt = self.analysis_prompt.format(transcript=segment['text'])
        
        # Get analysis from GPT-4
        analysis_result = await self.llm_utils.call_gpt4(
            system_role="You are an expert content analyzer.",
            prompt=prompt
        )
        
        # Parse JSON response
        try:
            analysis = json.loads(analysis_result)
            return {
                **segment,
                "analysis": analysis
            }
        except json.JSONDecodeError:
            raise ValueError("Failed to parse LLM response")

    async def analyze_transcript(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        analyzed_segments = []
        for segment in segments:
            analyzed = await self.analyze_segment(segment)
            analyzed_segments.append(analyzed)
        
        # Sort by combined score
        analyzed_segments.sort(
            key=lambda x: (
                x['analysis']['engagement_score'] + 
                x['analysis']['strategic_score']
            ),
            reverse=True
        )
        
        return analyzed_segments