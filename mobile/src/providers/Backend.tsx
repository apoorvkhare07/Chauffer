import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import {
  ConvexReactClient,
  useConvexAuth,
  useConvexConnectionState,
  useQuery,
} from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { router } from "expo-router";
import { api } from "../../../convex/_generated/api";
import { readConfig, type RuntimeConfig } from "../core/config";
import { createStorage } from "../platform/storage";
import { Button, Empty, Loading, Notice, Screen } from "../components/ui";
import { cleanupPhotos } from "../platform/photos";

let config: RuntimeConfig | null = null,
  configurationError = "";
try {
  config = readConfig({
    environment: process.env.EXPO_PUBLIC_APP_ENV,
    url: process.env.EXPO_PUBLIC_CONVEX_URL,
    allowLocal: process.env.EXPO_PUBLIC_ALLOW_LOCAL_BACKEND,
  });
} catch (e) {
  configurationError =
    e instanceof Error ? e.message : "Mobile configuration is missing.";
}
const storage = createStorage(config?.namespace ?? "chauffer.unconfigured");
const client = config
  ? new ConvexReactClient(config.url, {
      unsavedChangesWarning: false,
      logger: false,
    })
  : null;
const BackendContext = createContext({
  config,
  configurationError,
  connected: !!client,
});
export const useBackend = () => useContext(BackendContext);
export const deviceStorage = storage;
export function Backend({ children }: PropsWithChildren) {
  useEffect(() => {
    void cleanupPhotos();
  }, []);
  return (
    <BackendContext.Provider
      value={{ config, configurationError, connected: !!client }}
    >
      {client ? (
        <ConvexAuthProvider
          client={client}
          storage={storage}
          storageNamespace={config!.namespace}
          shouldHandleCode={false}
        >
          {children}
        </ConvexAuthProvider>
      ) : (
        children
      )}
    </BackendContext.Provider>
  );
}
export function ConfigNotice() {
  return (
    <Notice>
      Development setup:{" "}
      {configurationError ||
        "Connect the agreed development backend to use your account."}{" "}
      No search or upload has been sent.
    </Notice>
  );
}
export function ConnectionNotice() {
  const connection = useConvexConnectionState();
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setElapsed(true), 6000);
    return () => clearTimeout(timer);
  }, []);
  return !connection.isWebSocketConnected && elapsed ? (
    <Notice>
      Connection interrupted. Waiting to sync your saved state. Your request
      will not be sent again automatically.
    </Notice>
  ) : null;
}
export function PrivateScreen({
  children,
  title,
}: PropsWithChildren<{ title: string }>) {
  const { connected } = useBackend();
  if (!connected)
    return (
      <Screen>
        <Empty
          title={title}
          text="Sign in to keep your clothes, saved finds and preferences together."
        />
        <ConfigNotice />
      </Screen>
    );
  return <Authenticated title={title}>{children}</Authenticated>;
}
function Authenticated({
  children,
  title,
}: PropsWithChildren<{ title: string }>) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (isLoading)
    return (
      <Screen>
        <Loading label="Restoring your session…" />
        <ConnectionNotice />
      </Screen>
    );
  if (!isAuthenticated)
    return (
      <Screen>
        <Empty
          title={title}
          text="Your wardrobe and saved finds stay private to your account."
        >
          <Button
            label="Continue with phone"
            onPress={() => router.push("/sign-in")}
          />
        </Empty>
      </Screen>
    );
  return <SetupGate>{children}</SetupGate>;
}
function SetupGate({ children }: PropsWithChildren) {
  const setup = useQuery(api.styling.get, {});
  if (!setup)
    return (
      <Screen>
        <Loading label="Getting your preferences…" />
        <ConnectionNotice />
      </Screen>
    );
  if (!setup.requiredComplete)
    return (
      <Screen>
        <Empty
          title="A little about your style"
          text="Set your basic preferences first. Photos and wardrobe setup are optional."
        >
          <Button
            label="Set up my style"
            onPress={() => router.push("/preferences")}
          />
        </Empty>
      </Screen>
    );
  return children;
}
