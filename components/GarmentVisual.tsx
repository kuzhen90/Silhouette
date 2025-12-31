import { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import Svg, { Path, Line, Circle, Rect, G } from "react-native-svg";
import type { GarmentType } from "../utils/storage";

interface GarmentVisualProps {
  garmentType: GarmentType;
}

function ShirtVisual() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 200 220">
      <G>
        {/* Main body */}
        <Path
          d="M60 50 L60 200 L140 200 L140 50 L120 30 L80 30 Z"
          fill="#2563EB"
          fillOpacity={0.2}
          stroke="#2563EB"
          strokeWidth={2}
        />
        {/* Left sleeve */}
        <Path
          d="M60 50 L20 70 L20 120 L60 100 Z"
          fill="#2563EB"
          fillOpacity={0.15}
          stroke="#2563EB"
          strokeWidth={2}
        />
        {/* Right sleeve */}
        <Path
          d="M140 50 L180 70 L180 120 L140 100 Z"
          fill="#2563EB"
          fillOpacity={0.15}
          stroke="#2563EB"
          strokeWidth={2}
        />
        {/* Collar */}
        <Path
          d="M80 30 L90 45 L100 35 L110 45 L120 30"
          fill="none"
          stroke="#2563EB"
          strokeWidth={2}
        />

        {/* Measurement indicators */}
        {/* Shoulder width */}
        <Line
          x1="60"
          y1="50"
          x2="140"
          y2="50"
          stroke="#EF4444"
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />
        <Circle cx="60" cy="50" r="4" fill="#EF4444" />
        <Circle cx="140" cy="50" r="4" fill="#EF4444" />

        {/* Body length */}
        <Line
          x1="150"
          y1="30"
          x2="150"
          y2="200"
          stroke="#EF4444"
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />
        <Circle cx="150" cy="30" r="4" fill="#EF4444" />
        <Circle cx="150" cy="200" r="4" fill="#EF4444" />

        {/* Sleeve length */}
        <Line
          x1="140"
          y1="50"
          x2="180"
          y2="120"
          stroke="#EF4444"
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />
        <Circle cx="180" cy="120" r="4" fill="#EF4444" />

        {/* Chest */}
        <Line
          x1="60"
          y1="80"
          x2="140"
          y2="80"
          stroke="#EF4444"
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />
        <Circle cx="60" cy="80" r="4" fill="#EF4444" />
        <Circle cx="140" cy="80" r="4" fill="#EF4444" />
      </G>
    </Svg>
  );
}

function PantsVisual() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 200 240">
      <G>
        {/* Waistband */}
        <Rect
          x="50"
          y="20"
          width="100"
          height="20"
          fill="#2563EB"
          fillOpacity={0.25}
          stroke="#2563EB"
          strokeWidth={2}
        />
        {/* Left leg */}
        <Path
          d="M50 40 L50 220 L90 220 L100 40 Z"
          fill="#2563EB"
          fillOpacity={0.2}
          stroke="#2563EB"
          strokeWidth={2}
        />
        {/* Right leg */}
        <Path
          d="M100 40 L110 220 L150 220 L150 40 Z"
          fill="#2563EB"
          fillOpacity={0.2}
          stroke="#2563EB"
          strokeWidth={2}
        />
        {/* Center seam */}
        <Line
          x1="100"
          y1="40"
          x2="100"
          y2="90"
          stroke="#2563EB"
          strokeWidth={2}
        />

        {/* Measurement indicators */}
        {/* Waist */}
        <Line
          x1="50"
          y1="30"
          x2="150"
          y2="30"
          stroke="#EF4444"
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />
        <Circle cx="50" cy="30" r="4" fill="#EF4444" />
        <Circle cx="150" cy="30" r="4" fill="#EF4444" />

        {/* Inseam */}
        <Line
          x1="100"
          y1="90"
          x2="100"
          y2="220"
          stroke="#EF4444"
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />
        <Circle cx="100" cy="90" r="4" fill="#EF4444" />
        <Circle cx="100" cy="220" r="4" fill="#EF4444" />

        {/* Rise */}
        <Line
          x1="160"
          y1="20"
          x2="160"
          y2="90"
          stroke="#EF4444"
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />
        <Circle cx="160" cy="20" r="4" fill="#EF4444" />
        <Circle cx="160" cy="90" r="4" fill="#EF4444" />

        {/* Leg opening */}
        <Line
          x1="110"
          y1="220"
          x2="150"
          y2="220"
          stroke="#EF4444"
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />
        <Circle cx="110" cy="220" r="4" fill="#EF4444" />
        <Circle cx="150" cy="220" r="4" fill="#EF4444" />
      </G>
    </Svg>
  );
}

function JacketVisual() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 200 220">
      <G>
        {/* Left panel */}
        <Path
          d="M55 50 L55 200 L95 200 L95 50 L80 30 Z"
          fill="#2563EB"
          fillOpacity={0.2}
          stroke="#2563EB"
          strokeWidth={2}
        />
        {/* Right panel */}
        <Path
          d="M105 50 L105 200 L145 200 L145 50 L120 30 Z"
          fill="#2563EB"
          fillOpacity={0.2}
          stroke="#2563EB"
          strokeWidth={2}
        />
        {/* Left lapel */}
        <Path
          d="M80 30 L95 50 L95 90 L80 70 Z"
          fill="#2563EB"
          fillOpacity={0.3}
          stroke="#2563EB"
          strokeWidth={2}
        />
        {/* Right lapel */}
        <Path
          d="M120 30 L105 50 L105 90 L120 70 Z"
          fill="#2563EB"
          fillOpacity={0.3}
          stroke="#2563EB"
          strokeWidth={2}
        />
        {/* Left sleeve */}
        <Path
          d="M55 50 L15 70 L15 130 L55 110 Z"
          fill="#2563EB"
          fillOpacity={0.15}
          stroke="#2563EB"
          strokeWidth={2}
        />
        {/* Right sleeve */}
        <Path
          d="M145 50 L185 70 L185 130 L145 110 Z"
          fill="#2563EB"
          fillOpacity={0.15}
          stroke="#2563EB"
          strokeWidth={2}
        />
        {/* Collar */}
        <Path
          d="M80 30 L100 20 L120 30"
          fill="none"
          stroke="#2563EB"
          strokeWidth={2}
        />
        {/* Buttons */}
        <Circle cx="100" cy="100" r="4" fill="#2563EB" fillOpacity={0.5} />
        <Circle cx="100" cy="130" r="4" fill="#2563EB" fillOpacity={0.5} />
        <Circle cx="100" cy="160" r="4" fill="#2563EB" fillOpacity={0.5} />

        {/* Measurement indicators */}
        {/* Shoulder width */}
        <Line
          x1="55"
          y1="50"
          x2="145"
          y2="50"
          stroke="#EF4444"
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />
        <Circle cx="55" cy="50" r="4" fill="#EF4444" />
        <Circle cx="145" cy="50" r="4" fill="#EF4444" />

        {/* Body length */}
        <Line
          x1="155"
          y1="20"
          x2="155"
          y2="200"
          stroke="#EF4444"
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />
        <Circle cx="155" cy="20" r="4" fill="#EF4444" />
        <Circle cx="155" cy="200" r="4" fill="#EF4444" />

        {/* Sleeve length */}
        <Line
          x1="145"
          y1="50"
          x2="185"
          y2="130"
          stroke="#EF4444"
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />
        <Circle cx="185" cy="130" r="4" fill="#EF4444" />

        {/* Chest */}
        <Line
          x1="55"
          y1="80"
          x2="145"
          y2="80"
          stroke="#EF4444"
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />
        <Circle cx="55" cy="80" r="4" fill="#EF4444" />
        <Circle cx="145" cy="80" r="4" fill="#EF4444" />
      </G>
    </Svg>
  );
}

export default function GarmentVisual({ garmentType }: GarmentVisualProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [garmentType]);

  const renderGarment = () => {
    switch (garmentType) {
      case "shirt":
        return <ShirtVisual />;
      case "pants":
        return <PantsVisual />;
      case "jacket":
        return <JacketVisual />;
      default:
        return <ShirtVisual />;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.visualContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {renderGarment()}
      </Animated.View>
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
    aspectRatio: 1,
    maxHeight: 350,
  },
  visualContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
