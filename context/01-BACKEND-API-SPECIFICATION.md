# Backend API Specification

## Overview

This document defines the complete API contract for the Image Analyzer Backend. It specifies endpoints, request/response schemas, status codes, and data formats.

---

## Base URL

### Local Development
- **Laptop Local**: `http://localhost:8000`
- **Same WiFi (Physical Device)**: `http://192.168.1.x:8000` (replace with laptop's local IP)
- **Android Emulator**: `http://10.0.2.2:8000`
- **iOS Simulator**: `http://localhost:8000`
- **Ngrok (if needed)**: `https://xxxx-xx-xx-xx-xx.ngrok.io`

### Production (TODO - Future)
- TBD based on cloud provider selection

---

## Endpoints

### 1. POST /measure

Analyzes a full-body photo and returns body and garment measurements.

#### Request

**HTTP Method**: `POST`

**Content-Type**: `multipart/form-data`

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | Full-body photo (JPEG or PNG) |
| `height_cm` | Float | Yes | User's height in centimeters (e.g., 175.5) |
| `weight_kg` | Float | Optional | User's weight in kilograms (for future BMI-based adjustments) |

**Example Request (cURL)**:
```bash
curl -X POST "http://localhost:8000/measure" \
  -F "file=@photo.jpg" \
  -F "height_cm=175.0" \
  -F "weight_kg=70.0"
```

**Example Request (React Native)**:
```javascript
const formData = new FormData();
formData.append('file', {
  uri: photoUri,
  name: 'photo.jpg',
  type: 'image/jpeg',
});
formData.append('height_cm', '175.0');
formData.append('weight_kg', '70.0');

const response = await fetch('http://192.168.1.5:8000/measure', {
  method: 'POST',
  body: formData,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

const data = await response.json();
```

---

#### Response (Success)

**HTTP Status Code**: `200 OK`

**Content-Type**: `application/json`

**Schema**:
```json
{
  "status": "success",
  "message": "Measurements calculated successfully",
  "body_measurements": {
    "shoulder_width": {
      "value": 45.2,
      "unit": "cm",
      "confidence": 0.95
    },
    "chest_circumference": {
      "value": 98.5,
      "unit": "cm",
      "confidence": 0.88
    },
    "waist_circumference": {
      "value": 82.3,
      "unit": "cm",
      "confidence": 0.82
    },
    "hip_width": {
      "value": 38.7,
      "unit": "cm",
      "confidence": 0.90
    },
    "arm_length": {
      "value": 63.5,
      "unit": "cm",
      "confidence": 0.91
    },
    "torso_length": {
      "value": 73.6,
      "unit": "cm",
      "confidence": 0.93
    },
    "inseam_length": {
      "value": 81.2,
      "unit": "cm",
      "confidence": 0.87
    },
    "leg_opening": {
      "value": 18.4,
      "unit": "cm",
      "confidence": 0.85
    }
  },
  "garment_measurements": {
    "shirt": {
      "shoulder": {
        "value": 18.0,
        "unit": "inches",
        "confidence": 0.95,
        "notes": "Converted from body measurement with fit allowance"
      },
      "chest": {
        "value": 40.0,
        "unit": "inches",
        "confidence": 0.88,
        "notes": "Includes 2-inch ease for regular fit"
      },
      "sleeves": {
        "value": 25.0,
        "unit": "inches",
        "confidence": 0.91,
        "notes": "Measured from center back to wrist"
      },
      "length": {
        "value": 29.0,
        "unit": "inches",
        "confidence": 0.93,
        "notes": "Measured from high point shoulder to hem"
      }
    },
    "pants": {
      "waist": {
        "value": 32.0,
        "unit": "inches",
        "confidence": 0.82,
        "notes": "Natural waist measurement"
      },
      "inseam": {
        "value": 32.0,
        "unit": "inches",
        "confidence": 0.87,
        "notes": "Crotch to ankle measurement"
      },
      "rise": {
        "value": 11.0,
        "unit": "inches",
        "confidence": 0.80,
        "notes": "Estimated from torso proportions"
      },
      "leg": {
        "value": 7.2,
        "unit": "inches",
        "confidence": 0.85,
        "notes": "Leg opening diameter"
      }
    },
    "jacket": {
      "shoulder": {
        "value": 18.5,
        "unit": "inches",
        "confidence": 0.95,
        "notes": "Slightly wider than shirt for layering"
      },
      "chest": {
        "value": 42.0,
        "unit": "inches",
        "confidence": 0.88,
        "notes": "Includes 4-inch ease for jacket fit"
      },
      "sleeves": {
        "value": 26.0,
        "unit": "inches",
        "confidence": 0.91,
        "notes": "Slightly longer than shirt sleeve"
      },
      "length": {
        "value": 30.0,
        "unit": "inches",
        "confidence": 0.93,
        "notes": "Standard jacket length"
      }
    }
  },
  "metadata": {
    "processing_time_ms": 3247,
    "image_width": 1920,
    "image_height": 1080,
    "detected_landmarks": 33,
    "model_version": "mediapipe_pose_v2",
    "calibration_factor": 1.42
  }
}
```

**Field Descriptions**:

- `status`: Always "success" for successful processing
- `message`: Human-readable status message
- `body_measurements`: Actual body dimensions in centimeters
  - Each measurement includes `value`, `unit`, and `confidence` (0.0-1.0)
- `garment_measurements`: Recommended garment sizes in inches
  - Organized by garment type: `shirt`, `pants`, `jacket`
  - Each measurement includes `value`, `unit`, `confidence`, and `notes`
- `metadata`: Processing information for debugging/logging
  - `processing_time_ms`: Total processing time in milliseconds
  - `detected_landmarks`: Number of pose landmarks detected (33 expected)
  - `model_version`: MediaPipe model identifier
  - `calibration_factor`: Height-based scaling factor applied

**Confidence Score Interpretation**:
- `0.90 - 1.00`: High confidence (GREEN) - Very reliable measurement
- `0.70 - 0.89`: Medium confidence (YELLOW) - Proceed with caution
- `0.00 - 0.69`: Low confidence (RED) - Very unsure, manual verification recommended

---

#### Response (Partial Success)

**HTTP Status Code**: `200 OK`

**Content-Type**: `application/json`

**Use Case**: Body partially detected (some landmarks missing)

```json
{
  "status": "partial_success",
  "message": "Some body landmarks not detected. Partial measurements returned.",
  "warnings": [
    "Lower body landmarks not fully visible",
    "Inseam measurement has low confidence"
  ],
  "body_measurements": {
    "shoulder_width": {
      "value": 45.2,
      "unit": "cm",
      "confidence": 0.95
    },
    "chest_circumference": {
      "value": 98.5,
      "unit": "cm",
      "confidence": 0.88
    },
    "inseam_length": {
      "value": null,
      "unit": "cm",
      "confidence": 0.0,
      "error": "Landmarks not detected"
    }
  },
  "garment_measurements": {
    "shirt": {
      "shoulder": { "value": 18.0, "unit": "inches", "confidence": 0.95 },
      "chest": { "value": 40.0, "unit": "inches", "confidence": 0.88 },
      "sleeves": { "value": null, "unit": "inches", "confidence": 0.0 },
      "length": { "value": null, "unit": "inches", "confidence": 0.0 }
    },
    "pants": {
      "waist": { "value": null, "unit": "inches", "confidence": 0.0 },
      "inseam": { "value": null, "unit": "inches", "confidence": 0.0 },
      "rise": { "value": null, "unit": "inches", "confidence": 0.0 },
      "leg": { "value": null, "unit": "inches", "confidence": 0.0 }
    }
  },
  "metadata": {
    "processing_time_ms": 2891,
    "detected_landmarks": 18,
    "missing_landmarks": [25, 26, 27, 28, 29, 30, 31, 32]
  }
}
```

**UI Handling**:
- Display warning message: "Some measurements could not be calculated. Please upload another photo for best results."
- Auto-fill available measurements
- Leave null measurements empty (don't overwrite existing values)

---

#### Response (Error - No Body Detected)

**HTTP Status Code**: `400 Bad Request`

**Content-Type**: `application/json`

```json
{
  "status": "error",
  "error_code": "NO_BODY_DETECTED",
  "message": "Could not detect body in photo. Please ensure full body is visible from head to toe.",
  "suggestions": [
    "Stand 6-8 feet from the camera",
    "Ensure full body is visible (head to toes)",
    "Use good lighting (avoid shadows)",
    "Wear tight-fitting clothing",
    "Stand against a plain background"
  ],
  "metadata": {
    "processing_time_ms": 1234,
    "detected_landmarks": 0
  }
}
```

**UI Handling**:
- Navigate to garment editor
- Display error message with suggestions
- Show "Upload New Photo" button

---

#### Response (Error - Poor Image Quality)

**HTTP Status Code**: `400 Bad Request`

**Content-Type**: `application/json`

```json
{
  "status": "error",
  "error_code": "POOR_IMAGE_QUALITY",
  "message": "Image quality is too low for accurate measurements.",
  "details": {
    "issue": "Image is too blurry",
    "image_resolution": "640x480",
    "minimum_required": "1280x720"
  },
  "suggestions": [
    "Use a higher resolution camera",
    "Ensure camera is focused",
    "Clean camera lens",
    "Provide better lighting"
  ],
  "metadata": {
    "processing_time_ms": 567
  }
}
```

---

#### Response (Error - Invalid File Format)

**HTTP Status Code**: `400 Bad Request`

**Content-Type**: `application/json`

```json
{
  "status": "error",
  "error_code": "INVALID_FILE_FORMAT",
  "message": "Invalid image format. Please upload a JPEG or PNG file.",
  "details": {
    "received_format": "application/pdf",
    "supported_formats": ["image/jpeg", "image/png"]
  }
}
```

---

#### Response (Error - Missing Parameters)

**HTTP Status Code**: `422 Unprocessable Entity`

**Content-Type**: `application/json`

```json
{
  "status": "error",
  "error_code": "MISSING_PARAMETERS",
  "message": "Required parameter 'height_cm' is missing.",
  "missing_fields": ["height_cm"]
}
```

---

#### Response (Error - Server Error)

**HTTP Status Code**: `500 Internal Server Error`

**Content-Type**: `application/json`

```json
{
  "status": "error",
  "error_code": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred during processing. Please try again.",
  "request_id": "req_abc123xyz",
  "metadata": {
    "timestamp": "2025-12-31T10:30:45Z"
  }
}
```

---

### 2. GET /health

Health check endpoint to verify server is running.

#### Request

**HTTP Method**: `GET`

**URL**: `/health`

#### Response (Success)

**HTTP Status Code**: `200 OK`

**Content-Type**: `application/json`

```json
{
  "status": "healthy",
  "service": "silhouette-image-analyzer",
  "version": "1.0.0",
  "mediapipe_initialized": true,
  "timestamp": "2025-12-31T10:30:45Z"
}
```

---

### 3. GET /

Root endpoint - API information.

#### Request

**HTTP Method**: `GET`

**URL**: `/`

#### Response

**HTTP Status Code**: `200 OK`

**Content-Type**: `application/json`

```json
{
  "service": "Silhouette Image Analyzer Backend",
  "version": "1.0.0",
  "endpoints": [
    {
      "path": "/measure",
      "method": "POST",
      "description": "Analyze full-body photo and return measurements"
    },
    {
      "path": "/health",
      "method": "GET",
      "description": "Health check endpoint"
    }
  ],
  "documentation": "See context/01-BACKEND-API-SPECIFICATION.md"
}
```

---

## Error Codes Reference

| Error Code | HTTP Status | Description | User Action |
|------------|-------------|-------------|-------------|
| `NO_BODY_DETECTED` | 400 | Body landmarks not found in image | Retake photo with full body visible |
| `POOR_IMAGE_QUALITY` | 400 | Image is blurry or low resolution | Retake with better camera/lighting |
| `INVALID_FILE_FORMAT` | 400 | Unsupported file type | Upload JPEG or PNG only |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit (10MB) | Compress image or use lower quality |
| `MISSING_PARAMETERS` | 422 | Required fields not provided | Check request parameters |
| `INVALID_HEIGHT_VALUE` | 422 | Height value out of valid range (50-250cm) | Enter valid height |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error | Try again or contact support |

---

## Data Format Specifications

### Height Input
- **Format**: Float (decimal number)
- **Unit**: Centimeters
- **Range**: 50.0 - 250.0 cm
- **Examples**: 175.5, 180.0, 165.2

**Conversion Reference**:
- 5'0" = 152.4 cm
- 5'6" = 167.6 cm
- 6'0" = 182.9 cm
- 6'6" = 198.1 cm

### Weight Input (Optional)
- **Format**: Float (decimal number)
- **Unit**: Kilograms
- **Range**: 30.0 - 300.0 kg
- **Examples**: 70.0, 85.5, 62.3

**Conversion Reference**:
- 100 lbs = 45.4 kg
- 150 lbs = 68.0 kg
- 200 lbs = 90.7 kg

### Image File Requirements
- **Formats**: JPEG (.jpg, .jpeg), PNG (.png)
- **Max File Size**: 10 MB
- **Recommended Resolution**: 1280x720 (720p) or higher
- **Aspect Ratio**: Any (will be processed as-is)
- **Color Space**: RGB (color images required)

---

## Rate Limiting (Future - TODO)

Not implemented in local development. Production deployment should include:
- **Limit**: 10 requests per minute per IP
- **Burst**: 20 requests per minute
- **Response on Limit**: HTTP 429 with Retry-After header

---

## CORS Configuration

**Local Development**:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Production (TODO)**:
- Restrict `allow_origins` to specific domains
- Set appropriate CORS headers

---

## Testing the API

### Using cURL (Command Line)

```bash
# Test health check
curl http://localhost:8000/health

# Test measurement endpoint
curl -X POST http://localhost:8000/measure \
  -F "file=@test_photo.jpg" \
  -F "height_cm=175.0"
```

### Using Python Requests

```python
import requests

# Test measurement
with open('test_photo.jpg', 'rb') as f:
    files = {'file': f}
    data = {'height_cm': 175.0}
    response = requests.post('http://localhost:8000/measure',
                            files=files, data=data)
    print(response.json())
```

### Using Postman

1. Create new POST request to `http://localhost:8000/measure`
2. Set Body type to `form-data`
3. Add key `file` (type: File) and select image
4. Add key `height_cm` (type: Text) with value `175.0`
5. Send request

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-31 | Initial API specification |

---

## Next Steps

After reviewing this API specification:
1. Implement backend server using **02-BACKEND-MEDIAPIPE-IMPLEMENTATION.md**
2. Integrate frontend using **05-FRONTEND-INTEGRATION-GUIDE.md**
3. Test error scenarios from **06-BACKEND-ERROR-HANDLING.md**
