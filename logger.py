# logger.py
import json
from datetime import datetime
import csv
import os
from pathlib import Path
from config import Config
from typing import Dict, Any

class Logger:
    EVENTS = {
        'EXTENSION_OPENED': 'extension_opened',
        'TRANSCRIPT_RETRIEVAL_ATTEMPT': 'transcript_retrieval_attempt',
        'TRANSCRIPT_FOUND_IN_STORAGE': 'transcript_found_in_storage',
        'TRANSCRIPT_RETRIEVED_FROM_YOUTUBE': 'transcript_retrieved_from_youtube',
        'PROCESS_TRANSCRIPT_ATTEMPT': 'process_transcript_attempt',
        'PROCESS_TRANSCRIPT_SUCCESS': 'process_transcript_success',
        'ERROR': 'error',
        'PAGE_NAVIGATION': 'page_navigation',
        'TAB_SWITCH': 'tab_switch',
        'FONT_SIZE_CHANGE': 'font_size_change',
        'COPY_ATTEMPT': 'copy_attempt',
        'COPY_SUCCESS': 'copy_success',
        'MANUAL_TRANSCRIPT_LOAD': 'manual_transcript_load',
        'PROCESS_TRANSCRIPT_START': 'process_transcript_start',
        'PROCESS_TRANSCRIPT_FAILURE': 'process_transcript_failure'
    }

    FIELDS = {
        'VIDEO_ID': 'videoId',
        'TRANSCRIPT_LENGTH': 'transcriptLength',
        'MODEL': 'model',
        'PAGE_INDEX': 'pageIndex',
        'ERROR': 'error',
        'ERROR_TYPE': 'errorType',
        'ERROR_MESSAGE': 'errorMessage',
        'ERROR_STACK': 'errorStack',
        'RESPONSE_LENGTH': 'responseLength',
        'TIMESTAMP': 'timestamp',
        'NAVIGATION_DIRECTION': 'navigationDirection',
        'TAB_NAME': 'tabName',
        'FONT_SIZE': 'fontSize',
        'COPY_TARGET': 'copyTarget',
        'PROCESSING_TIME': 'processingTime',
        'SUCCESS': 'success'
    }

    LOG_FILE_PATH = Path('logging.csv')
    CSV_HEADERS = ['timestamp', 'event', 'data']

    def __init__(self):
        self.config = Config()
        
        # Create CSV file with headers if it doesn't exist
        if not self.LOG_FILE_PATH.exists():
            with open(self.LOG_FILE_PATH, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(self.CSV_HEADERS)

    def log_event(self, event_name: str, data: Dict[str, Any] = None) -> None:
        """
        Log an event to a CSV file
        """
        if data is None:
            data = {}

        log_entry = [
            datetime.now().isoformat(),
            event_name,
            json.dumps(data)  # Convert dict to JSON string for CSV storage
        ]
        
        try:
            with open(self.LOG_FILE_PATH, 'a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(log_entry)
            print(f"Logged event to file: {event_name}")
            
        except Exception as error:
            print(f'Logging error: {str(error)}')
            print(f'Error type: {type(error).__name__}')

# Example usage can be simplified to:
def main():
    logger = Logger()
    
    # Log an event (no await needed)
    logger.log_event(
        Logger.EVENTS['TRANSCRIPT_RETRIEVAL_ATTEMPT'],
        {
            Logger.FIELDS['VIDEO_ID']: 'testing',
        }
    )    

if __name__ == "__main__":
    main()  # Remove asyncio.run()