# Frontend Integration Guide

## Overview

This document provides complete implementation details for integrating the Image Analyzer Backend with your React Native Silhouette app. It includes API service code, UI updates, state management, and confidence indicators.

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Welcome Page (app/welcome.tsx)                              │
│    ├─ Photo Upload                                           │
│    └─ Trigger → Onboarding                                   │
│         │                                                     │
│         ▼                                                     │
│  Onboarding (app/onboarding.tsx)                            │
│    ├─ Collect Height/Weight                                  │
│    └─ Trigger → Backend Analysis → Garment Editor           │
│         │                                                     │
│         ▼                                                     │
│  Backend API Call (services/api.ts)                         │
│    ├─ Send: Photo + Height + Weight                          │
│    └─ Receive: Measurements + Confidence                     │
│         │                                                     │
│         ▼                                                     │
│  Garment Editor (app/garment-editor.tsx)                    │
│    ├─ Auto-fill Measurements                                 │
│    ├─ Show Confidence Indicators                             │
│    └─ Allow Manual Edits                                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Update API Service

### Update services/api.ts

Replace the current dummy implementation with the real backend integration:

```typescript
/**
 * API Service
 * Handles communication with Python backend and future Supabase integration
 */

// API Configuration
const API_CONFIG = {
  // Update this based on your deployment
  LOCAL_LAPTOP: 'http://localhost:8000',
  LOCAL_NETWORK: 'http://192.168.1.105:8000', // Replace with your laptop IP
  ANDROID_EMULATOR: 'http://10.0.2.2:8000',
  IOS_SIMULATOR: 'http://localhost:8000',
  NGROK: '', // Add your ngrok URL if using
  PRODUCTION: '', // TODO: Add production URL later
};

// Automatically select API base URL based on platform
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getApiBaseUrl(): string {
  // Check if running in Expo Go
  const isExpoGo = Constants.appOwnership === 'expo';

  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'android') {
      // Android emulator
      return API_CONFIG.ANDROID_EMULATOR;
    } else if (Platform.OS === 'ios') {
      // iOS simulator
      return API_CONFIG.IOS_SIMULATOR;
    } else {
      // Web or other
      return API_CONFIG.LOCAL_LAPTOP;
    }
  } else {
    // Production mode
    return API_CONFIG.PRODUCTION || API_CONFIG.LOCAL_LAPTOP;
  }
}

const API_BASE_URL = getApiBaseUrl();

console.log(`API Base URL: ${API_BASE_URL}`);

// Response Interfaces
export interface UploadResponse {
  success: boolean;
  message?: string;
  photoUrl?: string;
}

export interface MeasurementValue {
  value: number | null;
  unit: string;
  confidence: number;
  notes?: string;
  error?: string;
}

export interface BodyMeasurements {
  shoulder_width: MeasurementValue;
  chest_circumference: MeasurementValue;
  waist_circumference: MeasurementValue;
  hip_width: MeasurementValue;
  arm_length: MeasurementValue;
  torso_length: MeasurementValue;
  inseam_length: MeasurementValue;
  leg_opening: MeasurementValue;
}

export interface GarmentMeasurement {
  shoulder?: MeasurementValue;
  chest?: MeasurementValue;
  sleeves?: MeasurementValue;
  length?: MeasurementValue;
  waist?: MeasurementValue;
  inseam?: MeasurementValue;
  rise?: MeasurementValue;
  leg?: MeasurementValue;
}

export interface GarmentMeasurements {
  shirt: GarmentMeasurement;
  pants: GarmentMeasurement;
  jacket: GarmentMeasurement;
}

export interface MeasurementResponse {
  status: 'success' | 'partial_success' | 'error';
  message: string;
  warnings?: string[];
  body_measurements?: BodyMeasurements;
  garment_measurements?: GarmentMeasurements;
  metadata?: {
    processing_time_ms: number;
    image_width: number;
    image_height: number;
    detected_landmarks: number;
    model_version: string;
    calibration_factor: number;
  };
  error_code?: string;
  suggestions?: string[];
}

/**
 * Upload a profile photo (DEPRECATED - keeping for compatibility)
 * TODO: Replace with Supabase storage integration in the future
 */
export async function uploadProfilePhoto(
  photoUri: string
): Promise<UploadResponse> {
  if (!photoUri) {
    console.error('No photo URI provided');
    return {
      success: false,
      message: 'No photo URI provided',
    };
  }

  // For now, just return success with local URI
  // Photo will be sent to backend in analyzeMeasurements()
  return {
    success: true,
    photoUrl: photoUri,
  };
}

/**
 * Analyze photo and get body/garment measurements
 *
 * @param photoUri - Local URI of the full-body photo
 * @param heightCm - User's height in centimeters
 * @param weightKg - User's weight in kilograms (optional)
 * @param onProgress - Callback for progress updates
 * @returns Promise with measurement results
 */
export async function analyzeMeasurements(
  photoUri: string,
  heightCm: number,
  weightKg?: number,
  onProgress?: (message: string) => void
): Promise<MeasurementResponse> {
  try {
    onProgress?.('Preparing photo...');

    // Validate inputs
    if (!photoUri) {
      throw new Error('Photo URI is required');
    }
    if (!heightCm || heightCm < 50 || heightCm > 250) {
      throw new Error('Invalid height value');
    }

    // Create FormData
    const formData = new FormData();

    // Add photo file
    formData.append('file', {
      uri: photoUri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any);

    // Add height
    formData.append('height_cm', heightCm.toString());

    // Add weight if provided
    if (weightKg) {
      formData.append('weight_kg', weightKg.toString());
    }

    onProgress?.('Uploading photo...');

    // Send request
    const response = await fetch(`${API_BASE_URL}/measure`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    onProgress?.('Processing image...');

    // Parse response
    const data: MeasurementResponse = await response.json();

    if (!response.ok) {
      // HTTP error
      return {
        status: 'error',
        message: data.message || 'Failed to analyze photo',
        error_code: data.error_code,
        suggestions: data.suggestions,
      };
    }

    onProgress?.('Measurements received!');

    return data;
  } catch (error) {
    console.error('Error analyzing measurements:', error);

    // Network or other error
    return {
      status: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to connect to backend server',
      error_code: 'NETWORK_ERROR',
      suggestions: [
        'Check your internet connection',
        'Ensure backend server is running',
        'Verify API URL is correct',
      ],
    };
  }
}

/**
 * Test backend connection
 */
export async function testBackendConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('Backend connection failed:', error);
    return false;
  }
}
```

---

## Step 2: Update Onboarding Page

Modify `app/onboarding.tsx` to trigger backend analysis:

```typescript
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { saveUserProfile, getUserProfile } from "../utils/storage";
import { analyzeMeasurements } from "../services/api";

export default function OnboardingPage() {
  const params = useLocalSearchParams();
  const photoUri = params.photoUri as string | undefined;

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState("");

  const weightInputRef = useRef<TextInput>(null);

  // ... (keep existing animation code)

  const isFormValid = height.trim().length > 0 && weight.trim().length > 0;

  const handleContinue = async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // 1. Save user profile
      await saveUserProfile(height.trim(), weight.trim());

      // 2. If we have a photo, analyze it
      if (photoUri) {
        // Convert height/weight to numbers
        const heightCm = parseFloat(height.trim());
        const weightKg = parseFloat(weight.trim());

        // Show progress
        setAnalysisProgress("Analyzing photo...");

        // Call backend
        const result = await analyzeMeasurements(
          photoUri,
          heightCm,
          weightKg,
          (message) => {
            setAnalysisProgress(message);
          }
        );

        if (result.status === 'error') {
          // Show error alert
          Alert.alert(
            'Measurement Analysis Failed',
            result.message,
            [
              {
                text: 'Continue Anyway',
                onPress: () => {
                  // Navigate to garment editor without measurements
                  router.replace('/garment-editor');
                },
              },
              {
                text: 'Retake Photo',
                onPress: () => {
                  router.replace('/welcome');
                },
                style: 'cancel',
              },
            ]
          );
          return;
        }

        if (result.status === 'partial_success') {
          // Show warning but continue
          Alert.alert(
            'Partial Measurements',
            result.message + '\n\nSome measurements may be missing.',
            [
              {
                text: 'Continue',
                onPress: () => {
                  // Navigate with measurements
                  router.replace({
                    pathname: '/garment-editor',
                    params: { measurements: JSON.stringify(result.garment_measurements) },
                  });
                },
              },
            ]
          );
          return;
        }

        // Success - navigate with measurements
        router.replace({
          pathname: '/garment-editor',
          params: { measurements: JSON.stringify(result.garment_measurements) },
        });
      } else {
        // No photo - just navigate
        router.replace('/garment-editor');
      }
    } catch (error) {
      console.error('Error during onboarding:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
      setAnalysisProgress('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.card, /* animation styles */]}>
          <Animated.View style={{ opacity: titleOpacity }}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
              Let's start by getting your measurements
            </Text>
          </Animated.View>

          {/* Existing input fields */}
          {/* ... */}

          {/* Progress indicator */}
          {isSubmitting && analysisProgress && (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.progressText}>{analysisProgress}</Text>
            </View>
          )}

          <Animated.View style={/* button animation */}>
            <TouchableOpacity
              style={[
                styles.button,
                !isFormValid && styles.buttonDisabled,
              ]}
              onPress={handleContinue}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={[styles.buttonText]}>Continue</Text>
                  <Text style={[styles.buttonArrow]}>→</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Add to styles
const newStyles = {
  progressContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginVertical: 12,
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500' as const,
  },
};

const styles = StyleSheet.create({
  // ... existing styles
  ...newStyles,
});
```

---

## Step 3: Update Welcome Page

Modify `app/welcome.tsx` to pass photo URI to onboarding:

```typescript
// In handleUploadPhoto function, update navigation:

const handleUploadPhoto = async () => {
  if (!selectedImage) return;

  setIsUploading(true);
  try {
    // Still call uploadProfilePhoto for compatibility
    const response = await uploadProfilePhoto(selectedImage);

    if (response.success) {
      await setWelcomeCompleted();
      // Pass photo URI to onboarding
      router.replace({
        pathname: '/onboarding',
        params: { photoUri: selectedImage },
      });
    } else {
      Alert.alert(
        "Upload Failed",
        response.message || "Failed to upload photo. Please try again.",
        [{ text: "OK" }]
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    Alert.alert("Error", "An error occurred while uploading. Please try again.");
  } finally {
    setIsUploading(false);
  }
};
```

---

## Step 4: Update Garment Editor

Modify `app/garment-editor.tsx` to receive and apply measurements:

```typescript
import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import GarmentVisual from "../components/GarmentVisual";
import MeasurementPanel from "../components/MeasurementPanel";
import {
  GarmentType,
  MeasurementData,
  DEFAULT_MEASUREMENTS,
  getMeasurements,
  saveMeasurements,
} from "../utils/storage";
import { GarmentMeasurements } from "../services/api";

// ... existing imports and constants

export default function GarmentEditor() {
  const params = useLocalSearchParams();
  const receivedMeasurements = params.measurements
    ? JSON.parse(params.measurements as string) as GarmentMeasurements
    : null;

  const [selectedGarment, setSelectedGarment] = useState<GarmentType>("shirt");
  const [measurements, setMeasurements] =
    useState<MeasurementData>(DEFAULT_MEASUREMENTS);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, any>>({});

  // ... existing refs and animation values

  useEffect(() => {
    loadMeasurements();
  }, []);

  const loadMeasurements = async () => {
    const saved = await getMeasurements();
    if (saved) {
      setMeasurements(saved);
    }

    // Apply received measurements from backend
    if (receivedMeasurements) {
      applyBackendMeasurements(receivedMeasurements);
    }
  };

  const applyBackendMeasurements = (backendMeasurements: GarmentMeasurements) => {
    setMeasurements((prev) => {
      const updated = { ...prev };

      // Apply shirt measurements
      if (backendMeasurements.shirt) {
        Object.keys(backendMeasurements.shirt).forEach((key) => {
          const measurement = backendMeasurements.shirt[key as keyof typeof backendMeasurements.shirt];
          if (measurement && measurement.value !== null) {
            // Check if current value is empty (default)
            const currentValue = prev.shirt[key as keyof typeof prev.shirt];
            if (!currentValue || currentValue === DEFAULT_MEASUREMENTS.shirt[key as keyof typeof DEFAULT_MEASUREMENTS.shirt]) {
              // Auto-fill empty fields
              updated.shirt = {
                ...updated.shirt,
                [key]: measurement.value.toString(),
              };
            } else {
              // Prompt for confirmation on populated fields
              setPendingUpdates((pending) => ({
                ...pending,
                [`shirt_${key}`]: measurement.value,
              }));
            }
          }
        });
      }

      // Apply pants measurements
      if (backendMeasurements.pants) {
        Object.keys(backendMeasurements.pants).forEach((key) => {
          const measurement = backendMeasurements.pants[key as keyof typeof backendMeasurements.pants];
          if (measurement && measurement.value !== null) {
            const currentValue = prev.pants[key as keyof typeof prev.pants];
            if (!currentValue || currentValue === DEFAULT_MEASUREMENTS.pants[key as keyof typeof DEFAULT_MEASUREMENTS.pants]) {
              updated.pants = {
                ...updated.pants,
                [key]: measurement.value.toString(),
              };
            } else {
              setPendingUpdates((pending) => ({
                ...pending,
                [`pants_${key}`]: measurement.value,
              }));
            }
          }
        });
      }

      // Apply jacket measurements
      if (backendMeasurements.jacket) {
        Object.keys(backendMeasurements.jacket).forEach((key) => {
          const measurement = backendMeasurements.jacket[key as keyof typeof backendMeasurements.jacket];
          if (measurement && measurement.value !== null) {
            const currentValue = prev.jacket[key as keyof typeof prev.jacket];
            if (!currentValue || currentValue === DEFAULT_MEASUREMENTS.jacket[key as keyof typeof DEFAULT_MEASUREMENTS.jacket]) {
              updated.jacket = {
                ...updated.jacket,
                [key]: measurement.value.toString(),
              };
            } else {
              setPendingUpdates((pending) => ({
                ...pending,
                [`jacket_${key}`]: measurement.value,
              }));
            }
          }
        });
      }

      // Save updated measurements
      saveMeasurements(updated);
      return updated;
    });

    // Show success message
    Alert.alert(
      'Measurements Applied',
      'Your body measurements have been analyzed and applied to all garment types.',
      [{ text: 'OK' }]
    );
  };

  // ... rest of component
}
```

---

## Step 5: Add Confidence Indicators (TODO)

**Note**: Full implementation is a TODO for after backend is working.

For now, create a placeholder component:

```typescript
// components/ConfidenceIndicator.tsx
import { View, Text, StyleSheet } from 'react-native';

interface ConfidenceIndicatorProps {
  confidence: number; // 0.0 - 1.0
}

export default function ConfidenceIndicator({ confidence }: ConfidenceIndicatorProps) {
  const getColor = () => {
    if (confidence >= 0.90) return '#10B981'; // Green
    if (confidence >= 0.70) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getLabel = () => {
    if (confidence >= 0.90) return 'High';
    if (confidence >= 0.70) return 'Medium';
    return 'Low';
  };

  return (
    <View style={[styles.indicator, { backgroundColor: getColor() }]}>
      <Text style={styles.label}>{getLabel()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  indicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  label: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});
```

**Integration (Future)**:
- Add confidence data to storage
- Display indicator next to each measurement field
- Show tooltip with confidence percentage on tap

---

## Step 6: Add "Upload New Photo" Button

Add button in garment editor to re-analyze with new photo:

```typescript
// In garment-editor.tsx, add this function:

const handleUploadNewPhoto = async () => {
  // Open image picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [9, 16],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    const photoUri = result.assets[0].uri;

    // Get user profile
    const profile = await getUserProfile();
    if (!profile) return;

    const heightCm = parseFloat(profile.height); // TODO: Parse properly
    const weightKg = parseFloat(profile.weight);

    // Analyze photo
    Alert.alert('Analyzing Photo', 'Please wait...');

    const measurementResult = await analyzeMeasurements(
      photoUri,
      heightCm,
      weightKg
    );

    if (measurementResult.status === 'success' || measurementResult.status === 'partial_success') {
      if (measurementResult.garment_measurements) {
        applyBackendMeasurements(measurementResult.garment_measurements);
      }
    } else {
      Alert.alert('Analysis Failed', measurementResult.message);
    }
  }
};

// Add button in render:
<TouchableOpacity
  style={styles.uploadButton}
  onPress={handleUploadNewPhoto}
>
  <Text style={styles.uploadButtonText}>Upload New Photo</Text>
</TouchableOpacity>
```

---

## Step 7: Testing the Integration

### Test Checklist

1. **Backend Running**:
   ```bash
   cd backend
   python main.py
   ```

2. **Update API URL**:
   - In `services/api.ts`, update `API_CONFIG.LOCAL_NETWORK` with your laptop IP

3. **Test Flow**:
   - [ ] Open app
   - [ ] Take/upload photo on welcome page
   - [ ] Enter height and weight on onboarding
   - [ ] See "Analyzing photo..." progress
   - [ ] Measurements auto-filled in garment editor
   - [ ] Can manually edit measurements
   - [ ] No errors in console

4. **Error Testing**:
   - [ ] Try with no full body in photo → Should show error
   - [ ] Try with blurry photo → Should show quality error
   - [ ] Stop backend server → Should show network error

---

## Debugging

### Enable Detailed Logging

```typescript
// In services/api.ts, add logging:

console.log('Sending to backend:', {
  photoUri,
  heightCm,
  weightKg,
  apiUrl: API_BASE_URL,
});

// Log response
console.log('Backend response:', JSON.stringify(data, null, 2));
```

### Common Issues

**Issue**: "Network request failed"
- Check backend is running
- Verify API_BASE_URL is correct
- Test health endpoint: `curl http://YOUR_IP:8000/health`

**Issue**: "Cannot read property 'value' of undefined"
- Check response structure matches interface
- Verify backend returns expected JSON format

**Issue**: Measurements not auto-filling
- Check params are passed to garment-editor
- Verify `applyBackendMeasurements` is called
- Check measurements structure

---

## Future Enhancements (TODO)

1. **Confidence Indicators**: Full implementation with colors
2. **Measurement History**: Track measurements over time
3. **Photo Gallery**: View all uploaded photos
4. **Comparison**: Compare measurements from different photos
5. **Supabase Integration**: Store photos and measurements in cloud
6. **Offline Support**: Cache measurements locally

---

## Complete Integration Example

Here's the full flow in pseudo-code:

```
1. User opens app
2. Welcome page: User uploads photo → photoUri saved
3. Onboarding: User enters height/weight
4. On "Continue":
   a. Save profile (height, weight)
   b. Call analyzeMeasurements(photoUri, height, weight)
   c. Show progress: "Detecting body landmarks..."
   d. Backend processes image with MediaPipe
   e. Receive measurements response
5. Navigate to garment-editor with measurements
6. Auto-fill empty fields
7. Show confirmation for populated fields (TODO)
8. User reviews/edits measurements
9. Measurements saved in AsyncStorage
```

---

## Next Steps

After frontend integration:
1. **Test thoroughly** with different photos
2. **Validate accuracy** of measurements
3. **Implement confidence indicators** (TODO)
4. **Add Supabase integration** (TODO)
5. **Deploy to production** when ready
