#!/bin/bash

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PARENT_DIR="$(dirname "$DIR")"

osascript <<EOF
tell application "iTerm"
    activate

    # Create a single new window
    set newWindow to (create window with default profile)
    set nw_id to id of newWindow
    
    tell newWindow
        # First tab - Backend
        tell current session of first tab
            write text "cd '${DIR}'"
            write text "source '${PARENT_DIR}/venv/bin/activate'"
            write text "uvicorn backend.main:app --reload"
        end tell

        # Second tab - Frontend
        create tab with default profile
        tell current session of second tab
            write text "cd '${DIR}/frontend' && npm start"
        end tell
    end tell

    # Close all other windows, leaving only the newly created one
    set window_list to every window
    repeat with w in window_list
        if id of w is not nw_id then
            close w
        end if
    end repeat
end tell
EOF