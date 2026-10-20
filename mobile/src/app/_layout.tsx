import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Backend } from "../providers/Backend";
import { Brand, colors, Loading, Screen } from "../components/ui";
import { ErrorBoundary } from "../components/ErrorBoundary";

export default function RootLayout() {
  const [fonts, error] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  if (!fonts && !error)
    return (
      <SafeAreaProvider>
        <Screen>
          <Loading label="Opening chauffer…" />
        </Screen>
      </SafeAreaProvider>
    );
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ErrorBoundary>
        <Backend>
          <Stack
            screenOptions={{
              headerTintColor: colors.ink,
              headerShadowVisible: false,
              headerStyle: { backgroundColor: colors.canvas },
              contentStyle: { backgroundColor: colors.canvas },
              headerBackButtonDisplayMode: "minimal",
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="sign-in"
              options={{ title: "Your account", presentation: "modal" }}
            />
            <Stack.Screen
              name="preferences"
              options={{ title: "Your style" }}
            />
            <Stack.Screen
              name="wardrobe-edit"
              options={{ title: "Clothing details" }}
            />
            <Stack.Screen
              name="outfits"
              options={{ title: "Wear what you own" }}
            />
            <Stack.Screen name="history" options={{ title: "Past chats" }} />
            <Stack.Screen name="guest-preview" options={{ title: "Photo preview" }} />
            <Stack.Screen name="try-on" options={{ title: "Visual try-on" }} />
            <Stack.Screen
              name="styling-photo"
              options={{ title: "Optional styling photo" }}
            />
            <Stack.Screen
              name="stylist"
              options={{ title: "Personal stylist" }}
            />
            <Stack.Screen
              name="+not-found"
              options={{ headerTitle: () => <Brand /> }}
            />
          </Stack>
        </Backend>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
