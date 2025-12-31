# Backend Deployment Guide

## Overview

This document provides step-by-step instructions for setting up and deploying the Image Analyzer Backend locally for development and testing.

---

## Prerequisites

### System Requirements

- **Operating System**: Windows, macOS, or Linux
- **Python Version**: 3.8 or higher (3.10+ recommended)
- **RAM**: Minimum 4GB (8GB+ recommended for better performance)
- **Disk Space**: ~1GB for dependencies

### Required Tools

- Python 3.8+
- pip (Python package manager)
- Text editor or IDE (VS Code, PyCharm, etc.)

---

## Local Development Setup

### Step 1: Create Project Directory

```bash
# Navigate to your projects folder
cd C:\Users\kzhou\OneDrive\Documents\React\Silhouette

# Create backend directory
mkdir backend
cd backend
```

### Step 2: Set Up Python Virtual Environment

**Windows**:
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate
```

**macOS/Linux**:
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate
```

**Verification**:
Your terminal prompt should now show `(venv)` prefix.

### Step 3: Install Dependencies

Create `requirements.txt`:

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
numpy==1.24.3
opencv-python==4.8.1.78
mediapipe==0.10.8
```

Install dependencies:

```bash
pip install -r requirements.txt
```

**Installation Time**: 2-5 minutes depending on internet speed

**Verify Installation**:
```bash
python -c "import fastapi, mediapipe, cv2, numpy; print('All dependencies installed successfully!')"
```

### Step 4: Create Backend Server File

Create `main.py` in the `backend` directory.

Use the complete implementation from:
- **02-BACKEND-MEDIAPIPE-IMPLEMENTATION.md** (MediaPipe integration)
- **03-BACKEND-MEASUREMENT-CALCULATIONS.md** (Measurement algorithms)

Copy the complete code from these documents into `main.py`.

### Step 5: Start the Server

```bash
# Make sure virtual environment is activated
# You should see (venv) in your terminal prompt

python main.py
```

**Expected Output**:
```
Initializing MediaPipe Pose model...
MediaPipe Pose model initialized successfully!
Starting Silhouette Image Analyzer Backend...
Server will be available at:
  - http://localhost:8000 (local)
  - http://0.0.0.0:8000 (network)

Press Ctrl+C to stop the server

INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Step 6: Test Server is Running

Open a new terminal and test:

```bash
# Test health endpoint
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","service":"silhouette-image-analyzer","version":"1.0.0","mediapipe_initialized":true,"timestamp":"..."}
```

Or open browser and navigate to: `http://localhost:8000`

---

## Network Configuration for React Native

### Option 1: Testing on Same Machine (Emulator/Simulator)

**Android Emulator**:
- Use `http://10.0.2.2:8000`
- This is a special IP that points to the host machine

**iOS Simulator** (macOS only):
- Use `http://localhost:8000`
- iOS simulator shares localhost with host machine

### Option 2: Testing on Physical Device (Same WiFi)

#### Find Your Computer's Local IP Address

**Windows**:
```bash
ipconfig

# Look for "IPv4 Address" under your WiFi adapter
# Example: 192.168.1.105
```

**macOS**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1

# Example output: inet 192.168.1.105 netmask...
```

**Linux**:
```bash
hostname -I

# Example output: 192.168.1.105
```

#### Configure Firewall

**Windows Firewall**:
1. Open "Windows Defender Firewall"
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change settings"
4. Click "Allow another app"
5. Browse to `python.exe` in your venv folder
6. Add for both Private and Public networks
7. Click OK

**Alternative (simpler but less secure)**:
```bash
# Temporarily disable firewall for testing
# Windows: Settings > Update & Security > Windows Security > Firewall & network protection > Turn off

# Remember to re-enable after testing!
```

**macOS Firewall**:
1. System Preferences > Security & Privacy > Firewall
2. If on, Python should auto-prompt for network access
3. Click "Allow"

**Linux (ufw)**:
```bash
sudo ufw allow 8000
```

#### Test Connection from Phone

1. Ensure phone and laptop are on same WiFi network
2. On phone browser, navigate to `http://YOUR_IP:8000`
   - Example: `http://192.168.1.105:8000`
3. You should see the API info page

**In React Native App**:
```javascript
// Update API base URL
const API_BASE_URL = 'http://192.168.1.105:8000';
```

### Option 3: Using Ngrok (If Firewall Issues)

Ngrok creates a public tunnel to your local server.

#### Install Ngrok

Download from: https://ngrok.com/download

Or via package manager:

**Windows (Chocolatey)**:
```bash
choco install ngrok
```

**macOS (Homebrew)**:
```bash
brew install ngrok/ngrok/ngrok
```

#### Start Ngrok Tunnel

```bash
# Start backend server first
python main.py

# In new terminal, start ngrok
ngrok http 8000
```

**Output**:
```
Session Status                online
Forwarding                    https://abcd-12-34-56-78.ngrok.io -> http://localhost:8000
```

**In React Native App**:
```javascript
const API_BASE_URL = 'https://abcd-12-34-56-78.ngrok.io';
```

**Note**: Free ngrok URLs expire when you close ngrok. You'll get a new URL each time.

---

## Testing the Backend

### Test 1: Health Check

```bash
curl http://localhost:8000/health
```

**Expected**: `{"status":"healthy",...}`

### Test 2: Measurement Endpoint

Prepare a test image (full-body photo).

```bash
curl -X POST http://localhost:8000/measure \
  -F "file=@test_photo.jpg" \
  -F "height_cm=175.0"
```

**Expected**: JSON with measurements and confidence scores

### Test 3: Error Handling

Test with invalid image:

```bash
curl -X POST http://localhost:8000/measure \
  -F "file=@document.pdf" \
  -F "height_cm=175.0"
```

**Expected**: Error response about invalid file format

---

## Project Structure

```
backend/
├── venv/                    # Virtual environment (git-ignored)
├── main.py                  # Main FastAPI application
├── requirements.txt         # Python dependencies
├── test_images/            # Test photos (optional)
│   ├── test_photo_1.jpg
│   └── test_photo_2.jpg
└── README.md               # Backend documentation
```

---

## Environment Variables (Optional)

For easier configuration, create `.env` file:

```env
# .env
HOST=0.0.0.0
PORT=8000
DEBUG=True
LOG_LEVEL=info
MODEL_COMPLEXITY=2
MIN_DETECTION_CONFIDENCE=0.5
```

Install python-dotenv:
```bash
pip install python-dotenv
```

Load in main.py:
```python
from dotenv import load_dotenv
import os

load_dotenv()

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# Use in uvicorn.run()
```

---

## Common Issues and Solutions

### Issue 1: Port Already in Use

**Error**: `Address already in use`

**Solution**:
```bash
# Windows: Find process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8000
kill -9 <PID>

# Or use a different port
uvicorn.run(app, host="0.0.0.0", port=8001)
```

### Issue 2: Module Not Found

**Error**: `ModuleNotFoundError: No module named 'mediapipe'`

**Solution**:
```bash
# Ensure virtual environment is activated
# You should see (venv) in prompt

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue 3: Cannot Connect from Phone

**Checklist**:
- [ ] Phone and laptop on same WiFi?
- [ ] Using correct IP address? (not 127.0.0.1 or localhost)
- [ ] Firewall allows Python?
- [ ] Server running on 0.0.0.0 (not 127.0.0.1)?
- [ ] Port 8000 accessible?

**Debug**:
```bash
# Test from another device on same network
curl http://YOUR_IP:8000/health

# If this works, issue is with React Native config
# If this fails, issue is with network/firewall
```

### Issue 4: Slow Processing

**Possible causes**:
- Large image files (>5MB)
- Model initialized per request (should be global)
- Low CPU performance

**Solutions**:
- Resize images on frontend before upload
- Ensure model initialized outside endpoint function
- Use model_complexity=1 for faster (less accurate) processing

### Issue 5: MediaPipe Not Detecting Body

**Checklist**:
- [ ] Full body visible in photo (head to toes)?
- [ ] Person facing camera?
- [ ] Good lighting (not too dark)?
- [ ] Minimal background clutter?
- [ ] Person not obscured by objects?

**Debug**:
```python
# Add debugging to main.py
if not results.pose_world_landmarks:
    print(f"No landmarks detected in image {image_width}x{image_height}")
    # Save image for inspection
    cv2.imwrite("debug_failed.jpg", image)
```

---

## Development Workflow

### Recommended Development Process

1. **Start Server**: `python main.py`
2. **Make Code Changes**: Edit main.py
3. **Restart Server**: Ctrl+C, then `python main.py` again
4. **Test Changes**: Use curl or React Native app

### Auto-Reload During Development

For automatic reload on code changes:

```bash
# Instead of python main.py, use:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Note**: Remove the `if __name__ == "__main__"` block when using this method.

---

## Logging and Debugging

### Enable Detailed Logging

```python
import logging

# Add to main.py (after imports)
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Use in code
logger.info(f"Processing image {image_width}x{image_height}")
logger.debug(f"Detected {len(landmarks)} landmarks")
logger.error(f"Error processing image: {str(e)}")
```

### Request Logging

```python
# Add middleware for request logging
@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response
```

---

## Performance Optimization

### 1. Image Size Limits

```python
# Add to /measure endpoint
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

file_size = len(contents)
if file_size > MAX_FILE_SIZE:
    raise HTTPException(
        status_code=413,
        detail={"error_code": "FILE_TOO_LARGE", "message": "File size exceeds 10MB"}
    )
```

### 2. Image Resizing

```python
# Resize large images for faster processing
MAX_DIMENSION = 1920

if image_width > MAX_DIMENSION or image_height > MAX_DIMENSION:
    scale = MAX_DIMENSION / max(image_width, image_height)
    new_width = int(image_width * scale)
    new_height = int(image_height * scale)
    image = cv2.resize(image, (new_width, new_height))
```

### 3. Caching (Future Enhancement)

For repeated requests with same image:
- Use hash of image as cache key
- Store results in Redis or in-memory cache
- Return cached results if available

---

## Security Considerations (Production)

**TODO for Production Deployment**:

1. **Rate Limiting**: Prevent abuse
2. **API Authentication**: Require API keys or JWT tokens
3. **HTTPS**: Use SSL/TLS encryption
4. **Input Validation**: Strict file type and size checks
5. **CORS**: Restrict allowed origins
6. **Error Messages**: Don't leak sensitive information

---

## Next Steps

After local deployment is working:

1. **Test with React Native**: Follow **05-FRONTEND-INTEGRATION-GUIDE.md**
2. **Validate Measurements**: Test with known body measurements
3. **Handle Edge Cases**: Review **06-BACKEND-ERROR-HANDLING.md**
4. **Plan Production**: Review **07-BACKEND-FUTURE-ENHANCEMENTS.md** for cloud deployment

---

## Production Deployment (TODO)

**Future Cloud Deployment Options**:

### Option A: AWS EC2
- Deploy on EC2 instance with Ubuntu
- Use Gunicorn + Nginx for production
- Set up Auto Scaling for traffic spikes

### Option B: Google Cloud Run
- Containerize with Docker
- Deploy to Cloud Run (serverless)
- Auto-scales to zero when not in use

### Option C: Heroku
- Simple deployment with Heroku CLI
- Good for MVP/testing
- Add Heroku Postgres if needed

### Option D: Railway / Render
- Modern, easy-to-use platforms
- Git-based deployment
- Free tier available

**See 07-BACKEND-FUTURE-ENHANCEMENTS.md for detailed production deployment guide.**

---

## Helpful Commands Reference

```bash
# Virtual environment
python -m venv venv                 # Create venv
venv\Scripts\activate               # Activate (Windows)
source venv/bin/activate            # Activate (macOS/Linux)
deactivate                          # Deactivate

# Dependencies
pip install -r requirements.txt     # Install dependencies
pip freeze > requirements.txt       # Save current packages
pip list                            # List installed packages

# Running server
python main.py                      # Run with script
uvicorn main:app --reload           # Run with auto-reload
uvicorn main:app --host 0.0.0.0 --port 8000  # Run on network

# Testing
curl http://localhost:8000/health   # Health check
curl -X POST ...                    # Test measure endpoint

# Networking
ipconfig                            # Windows: Get local IP
ifconfig                            # macOS/Linux: Get local IP
ping 192.168.1.105                  # Test connectivity
```

---

## Support and Troubleshooting

If you encounter issues not covered here:

1. Check server logs for error messages
2. Verify all dependencies are installed
3. Ensure network configuration is correct
4. Test with curl before React Native app
5. Review error handling documentation (06-BACKEND-ERROR-HANDLING.md)

Remember to check that:
- Python 3.8+ is installed
- Virtual environment is activated
- All dependencies are installed
- Server is running on 0.0.0.0 (not 127.0.0.1)
- Firewall allows connections
- Correct IP address is used in React Native app
