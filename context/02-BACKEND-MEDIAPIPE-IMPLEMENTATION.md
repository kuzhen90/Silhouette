# MediaPipe Pose Landmarker Implementation

## Overview

This document provides complete implementation details for integrating MediaPipe's Pose Landmarker model into the FastAPI backend. It includes model configuration, landmark detection, coordinate processing, and best practices.

---

## MediaPipe Pose Landmarker Overview

MediaPipe Pose is a ML solution that detects 33 3D landmarks on the human body from a single image or video frame.

### Why Pose Landmarker?
- **Accuracy**: Best-in-class pose estimation for full-body tracking
- **3D Coordinates**: Provides x, y, z world coordinates (not just 2D pixels)
- **Static Image Mode**: Optimized for analyzing photos (vs. video streams)
- **Model Complexity Options**: Can choose between speed and accuracy
- **No GPU Required**: Runs on CPU (GPU optional for faster processing)

---

## Model Configuration

### Model Complexity Selection

MediaPipe Pose offers 3 model complexity levels:

| Complexity | Speed | Accuracy | Use Case |
|------------|-------|----------|----------|
| 0 (Lite) | Fastest | Lower | Real-time video on mobile |
| 1 (Full) | Medium | Good | Real-time video on desktop |
| 2 (Heavy) | Slowest | Best | Static image analysis |

**Selected Configuration**: **Complexity 2 (Heavy)**

**Rationale**:
- Analyzing static photos (not video), so speed less critical
- User accepts 5-15 second processing time
- Accuracy is priority for garment measurements
- Processing happens server-side (not on mobile device)

### Initialization Parameters

```python
import mediapipe as mp

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=True,      # Optimized for photos (not video)
    model_complexity=2,           # Use most accurate model
    smooth_landmarks=False,       # No smoothing needed for static images
    enable_segmentation=False,    # Don't need background segmentation
    smooth_segmentation=False,    # Not applicable
    min_detection_confidence=0.5, # Minimum confidence to detect pose
    min_tracking_confidence=0.5   # Not used in static mode
)
```

**Parameter Explanations**:

- `static_image_mode=True`: Treats each image independently (no temporal smoothing)
- `model_complexity=2`: Use Heavy model for maximum accuracy
- `smooth_landmarks=False`: No smoothing across frames (we only have one frame)
- `enable_segmentation=False`: We don't need person segmentation mask
- `min_detection_confidence=0.5`: Accept pose if confidence ≥ 50%

---

## 33 Pose Landmarks

MediaPipe detects these landmarks (indices 0-32):

```
Landmark Index Reference:
0:  Nose
1:  Left Eye (inner)
2:  Left Eye
3:  Left Eye (outer)
4:  Right Eye (inner)
5:  Right Eye
6:  Right Eye (outer)
7:  Left Ear
8:  Right Ear
9:  Mouth (left)
10: Mouth (right)
11: Left Shoulder
12: Right Shoulder
13: Left Elbow
14: Right Elbow
15: Left Wrist
16: Right Wrist
17: Left Pinky
18: Right Pinky
19: Left Index
20: Right Index
21: Left Thumb
22: Right Thumb
23: Left Hip
24: Right Hip
25: Left Knee
26: Right Knee
27: Left Ankle
28: Right Ankle
29: Left Heel
30: Right Heel
31: Left Foot Index
32: Right Foot Index
```

**Visual Reference**:
```
        0 (nose)
    7       8 (ears)
        11-12 (shoulders)
        13-14 (elbows)
        15-16 (wrists)
        23-24 (hips)
        25-26 (knees)
        27-28 (ankles)
        29-30 (heels)
```

---

## Implementation Code

### Complete main.py Structure

```python
import cv2
import mediapipe as mp
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import Optional
import time

# Initialize FastAPI app
app = FastAPI(
    title="Silhouette Image Analyzer",
    description="Backend for analyzing full-body photos and calculating measurements",
    version="1.0.0"
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe Pose outside request handler (for speed)
print("Initializing MediaPipe Pose model...")
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=True,
    model_complexity=2,
    smooth_landmarks=False,
    enable_segmentation=False,
    min_detection_confidence=0.5
)
print("MediaPipe Pose model initialized successfully!")


@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "service": "Silhouette Image Analyzer Backend",
        "version": "1.0.0",
        "endpoints": [
            {"path": "/measure", "method": "POST", "description": "Analyze photo"},
            {"path": "/health", "method": "GET", "description": "Health check"}
        ]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "silhouette-image-analyzer",
        "version": "1.0.0",
        "mediapipe_initialized": True,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }


@app.post("/measure")
async def get_measurement(
    file: UploadFile = File(...),
    height_cm: float = Form(...),
    weight_kg: Optional[float] = Form(None)
):
    """
    Analyze full-body photo and return measurements

    Args:
        file: Full-body photo (JPEG or PNG)
        height_cm: User's height in centimeters (50-250)
        weight_kg: User's weight in kilograms (optional, for future use)

    Returns:
        JSON with body measurements, garment measurements, and confidence scores
    """
    start_time = time.time()

    # Validate height
    if not (50 <= height_cm <= 250):
        raise HTTPException(
            status_code=422,
            detail={
                "status": "error",
                "error_code": "INVALID_HEIGHT_VALUE",
                "message": f"Height {height_cm}cm is out of valid range (50-250cm)"
            }
        )

    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=400,
            detail={
                "status": "error",
                "error_code": "INVALID_FILE_FORMAT",
                "message": "Invalid image format. Please upload JPEG or PNG.",
                "details": {
                    "received_format": file.content_type,
                    "supported_formats": ["image/jpeg", "image/png"]
                }
            }
        )

    try:
        # 1. READ AND DECODE IMAGE
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "error",
                    "error_code": "INVALID_IMAGE",
                    "message": "Could not decode image file"
                }
            )

        # Check image resolution
        image_height, image_width = image.shape[:2]
        if image_width < 640 or image_height < 480:
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "error",
                    "error_code": "POOR_IMAGE_QUALITY",
                    "message": "Image resolution too low for accurate measurements",
                    "details": {
                        "image_resolution": f"{image_width}x{image_height}",
                        "minimum_required": "1280x720"
                    }
                }
            )

        # Convert BGR to RGB (MediaPipe expects RGB)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # 2. RUN MEDIAPIPE POSE DETECTION
        results = pose.process(image_rgb)

        if not results.pose_world_landmarks:
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "error",
                    "error_code": "NO_BODY_DETECTED",
                    "message": "Could not detect body in photo",
                    "suggestions": [
                        "Stand 6-8 feet from the camera",
                        "Ensure full body is visible (head to toes)",
                        "Use good lighting (avoid shadows)",
                        "Wear tight-fitting clothing",
                        "Stand against a plain background"
                    ]
                }
            )

        # 3. EXTRACT LANDMARKS
        landmarks = results.pose_world_landmarks.landmark
        detected_count = len(landmarks)

        # 4. CALCULATE MEASUREMENTS
        # (See 03-BACKEND-MEASUREMENT-CALCULATIONS.md for full implementation)
        measurements_result = calculate_measurements(
            landmarks=landmarks,
            height_cm=height_cm,
            weight_kg=weight_kg
        )

        # 5. PREPARE RESPONSE
        processing_time_ms = int((time.time() - start_time) * 1000)

        response = {
            "status": measurements_result["status"],
            "message": measurements_result["message"],
            "body_measurements": measurements_result["body_measurements"],
            "garment_measurements": measurements_result["garment_measurements"],
            "metadata": {
                "processing_time_ms": processing_time_ms,
                "image_width": image_width,
                "image_height": image_height,
                "detected_landmarks": detected_count,
                "model_version": "mediapipe_pose_v2",
                "calibration_factor": measurements_result["calibration_factor"]
            }
        }

        # Add warnings if partial detection
        if "warnings" in measurements_result:
            response["warnings"] = measurements_result["warnings"]

        return response

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred during processing"
            }
        )


def calculate_measurements(landmarks, height_cm: float, weight_kg: Optional[float]):
    """
    Calculate body and garment measurements from pose landmarks

    This is a placeholder - see 03-BACKEND-MEASUREMENT-CALCULATIONS.md
    for complete implementation
    """
    # Implementation in next specification document
    pass


if __name__ == "__main__":
    print("Starting Silhouette Image Analyzer Backend...")
    print("Server will be available at:")
    print("  - http://localhost:8000 (local)")
    print("  - http://0.0.0.0:8000 (network)")
    print("\nPress Ctrl+C to stop the server")

    uvicorn.run(
        app,
        host="0.0.0.0",  # Listen on all network interfaces
        port=8000,
        log_level="info"
    )
```

---

## Landmark Coordinate System

### World Coordinates vs Image Coordinates

MediaPipe provides TWO coordinate systems:

**1. Image Coordinates (`pose_landmarks`)**:
- Normalized to image dimensions (0.0 - 1.0)
- x: 0 (left) to 1 (right)
- y: 0 (top) to 1 (bottom)
- z: Depth relative to hips (smaller = closer to camera)

**2. World Coordinates (`pose_world_landmarks`)** ← **WE USE THIS**:
- Real-world 3D coordinates in meters
- Origin: Mid-point between hips
- x: Left (-) to Right (+)
- y: Bottom (-) to Top (+)
- z: Far (-) to Near (+) relative to camera

**Why World Coordinates?**:
- Scale-independent (not affected by image resolution)
- Represents actual 3D space
- Better for calculating real-world measurements
- Already in metric units (meters)

### Accessing Landmarks

```python
# Get world landmarks
landmarks = results.pose_world_landmarks.landmark

# Access specific landmark
nose = landmarks[0]
left_shoulder = landmarks[11]
right_shoulder = landmarks[12]

# Extract coordinates
print(f"Left Shoulder: x={left_shoulder.x}, y={left_shoulder.y}, z={left_shoulder.z}")

# Convert to numpy array for calculations
l_shoulder_array = np.array([
    landmarks[11].x,
    landmarks[11].y,
    landmarks[11].z
])
```

---

## Common Operations

### 1. Calculate Distance Between Two Landmarks

```python
def calculate_distance(landmark1, landmark2):
    """Calculate 3D Euclidean distance between two landmarks"""
    p1 = np.array([landmark1.x, landmark1.y, landmark1.z])
    p2 = np.array([landmark2.x, landmark2.y, landmark2.z])
    return np.linalg.norm(p2 - p1)

# Example: Shoulder width
shoulder_width_m = calculate_distance(landmarks[11], landmarks[12])
shoulder_width_cm = shoulder_width_m * 100  # Convert to cm
```

### 2. Calculate Midpoint

```python
def calculate_midpoint(landmark1, landmark2):
    """Calculate midpoint between two landmarks"""
    p1 = np.array([landmark1.x, landmark1.y, landmark1.z])
    p2 = np.array([landmark2.x, landmark2.y, landmark2.z])
    return (p1 + p2) / 2

# Example: Center of shoulders
shoulder_center = calculate_midpoint(landmarks[11], landmarks[12])
```

### 3. Check Landmark Visibility

```python
def is_landmark_visible(landmark, visibility_threshold=0.5):
    """Check if landmark is visible with sufficient confidence"""
    return landmark.visibility >= visibility_threshold

# Example: Check if both knees are visible
left_knee_visible = is_landmark_visible(landmarks[25])
right_knee_visible = is_landmark_visible(landmarks[26])

if not (left_knee_visible and right_knee_visible):
    print("Warning: Knees not fully visible")
```

---

## Height Calibration

The key to accurate measurements is calibrating pixel/world coordinates to real-world units using user-provided height.

### Calibration Process

```python
def calculate_calibration_factor(landmarks, actual_height_cm):
    """
    Calculate scaling factor to convert world coordinates to real measurements

    Args:
        landmarks: MediaPipe pose landmarks
        actual_height_cm: User's actual height in centimeters

    Returns:
        calibration_factor: Multiplier to scale measurements
    """
    # Get top of head (nose is highest reliable landmark)
    nose = landmarks[0]

    # Get bottom of feet (use lower heel)
    left_heel = landmarks[29]
    right_heel = landmarks[30]
    heel = left_heel if left_heel.y < right_heel.y else right_heel

    # Calculate detected height in world coordinates (meters)
    # Add 15% to account for head height above nose
    detected_height_m = abs(heel.y - nose.y) * 1.15

    # Calculate calibration factor
    actual_height_m = actual_height_cm / 100
    calibration_factor = actual_height_m / detected_height_m

    return calibration_factor

# Usage
calibration_factor = calculate_calibration_factor(landmarks, height_cm)

# Apply to measurements
shoulder_width_raw = calculate_distance(landmarks[11], landmarks[12])
shoulder_width_calibrated = shoulder_width_raw * calibration_factor * 100  # in cm
```

**Why 1.15 multiplier?**:
- Nose is not the top of the head
- Typical distance from nose to crown is ~12-15% of total height
- This approximation improves accuracy

---

## Error Handling

### Detecting Missing Landmarks

```python
def get_visible_landmarks(landmarks, threshold=0.5):
    """Return list of visible landmark indices"""
    visible = []
    for i, landmark in enumerate(landmarks):
        if landmark.visibility >= threshold:
            visible.append(i)
    return visible

def get_missing_landmarks(landmarks, threshold=0.5):
    """Return list of missing landmark indices"""
    missing = []
    for i, landmark in enumerate(landmarks):
        if landmark.visibility < threshold:
            missing.append(i)
    return missing

# Usage
visible = get_visible_landmarks(landmarks)
missing = get_missing_landmarks(landmarks)

print(f"Detected {len(visible)} landmarks")
if missing:
    print(f"Missing landmarks: {missing}")
```

### Partial Detection Strategy

```python
# Check which body parts are visible
upper_body_visible = all(
    is_landmark_visible(landmarks[i])
    for i in [11, 12, 13, 14, 15, 16]  # Shoulders, elbows, wrists
)

lower_body_visible = all(
    is_landmark_visible(landmarks[i])
    for i in [23, 24, 25, 26, 27, 28]  # Hips, knees, ankles
)

if upper_body_visible and not lower_body_visible:
    # Can calculate shirt measurements only
    warnings.append("Lower body not visible - pants measurements unavailable")
elif lower_body_visible and not upper_body_visible:
    # Can calculate pants measurements only
    warnings.append("Upper body not visible - shirt measurements unavailable")
```

---

## Performance Optimization

### 1. Initialize Model Once (Not Per Request)

**CORRECT** (global initialization):
```python
# At module level (outside request handler)
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=True, model_complexity=2)

@app.post("/measure")
async def get_measurement(file: UploadFile):
    results = pose.process(image_rgb)  # Reuse initialized model
```

**INCORRECT** (initialization per request):
```python
@app.post("/measure")
async def get_measurement(file: UploadFile):
    pose = mp_pose.Pose(...)  # SLOW - initializes model every request
    results = pose.process(image_rgb)
```

### 2. Use NumPy for Vector Operations

```python
# FAST (vectorized)
p1 = np.array([l1.x, l1.y, l1.z])
p2 = np.array([l2.x, l2.y, l2.z])
distance = np.linalg.norm(p2 - p1)

# SLOW (manual calculation)
distance = math.sqrt((l2.x - l1.x)**2 + (l2.y - l1.y)**2 + (l2.z - l1.z)**2)
```

### 3. Efficient Image Decoding

```python
# FAST (direct memory buffer)
contents = await file.read()
nparr = np.frombuffer(contents, np.uint8)
image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

# SLOW (save to disk first)
with open('temp.jpg', 'wb') as f:
    f.write(await file.read())
image = cv2.imread('temp.jpg')
```

---

## Testing MediaPipe Integration

### Test Script (test_mediapipe.py)

```python
import cv2
import mediapipe as mp
import numpy as np

# Initialize
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=True, model_complexity=2)

# Load test image
image = cv2.imread('test_photo.jpg')
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

# Process
results = pose.process(image_rgb)

# Check results
if results.pose_world_landmarks:
    landmarks = results.pose_world_landmarks.landmark
    print(f"✓ Detected {len(landmarks)} landmarks")

    # Test shoulder measurement
    l_shoulder = np.array([landmarks[11].x, landmarks[11].y, landmarks[11].z])
    r_shoulder = np.array([landmarks[12].x, landmarks[12].y, landmarks[12].z])
    shoulder_width_m = np.linalg.norm(r_shoulder - l_shoulder)
    print(f"✓ Shoulder width: {shoulder_width_m:.3f}m ({shoulder_width_m*100:.1f}cm)")

    # Test calibration
    nose_y = landmarks[0].y
    heel_y = max(landmarks[29].y, landmarks[30].y)
    detected_height_m = abs(heel_y - nose_y) * 1.15
    print(f"✓ Detected height: {detected_height_m:.2f}m ({detected_height_m*100:.0f}cm)")
else:
    print("✗ No pose detected")

pose.close()
```

---

## Common Issues and Solutions

### Issue 1: "No module named 'mediapipe'"

**Solution**:
```bash
pip install mediapipe
```

### Issue 2: Landmarks not detected

**Possible causes**:
- Image too dark/blurry
- Person not facing camera
- Full body not in frame
- Obstructed by objects

**Solution**: Check image quality, ensure full body visible

### Issue 3: Inaccurate measurements

**Possible causes**:
- Poor calibration (height reference incorrect)
- Baggy clothing obscuring body shape
- Person not standing straight

**Solution**: Verify height input, request tight-fitting clothing, proper pose

### Issue 4: Slow processing

**Check**:
- Is model initialized globally (not per-request)?
- Using model_complexity=2 (expected to be slower)
- Image resolution very high (resize if needed)

---

## Next Steps

After implementing MediaPipe integration:
1. Review **03-BACKEND-MEASUREMENT-CALCULATIONS.md** for complete measurement algorithms
2. Test with various photos (different heights, poses, lighting)
3. Validate calibration accuracy
4. Implement error handling from **06-BACKEND-ERROR-HANDLING.md**
