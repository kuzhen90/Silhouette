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

const GARMENT_OPTIONS: { value: GarmentType; label: string }[] = [
  { value: "shirt", label: "Shirt" },
  { value: "pants", label: "Pants" },
  { value: "jacket", label: "Jacket" },
];

export default function GarmentEditor() {
  const params = useLocalSearchParams();
  const backendMeasurements = params.measurements as string | undefined;

  const [selectedGarment, setSelectedGarment] = useState<GarmentType>("shirt");
  const [measurements, setMeasurements] =
    useState<MeasurementData>(DEFAULT_MEASUREMENTS);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasAppliedBackendMeasurements, setHasAppliedBackendMeasurements] =
    useState(false);

  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const chevronRotation = useRef(new Animated.Value(0)).current;
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply backend measurements when available
  const applyBackendMeasurements = useCallback(
    (garmentMeasurements: GarmentMeasurements): MeasurementData => {
      const formatValue = (value: number | null | undefined): string => {
        if (value === null || value === undefined) return "";
        return value.toFixed(1);
      };

      return {
        shirt: {
          shoulder: formatValue(garmentMeasurements.shirt?.shoulder?.value),
          chest: formatValue(garmentMeasurements.shirt?.chest?.value),
          sleeves: formatValue(garmentMeasurements.shirt?.sleeves?.value),
          length: formatValue(garmentMeasurements.shirt?.length?.value),
        },
        pants: {
          waist: formatValue(garmentMeasurements.pants?.waist?.value),
          inseam: formatValue(garmentMeasurements.pants?.inseam?.value),
          rise: formatValue(garmentMeasurements.pants?.rise?.value),
          leg: formatValue(garmentMeasurements.pants?.leg?.value),
        },
        jacket: {
          shoulder: formatValue(garmentMeasurements.jacket?.shoulder?.value),
          chest: formatValue(garmentMeasurements.jacket?.chest?.value),
          sleeves: formatValue(garmentMeasurements.jacket?.sleeves?.value),
          length: formatValue(garmentMeasurements.jacket?.length?.value),
        },
      };
    },
    []
  );

  useEffect(() => {
    const initializeMeasurements = async () => {
      // First load any saved measurements
      const saved = await getMeasurements();

      // If we have backend measurements and haven't applied them yet
      if (backendMeasurements && !hasAppliedBackendMeasurements) {
        try {
          const parsed: GarmentMeasurements = JSON.parse(backendMeasurements);
          const appliedMeasurements = applyBackendMeasurements(parsed);

          // Merge with saved measurements (backend takes precedence for non-empty values)
          const merged: MeasurementData = {
            shirt: {
              ...DEFAULT_MEASUREMENTS.shirt,
              ...(saved?.shirt || {}),
              ...(appliedMeasurements.shirt.shoulder && {
                shoulder: appliedMeasurements.shirt.shoulder,
              }),
              ...(appliedMeasurements.shirt.chest && {
                chest: appliedMeasurements.shirt.chest,
              }),
              ...(appliedMeasurements.shirt.sleeves && {
                sleeves: appliedMeasurements.shirt.sleeves,
              }),
              ...(appliedMeasurements.shirt.length && {
                length: appliedMeasurements.shirt.length,
              }),
            },
            pants: {
              ...DEFAULT_MEASUREMENTS.pants,
              ...(saved?.pants || {}),
              ...(appliedMeasurements.pants.waist && {
                waist: appliedMeasurements.pants.waist,
              }),
              ...(appliedMeasurements.pants.inseam && {
                inseam: appliedMeasurements.pants.inseam,
              }),
              ...(appliedMeasurements.pants.rise && {
                rise: appliedMeasurements.pants.rise,
              }),
              ...(appliedMeasurements.pants.leg && {
                leg: appliedMeasurements.pants.leg,
              }),
            },
            jacket: {
              ...DEFAULT_MEASUREMENTS.jacket,
              ...(saved?.jacket || {}),
              ...(appliedMeasurements.jacket.shoulder && {
                shoulder: appliedMeasurements.jacket.shoulder,
              }),
              ...(appliedMeasurements.jacket.chest && {
                chest: appliedMeasurements.jacket.chest,
              }),
              ...(appliedMeasurements.jacket.sleeves && {
                sleeves: appliedMeasurements.jacket.sleeves,
              }),
              ...(appliedMeasurements.jacket.length && {
                length: appliedMeasurements.jacket.length,
              }),
            },
          };

          setMeasurements(merged);
          saveMeasurements(merged);
          setHasAppliedBackendMeasurements(true);
        } catch (error) {
          console.error("Error parsing backend measurements:", error);
          if (saved) {
            setMeasurements(saved);
          }
        }
      } else if (saved) {
        setMeasurements(saved);
      }
    };

    initializeMeasurements();
  }, [backendMeasurements, hasAppliedBackendMeasurements, applyBackendMeasurements]);

  const debouncedSave = useCallback((newMeasurements: MeasurementData) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveMeasurements(newMeasurements);
    }, 500);
  }, []);

  const handleMeasurementChange = (key: string, value: string) => {
    setMeasurements((prev) => {
      const newMeasurements = {
        ...prev,
        [selectedGarment]: {
          ...prev[selectedGarment],
          [key]: value,
        },
      };
      debouncedSave(newMeasurements);
      return newMeasurements;
    });
  };

  const toggleDropdown = () => {
    const toValue = isDropdownOpen ? 0 : 1;

    Animated.parallel([
      Animated.timing(dropdownAnim, {
        toValue,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(chevronRotation, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectGarment = (garment: GarmentType) => {
    setSelectedGarment(garment);
    toggleDropdown();
  };

  const dropdownHeight = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150],
  });

  const chevronRotate = chevronRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const selectedLabel =
    GARMENT_OPTIONS.find((o) => o.value === selectedGarment)?.label || "Shirt";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Garment Type Selector */}
        <View style={styles.selectorContainer}>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={toggleDropdown}
            activeOpacity={0.8}
          >
            <Text style={styles.selectorText}>{selectedLabel}</Text>
            <Animated.Text
              style={[
                styles.chevron,
                { transform: [{ rotate: chevronRotate }] },
              ]}
            >
              ▼
            </Animated.Text>
          </TouchableOpacity>

          <Animated.View
            style={[styles.dropdownMenu, { height: dropdownHeight }]}
          >
            {GARMENT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dropdownItem,
                  selectedGarment === option.value && styles.dropdownItemActive,
                ]}
                onPress={() => selectGarment(option.value)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    selectedGarment === option.value &&
                      styles.dropdownItemTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>

        {/* Garment Visualization */}
        <View style={styles.visualSection}>
          <GarmentVisual garmentType={selectedGarment} />
        </View>

        {/* Measurement Panel */}
        <View style={styles.panelSection}>
          <MeasurementPanel
            garmentType={selectedGarment}
            measurements={measurements[selectedGarment]}
            onMeasurementChange={handleMeasurementChange}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  selectorContainer: {
    marginBottom: 20,
    zIndex: 10,
  },
  selectorButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  selectorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  chevron: {
    fontSize: 12,
    color: "#6B7280",
  },
  dropdownMenu: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  dropdownItemActive: {
    backgroundColor: "#EFF6FF",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#374151",
  },
  dropdownItemTextActive: {
    color: "#2563EB",
    fontWeight: "600",
  },
  visualSection: {
    marginBottom: 20,
  },
  panelSection: {
    flex: 1,
  },
});
