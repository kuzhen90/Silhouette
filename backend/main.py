import cv2
import numpy as np
import mediapipe as mp
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard MediaPipe initialization
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


# Helper Functions
def calculate_distance_3d(landmark1, landmark2) -> float:
    """Calculate 3D Euclidean distance between two landmarks"""
    p1 = np.array([landmark1.x, landmark1.y, landmark1.z])
    p2 = np.array([landmark2.x, landmark2.y, landmark2.z])
    return np.linalg.norm(p2 - p1)


def calculate_midpoint(landmark1, landmark2):
    """Calculate midpoint between two landmarks"""
    p1 = np.array([landmark1.x, landmark1.y, landmark1.z])
    p2 = np.array([landmark2.x, landmark2.y, landmark2.z])
    return (p1 + p2) / 2


def is_landmark_visible(landmark, threshold=0.5) -> bool:
    """Check if landmark has sufficient visibility confidence"""
    return hasattr(landmark, 'visibility') and landmark.visibility >= threshold


def cm_to_inches(cm: float) -> float:
    """Convert centimeters to inches"""
    return cm / 2.54


def inches_to_cm(inches: float) -> float:
    """Convert inches to centimeters"""
    return inches * 2.54


def round_to_half_inch(inches: float) -> float:
    """Round to nearest 0.5 inch"""
    return round(inches * 2) / 2


def calculate_calibration_factor(landmarks, actual_height_cm: float) -> dict:
    """Calculate scaling factor to convert world coordinates to real measurements"""
    nose = landmarks[0]
    left_heel = landmarks[29]
    right_heel = landmarks[30]

    heel = left_heel if left_heel.y < right_heel.y else right_heel
    nose_to_heel_m = abs(heel.y - nose.y)
    detected_height_m = nose_to_heel_m * 1.15

    actual_height_m = actual_height_cm / 100
    calibration_factor = actual_height_m / detected_height_m

    height_ratio = detected_height_m / actual_height_m
    if 0.8 <= height_ratio <= 1.2:
        confidence = 0.95
    elif 0.6 <= height_ratio <= 1.4:
        confidence = 0.80
    else:
        confidence = 0.60

    return {
        "calibration_factor": calibration_factor,
        "confidence": confidence,
        "detected_height_m": detected_height_m,
        "detected_height_cm": detected_height_m * 100
    }


# Body Measurement Functions
def calculate_shoulder_width(landmarks, calibration_factor: float) -> dict:
    """Calculate shoulder width"""
    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]

    if not (is_landmark_visible(left_shoulder) and is_landmark_visible(right_shoulder)):
        return {"value": None, "unit": "cm", "confidence": 0.0, "error": "Shoulders not visible"}

    distance_m = calculate_distance_3d(left_shoulder, right_shoulder)
    distance_cm = distance_m * 100 * calibration_factor

    visibility_avg = (left_shoulder.visibility + right_shoulder.visibility) / 2
    confidence = min(0.98, visibility_avg)

    return {"value": round(distance_cm, 1), "unit": "cm", "confidence": round(confidence, 2)}


def calculate_chest_circumference(landmarks, calibration_factor: float, shoulder_width_cm: Optional[float] = None) -> dict:
    """Calculate chest circumference using shoulder width and anthropometric ratios"""
    if shoulder_width_cm is None:
        shoulder_result = calculate_shoulder_width(landmarks, calibration_factor)
        if shoulder_result["value"] is None:
            return {"value": None, "unit": "cm", "confidence": 0.0, "error": "Cannot calculate without shoulder reference"}
        shoulder_width_cm = shoulder_result["value"]

    chest_circumference_cm = shoulder_width_cm * 2.2
    return {"value": round(chest_circumference_cm, 1), "unit": "cm", "confidence": 0.75, "notes": "Estimated from shoulder width"}


def calculate_hip_width(landmarks, calibration_factor: float) -> dict:
    """Calculate hip width"""
    left_hip = landmarks[23]
    right_hip = landmarks[24]

    if not (is_landmark_visible(left_hip) and is_landmark_visible(right_hip)):
        return {"value": None, "unit": "cm", "confidence": 0.0, "error": "Hips not visible"}

    distance_m = calculate_distance_3d(left_hip, right_hip)
    distance_cm = distance_m * 100 * calibration_factor

    visibility_avg = (left_hip.visibility + right_hip.visibility) / 2
    confidence = min(0.92, visibility_avg)

    return {"value": round(distance_cm, 1), "unit": "cm", "confidence": round(confidence, 2)}


def calculate_waist_circumference(landmarks, calibration_factor: float, hip_width_cm: Optional[float] = None) -> dict:
    """Calculate waist circumference"""
    if hip_width_cm is None:
        hip_result = calculate_hip_width(landmarks, calibration_factor)
        if hip_result["value"] is None:
            return {"value": None, "unit": "cm", "confidence": 0.0, "error": "Cannot calculate without hip reference"}
        hip_width_cm = hip_result["value"]

    waist_circumference_cm = hip_width_cm * 2.0 * 0.90
    return {"value": round(waist_circumference_cm, 1), "unit": "cm", "confidence": 0.70, "notes": "Estimated from hip width"}


def calculate_arm_length(landmarks, calibration_factor: float) -> dict:
    """Calculate arm length from shoulder to wrist"""
    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]
    left_wrist = landmarks[15]
    right_wrist = landmarks[16]

    shoulder_center = calculate_midpoint(left_shoulder, right_shoulder)

    class Point:
        def __init__(self, coords):
            self.x, self.y, self.z = coords

    shoulder_point = Point(shoulder_center)
    arms_measured = 0
    total_length = 0

    if is_landmark_visible(left_wrist):
        total_length += calculate_distance_3d(shoulder_point, left_wrist)
        arms_measured += 1

    if is_landmark_visible(right_wrist):
        total_length += calculate_distance_3d(shoulder_point, right_wrist)
        arms_measured += 1

    if arms_measured == 0:
        return {"value": None, "unit": "cm", "confidence": 0.0, "error": "Arms not visible"}

    avg_length_m = total_length / arms_measured
    avg_length_cm = avg_length_m * 100 * calibration_factor

    confidence = 0.93 if arms_measured == 2 else 0.80
    return {"value": round(avg_length_cm, 1), "unit": "cm", "confidence": confidence, "notes": f"Average of {arms_measured} arm(s)"}


def calculate_torso_length(landmarks, calibration_factor: float) -> dict:
    """Calculate torso length from shoulder to hip"""
    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]
    left_hip = landmarks[23]
    right_hip = landmarks[24]

    shoulders_visible = is_landmark_visible(left_shoulder) and is_landmark_visible(right_shoulder)
    hips_visible = is_landmark_visible(left_hip) and is_landmark_visible(right_hip)

    if not (shoulders_visible and hips_visible):
        return {"value": None, "unit": "cm", "confidence": 0.0, "error": "Shoulders or hips not visible"}

    shoulder_center = calculate_midpoint(left_shoulder, right_shoulder)
    hip_center = calculate_midpoint(left_hip, right_hip)

    torso_length_m = np.linalg.norm(hip_center - shoulder_center)
    torso_length_cm = torso_length_m * 100 * calibration_factor

    return {"value": round(torso_length_cm, 1), "unit": "cm", "confidence": 0.90}


def calculate_inseam_length(landmarks, calibration_factor: float) -> dict:
    """Calculate inseam length from hip to ankle"""
    left_hip = landmarks[23]
    right_hip = landmarks[24]
    left_ankle = landmarks[27]
    right_ankle = landmarks[28]

    hip_center = calculate_midpoint(left_hip, right_hip)

    class Point:
        def __init__(self, coords):
            self.x, self.y, self.z = coords

    hip_point = Point(hip_center)
    legs_measured = 0
    total_length = 0

    if is_landmark_visible(left_ankle):
        total_length += calculate_distance_3d(hip_point, left_ankle)
        legs_measured += 1

    if is_landmark_visible(right_ankle):
        total_length += calculate_distance_3d(hip_point, right_ankle)
        legs_measured += 1

    if legs_measured == 0:
        return {"value": None, "unit": "cm", "confidence": 0.0, "error": "Ankles not visible"}

    avg_length_m = total_length / legs_measured
    avg_length_cm = avg_length_m * 100 * calibration_factor

    confidence = 0.88 if legs_measured == 2 else 0.75
    return {"value": round(avg_length_cm, 1), "unit": "cm", "confidence": confidence, "notes": f"Average of {legs_measured} leg(s)"}


def calculate_leg_opening(landmarks, calibration_factor: float) -> dict:
    """Calculate leg opening diameter at ankle"""
    left_ankle = landmarks[27]
    right_ankle = landmarks[28]

    if not (is_landmark_visible(left_ankle) and is_landmark_visible(right_ankle)):
        return {"value": None, "unit": "cm", "confidence": 0.0, "error": "Ankles not visible"}

    hip_result = calculate_hip_width(landmarks, calibration_factor)

    if hip_result["value"]:
        leg_opening_cm = hip_result["value"] * 0.47
        confidence = 0.75
    else:
        leg_opening_cm = 18.0
        confidence = 0.50

    return {"value": round(leg_opening_cm, 1), "unit": "cm", "confidence": confidence, "notes": "Estimated from hip proportions"}


# Garment Measurement Functions
def calculate_shirt_measurements(body_measurements: dict) -> dict:
    """Calculate recommended shirt measurements from body measurements"""
    shirt = {}

    if body_measurements["shoulder_width"]["value"]:
        shoulder_cm = body_measurements["shoulder_width"]["value"]
        shoulder_inches = cm_to_inches(shoulder_cm)
        shirt["shoulder"] = {
            "value": round_to_half_inch(shoulder_inches),
            "unit": "inches",
            "confidence": body_measurements["shoulder_width"]["confidence"],
            "notes": "Direct body measurement"
        }
    else:
        shirt["shoulder"] = {"value": None, "unit": "inches", "confidence": 0.0}

    if body_measurements["chest_circumference"]["value"]:
        chest_cm = body_measurements["chest_circumference"]["value"]
        chest_ease_cm = inches_to_cm(2.0)
        chest_with_ease_cm = chest_cm + chest_ease_cm
        chest_inches = cm_to_inches(chest_with_ease_cm)
        shirt["chest"] = {
            "value": round_to_half_inch(chest_inches),
            "unit": "inches",
            "confidence": body_measurements["chest_circumference"]["confidence"],
            "notes": "Includes 2-inch ease for regular fit"
        }
    else:
        shirt["chest"] = {"value": None, "unit": "inches", "confidence": 0.0}

    if body_measurements["arm_length"]["value"]:
        arm_cm = body_measurements["arm_length"]["value"]
        shoulder_cm = body_measurements["shoulder_width"]["value"] or 45.0
        sleeve_cm = arm_cm + (shoulder_cm / 2)
        sleeve_inches = cm_to_inches(sleeve_cm)
        shirt["sleeves"] = {
            "value": round_to_half_inch(sleeve_inches),
            "unit": "inches",
            "confidence": body_measurements["arm_length"]["confidence"],
            "notes": "Measured from center back to wrist"
        }
    else:
        shirt["sleeves"] = {"value": None, "unit": "inches", "confidence": 0.0}

    if body_measurements["torso_length"]["value"]:
        torso_cm = body_measurements["torso_length"]["value"]
        length_cm = torso_cm + 15.0
        length_inches = cm_to_inches(length_cm)
        shirt["length"] = {
            "value": round_to_half_inch(length_inches),
            "unit": "inches",
            "confidence": body_measurements["torso_length"]["confidence"],
            "notes": "Measured from high point shoulder to hem"
        }
    else:
        shirt["length"] = {"value": None, "unit": "inches", "confidence": 0.0}

    return shirt


def calculate_pants_measurements(body_measurements: dict) -> dict:
    """Calculate recommended pants measurements from body measurements"""
    pants = {}

    if body_measurements["waist_circumference"]["value"]:
        waist_cm = body_measurements["waist_circumference"]["value"]
        waist_inches = cm_to_inches(waist_cm)
        pants["waist"] = {
            "value": round_to_half_inch(waist_inches),
            "unit": "inches",
            "confidence": body_measurements["waist_circumference"]["confidence"],
            "notes": "Natural waist measurement"
        }
    else:
        pants["waist"] = {"value": None, "unit": "inches", "confidence": 0.0}

    if body_measurements["inseam_length"]["value"]:
        inseam_cm = body_measurements["inseam_length"]["value"]
        inseam_inches = cm_to_inches(inseam_cm)
        pants["inseam"] = {
            "value": round_to_half_inch(inseam_inches),
            "unit": "inches",
            "confidence": body_measurements["inseam_length"]["confidence"],
            "notes": "Crotch to ankle measurement"
        }
    else:
        pants["inseam"] = {"value": None, "unit": "inches", "confidence": 0.0}

    if body_measurements["torso_length"]["value"]:
        torso_cm = body_measurements["torso_length"]["value"]
        rise_cm = torso_cm * 0.28
        rise_inches = cm_to_inches(rise_cm)
        pants["rise"] = {
            "value": round_to_half_inch(rise_inches),
            "unit": "inches",
            "confidence": 0.70,
            "notes": "Estimated from torso proportions"
        }
    else:
        pants["rise"] = {"value": None, "unit": "inches", "confidence": 0.0}

    if body_measurements["leg_opening"]["value"]:
        leg_cm = body_measurements["leg_opening"]["value"]
        leg_inches = cm_to_inches(leg_cm)
        pants["leg"] = {
            "value": round_to_half_inch(leg_inches),
            "unit": "inches",
            "confidence": body_measurements["leg_opening"]["confidence"],
            "notes": "Leg opening diameter"
        }
    else:
        pants["leg"] = {"value": None, "unit": "inches", "confidence": 0.0}

    return pants


def calculate_jacket_measurements(body_measurements: dict) -> dict:
    """Calculate recommended jacket measurements from body measurements"""
    jacket = {}

    if body_measurements["shoulder_width"]["value"]:
        shoulder_cm = body_measurements["shoulder_width"]["value"] + 1.0
        shoulder_inches = cm_to_inches(shoulder_cm)
        jacket["shoulder"] = {
            "value": round_to_half_inch(shoulder_inches),
            "unit": "inches",
            "confidence": body_measurements["shoulder_width"]["confidence"],
            "notes": "Slightly wider than shirt for layering"
        }
    else:
        jacket["shoulder"] = {"value": None, "unit": "inches", "confidence": 0.0}

    if body_measurements["chest_circumference"]["value"]:
        chest_cm = body_measurements["chest_circumference"]["value"]
        chest_ease_cm = inches_to_cm(4.0)
        chest_with_ease_cm = chest_cm + chest_ease_cm
        chest_inches = cm_to_inches(chest_with_ease_cm)
        jacket["chest"] = {
            "value": round_to_half_inch(chest_inches),
            "unit": "inches",
            "confidence": body_measurements["chest_circumference"]["confidence"],
            "notes": "Includes 4-inch ease for jacket fit"
        }
    else:
        jacket["chest"] = {"value": None, "unit": "inches", "confidence": 0.0}

    if body_measurements["arm_length"]["value"]:
        arm_cm = body_measurements["arm_length"]["value"]
        shoulder_cm = body_measurements["shoulder_width"]["value"] or 45.0
        sleeve_cm = arm_cm + (shoulder_cm / 2) + 2.5
        sleeve_inches = cm_to_inches(sleeve_cm)
        jacket["sleeves"] = {
            "value": round_to_half_inch(sleeve_inches),
            "unit": "inches",
            "confidence": body_measurements["arm_length"]["confidence"],
            "notes": "Slightly longer than shirt sleeve"
        }
    else:
        jacket["sleeves"] = {"value": None, "unit": "inches", "confidence": 0.0}

    if body_measurements["torso_length"]["value"]:
        torso_cm = body_measurements["torso_length"]["value"]
        length_cm = torso_cm + 18.0
        length_inches = cm_to_inches(length_cm)
        jacket["length"] = {
            "value": round_to_half_inch(length_inches),
            "unit": "inches",
            "confidence": body_measurements["torso_length"]["confidence"],
            "notes": "Standard jacket length"
        }
    else:
        jacket["length"] = {"value": None, "unit": "inches", "confidence": 0.0}

    return jacket


def calculate_measurements(landmarks, height_cm: float, weight_kg: Optional[float] = None) -> dict:
    """Master function to calculate all body and garment measurements"""
    calibration_result = calculate_calibration_factor(landmarks, height_cm)
    calibration_factor = calibration_result["calibration_factor"]

    body_measurements = {
        "shoulder_width": calculate_shoulder_width(landmarks, calibration_factor),
        "chest_circumference": calculate_chest_circumference(landmarks, calibration_factor),
        "waist_circumference": calculate_waist_circumference(landmarks, calibration_factor),
        "hip_width": calculate_hip_width(landmarks, calibration_factor),
        "arm_length": calculate_arm_length(landmarks, calibration_factor),
        "torso_length": calculate_torso_length(landmarks, calibration_factor),
        "inseam_length": calculate_inseam_length(landmarks, calibration_factor),
        "leg_opening": calculate_leg_opening(landmarks, calibration_factor)
    }

    garment_measurements = {
        "shirt": calculate_shirt_measurements(body_measurements),
        "pants": calculate_pants_measurements(body_measurements),
        "jacket": calculate_jacket_measurements(body_measurements)
    }

    available_count = sum(1 for m in body_measurements.values() if m["value"] is not None)
    total_count = len(body_measurements)

    if available_count == total_count:
        status = "success"
        message = "Measurements calculated successfully"
        warnings = None
    elif available_count > 0:
        status = "partial_success"
        message = "Some body landmarks not detected. Partial measurements returned."
        warnings = []
        missing = [key for key, val in body_measurements.items() if val["value"] is None]
        if missing:
            warnings.append(f"Missing measurements: {', '.join(missing)}")
            warnings.append("Please upload another photo for best results")
    else:
        status = "error"
        message = "Could not calculate measurements"
        warnings = ["No body landmarks detected with sufficient confidence"]

    result = {
        "status": status,
        "message": message,
        "body_measurements": body_measurements,
        "garment_measurements": garment_measurements,
        "calibration_factor": calibration_factor
    }

    if warnings:
        result["warnings"] = warnings

    return result


# API Endpoints
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
    """Analyze full-body photo and return measurements"""
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
        # Read and decode image
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

        # Convert BGR to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Run MediaPipe pose detection
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

        landmarks = results.pose_world_landmarks.landmark
        detected_count = len(landmarks)

        # Calculate measurements
        measurements_result = calculate_measurements(
            landmarks=landmarks,
            height_cm=height_cm,
            weight_kg=weight_kg
        )

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


if __name__ == "__main__":
    print("Starting Silhouette Image Analyzer Backend...")
    print("Server will be available at:")
    print("  - http://localhost:8000 (local)")
    print("  - http://0.0.0.0:8000 (network)")
    print("\nPress Ctrl+C to stop the server")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
