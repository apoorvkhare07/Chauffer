import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Brand, colors } from "../../components/ui";
import type { ComponentProps } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const icons: Record<string, ComponentProps<typeof Ionicons>["name"]> = {
  index: "search-outline",
  wardrobe: "shirt-outline",
  saved: "heart-outline",
  settings: "options-outline",
};
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerTitle: () => <Brand />,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.canvas },
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingBottom: Math.max(8, insets.bottom),
          borderTopColor: colors.line,
          backgroundColor: colors.white,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 12,
          lineHeight: 18,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            aria-hidden
            accessible={false}
            importantForAccessibility="no"
            name={icons[route.name]}
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Discover" }} />
      <Tabs.Screen name="wardrobe" options={{ title: "Wardrobe" }} />
      <Tabs.Screen name="saved" options={{ title: "Saved" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
