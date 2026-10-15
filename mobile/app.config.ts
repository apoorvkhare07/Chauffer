import type { ExpoConfig } from "expo/config";
// Expo evaluates this config in Node; register TypeScript for the shared validator.
import "tsx/cjs";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  readConfig,
}: typeof import("./src/core/config") = require("./src/core/config.ts");

const environment = process.env.EXPO_PUBLIC_APP_ENV || "development";
if (!["development", "preview", "production"].includes(environment)) {
  throw new Error(
    "EXPO_PUBLIC_APP_ENV must be development, preview or production.",
  );
}
const production = environment === "production";
if (process.env.EXPO_PUBLIC_CONVEX_URL)
  readConfig({
    environment,
    url: process.env.EXPO_PUBLIC_CONVEX_URL,
    allowLocal: process.env.EXPO_PUBLIC_ALLOW_LOCAL_BACKEND,
  });
if (
  (production || process.env.EAS_BUILD === "true") &&
  !process.env.EXPO_PUBLIC_CONVEX_URL
) {
  throw new Error(
    "Set the explicit EXPO_PUBLIC_CONVEX_URL for this build environment.",
  );
}
// Production identifiers are intentionally required, pending seller/name decisions.
if (
  production &&
  (!process.env.MOBILE_IOS_IDENTIFIER || !process.env.MOBILE_ANDROID_IDENTIFIER)
) {
  throw new Error(
    "Set approved MOBILE_IOS_IDENTIFIER and MOBILE_ANDROID_IDENTIFIER before a production build.",
  );
}
const suffix = environment === "preview" ? "preview" : "dev";
const config: ExpoConfig = {
  name: production
    ? "Chauffer"
    : `Chauffer ${environment === "preview" ? "Preview" : "Dev"}`,
  slug: "chauffer-mobile",
  version: "0.1.0",
  icon: "./assets/icon.png",
  scheme: production ? "chauffer" : `chauffer-${suffix}`,
  orientation: "portrait",
  userInterfaceStyle: "light",
  ios: {
    bundleIdentifier: production
      ? process.env.MOBILE_IOS_IDENTIFIER
      : `in.chauffer.app.${suffix}`,
    supportsTablet: false,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: production
      ? process.env.MOBILE_ANDROID_IDENTIFIER
      : `in.chauffer.app.${suffix}`,
    blockedPermissions: [
      "android.permission.RECORD_AUDIO",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.READ_CONTACTS",
    ],
  },
  web: { bundler: "metro", output: "single" },
  plugins: [
    ["expo-build-properties", { ios: { enableSceneSupport: true } }],
    "expo-router",
    "expo-dev-client",
    "expo-font",
    ["expo-secure-store", { faceIDPermission: false }],
    "expo-web-browser",
    [
      "expo-image-picker",
      {
        photosPermission:
          "Choose a clothing photo to add to your private wardrobe.",
        cameraPermission: "Take a clothing photo for your private wardrobe.",
        microphonePermission: false,
      },
    ],
  ],
  extra: { environment },
};
export default config;
