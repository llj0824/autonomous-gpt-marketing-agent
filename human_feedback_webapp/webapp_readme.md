## Running the Application

### Prerequisites
- Python 3.8 or higher
- Node.js 14 or higher
- npm 6 or higher

### Backend Setup
1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Initialize the database:
   ```bash
   python backend/init_database.py
   ```

4. Start the FastAPI server, # Run at human_feedback_webapp folder level.
   ```bash
   uvicorn backend.main:app --reload
   ```
   The backend will be available at http://localhost:8000

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   The application will be available at http://localhost:3000

### Using the Application
1. Open your browser and navigate to http://localhost:3000
2. Add YouTube channels to monitor using the Channel Management section
3. Process videos will appear in the Video Queue
4. Click on a video to start reviewing its highlights
5. Use keyboard shortcuts for efficient review:
   - 'A' to approve a highlight
   - 'R' to reject a highlight
   - Left/Right arrow keys to navigate between highlights

### Development
- Backend API documentation is available at http://localhost:8000/docs
- The SQLite database is located at `data/app.db`
- Frontend source code is in the `frontend/src` directory