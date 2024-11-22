def process_transcript(transcript_data, chunk_duration=60):
    """
    Segment the transcript into time-based chunks.

    :param transcript_data: List of transcript entries.
    :param chunk_duration: Duration of each chunk in seconds.
    :return: List of transcript chunks.
    """
    if not transcript_data:
        return []

    chunks = []
    current_chunk = {
        'start_time': transcript_data[0]['start'],
        'end_time': transcript_data[0]['start'],
        'text': ''
    }
    for entry in transcript_data:
        current_chunk['end_time'] = entry['start'] + entry['duration']
        current_chunk['text'] += ' ' + entry['text']

        if current_chunk['end_time'] - current_chunk['start_time'] >= chunk_duration:
            chunks.append(current_chunk)
            current_chunk = {
                'start_time': current_chunk['end_time'],
                'end_time': current_chunk['end_time'],
                'text': ''
            }
    # Add the last chunk
    if current_chunk['text']:
        chunks.append(current_chunk)
    return chunks