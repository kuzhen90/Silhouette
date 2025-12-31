# Measurement Calculation Algorithms

## Overview

This document provides complete algorithms for calculating body measurements and garment measurements from MediaPipe pose landmarks. It includes the hybrid approach using both direct landmark distances and anthropometric ratios.

---

## Calculation Strategy

### Hybrid Approach

We combine two methods for maximum accuracy:

1. **Direct Measurement**: Calculate distances between landmarks using 3D coordinates
2. **Anthropometric Ratios**: Use established body proportion relationships for estimates

**When to use each**:
- Direct: When landmarks are clearly visible and reliable (shoulders, hips, height)
- Ratios: For circumferences (chest, waist) and areas without direct landmarks

---

## Helper Functions

### Distance Calculation

```python
import numpy as np
from typing import Optional

def calculate_distance_3d(landmark1, landmark2) -> float:
    """
    Calculate 3D Euclidean distance between two landmarks

    Args:
        landmark1: MediaPipe pose landmark
        landmark2: MediaPipe pose landmark

    Returns:
        Distance in meters (world coordinate units)
    """
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
```

### Unit Conversion

```python
def cm_to_inches(cm: float) -> float:
    """Convert centimeters to inches"""
    return cm / 2.54


def inches_to_cm(inches: float) -> float:
    """Convert inches to centimeters"""
    return inches * 2.54


def round_to_half_inch(inches: float) -> float:
    """Round to nearest 0.5 inch (common for garment sizing)"""
    return round(inches * 2) / 2
```

---

## Calibration Factor

```python
def calculate_calibration_factor(landmarks, actual_height_cm: float) -> dict:
    """
    Calculate scaling factor to convert world coordinates to real measurements

    Args:
        landmarks: MediaPipe pose world landmarks
        actual_height_cm: User's actual height in centimeters

    Returns:
        dict with calibration_factor and confidence
    """
    # Get top reference point (nose)
    nose = landmarks[0]

    # Get bottom reference point (lower heel)
    left_heel = landmarks[29]
    right_heel = landmarks[30]

    # Use the lower heel (larger y value in world coords where y increases upward)
    heel = left_heel if left_heel.y < right_heel.y else right_heel

    # Calculate detected height in world coordinates
    # Nose to heel distance represents ~87% of total height
    # Multiply by 1.15 to account for head above nose
    nose_to_heel_m = abs(heel.y - nose.y)
    detected_height_m = nose_to_heel_m * 1.15

    # Calculate calibration factor
    actual_height_m = actual_height_cm / 100
    calibration_factor = actual_height_m / detected_height_m

    # Estimate confidence based on how reasonable the detected height is
    height_ratio = detected_height_m / actual_height_m
    if 0.8 <= height_ratio <= 1.2:
        confidence = 0.95  # Very close match
    elif 0.6 <= height_ratio <= 1.4:
        confidence = 0.80  # Reasonable match
    else:
        confidence = 0.60  # Significant discrepancy

    return {
        "calibration_factor": calibration_factor,
        "confidence": confidence,
        "detected_height_m": detected_height_m,
        "detected_height_cm": detected_height_m * 100
    }
```

---

## Body Measurements

### 1. Shoulder Width

```python
def calculate_shoulder_width(landmarks, calibration_factor: float) -> dict:
    """
    Calculate shoulder width (acromial breadth)

    Landmarks: 11 (left shoulder), 12 (right shoulder)
    """
    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]

    # Check visibility
    if not (is_landmark_visible(left_shoulder) and is_landmark_visible(right_shoulder)):
        return {
            "value": None,
            "unit": "cm",
            "confidence": 0.0,
            "error": "Shoulders not visible"
        }

    # Calculate distance
    distance_m = calculate_distance_3d(left_shoulder, right_shoulder)
    distance_cm = distance_m * 100 * calibration_factor

    # Visibility-based confidence
    visibility_avg = (left_shoulder.visibility + right_shoulder.visibility) / 2
    confidence = min(0.98, visibility_avg)

    return {
        "value": round(distance_cm, 1),
        "unit": "cm",
        "confidence": round(confidence, 2)
    }
```

### 2. Chest Circumference

```python
def calculate_chest_circumference(landmarks, calibration_factor: float,
                                  shoulder_width_cm: Optional[float] = None) -> dict:
    """
    Calculate chest circumference using shoulder width and anthropometric ratios

    Method: Estimate from shoulder width using typical body proportions
    Ratio: Chest circumference ≈ shoulder width × 2.2 (average male/female)
    """
    # Try to get shoulder width from landmarks
    if shoulder_width_cm is None:
        shoulder_result = calculate_shoulder_width(landmarks, calibration_factor)
        if shoulder_result["value"] is None:
            return {
                "value": None,
                "unit": "cm",
                "confidence": 0.0,
                "error": "Cannot calculate without shoulder reference"
            }
        shoulder_width_cm = shoulder_result["value"]

    # Use anthropometric ratio
    # Chest circumference is typically 2.1-2.3 times shoulder width
    chest_circumference_cm = shoulder_width_cm * 2.2

    # Confidence is lower for estimated measurements
    confidence = 0.75

    return {
        "value": round(chest_circumference_cm, 1),
        "unit": "cm",
        "confidence": confidence,
        "notes": "Estimated from shoulder width using anthropometric ratio"
    }
```

### 3. Waist Circumference

```python
def calculate_waist_circumference(landmarks, calibration_factor: float,
                                  hip_width_cm: Optional[float] = None) -> dict:
    """
    Calculate waist circumference

    Method: Estimate from hip width using anthropometric ratios
    Waist-to-hip ratio typically: 0.85-0.95
    """
    # Calculate hip width if not provided
    if hip_width_cm is None:
        hip_result = calculate_hip_width(landmarks, calibration_factor)
        if hip_result["value"] is None:
            return {
                "value": None,
                "unit": "cm",
                "confidence": 0.0,
                "error": "Cannot calculate without hip reference"
            }
        hip_width_cm = hip_result["value"]

    # Waist is typically 90% of hip width for average body type
    # This is a simplified model - actual ratio varies by body composition
    waist_circumference_cm = hip_width_cm * 2.0 * 0.90

    confidence = 0.70  # Lower confidence for estimation

    return {
        "value": round(waist_circumference_cm, 1),
        "unit": "cm",
        "confidence": confidence,
        "notes": "Estimated from hip width using anthropometric ratio"
    }
```

### 4. Hip Width

```python
def calculate_hip_width(landmarks, calibration_factor: float) -> dict:
    """
    Calculate hip width (bi-iliac breadth)

    Landmarks: 23 (left hip), 24 (right hip)
    """
    left_hip = landmarks[23]
    right_hip = landmarks[24]

    # Check visibility
    if not (is_landmark_visible(left_hip) and is_landmark_visible(right_hip)):
        return {
            "value": None,
            "unit": "cm",
            "confidence": 0.0,
            "error": "Hips not visible"
        }

    # Calculate distance
    distance_m = calculate_distance_3d(left_hip, right_hip)
    distance_cm = distance_m * 100 * calibration_factor

    # Visibility-based confidence
    visibility_avg = (left_hip.visibility + right_hip.visibility) / 2
    confidence = min(0.92, visibility_avg)

    return {
        "value": round(distance_cm, 1),
        "unit": "cm",
        "confidence": round(confidence, 2)
    }
```

### 5. Arm Length (Sleeve)

```python
def calculate_arm_length(landmarks, calibration_factor: float) -> dict:
    """
    Calculate arm length from shoulder to wrist

    Landmarks: 11/12 (shoulders), 15/16 (wrists)
    Uses average of both arms
    """
    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]
    left_wrist = landmarks[15]
    right_wrist = landmarks[16]

    # Calculate center of shoulders
    shoulder_center = calculate_midpoint(left_shoulder, right_shoulder)

    arms_measured = 0
    total_length = 0

    # Left arm
    if is_landmark_visible(left_wrist):
        # Convert midpoint back to object-like structure for distance calc
        class Point:
            def __init__(self, coords):
                self.x, self.y, self.z = coords

        shoulder_point = Point(shoulder_center)
        left_length_m = calculate_distance_3d(shoulder_point, left_wrist)
        total_length += left_length_m
        arms_measured += 1

    # Right arm
    if is_landmark_visible(right_wrist):
        shoulder_point = Point(shoulder_center)
        right_length_m = calculate_distance_3d(shoulder_point, right_wrist)
        total_length += right_length_m
        arms_measured += 1

    if arms_measured == 0:
        return {
            "value": None,
            "unit": "cm",
            "confidence": 0.0,
            "error": "Arms not visible"
        }

    # Average of measured arms
    avg_length_m = total_length / arms_measured
    avg_length_cm = avg_length_m * 100 * calibration_factor

    # Confidence based on number of arms measured
    confidence = 0.93 if arms_measured == 2 else 0.80

    return {
        "value": round(avg_length_cm, 1),
        "unit": "cm",
        "confidence": confidence,
        "notes": f"Average of {arms_measured} arm(s)"
    }
```

### 6. Torso Length

```python
def calculate_torso_length(landmarks, calibration_factor: float) -> dict:
    """
    Calculate torso length from shoulder to hip

    Landmarks: 11/12 (shoulders), 23/24 (hips)
    """
    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]
    left_hip = landmarks[23]
    right_hip = landmarks[24]

    # Check visibility
    shoulders_visible = is_landmark_visible(left_shoulder) and is_landmark_visible(right_shoulder)
    hips_visible = is_landmark_visible(left_hip) and is_landmark_visible(right_hip)

    if not (shoulders_visible and hips_visible):
        return {
            "value": None,
            "unit": "cm",
            "confidence": 0.0,
            "error": "Shoulders or hips not visible"
        }

    # Calculate midpoints
    shoulder_center = calculate_midpoint(left_shoulder, right_shoulder)
    hip_center = calculate_midpoint(left_hip, right_hip)

    # Calculate distance between centers
    torso_length_m = np.linalg.norm(hip_center - shoulder_center)
    torso_length_cm = torso_length_m * 100 * calibration_factor

    confidence = 0.90

    return {
        "value": round(torso_length_cm, 1),
        "unit": "cm",
        "confidence": confidence
    }
```

### 7. Inseam Length

```python
def calculate_inseam_length(landmarks, calibration_factor: float) -> dict:
    """
    Calculate inseam length from hip to ankle

    Landmarks: 23/24 (hips), 27/28 (ankles)
    """
    left_hip = landmarks[23]
    right_hip = landmarks[24]
    left_ankle = landmarks[27]
    right_ankle = landmarks[28]

    hip_center = calculate_midpoint(left_hip, right_hip)

    legs_measured = 0
    total_length = 0

    class Point:
        def __init__(self, coords):
            self.x, self.y, self.z = coords

    hip_point = Point(hip_center)

    # Left leg
    if is_landmark_visible(left_ankle):
        left_length_m = calculate_distance_3d(hip_point, left_ankle)
        total_length += left_length_m
        legs_measured += 1

    # Right leg
    if is_landmark_visible(right_ankle):
        right_length_m = calculate_distance_3d(hip_point, right_ankle)
        total_length += right_length_m
        legs_measured += 1

    if legs_measured == 0:
        return {
            "value": None,
            "unit": "cm",
            "confidence": 0.0,
            "error": "Ankles not visible"
        }

    avg_length_m = total_length / legs_measured
    avg_length_cm = avg_length_m * 100 * calibration_factor

    confidence = 0.88 if legs_measured == 2 else 0.75

    return {
        "value": round(avg_length_cm, 1),
        "unit": "cm",
        "confidence": confidence,
        "notes": f"Average of {legs_measured} leg(s)"
    }
```

### 8. Leg Opening

```python
def calculate_leg_opening(landmarks, calibration_factor: float) -> dict:
    """
    Calculate leg opening diameter at ankle

    Landmarks: 27/28 (ankles), 31/32 (foot indices)
    Estimated from ankle width
    """
    left_ankle = landmarks[27]
    right_ankle = landmarks[28]

    if not (is_landmark_visible(left_ankle) and is_landmark_visible(right_ankle)):
        return {
            "value": None,
            "unit": "cm",
            "confidence": 0.0,
            "error": "Ankles not visible"
        }

    # Distance between ankles when standing normally
    # Typical leg opening is about 18-22cm for average build
    # Estimate based on hip width ratio
    hip_result = calculate_hip_width(landmarks, calibration_factor)

    if hip_result["value"]:
        # Leg opening is typically 45-50% of hip width
        leg_opening_cm = hip_result["value"] * 0.47
        confidence = 0.75
    else:
        # Fallback estimate
        leg_opening_cm = 18.0
        confidence = 0.50

    return {
        "value": round(leg_opening_cm, 1),
        "unit": "cm",
        "confidence": confidence,
        "notes": "Estimated from hip proportions"
    }
```

---

## Garment Measurements

Garment measurements are derived from body measurements with added ease/allowance for comfort and fit.

### Shirt Measurements

```python
def calculate_shirt_measurements(body_measurements: dict) -> dict:
    """
    Calculate recommended shirt measurements from body measurements

    Body measurements should include: shoulder_width, chest_circumference,
    arm_length, torso_length
    """
    shirt = {}

    # 1. SHOULDER
    if body_measurements["shoulder_width"]["value"]:
        # Shirt shoulder typically matches body shoulder width
        shoulder_cm = body_measurements["shoulder_width"]["value"]
        shoulder_inches = cm_to_inches(shoulder_cm)

        shirt["shoulder"] = {
            "value": round_to_half_inch(shoulder_inches),
            "unit": "inches",
            "confidence": body_measurements["shoulder_width"]["confidence"],
            "notes": "Direct body measurement"
        }
    else:
        shirt["shoulder"] = {
            "value": None,
            "unit": "inches",
            "confidence": 0.0
        }

    # 2. CHEST
    if body_measurements["chest_circumference"]["value"]:
        # Add 2-4 inches ease for regular fit (we use 2 inches)
        chest_cm = body_measurements["chest_circumference"]["value"]
        chest_ease_cm = inches_to_cm(2.0)  # 2 inch ease
        chest_with_ease_cm = chest_cm + chest_ease_cm
        chest_inches = cm_to_inches(chest_with_ease_cm)

        shirt["chest"] = {
            "value": round_to_half_inch(chest_inches),
            "unit": "inches",
            "confidence": body_measurements["chest_circumference"]["confidence"],
            "notes": "Includes 2-inch ease for regular fit"
        }
    else:
        shirt["chest"] = {
            "value": None,
            "unit": "inches",
            "confidence": 0.0
        }

    # 3. SLEEVES (Center Back to Wrist)
    if body_measurements["arm_length"]["value"]:
        # Sleeve length is arm length + shoulder width/2
        # This approximates center back to wrist measurement
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
        shirt["sleeves"] = {
            "value": None,
            "unit": "inches",
            "confidence": 0.0
        }

    # 4. LENGTH (High Point Shoulder to Hem)
    if body_measurements["torso_length"]["value"]:
        # Shirt length is torso length + additional length for coverage
        torso_cm = body_measurements["torso_length"]["value"]
        # Add ~15cm for below-hip coverage
        length_cm = torso_cm + 15.0
        length_inches = cm_to_inches(length_cm)

        shirt["length"] = {
            "value": round_to_half_inch(length_inches),
            "unit": "inches",
            "confidence": body_measurements["torso_length"]["confidence"],
            "notes": "Measured from high point shoulder to hem"
        }
    else:
        shirt["length"] = {
            "value": None,
            "unit": "inches",
            "confidence": 0.0
        }

    return shirt
```

### Pants Measurements

```python
def calculate_pants_measurements(body_measurements: dict) -> dict:
    """
    Calculate recommended pants measurements from body measurements
    """
    pants = {}

    # 1. WAIST
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
        pants["waist"] = {
            "value": None,
            "unit": "inches",
            "confidence": 0.0
        }

    # 2. INSEAM
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
        pants["inseam"] = {
            "value": None,
            "unit": "inches",
            "confidence": 0.0
        }

    # 3. RISE (Front Rise)
    if body_measurements["torso_length"]["value"]:
        # Rise is approximately 25-30% of torso length
        torso_cm = body_measurements["torso_length"]["value"]
        rise_cm = torso_cm * 0.28
        rise_inches = cm_to_inches(rise_cm)

        pants["rise"] = {
            "value": round_to_half_inch(rise_inches),
            "unit": "inches",
            "confidence": 0.70,  # Lower confidence for estimation
            "notes": "Estimated from torso proportions"
        }
    else:
        pants["rise"] = {
            "value": None,
            "unit": "inches",
            "confidence": 0.0
        }

    # 4. LEG OPENING
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
        pants["leg"] = {
            "value": None,
            "unit": "inches",
            "confidence": 0.0
        }

    return pants
```

### Jacket Measurements

```python
def calculate_jacket_measurements(body_measurements: dict) -> dict:
    """
    Calculate recommended jacket measurements from body measurements
    Jackets need more ease than shirts for layering
    """
    jacket = {}

    # 1. SHOULDER
    if body_measurements["shoulder_width"]["value"]:
        # Jacket shoulder slightly wider for structure (add 1cm)
        shoulder_cm = body_measurements["shoulder_width"]["value"] + 1.0
        shoulder_inches = cm_to_inches(shoulder_cm)

        jacket["shoulder"] = {
            "value": round_to_half_inch(shoulder_inches),
            "unit": "inches",
            "confidence": body_measurements["shoulder_width"]["confidence"],
            "notes": "Slightly wider than shirt for layering"
        }
    else:
        jacket["shoulder"] = {
            "value": None,
            "unit": "inches",
            "confidence": 0.0
        }

    # 2. CHEST
    if body_measurements["chest_circumference"]["value"]:
        # Jackets need 4-6 inches ease (we use 4)
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
        jacket["chest"] = {
            "value": None,
            "unit": "inches",
            "confidence": 0.0
        }

    # 3. SLEEVES
    if body_measurements["arm_length"]["value"]:
        # Jacket sleeves slightly longer than shirt (add 2-3cm)
        arm_cm = body_measurements["arm_length"]["value"]
        shoulder_cm = body_measurements["shoulder_width"]["value"] or 45.0

        sleeve_cm = arm_cm + (shoulder_cm / 2) + 2.5  # Extra 2.5cm for jacket
        sleeve_inches = cm_to_inches(sleeve_cm)

        jacket["sleeves"] = {
            "value": round_to_half_inch(sleeve_inches),
            "unit": "inches",
            "confidence": body_measurements["arm_length"]["confidence"],
            "notes": "Slightly longer than shirt sleeve"
        }
    else:
        jacket["sleeves"] = {
            "value": None,
            "unit": "inches",
            "confidence": 0.0
        }

    # 4. LENGTH
    if body_measurements["torso_length"]["value"]:
        # Jacket length typically covers hips
        torso_cm = body_measurements["torso_length"]["value"]
        length_cm = torso_cm + 18.0  # Slightly longer than shirt
        length_inches = cm_to_inches(length_cm)

        jacket["length"] = {
            "value": round_to_half_inch(length_inches),
            "unit": "inches",
            "confidence": body_measurements["torso_length"]["confidence"],
            "notes": "Standard jacket length"
        }
    else:
        jacket["length"] = {
            "value": None,
            "unit": "inches",
            "confidence": 0.0
        }

    return jacket
```

---

## Complete calculate_measurements Function

```python
def calculate_measurements(landmarks, height_cm: float, weight_kg: Optional[float] = None) -> dict:
    """
    Master function to calculate all body and garment measurements

    Args:
        landmarks: MediaPipe pose world landmarks
        height_cm: User's height in centimeters
        weight_kg: User's weight in kilograms (optional, for future use)

    Returns:
        Dictionary with body_measurements, garment_measurements, status, and metadata
    """
    # 1. CALCULATE CALIBRATION FACTOR
    calibration_result = calculate_calibration_factor(landmarks, height_cm)
    calibration_factor = calibration_result["calibration_factor"]

    # 2. CALCULATE BODY MEASUREMENTS
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

    # 3. CALCULATE GARMENT MEASUREMENTS
    garment_measurements = {
        "shirt": calculate_shirt_measurements(body_measurements),
        "pants": calculate_pants_measurements(body_measurements),
        "jacket": calculate_jacket_measurements(body_measurements)
    }

    # 4. DETERMINE STATUS
    # Count how many body measurements are available
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

        # Identify which measurements are missing
        missing = [key for key, val in body_measurements.items() if val["value"] is None]
        if missing:
            warnings.append(f"Missing measurements: {', '.join(missing)}")
            warnings.append("Please upload another photo for best results")
    else:
        status = "error"
        message = "Could not calculate measurements"
        warnings = ["No body landmarks detected with sufficient confidence"]

    # 5. BUILD RESPONSE
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
```

---

## Anthropometric Reference Data

For reference, typical body proportion ratios (average adult):

| Measurement | Ratio to Height | Notes |
|-------------|-----------------|-------|
| Shoulder Width | 0.24-0.26 | ~24-26% of height |
| Chest Circumference | 0.50-0.55 | ~50-55% of height |
| Waist Circumference | 0.43-0.48 | ~43-48% of height |
| Hip Width | 0.19-0.21 | ~19-21% of height |
| Arm Length | 0.36-0.38 | ~36-38% of height |
| Inseam Length | 0.45-0.47 | ~45-47% of height |

These ratios can be used for validation or as fallback estimates.

---

## Testing Measurement Calculations

```python
# Test with sample data
from mediapipe.framework.formats import landmark_pb2

# Mock landmarks for testing (simplified)
def test_measurements():
    # Create test landmarks
    # (In practice, these come from MediaPipe)

    test_height_cm = 175.0  # 5'9"

    # Run calculations
    result = calculate_measurements(test_landmarks, test_height_cm)

    print(f"Status: {result['status']}")
    print(f"\nBody Measurements:")
    for key, val in result['body_measurements'].items():
        if val['value']:
            print(f"  {key}: {val['value']} {val['unit']} (confidence: {val['confidence']})")

    print(f"\nGarment Measurements:")
    print(f"  Shirt: {result['garment_measurements']['shirt']}")
    print(f"  Pants: {result['garment_measurements']['pants']}")
    print(f"  Jacket: {result['garment_measurements']['jacket']}")
```

---

## Next Steps

After implementing measurement calculations:
1. Integrate into main.py from **02-BACKEND-MEDIAPIPE-IMPLEMENTATION.md**
2. Test with real photos at various heights
3. Validate accuracy against known measurements
4. Tune anthropometric ratios if needed
5. Implement frontend integration from **05-FRONTEND-INTEGRATION-GUIDE.md**
