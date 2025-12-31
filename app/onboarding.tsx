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
import { saveUserProfile } from "../utils/storage";
import { analyzeMeasurements } from "../services/api";

export default function OnboardingPage() {
  const params = useLocalSearchParams();
  const photoUri = params.photoUri as string | undefined;

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState("");

  const weightInputRef = useRef<TextInput>(null);

  // Animation values
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const heightInputOpacity = useRef(new Animated.Value(0)).current;
  const heightInputTranslateX = useRef(new Animated.Value(-20)).current;
  const weightInputOpacity = useRef(new Animated.Value(0)).current;
  const weightInputTranslateX = useRef(new Animated.Value(-20)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const isFormValid = height.trim().length > 0 && weight.trim().length > 0;

  useEffect(() => {
    // Card entrance animation
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered content animations
    const staggerDelay = 150;

    setTimeout(() => {
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 200);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(heightInputOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(heightInputTranslateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200 + staggerDelay);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(weightInputOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(weightInputTranslateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200 + staggerDelay * 2);

    setTimeout(() => {
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 200 + staggerDelay * 3);
  }, []);

  const handleButtonPressIn = () => {
    if (isFormValid) {
      Animated.spring(buttonScale, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Parse height input to centimeters
  const parseHeightToCm = (heightStr: string): number => {
    // Check for feet'inches" format (e.g., 5'10")
    const feetInchesMatch = heightStr.match(/(\d+)'(\d+)/);
    if (feetInchesMatch) {
      const feet = parseInt(feetInchesMatch[1], 10);
      const inches = parseInt(feetInchesMatch[2], 10);
      return (feet * 12 + inches) * 2.54;
    }

    // Check for just a number (assume cm if > 100, inches if < 100)
    const numMatch = heightStr.match(/^(\d+\.?\d*)$/);
    if (numMatch) {
      const num = parseFloat(numMatch[1]);
      if (num > 100) {
        return num; // Already in cm
      } else {
        return num * 2.54; // Assume inches
      }
    }

    // Default: try to parse as number and assume cm
    return parseFloat(heightStr) || 170;
  };

  // Parse weight input to kilograms
  const parseWeightToKg = (weightStr: string): number => {
    const num = parseFloat(weightStr.replace(/[^\d.]/g, ""));
    // If contains "lbs" or number is > 100, assume pounds
    if (weightStr.toLowerCase().includes("lb") || num > 100) {
      return num * 0.453592;
    }
    return num || 70;
  };

  const handleContinue = async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Save user profile
      await saveUserProfile(height.trim(), weight.trim());

      // If we have a photo, analyze it
      if (photoUri) {
        const heightCm = parseHeightToCm(height.trim());
        const weightKg = parseWeightToKg(weight.trim());

        setAnalysisProgress("Analyzing photo...");

        const result = await analyzeMeasurements(
          photoUri,
          heightCm,
          weightKg,
          (message) => {
            setAnalysisProgress(message);
          }
        );

        if (result.status === "error") {
          Alert.alert("Measurement Analysis Failed", result.message, [
            {
              text: "Continue Anyway",
              onPress: () => {
                router.replace("/garment-editor");
              },
            },
            {
              text: "Retake Photo",
              onPress: () => {
                router.replace("/welcome");
              },
              style: "cancel",
            },
          ]);
          return;
        }

        if (result.status === "partial_success") {
          Alert.alert(
            "Partial Measurements",
            result.message + "\n\nSome measurements may be missing.",
            [
              {
                text: "Continue",
                onPress: () => {
                  router.replace({
                    pathname: "/garment-editor",
                    params: {
                      measurements: JSON.stringify(result.garment_measurements),
                    },
                  });
                },
              },
            ]
          );
          return;
        }

        // Success - navigate with measurements
        router.replace({
          pathname: "/garment-editor",
          params: {
            measurements: JSON.stringify(result.garment_measurements),
          },
        });
      } else {
        // No photo - just navigate
        router.replace("/garment-editor");
      }
    } catch (error) {
      console.error("Error during onboarding:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
      setAnalysisProgress("");
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
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <Animated.View style={{ opacity: titleOpacity }}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
              Let's start by getting your measurements
            </Text>
          </Animated.View>

          <View style={styles.inputsContainer}>
            <Animated.View
              style={{
                opacity: heightInputOpacity,
                transform: [{ translateX: heightInputTranslateX }],
              }}
            >
              <Text style={styles.label}>Height</Text>
              <TextInput
                style={styles.input}
                placeholder="5'10&quot;"
                placeholderTextColor="#9CA3AF"
                value={height}
                onChangeText={setHeight}
                returnKeyType="next"
                onSubmitEditing={() => weightInputRef.current?.focus()}
                blurOnSubmit={false}
              />
            </Animated.View>

            <Animated.View
              style={{
                opacity: weightInputOpacity,
                transform: [{ translateX: weightInputTranslateX }],
              }}
            >
              <Text style={styles.label}>Weight</Text>
              <TextInput
                ref={weightInputRef}
                style={styles.input}
                placeholder="160 lbs"
                placeholderTextColor="#9CA3AF"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
            </Animated.View>
          </View>

          {isSubmitting && analysisProgress && (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.progressText}>{analysisProgress}</Text>
            </View>
          )}

          <Animated.View
            style={{
              opacity: buttonOpacity,
              transform: [{ scale: buttonScale }],
            }}
          >
            <TouchableOpacity
              style={[styles.button, !isFormValid && styles.buttonDisabled]}
              onPress={handleContinue}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              disabled={!isFormValid || isSubmitting}
              activeOpacity={0.9}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text
                    style={[
                      styles.buttonText,
                      !isFormValid && styles.buttonTextDisabled,
                    ]}
                  >
                    Continue
                  </Text>
                  <Text
                    style={[
                      styles.buttonArrow,
                      !isFormValid && styles.buttonTextDisabled,
                    ]}
                  >
                    →
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
  },
  inputsContainer: {
    gap: 20,
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 2,
    borderColor: "transparent",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  buttonTextDisabled: {
    color: "#9CA3AF",
  },
  buttonArrow: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
});
