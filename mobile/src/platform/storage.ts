import * as SecureStore from "expo-secure-store";
import type { TokenStorage } from "@convex-dev/auth/react";
export function createStorage(namespace: string): TokenStorage {
  const keyFor = (key: string) =>
    `${namespace}.${Array.from(key, (c) => c.charCodeAt(0).toString(16).padStart(4, "0")).join("")}`;
  return {
    getItem: (key) => SecureStore.getItemAsync(keyFor(key)),
    setItem: (key, value) =>
      SecureStore.setItemAsync(keyFor(key), value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }),
    removeItem: (key) => SecureStore.deleteItemAsync(keyFor(key)),
  };
}
