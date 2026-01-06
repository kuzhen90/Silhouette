# Silhouette

A React Native app for managing personalized garment measurements. Users can upload a full-body photo, and the app uses AI (MediaPipe) to automatically calculate body measurements and recommend garment sizes.

## Features

### Onboarding Flow
1. **Welcome Page** - Users upload a full-body photo via camera or gallery
2. **Measurements Page** - Users enter their height and weight for calibration
3. **AI Analysis** - Backend processes the photo and calculates body measurements

### Garment Editor
The main application screen where users can:
- Select garment type (Shirt, Pants, Jacket)
- View interactive SVG garment visualizations with measurement indicators
- Edit measurements specific to each garment type:
  - **Shirt**: Shoulder Width, Chest, Sleeve Length, Body Length
  - **Pants**: Waist, Inseam, Rise, Leg Opening
  - **Jacket**: Shoulder Width, Chest, Sleeve Length, Body Length
- Measurements auto-save and persist across sessions

## Tech Stack

### Frontend
- React Native with Expo
- Expo Router (file-based routing)
- AsyncStorage for data persistence
- react-native-svg for garment visualizations
- expo-image-picker for camera/gallery access

### Backend
- Python FastAPI server
- MediaPipe Pose Landmarker for body detection
- OpenCV for image processing
- Docker for containerization

## Getting Started

### Prerequisites
- Node.js 18+
- Docker Desktop (for backend)
- Expo Go app on your mobile device

### 1. Start the Backend (Docker)

```bash
cd backend
docker-compose up --build
```

The backend will start at `http://localhost:8000`. You can verify it's running by visiting `http://localhost:8000/health` in your browser.

### 2. Start the Frontend (Expo)

In a new terminal:

```bash
npm install
npx expo start
```

### 3. Connect Your Device

Scan the QR code with Expo Go (Android) or Camera app (iOS).

**Important for Physical Devices:**
- Make sure your phone and computer are on the same Wi-Fi network
- The app is configured to connect to `http://192.168.1.154:8000`
- If your computer has a different IP, update `LOCAL_NETWORK` in `services/api.ts`

To find your computer's IP:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

## Project Structure

```
app/
  _layout.tsx        # Root layout with navigation logic
  welcome.tsx        # Photo upload welcome screen
  onboarding.tsx     # Height/weight input + backend analysis
  garment-editor.tsx # Main garment measurement editor
  index.tsx          # Default route

components/
  GarmentVisual.tsx    # SVG garment illustrations
  MeasurementPanel.tsx # Measurement input panel

services/
  api.ts             # Backend API integration

utils/
  storage.ts         # AsyncStorage helpers for persistence

backend/
  main.py            # FastAPI server with MediaPipe
  requirements.txt   # Python dependencies
  Dockerfile         # Container configuration
  docker-compose.yml # Docker orchestration
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information |
| `/health` | GET | Health check |
| `/measure` | POST | Analyze photo and return measurements |

## Troubleshooting

### "Network request failed" error
1. Ensure the Docker backend is running (`docker-compose up`)
2. Check that your phone and computer are on the same Wi-Fi
3. Verify the IP address in `services/api.ts` matches your computer

### Backend won't start
1. Make sure Docker Desktop is running
2. Try rebuilding: `docker-compose up --build --force-recreate`

### MediaPipe can't detect body
- Ensure full body is visible in the photo (head to toes)
- Use good lighting with minimal shadows
- Stand against a plain background
- Stand 6-8 feet from the camera
