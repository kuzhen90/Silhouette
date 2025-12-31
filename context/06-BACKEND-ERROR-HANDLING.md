# Backend Error Handling Specification

## Overview

This document defines all error scenarios, error codes, user-facing messages, and recovery strategies for the Image Analyzer Backend.

---

## Error Categories

### 1. Input Validation Errors
### 2. Image Quality Errors
### 3. Processing Errors
### 4. Network Errors
### 5. Server Errors

---

## Error Response Format

All errors follow this consistent structure:

```json
{
  "status": "error",
  "error_code": "ERROR_CODE_NAME",
  "message": "User-friendly error message",
  "details": {
    "additional": "technical details"
  },
  "suggestions": [
    "Actionable suggestion 1",
    "Actionable suggestion 2"
  ],
  "metadata": {
    "timestamp": "2025-12-31T10:30:45Z",
    "request_id": "req_abc123"
  }
}
```

---

## 1. Input Validation Errors

### 1.1 Missing File

**Scenario**: No file uploaded in request

**HTTP Status**: `422 Unprocessable Entity`

**Error Code**: `MISSING_FILE`

**Implementation**:
```python
if not file:
    raise HTTPException(
        status_code=422,
        detail={
            "status": "error",
            "error_code": "MISSING_FILE",
            "message": "No image file provided in request",
            "suggestions": [
                "Ensure you selected a photo",
                "Check file upload is working properly"
            ]
        }
    )
```

**Frontend Handling**:
```typescript
if (data.error_code === 'MISSING_FILE') {
  Alert.alert('No Photo', 'Please select a photo to analyze.');
  router.replace('/welcome'); // Go back to photo selection
}
```

---

### 1.2 Missing Height Parameter

**Scenario**: `height_cm` not provided

**HTTP Status**: `422 Unprocessable Entity`

**Error Code**: `MISSING_PARAMETERS`

**Implementation**:
```python
if not height_cm:
    raise HTTPException(
        status_code=422,
        detail={
            "status": "error",
            "error_code": "MISSING_PARAMETERS",
            "message": "Required parameter 'height_cm' is missing",
            "missing_fields": ["height_cm"],
            "suggestions": [
                "Enter your height in the onboarding form"
            ]
        }
    )
```

**Frontend Handling**:
```typescript
Alert.alert('Missing Information', 'Please enter your height to continue.');
// Show onboarding form
```

---

### 1.3 Invalid Height Value

**Scenario**: Height outside valid range (50-250cm)

**HTTP Status**: `422 Unprocessable Entity`

**Error Code**: `INVALID_HEIGHT_VALUE`

**Implementation**:
```python
if not (50 <= height_cm <= 250):
    raise HTTPException(
        status_code=422,
        detail={
            "status": "error",
            "error_code": "INVALID_HEIGHT_VALUE",
            "message": f"Height {height_cm}cm is out of valid range (50-250cm)",
            "details": {
                "provided_height": height_cm,
                "valid_range": "50-250 cm"
            },
            "suggestions": [
                "Check that height is in centimeters, not inches",
                "Verify height value is correct"
            ]
        }
    )
```

**Frontend Handling**:
```typescript
Alert.alert(
  'Invalid Height',
  'Please enter a valid height between 50-250 cm.',
  [{ text: 'OK', onPress: () => router.back() }]
);
```

---

## 2. Image Quality Errors

### 2.1 Invalid File Format

**Scenario**: File is not JPEG or PNG

**HTTP Status**: `400 Bad Request`

**Error Code**: `INVALID_FILE_FORMAT`

**Implementation**:
```python
ALLOWED_FORMATS = ["image/jpeg", "image/png"]

if file.content_type not in ALLOWED_FORMATS:
    raise HTTPException(
        status_code=400,
        detail={
            "status": "error",
            "error_code": "INVALID_FILE_FORMAT",
            "message": "Invalid image format. Please upload JPEG or PNG.",
            "details": {
                "received_format": file.content_type,
                "supported_formats": ALLOWED_FORMATS
            },
            "suggestions": [
                "Convert image to JPEG or PNG format",
                "Take a new photo with your camera"
            ]
        }
    )
```

**Frontend Handling**:
```typescript
Alert.alert(
  'Invalid Format',
  'Please upload a JPEG or PNG image.',
  [{ text: 'Choose Another Photo', onPress: () => router.replace('/welcome') }]
);
```

---

### 2.2 File Too Large

**Scenario**: Image file exceeds size limit (10MB)

**HTTP Status**: `413 Payload Too Large`

**Error Code**: `FILE_TOO_LARGE`

**Implementation**:
```python
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

contents = await file.read()
file_size = len(contents)

if file_size > MAX_FILE_SIZE:
    file_size_mb = file_size / (1024 * 1024)
    raise HTTPException(
        status_code=413,
        detail={
            "status": "error",
            "error_code": "FILE_TOO_LARGE",
            "message": f"File size ({file_size_mb:.1f}MB) exceeds maximum (10MB)",
            "details": {
                "file_size_bytes": file_size,
                "max_size_bytes": MAX_FILE_SIZE
            },
            "suggestions": [
                "Compress the image",
                "Reduce image quality/resolution",
                "Take a new photo with lower quality settings"
            ]
        }
    )
```

**Frontend Prevention** (compress before upload):
```typescript
// In image picker
const result = await ImagePicker.launchCameraAsync({
  quality: 0.7, // Compress to 70%
  allowsEditing: true,
});
```

---

### 2.3 Poor Image Quality

**Scenario**: Image resolution too low or blurry

**HTTP Status**: `400 Bad Request`

**Error Code**: `POOR_IMAGE_QUALITY`

**Implementation**:
```python
MIN_WIDTH = 1280
MIN_HEIGHT = 720

image_height, image_width = image.shape[:2]

if image_width < MIN_WIDTH or image_height < MIN_HEIGHT:
    raise HTTPException(
        status_code=400,
        detail={
            "status": "error",
            "error_code": "POOR_IMAGE_QUALITY",
            "message": "Image resolution too low for accurate measurements",
            "details": {
                "image_resolution": f"{image_width}x{image_height}",
                "minimum_required": f"{MIN_WIDTH}x{MIN_HEIGHT}"
            },
            "suggestions": [
                "Use a higher resolution camera",
                "Ensure camera is focused properly",
                "Clean camera lens",
                "Use better lighting"
            ]
        }
    )
```

**Blur Detection** (optional enhancement):
```python
import cv2

def is_blurry(image, threshold=100):
    """Detect if image is blurry using Laplacian variance"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    return laplacian_var < threshold

if is_blurry(image):
    raise HTTPException(
        status_code=400,
        detail={
            "status": "error",
            "error_code": "POOR_IMAGE_QUALITY",
            "message": "Image is too blurry for accurate measurements",
            "details": {"issue": "Image blur detected"},
            "suggestions": [
                "Ensure camera is focused",
                "Hold device steady",
                "Use better lighting"
            ]
        }
    )
```

**Frontend Handling**:
```typescript
Alert.alert(
  'Poor Image Quality',
  data.message + '\n\n' + data.suggestions?.join('\n'),
  [
    { text: 'Retake Photo', onPress: () => router.replace('/welcome') },
    { text: 'Try Anyway', onPress: () => continueWithoutMeasurements() }
  ]
);
```

---

### 2.4 Invalid Image Data

**Scenario**: Cannot decode image file

**HTTP Status**: `400 Bad Request`

**Error Code**: `INVALID_IMAGE`

**Implementation**:
```python
image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

if image is None:
    raise HTTPException(
        status_code=400,
        detail={
            "status": "error",
            "error_code": "INVALID_IMAGE",
            "message": "Could not decode image file. File may be corrupted.",
            "suggestions": [
                "Try uploading a different photo",
                "Take a new photo",
                "Ensure file is a valid image"
            ]
        }
    )
```

---

## 3. Processing Errors

### 3.1 No Body Detected

**Scenario**: MediaPipe cannot detect any pose landmarks

**HTTP Status**: `400 Bad Request`

**Error Code**: `NO_BODY_DETECTED`

**Implementation**:
```python
results = pose.process(image_rgb)

if not results.pose_world_landmarks:
    raise HTTPException(
        status_code=400,
        detail={
            "status": "error",
            "error_code": "NO_BODY_DETECTED",
            "message": "Could not detect body in photo. Please ensure full body is visible.",
            "suggestions": [
                "Stand 6-8 feet from the camera",
                "Ensure full body is visible (head to toes)",
                "Face the camera directly",
                "Use good lighting (avoid shadows)",
                "Wear tight-fitting clothing",
                "Stand against a plain background",
                "Remove obstructions between you and camera"
            ],
            "metadata": {
                "detected_landmarks": 0
            }
        }
    )
```

**Frontend Handling**:
```typescript
if (data.error_code === 'NO_BODY_DETECTED') {
  Alert.alert(
    'Body Not Detected',
    'We couldn\'t detect your full body in the photo.\n\n' +
    'Tips for best results:\n' +
    data.suggestions?.slice(0, 5).join('\n• '),
    [
      { text: 'Retake Photo', onPress: () => router.replace('/welcome') },
      { text: 'Continue Anyway', onPress: () => continueWithoutMeasurements() }
    ]
  );
}
```

---

### 3.2 Partial Detection (Warning, not error)

**Scenario**: Some landmarks detected but not all

**HTTP Status**: `200 OK`

**Status**: `partial_success`

**Implementation**:
```python
# Count visible landmarks
visible_count = sum(
    1 for lm in landmarks
    if hasattr(lm, 'visibility') and lm.visibility >= 0.5
)

if visible_count < 20:  # Less than 60% of landmarks
    return {
        "status": "partial_success",
        "message": "Some body landmarks not detected. Partial measurements returned.",
        "warnings": [
            "Lower body landmarks not fully visible",
            "Some measurements may have low confidence",
            "Consider uploading another photo for best results"
        ],
        "body_measurements": measurements_result,  # Partial measurements
        # ...
    }
```

**Frontend Handling**:
```typescript
if (data.status === 'partial_success') {
  Alert.alert(
    'Partial Measurements',
    data.message + '\n\n' + data.warnings?.join('\n'),
    [
      { text: 'Use These', onPress: () => applyMeasurements(data) },
      { text: 'Upload New Photo', onPress: () => handleUploadNewPhoto() }
    ]
  );
}
```

---

### 3.3 Calibration Failure

**Scenario**: Height calibration produces unreasonable results

**HTTP Status**: `400 Bad Request`

**Error Code**: `CALIBRATION_FAILED`

**Implementation**:
```python
# In calculate_calibration_factor
height_ratio = detected_height_m / actual_height_m

if height_ratio < 0.5 or height_ratio > 1.5:
    # Detected height is way off
    raise HTTPException(
        status_code=400,
        detail={
            "status": "error",
            "error_code": "CALIBRATION_FAILED",
            "message": "Could not calibrate measurements with provided height",
            "details": {
                "provided_height_cm": actual_height_cm,
                "detected_height_cm": detected_height_m * 100,
                "discrepancy_percent": abs(1 - height_ratio) * 100
            },
            "suggestions": [
                "Verify your height is correct",
                "Ensure full body including feet is visible",
                "Stand at recommended distance from camera",
                "Retake photo with better full-body visibility"
            ]
        }
    )
```

---

## 4. Network Errors

### 4.1 Connection Timeout

**Scenario**: Request takes too long

**Implementation** (FastAPI middleware):
```python
from starlette.middleware.base import BaseHTTPMiddleware
import asyncio

class TimeoutMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        try:
            return await asyncio.wait_for(call_next(request), timeout=30.0)
        except asyncio.TimeoutError:
            return JSONResponse(
                status_code=504,
                content={
                    "status": "error",
                    "error_code": "REQUEST_TIMEOUT",
                    "message": "Request took too long to process",
                    "suggestions": [
                        "Try with a smaller image file",
                        "Check your internet connection",
                        "Try again in a moment"
                    ]
                }
            )

app.add_middleware(TimeoutMiddleware)
```

**Frontend Handling**:
```typescript
// Set fetch timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ...
  });
} catch (error) {
  if (error.name === 'AbortError') {
    Alert.alert('Timeout', 'Request took too long. Please try again.');
  }
} finally {
  clearTimeout(timeoutId);
}
```

---

### 4.2 Backend Unreachable

**Scenario**: Cannot connect to backend server

**Frontend Handling**:
```typescript
try {
  const response = await fetch(`${API_BASE_URL}/measure`, { /* ... */ });
} catch (error) {
  if (error.message.includes('Network request failed')) {
    Alert.alert(
      'Connection Failed',
      'Could not connect to the measurement server.\n\n' +
      'Please check:\n' +
      '• Backend server is running\n' +
      '• Device has internet connection\n' +
      '• Device and server are on same network',
      [
        { text: 'Retry', onPress: () => retryAnalysis() },
        { text: 'Continue Without', onPress: () => continueWithoutMeasurements() }
      ]
    );
  }
}
```

---

## 5. Server Errors

### 5.1 Internal Server Error

**Scenario**: Unexpected error during processing

**HTTP Status**: `500 Internal Server Error`

**Error Code**: `INTERNAL_SERVER_ERROR`

**Implementation**:
```python
@app.post("/measure")
async def get_measurement(file: UploadFile, height_cm: float):
    try:
        # ... processing code
    except HTTPException:
        # Re-raise HTTP exceptions (expected errors)
        raise
    except Exception as e:
        # Log unexpected errors
        logger.error(f"Unexpected error processing image: {str(e)}", exc_info=True)

        # Return generic error to user (don't leak internals)
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred during processing",
                "request_id": f"req_{time.time()}",  # For debugging
                "suggestions": [
                    "Try again in a moment",
                    "Try with a different photo",
                    "Contact support if problem persists"
                ]
            }
        )
```

**Frontend Handling**:
```typescript
if (response.status === 500) {
  Alert.alert(
    'Server Error',
    'An unexpected error occurred. Please try again.',
    [
      { text: 'Retry', onPress: () => retryAnalysis() },
      { text: 'Skip', onPress: () => continueWithoutMeasurements() }
    ]
  );
}
```

---

### 5.2 Service Unavailable

**Scenario**: Server is down or restarting

**HTTP Status**: `503 Service Unavailable`

**Implementation** (health check):
```python
is_healthy = True

@app.get("/health")
async def health_check():
    if not is_healthy:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "message": "Service is temporarily unavailable"
            }
        )
    return {"status": "healthy"}
```

---

## Error Recovery Strategies

### Strategy 1: Retry with Backoff

```typescript
async function analyzeWithRetry(
  photoUri: string,
  heightCm: number,
  maxRetries: number = 3
): Promise<MeasurementResponse> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await analyzeMeasurements(photoUri, heightCm);
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
```

---

### Strategy 2: Graceful Degradation

```typescript
// If measurement analysis fails, continue with manual entry
async function handleMeasurementAnalysis(photoUri: string, heightCm: number) {
  try {
    const result = await analyzeMeasurements(photoUri, heightCm);

    if (result.status === 'success' || result.status === 'partial_success') {
      return result.garment_measurements;
    }
  } catch (error) {
    console.warn('Measurement analysis failed, continuing with manual entry:', error);
  }

  // Continue without measurements
  return null;
}
```

---

### Strategy 3: User Feedback

```typescript
// Always inform user what happened
if (result.status === 'error') {
  // Show specific error message
  Alert.alert(result.error_code || 'Error', result.message);

  // Provide actionable next steps
  if (result.suggestions && result.suggestions.length > 0) {
    console.log('Suggestions:', result.suggestions);
  }

  // Allow user to choose next action
  // - Retry
  // - Upload different photo
  // - Continue without measurements
  // - Contact support
}
```

---

## Error Logging

### Backend Logging

```python
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Log all errors
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(
        f"Error processing request",
        extra={
            "error": str(exc),
            "path": request.url.path,
            "method": request.method,
            "timestamp": datetime.utcnow().isoformat()
        },
        exc_info=True
    )

    # Return error response
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred"
        }
    )
```

---

### Frontend Error Reporting

```typescript
// Report errors for debugging
function reportError(error: any, context: string) {
  console.error(`[${context}]`, error);

  // TODO: Send to error tracking service (Sentry, Bugsnag, etc.)
  // sentry.captureException(error, { tags: { context } });
}

// Usage
try {
  await analyzeMeasurements(photoUri, heightCm);
} catch (error) {
  reportError(error, 'measurement_analysis');
  // Handle error...
}
```

---

## Error Code Reference Table

| Error Code | HTTP Status | Category | User Action |
|------------|-------------|----------|-------------|
| `MISSING_FILE` | 422 | Input | Select photo |
| `MISSING_PARAMETERS` | 422 | Input | Enter required fields |
| `INVALID_HEIGHT_VALUE` | 422 | Input | Check height value |
| `INVALID_FILE_FORMAT` | 400 | Image Quality | Upload JPEG/PNG |
| `FILE_TOO_LARGE` | 413 | Image Quality | Compress image |
| `POOR_IMAGE_QUALITY` | 400 | Image Quality | Retake with better quality |
| `INVALID_IMAGE` | 400 | Image Quality | Upload different file |
| `NO_BODY_DETECTED` | 400 | Processing | Retake with full body |
| `CALIBRATION_FAILED` | 400 | Processing | Check height, retake photo |
| `REQUEST_TIMEOUT` | 504 | Network | Retry with smaller image |
| `INTERNAL_SERVER_ERROR` | 500 | Server | Retry or contact support |
| `SERVICE_UNAVAILABLE` | 503 | Server | Try again later |

---

## Testing Error Scenarios

### Test Cases

```python
# test_errors.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_missing_file():
    response = client.post("/measure", data={"height_cm": 175})
    assert response.status_code == 422
    assert response.json()["error_code"] == "MISSING_FILE"

def test_invalid_height():
    response = client.post("/measure", data={"height_cm": 500})
    assert response.status_code == 422
    assert response.json()["error_code"] == "INVALID_HEIGHT_VALUE"

def test_invalid_format():
    files = {"file": ("test.pdf", b"fake pdf", "application/pdf")}
    response = client.post("/measure", files=files, data={"height_cm": 175})
    assert response.status_code == 400
    assert response.json()["error_code"] == "INVALID_FILE_FORMAT"
```

---

## Next Steps

After implementing error handling:
1. Test each error scenario manually
2. Verify error messages are user-friendly
3. Ensure recovery strategies work
4. Add error logging/monitoring
5. Review **07-BACKEND-FUTURE-ENHANCEMENTS.md** for improvements
