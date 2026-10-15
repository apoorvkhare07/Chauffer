import { useState } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  useBackend,
  ConfigNotice,
  deviceStorage,
} from "../../providers/Backend";
import { cleanupPhotos } from "../../platform/photos";
import {
  Button,
  Card,
  Copy,
  Heading,
  Loading,
  Muted,
  Notice,
  Screen,
  Title,
} from "../../components/ui";
import { useTask } from "../../hooks/useTask";
export default function Settings() {
  const { connected, config } = useBackend();
  return (
    <Screen>
      <Title>Make it yours.</Title>
      {connected ? <AccountSettings /> : <ConfigNotice />}
      <Card>
        <Heading>About this build</Heading>
        <Copy>
          Chauffer 0.1.0 · {config?.environment || "Unconfigured development"}
        </Copy>
        <Muted>
          {Platform.OS === "web"
            ? "Browser testing uses the website’s phone verification and photo tools. iPhone sign-in, camera and session checks still need an installed build."
            : "Mobile foundation. Device integration checks are still in progress."}
        </Muted>
        {config && (
          <Muted>
            Backend: {config.url}
            {config.local
              ? "\nLocal server: a physical phone needs a reachable network address."
              : ""}
          </Muted>
        )}
      </Card>
      <Card>
        <Button
          secondary
          label="Ask my personal stylist"
          onPress={() => router.push("/stylist")}
        />
        <Heading>Your information</Heading>
        <Copy>
          Chauffer uses Gemini to interpret requests and give styling advice.
          Photos need your separate agreement before upload. Wardrobe guesses
          stay drafts until you confirm them.
        </Copy>
        <Muted>
          Purchases finish on the store. Prices, stock and fit need checking
          there. No native analytics events are collected in this build.
        </Muted>
        <Muted>
          Complete account deletion and AI-content reporting still need shared
          backend support before a store launch. Removing one wardrobe piece
          only removes that piece and its photos.
        </Muted>
      </Card>
    </Screen>
  );
}
function AccountSettings() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (isLoading) return <Loading label="Restoring your account…" />;
  return isAuthenticated ? (
    <AccountActions />
  ) : (
    <Button
      label="Continue with phone"
      onPress={() => router.push("/sign-in")}
    />
  );
}
function AccountActions() {
  const { signOut } = useAuthActions(),
    forget = useMutation(api.profiles.forgetTaste),
    task = useTask();
  const [confirmForget, setConfirmForget] = useState(false),
    [forgot, setForgot] = useState(false);
  return (
    <>
      <Card>
        <Button
          secondary
          label="Edit preferences & styling"
          onPress={() => router.push("/preferences")}
        />
        <Button
          secondary
          label="Past shopping chats"
          onPress={() => router.push("/history")}
        />
        {confirmForget ? (
          <>
            <Copy>
              Clear remembered shopping likes and dislikes? Your saved products,
              clothes and past chats remain.
            </Copy>
            <Button
              danger
              label="Clear remembered taste"
              busy={task.busy}
              onPress={() =>
                void task.run(
                  () => forget({}),
                  () => {
                    setConfirmForget(false);
                    setForgot(true);
                  },
                )
              }
            />
            <Button
              secondary
              label="Keep remembered taste"
              onPress={() => setConfirmForget(false)}
            />
          </>
        ) : (
          <Button
            secondary
            label="Forget remembered shopping taste"
            onPress={() => setConfirmForget(true)}
          />
        )}
        <Button
          secondary
          label="Sign out of this device"
          busy={task.busy}
          onPress={() =>
            void task.run(
              async () => {
                await deviceStorage.removeItem("pending-request");
                await cleanupPhotos();
                await signOut();
              },
              () => router.replace("/"),
            )
          }
        />
      </Card>
      {forgot && <Notice>Remembered taste cleared.</Notice>}
      {!!task.error && <Notice error>{task.error}</Notice>}
    </>
  );
}
