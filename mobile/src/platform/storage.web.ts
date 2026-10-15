import type { TokenStorage } from "@convex-dev/auth/react";
// Browser preview deliberately keeps credentials in memory. Native uses SecureStore.
const stores = new Map<string, Map<string, string>>();
export function createStorage(namespace: string): TokenStorage {
  if (!stores.has(namespace)) stores.set(namespace, new Map());
  const values = stores.get(namespace)!;
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}
