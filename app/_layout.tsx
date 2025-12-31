import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { hasCompletedWelcome, getUserProfile } from "../utils/storage";

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    if (isLoading || !initialRoute) return;

    const currentRoute = segments[0];

    // Only redirect on initial load, not on subsequent navigations
    if (!currentRoute || currentRoute === "index") {
      if (initialRoute !== "index") {
        router.replace(initialRoute as any);
      }
    }
  }, [isLoading, initialRoute, segments]);

  const checkOnboardingStatus = async () => {
    try {
      // TODO: Uncomment these checks after testing is complete
      // const welcomeCompleted = await hasCompletedWelcome();
      // if (!welcomeCompleted) {
      //   setInitialRoute("/welcome");
      //   setIsLoading(false);
      //   return;
      // }

      // const userProfile = await getUserProfile();
      // if (!userProfile) {
      //   setInitialRoute("/onboarding");
      //   setIsLoading(false);
      //   return;
      // }

      // setInitialRoute("/");

      // TESTING MODE: Always start from welcome page
      setInitialRoute("/welcome");
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setInitialRoute("/welcome");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="garment-editor" />
      <Stack.Screen name="index" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
