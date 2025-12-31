import AsyncStorage from "@react-native-async-storage/async-storage";

const WELCOME_COMPLETED_KEY = "hasCompletedWelcome";

export async function hasCompletedWelcome(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(WELCOME_COMPLETED_KEY);
    return value === "true";
  } catch (error) {
    console.error("Error reading welcome completion status:", error);
    return false;
  }
}

export async function setWelcomeCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(WELCOME_COMPLETED_KEY, "true");
  } catch (error) {
    console.error("Error setting welcome completion status:", error);
    throw error;
  }
}

export async function resetWelcomeStatus(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WELCOME_COMPLETED_KEY);
  } catch (error) {
    console.error("Error resetting welcome status:", error);
    throw error;
  }
}

// User Profile Storage
const USER_PROFILE_KEY = "userProfile";

export interface UserProfile {
  height: string;
  weight: string;
}

export async function saveUserProfile(
  height: string,
  weight: string
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      USER_PROFILE_KEY,
      JSON.stringify({ height, weight })
    );
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const data = await AsyncStorage.getItem(USER_PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error reading user profile:", error);
    return null;
  }
}

export async function resetUserProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(USER_PROFILE_KEY);
  } catch (error) {
    console.error("Error resetting user profile:", error);
    throw error;
  }
}

// Garment Measurements Storage
const MEASUREMENTS_KEY = "measurements";

export type GarmentType = "shirt" | "pants" | "jacket";

export interface ShirtMeasurements {
  shoulder: string;
  chest: string;
  sleeves: string;
  length: string;
}

export interface PantsMeasurements {
  waist: string;
  inseam: string;
  rise: string;
  leg: string;
}

export interface JacketMeasurements {
  shoulder: string;
  chest: string;
  sleeves: string;
  length: string;
}

export interface MeasurementData {
  shirt: ShirtMeasurements;
  pants: PantsMeasurements;
  jacket: JacketMeasurements;
}

export const DEFAULT_MEASUREMENTS: MeasurementData = {
  shirt: { shoulder: "18", chest: "40", sleeves: "25", length: "29" },
  pants: { waist: "32", inseam: "32", rise: "11", leg: "8" },
  jacket: { shoulder: "18.5", chest: "42", sleeves: "26", length: "30" },
};

export async function saveMeasurements(
  measurements: MeasurementData
): Promise<void> {
  try {
    await AsyncStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(measurements));
  } catch (error) {
    console.error("Error saving measurements:", error);
    throw error;
  }
}

export async function getMeasurements(): Promise<MeasurementData | null> {
  try {
    const data = await AsyncStorage.getItem(MEASUREMENTS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error reading measurements:", error);
    return null;
  }
}

export async function resetMeasurements(): Promise<void> {
  try {
    await AsyncStorage.removeItem(MEASUREMENTS_KEY);
  } catch (error) {
    console.error("Error resetting measurements:", error);
    throw error;
  }
}
