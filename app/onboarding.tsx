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
} from "react-native";
import { router } from "expo-router";
import { saveUserProfile } from "../utils/storage";

export default function OnboardingPage() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleContinue = async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await saveUserProfile(height.trim(), weight.trim());
      router.replace("/garment-editor");
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSubmitting(false);
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

          <Animated.View
            style={{
              opacity: buttonOpacity,
              transform: [{ scale: buttonScale }],
            }}
          >
            <TouchableOpacity
              style={[
                styles.button,
                !isFormValid && styles.buttonDisabled,
              ]}
              onPress={handleContinue}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              disabled={!isFormValid || isSubmitting}
              activeOpacity={0.9}
            >
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
