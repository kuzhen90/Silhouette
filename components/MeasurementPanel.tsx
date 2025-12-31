import { useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Animated,
} from "react-native";
import type {
  GarmentType,
  ShirtMeasurements,
  PantsMeasurements,
  JacketMeasurements,
} from "../utils/storage";

interface MeasurementInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  delay: number;
}

function MeasurementInput({
  label,
  value,
  onChangeText,
  delay,
}: MeasurementInputProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, [label]);

  return (
    <Animated.View
      style={[
        styles.inputContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={styles.unitText}>in</Text>
      </View>
    </Animated.View>
  );
}

interface MeasurementPanelProps {
  garmentType: GarmentType;
  measurements: ShirtMeasurements | PantsMeasurements | JacketMeasurements;
  onMeasurementChange: (key: string, value: string) => void;
}

const MEASUREMENT_LABELS: Record<GarmentType, Record<string, string>> = {
  shirt: {
    shoulder: "Shoulder Width",
    chest: "Chest",
    sleeves: "Sleeve Length",
    length: "Body Length",
  },
  pants: {
    waist: "Waist",
    inseam: "Inseam",
    rise: "Rise",
    leg: "Leg Opening",
  },
  jacket: {
    shoulder: "Shoulder Width",
    chest: "Chest",
    sleeves: "Sleeve Length",
    length: "Body Length",
  },
};

export default function MeasurementPanel({
  garmentType,
  measurements,
  onMeasurementChange,
}: MeasurementPanelProps) {
  const labels = MEASUREMENT_LABELS[garmentType];
  const keys = Object.keys(labels);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📏</Text>
        <Text style={styles.headerTitle}>Measurements</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputsContainer}>
          {keys.map((key, index) => (
            <MeasurementInput
              key={`${garmentType}-${key}`}
              label={labels[key]}
              value={(measurements as unknown as Record<string, string>)[key] || ""}
              onChangeText={(value) => onMeasurementChange(key, value)}
              delay={index * 50}
            />
          ))}
        </View>

        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>
            💡 Tip: Adjust measurements to match your perfect fit. All values
            are in inches.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    flex: 1,
    minHeight: 300,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  scrollView: {
    flex: 1,
  },
  inputsContainer: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1F2937",
  },
  unitText: {
    paddingRight: 16,
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  tipContainer: {
    marginTop: 24,
    backgroundColor: "#DBEAFE",
    borderRadius: 12,
    padding: 16,
  },
  tipText: {
    fontSize: 14,
    color: "#1E40AF",
    lineHeight: 20,
  },
});
