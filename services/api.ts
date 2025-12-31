/**
 * API Service
 * Handles communication with Python backend and future Supabase integration
 */

import { Platform } from "react-native";

// API Configuration
const API_CONFIG = {
  LOCAL_LAPTOP: "http://localhost:8000",
  LOCAL_NETWORK: "http://192.168.1.154:8000", // Your laptop's Wi-Fi IP
  ANDROID_EMULATOR: "http://10.0.2.2:8000",
  IOS_SIMULATOR: "http://localhost:8000",
  NGROK: "", // Add your ngrok URL if using
  PRODUCTION: "", // TODO: Add production URL later
};

function getApiBaseUrl(): string {
  if (__DEV__) {
    // For physical devices, use LOCAL_NETWORK with your computer's IP
    // For simulators/emulators, use localhost or 10.0.2.2
    const USE_LOCAL_NETWORK = true; // Set to true for physical devices

    if (USE_LOCAL_NETWORK) {
      return API_CONFIG.LOCAL_NETWORK;
    }

    if (Platform.OS === "android") {
      return API_CONFIG.ANDROID_EMULATOR;
    } else if (Platform.OS === "ios") {
      return API_CONFIG.IOS_SIMULATOR;
    } else {
      return API_CONFIG.LOCAL_LAPTOP;
    }
  } else {
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
  status: "success" | "partial_success" | "error";
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
 * Upload a profile photo
 * For now, just returns success with local URI
 * Photo will be sent to backend in analyzeMeasurements()
 */
export async function uploadProfilePhoto(
  photoUri: string
): Promise<UploadResponse> {
  if (!photoUri) {
    console.error("No photo URI provided");
    return {
      success: false,
      message: "No photo URI provided",
    };
  }

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
    onProgress?.("Preparing photo...");

    if (!photoUri) {
      throw new Error("Photo URI is required");
    }
    if (!heightCm || heightCm < 50 || heightCm > 250) {
      throw new Error("Invalid height value");
    }

    const formData = new FormData();

    formData.append("file", {
      uri: photoUri,
      name: "photo.jpg",
      type: "image/jpeg",
    } as unknown as Blob);

    formData.append("height_cm", heightCm.toString());

    if (weightKg) {
      formData.append("weight_kg", weightKg.toString());
    }

    onProgress?.("Uploading photo...");

    const response = await fetch(`${API_BASE_URL}/measure`, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    onProgress?.("Processing image...");

    const data: MeasurementResponse = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Failed to analyze photo",
        error_code: data.error_code,
        suggestions: data.suggestions,
      };
    }

    onProgress?.("Measurements received!");

    return data;
  } catch (error) {
    console.error("Error analyzing measurements:", error);

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to connect to backend server",
      error_code: "NETWORK_ERROR",
      suggestions: [
        "Check your internet connection",
        "Ensure backend server is running",
        "Verify API URL is correct",
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
      method: "GET",
    });
    const data = await response.json();
    return data.status === "healthy";
  } catch (error) {
    console.error("Backend connection failed:", error);
    return false;
  }
}
