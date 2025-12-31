# Backend Specification Documents - Quick Reference

## Overview

This directory contains comprehensive technical specifications for the **Silhouette Image Analyzer Backend** - a Python-based service that analyzes full-body photos to automatically calculate garment measurements using computer vision.

---

## Document Structure

The specifications are organized into 8 documents, each covering a specific aspect of the backend:

### 📋 [00-BACKEND-OVERVIEW.md](./00-BACKEND-OVERVIEW.md)
**High-level feature summary and architecture**

**When to read**: Start here for executive summary and system overview

**Key contents**:
- Feature description and user flow
- System architecture diagram
- Technology stack overview
- Success criteria
- Quick start guide for implementers

---

### 🔌 [01-BACKEND-API-SPECIFICATION.md](./01-BACKEND-API-SPECIFICATION.md)
**Complete API contract and endpoint documentation**

**When to read**: Before implementing or integrating with the API

**Key contents**:
- Endpoint definitions (POST /measure, GET /health, GET /)
- Request/response schemas with examples
- Error codes and HTTP status codes
- Data format specifications (height, weight, images)
- Testing instructions (cURL, Postman)

**Critical sections**:
- Request format (FormData with photo + height_cm)
- Success response structure (measurements + confidence scores)
- Error response formats for each scenario
- Confidence score interpretation (0.90+ = green, 0.70-0.89 = yellow, <0.70 = red)

---

### 🤖 [02-BACKEND-MEDIAPIPE-IMPLEMENTATION.md](./02-BACKEND-MEDIAPIPE-IMPLEMENTATION.md)
**MediaPipe Pose Landmarker integration details**

**When to read**: When implementing the computer vision / pose detection

**Key contents**:
- MediaPipe model configuration (complexity=2 for accuracy)
- 33 pose landmark reference guide
- World coordinates vs image coordinates
- Landmark visibility checking
- Height calibration implementation
- Performance optimization tips

**Critical sections**:
- Model initialization (do once, not per request!)
- Accessing landmark coordinates
- Calculating distances between landmarks
- Height calibration formula (1.15x multiplier for nose-to-heel)

**Code highlights**:
- Complete main.py structure with FastAPI
- MediaPipe initialization pattern
- Image processing pipeline (read → decode → convert → process)

---

### 📏 [03-BACKEND-MEASUREMENT-CALCULATIONS.md](./03-BACKEND-MEASUREMENT-CALCULATIONS.md)
**Measurement algorithms and anthropometric calculations**

**When to read**: When implementing the measurement calculation logic

**Key contents**:
- Complete algorithms for 8 body measurements
- Garment measurement derivations (shirt, pants, jacket)
- Hybrid approach (direct measurement + anthropometric ratios)
- Unit conversions (cm to inches)
- Confidence score calculations

**Body measurements**:
1. Shoulder width (direct from landmarks 11, 12)
2. Chest circumference (estimated from shoulder × 2.2)
3. Waist circumference (estimated from hip × 0.9)
4. Hip width (direct from landmarks 23, 24)
5. Arm length (shoulder center to wrist 15/16)
6. Torso length (shoulder center to hip center)
7. Inseam length (hip center to ankle 27/28)
8. Leg opening (estimated from hip width × 0.47)

**Garment calculations**:
- Shirt: body measurements + 2" ease for chest
- Pants: body measurements, rise estimated from torso
- Jacket: body measurements + 4" ease for chest

**Critical sections**:
- `calculate_calibration_factor()` - converts world coords to real measurements
- Individual measurement functions with visibility checks
- `calculate_measurements()` - master function that orchestrates everything

---

### 🚀 [04-BACKEND-DEPLOYMENT-GUIDE.md](./04-BACKEND-DEPLOYMENT-GUIDE.md)
**Setup instructions for local development**

**When to read**: First time setting up the backend

**Key contents**:
- Python environment setup (venv, dependencies)
- requirements.txt with exact versions
- Step-by-step installation instructions
- Network configuration for React Native testing
- Firewall configuration (Windows/macOS/Linux)
- Ngrok setup (if needed)
- Troubleshooting common issues

**Quick start commands**:
```bash
# Setup
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt

# Run
python main.py

# Test
curl http://localhost:8000/health
```

**Network config**:
- Android Emulator: `http://10.0.2.2:8000`
- iOS Simulator: `http://localhost:8000`
- Physical Device: `http://192.168.1.x:8000` (your laptop IP)

**Critical sections**:
- Finding your local IP address
- Configuring Windows Firewall
- Testing connection from phone

---

### 📱 [05-FRONTEND-INTEGRATION-GUIDE.md](./05-FRONTEND-INTEGRATION-GUIDE.md)
**React Native integration code and examples**

**When to read**: When connecting the React Native app to backend

**Key contents**:
- Complete services/api.ts implementation
- Onboarding page updates for backend analysis
- Welcome page modifications to pass photo URI
- Garment editor updates to receive measurements
- Confidence indicator component (TODO)
- "Upload New Photo" button implementation

**Integration flow**:
1. Welcome page: User uploads photo → photoUri saved
2. Onboarding: User enters height/weight → triggers backend call
3. Backend processing: Photo + height sent, measurements received
4. Garment editor: Measurements auto-filled with confidence indicators

**Critical code**:
- `analyzeMeasurements()` function in api.ts
- `handleContinue()` in onboarding.tsx (calls backend)
- `applyBackendMeasurements()` in garment-editor.tsx
- Auto-fill logic (empty fields vs populated fields)

**Testing checklist**:
- Backend running and accessible
- API URL correctly configured
- Photo uploads successfully
- Measurements auto-fill
- Error handling works

---

### ⚠️ [06-BACKEND-ERROR-HANDLING.md](./06-BACKEND-ERROR-HANDLING.md)
**Error scenarios, codes, and recovery strategies**

**When to read**: When implementing error handling and testing edge cases

**Key contents**:
- All error scenarios with codes and HTTP status
- User-facing error messages
- Recovery strategies (retry, graceful degradation)
- Error logging best practices
- Test cases for each error type

**Error categories**:
1. Input validation (missing file, invalid height)
2. Image quality (blurry, low resolution, wrong format)
3. Processing (no body detected, calibration failed)
4. Network (timeout, connection failed)
5. Server (internal error, service unavailable)

**Error code reference table**:
| Code | Status | User Action |
|------|--------|-------------|
| NO_BODY_DETECTED | 400 | Retake with full body visible |
| POOR_IMAGE_QUALITY | 400 | Use better camera/lighting |
| INVALID_HEIGHT_VALUE | 422 | Check height value |
| FILE_TOO_LARGE | 413 | Compress image |
| INTERNAL_SERVER_ERROR | 500 | Retry or contact support |

**Critical sections**:
- Consistent error response format
- Partial detection handling (partial_success status)
- Frontend error handling examples
- Retry with exponential backoff

---

### 🔮 [07-BACKEND-FUTURE-ENHANCEMENTS.md](./07-BACKEND-FUTURE-ENHANCEMENTS.md)
**Roadmap, TODO items, and advanced features**

**When to read**: After core implementation, when planning next steps

**Key contents**:
- Phase-by-phase roadmap
- TODO items from user requirements
- Production deployment options (AWS, Google Cloud, Railway)
- Supabase integration plans
- Advanced features (video analysis, multiple photos, virtual try-on)
- Performance optimizations (GPU, caching, async processing)
- Cost estimates and timeline

**Phases**:
- Phase 1: Core backend ✓ (current scope)
- Phase 2: Confidence indicators (TODO)
- Phase 3: Production deployment (TODO)
- Phase 4: Supabase integration (TODO)
- Phase 5: Photo retention policy (TODO)
- Phase 6: Measurement history (TODO)

**Production deployment options**:
- AWS EC2: Best for scale ($20-100/month)
- Google Cloud Run: Best for simplicity ($5-30/month)
- Railway/Render: Easiest ($0-20/month)

**Timeline**: 8-12 weeks to full production

---

## Implementation Workflow

### For Backend Developers

1. **Read documents in order**:
   - 00-BACKEND-OVERVIEW.md (understand big picture)
   - 04-BACKEND-DEPLOYMENT-GUIDE.md (set up environment)
   - 01-BACKEND-API-SPECIFICATION.md (understand API contract)
   - 02-BACKEND-MEDIAPIPE-IMPLEMENTATION.md (implement pose detection)
   - 03-BACKEND-MEASUREMENT-CALCULATIONS.md (implement measurements)
   - 06-BACKEND-ERROR-HANDLING.md (implement error handling)

2. **Development process**:
   ```
   Setup → Implement → Test → Integrate → Deploy
   ```

3. **Testing**:
   - Test with various photos (different heights, poses, lighting)
   - Validate measurements against known values
   - Test error scenarios (no body, blurry, etc.)

---

### For Frontend Developers

1. **Read documents needed**:
   - 00-BACKEND-OVERVIEW.md (understand feature)
   - 01-BACKEND-API-SPECIFICATION.md (API contract)
   - 05-FRONTEND-INTEGRATION-GUIDE.md (integration code)
   - 06-BACKEND-ERROR-HANDLING.md (error handling)

2. **Integration process**:
   - Update services/api.ts with backend calls
   - Modify onboarding to trigger analysis
   - Update garment-editor to receive measurements
   - Implement error handling
   - Test end-to-end flow

3. **Testing checklist**:
   - [ ] Backend accessible from device
   - [ ] Photo uploads successfully
   - [ ] Measurements auto-fill
   - [ ] Errors handled gracefully
   - [ ] Loading states shown
   - [ ] Confidence indicators displayed (TODO)

---

### For Product Managers

1. **Key documents**:
   - 00-BACKEND-OVERVIEW.md (feature overview)
   - 07-BACKEND-FUTURE-ENHANCEMENTS.md (roadmap)

2. **Success metrics**:
   - Processing time < 10 seconds
   - Accuracy within ±2 inches for 80% of measurements
   - User acceptance rate > 70%
   - Uptime > 99.5%

3. **Timeline**:
   - Core backend: 2-3 weeks
   - Confidence indicators: 1 week
   - Production deployment: 1-2 weeks
   - Total: 8-12 weeks to full production

---

## Quick Reference

### Technology Stack

**Backend**:
- Python 3.8+
- FastAPI (web framework)
- Uvicorn (ASGI server)
- MediaPipe (pose detection)
- OpenCV (image processing)
- NumPy (numerical operations)

**Frontend**:
- React Native with Expo
- TypeScript
- AsyncStorage (local data)
- Expo Image Picker

**Future**:
- Supabase (database + storage + auth)
- Cloud hosting (AWS/GCP/Railway)

---

### Key Files to Implement

**Backend** (`backend/` directory):
- `main.py` - FastAPI server with MediaPipe integration
- `requirements.txt` - Python dependencies
- `.env` - Environment variables (optional)

**Frontend** (React Native app):
- `services/api.ts` - Backend API client
- `app/welcome.tsx` - Photo upload (updated)
- `app/onboarding.tsx` - Height/weight + backend trigger
- `app/garment-editor.tsx` - Measurement display + auto-fill
- `components/ConfidenceIndicator.tsx` - Confidence display (TODO)

---

### Common Commands

```bash
# Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Testing
curl http://localhost:8000/health
curl -X POST http://localhost:8000/measure -F "file=@photo.jpg" -F "height_cm=175"

# Frontend
npm install
npm start

# Find local IP
ipconfig  # Windows
ifconfig  # macOS/Linux
```

---

### Support Resources

**Documentation**:
- MediaPipe Pose: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
- FastAPI: https://fastapi.tiangolo.com/
- React Native: https://reactnative.dev/

**Troubleshooting**:
- Check 04-BACKEND-DEPLOYMENT-GUIDE.md "Common Issues" section
- Review 06-BACKEND-ERROR-HANDLING.md for error scenarios
- Verify network configuration (firewall, IP address)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-31 | Initial comprehensive specification |

---

## Contact

**Project**: Silhouette - Garment Measurement App
**Feature**: Image Analyzer Backend
**Specification Version**: 1.0

---

## License

All specifications are proprietary to the Silhouette project.

---

**Happy Building!**

Start with 00-BACKEND-OVERVIEW.md and follow the implementation workflow. Each document builds on the previous ones to provide a complete implementation guide.
