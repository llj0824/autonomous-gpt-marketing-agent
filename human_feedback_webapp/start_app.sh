#!/bin/bash

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PARENT_DIR="$(dirname "$DIR")"

# Start both servers in iTerm2 tabs
osascript -e 'tell application "iTerm"
    activate
    
    # Create a new window if none exists
    if not (exists current window) then
        create window with default profile
    end if
    
    tell current window
        # First tab - Backend
        create tab with default profile
        tell current session
            write text "cd '"$DIR"'"
            write text "source '"$PARENT_DIR/venv/bin/activate"'"
            write text "uvicorn backend.main:app --reload"
        end tell
        
        # Second tab - Frontend
        create tab with default profile
        tell current session
            write text "cd '"$DIR/frontend"' && npm start"
        end tell
    end tell
end tell'