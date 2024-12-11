# Human Feedback Web Application

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Usage Guide](#usage-guide)
- [Development Guide](#development-guide)
- [Technical Components](#technical-components)
- [Testing](#testing)
- [TODO](#todo)

## Overview
The Human Feedback Web Application helps review and improve autonomously generated highlights from YouTube videos. It's designed to:
- Review highlights extracted from long-form YouTube videos
- Collect human feedback on highlight quality
- Train the autonomous system to better identify engaging content
- Prepare approved content for social media publication

## System Architecture
```mermaid
graph LR
    A[YouTube Videos] --> B[Transcription]
    B --> C[LLM Highlights]
    C --> D[Human Review]
    D --> E[Social Media Posts]
    D --> F[AI Training Feedback]
```

### Process Flow
1. **Content Sourcing**: Import videos from selected YouTube channels
2. **Processing Pipeline**:
   - Extract video transcripts
   - Clean and polish transcripts using AI
   - Generate highlight suggestions
3. **Review System**:
   - Human reviewers approve/reject highlights
   - Feedback collected for AI improvement
4. **Publication**: Approved highlights prepared for social media

## Installation

### Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python backend/init_database.py

# Start server (from human_feedback_webapp folder)
uvicorn backend.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Creating a Startup Application (macOS)
For convenience, you can create a clickable application that starts both servers:

1. Create a startup script:
```bash
# human_feedback_webapp/start_app.sh
#!/bin/bash

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start the backend server in a new Terminal window
osascript -e "tell application \"Terminal\"
    do script \"cd '$DIR' && source venv/bin/activate && uvicorn backend.main:app --reload\"
end tell"

# Start the frontend in a new Terminal window
osascript -e "tell application \"Terminal\"
    do script \"cd '$DIR/frontend' && npm start\"
end tell"
```

2. Make the script executable:
```bash
chmod +x start_app.sh
```

3. Create an AppleScript application:
   - Open Script Editor
   - Paste the following code:
```applescript
tell application "iTerm"
	set currentDir to "/Users/leojiang/Desktop/workspace/autonomous-gpt-marketing-agent/human_feedback_webapp"
	do script "cd '" & currentDir & "' && ./start_app.sh"
end tell
```
   - Go to File > Export
   - Choose "Application" as the File Format
   - Save as "Human Feedback App"
   - (Optional) Add an icon via right-click > Get Info

Note: You may need to grant Terminal permissions for Finder and Automation access in System Settings > Privacy & Security when first running the app.

## Usage Guide

### Getting Started
1. Access the application at http://localhost:3000
2. Add YouTube channels in the Dashboard
3. Review generated highlights from the Video Queue

### Review Interface
- Split-screen layout:
  - Left: Full video transcript
  - Right: Highlight cards for review
- Keyboard shortcuts:
  - `A` - Approve highlight
  - `R` - Reject highlight
  - `←/→` - Navigate highlights

## Development Guide

### Key Resources
- API documentation: http://localhost:8000/docs
- Database location: `data/app.db`
- Frontend code: `frontend/src/`

### Main Components

#### Dashboard (`Dashboard.jsx`)
- Channel management interface
- Video queue monitoring
- Processing status tracking

#### Highlight Review (`HighlightReview.jsx`)
- Split-screen review interface
- Approval/rejection functionality
- Progress tracking

## Technical Components

### AI Integration
The system uses AI (ChatGPT) for:
- Transcript enhancement
- Highlight generation
- Learning from human feedback

### Feedback System
- Records reviewer decisions
- Analyzes rejection patterns
- Improves AI highlight generation
- Maintains quality control

## Testing
```bash
# Run all tests
pytest

# Run specific test file
pytest human_feedback_webapp/backend/tests/test_youtube_service.py

# Verbose output
pytest -v human_feedback_webapp/backend/tests/test_youtube_service.py

# Include print statements
pytest -v -s human_feedback_webapp/backend/tests/test_youtube_service.py
```

---

**Note**: This application requires both backend (FastAPI) and frontend (React) servers running simultaneously. The backend handles data processing and storage, while the frontend provides the user interface.

## TODO
0. add comment column to highlights.
1. add source column to highlights 
  -> what is used to generate it -> prompt & system prompt

1. approve highlights view 
  -> descending order by 
2. download video button
3. video snippet from video (checks the video exists, else downloads video)
* [Done] app icon to start program on startup

