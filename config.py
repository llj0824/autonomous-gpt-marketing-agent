from typing import Optional
import os
from dotenv import load_dotenv

class Config:
    def __init__(self):
        load_dotenv()  # Load environment variables from .env file
        
        # API Keys
        self.openai_api_key: Optional[str] = os.getenv('OPENAI_API_KEY')
        self.anthropic_api_key: Optional[str] = os.getenv('ANTHROPIC_API_KEY')
        
        # Encryption
        self.encryption_key: str = os.getenv('ENCRYPTION_KEY', 
            'default_encryption_key')  # Default fallback for development
        
        # API Endpoints
        self.openai_endpoint: str = os.getenv('OPENAI_API_ENDPOINT',
            'https://api.openai.com/v1/chat/completions')
        self.anthropic_endpoint: str = os.getenv('ANTHROPIC_API_ENDPOINT',
            'https://api.anthropic.com/v1/complete')
        
         # Logging Configuration
        self.logging_endpoint: str = os.getenv('LOGGING_ENDPOINT')
        self.max_failed_logs: int = int(os.getenv('MAX_FAILED_LOGS', '1000'))
        self.log_level: str = os.getenv('LOG_LEVEL', 'INFO')