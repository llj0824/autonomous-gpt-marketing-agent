# logger.py
import json
from datetime import datetime
import aiohttp
import asyncio
from typing import Dict, Any, List
import logging

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

    def __init__(self):
        self.logging_endpoint = (
            "https://script.google.com/macros/s/AKfycbwMzBx3xT-pIK-xi_fxGD5ZOZNwAbpyoQ7gSJ8pzirXmEpERc6OWqP0RWeSIiDa75EuEA/exec"
        )
        # Initialize storage
        self.storage = {}

    async def log_event(self, event_name: str, data: Dict[str, Any] = None) -> None:
        """
        Log an event to the remote endpoint and handle failures
        """
        if data is None:
            data = {}

        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'event': event_name,
            'data': data
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.logging_endpoint,
                    headers={'Content-Type': 'application/json'},
                    json=log_entry
                ) as response:
                    # Note: We're not checking response status due to no-cors mode
                    pass
        except Exception as error:
            print(f'Logging error: {error}')
            await self._store_log_locally(log_entry)

    async def _store_log_locally(self, log_entry: Dict[str, Any]) -> None:
        """
        Store failed logs locally
        """
        failed_logs = self.storage.get('failed_logs', [])
        failed_logs.append(log_entry)
        
        # Keep only the last 1000 failed logs
        if len(failed_logs) > 1000:
            failed_logs.pop(0)
        
        self.storage['failed_logs'] = failed_logs

    async def retry_failed_logs(self) -> int:
        """
        Retry sending failed logs to the endpoint
        Returns the number of successful retries
        """
        failed_logs = self.storage.get('failed_logs', [])
        successful_retries = []

        async with aiohttp.ClientSession() as session:
            for log_entry in failed_logs:
                try:
                    async with session.post(
                        self.logging_endpoint,
                        headers={'Content-Type': 'application/json'},
                        json=log_entry
                    ) as response:
                        successful_retries.append(log_entry)
                except Exception as error:
                    print(f'Failed to retry log: {error}')

        # Remove successful retries from failed logs
        remaining_logs = [log for log in failed_logs if log not in successful_retries]
        self.storage['failed_logs'] = remaining_logs

        return len(successful_retries)

# Example usage
async def main():
    logger = Logger()
    
    # Log an event
    await logger.log_event(
        Logger.EVENTS['TRANSCRIPT_RETRIEVAL_ATTEMPT'],
        {
            Logger.FIELDS['VIDEO_ID']: 'abc123',
            Logger.FIELDS['TRANSCRIPT_LENGTH']: 1000
        }
    )
    
    # Retry failed logs
    successful_retries = await logger.retry_failed_logs()
    print(f"Successfully retried {successful_retries} logs")

if __name__ == "__main__":
    asyncio.run(main())