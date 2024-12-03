Start the FastAPI server, # Run at human_feedback_webapp folder level.
   ```bash
   uvicorn backend.main:app --reload
   ```
   The backend will be available at http://localhost:8000

## Development
- Backend API documentation is available at http://localhost:8000/docs
- The SQLite database is located at `data/app.db`
- Frontend source code is in the `frontend/src` directory

### Run all tests
pytest

### Run this specific test file
pytest human_feedback_webapp/backend/tests/test_youtube_service.py

### Run with more detailed output (-v for verbose)
pytest -v human_feedback_webapp/backend/tests/test_youtube_service.py

### Run with print statement output (-s flag)
pytest -v -s human_feedback_webapp/backend/tests/test_youtube_service.py