import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import { useAction, useMutation, useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useBackend, ConfigNotice } from "../providers/Backend";
import {
  Button,
  Card,
  Copy,
  Field,
  Muted,
  Notice,
  Screen,
  Title,
} from "../components/ui";
import { useTask } from "../hooks/useTask";
import { otpProvider } from "../platform/otp";
import { finishPhoneSignIn, normalizePhone, providerValue } from "../core/otp";

export default function SignIn() {
  const { connected } = useBackend();
  return connected ? (
    <PhoneForm />
  ) : (
    <Screen>
      <Title>Your account</Title>
      <ConfigNotice />
    </Screen>
  );
}
function PhoneForm() {
  const begin = useAction(api.otp.beginWidget),
    sent = useMutation(api.otp.widgetSent),
    verify = useAction(api.otp.verifyWidget),
    { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const [phone, setPhone] = useState(""),
    [code, setCode] = useState(""),
    [attempt, setAttempt] = useState<{
      id: Id<"otpChallenges">;
      requestId: string;
    } | null>(null);
  const [retryAt, setRetryAt] = useState(0),
    [now, setNow] = useState(Date.now),
    [proof, setProof] = useState<string>();
  const task = useTask(),
    remaining = Math.max(0, Math.ceil((retryAt - now) / 1000));
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated]);
  const finish = (id: Id<"otpChallenges">, token: string) =>
    finishPhoneSignIn(
      id,
      token,
      (challenge, accessToken) =>
        verify({ id: challenge as Id<"otpChallenges">, token: accessToken }),
      (value) => signIn("msg91", value),
      () => active.current,
    );
  async function sendCode() {
    const number = normalizePhone(phone);
    if (Platform.OS === "web")
      throw new Error(
        "Phone verification needs an installed development build. This browser preview only checks screens.",
      );
    const challenge = await begin({ phone: number });
    if (!active.current) return;
    setRetryAt(Date.now() + 60_000);
    setAttempt(null);
    setProof(undefined);
    setCode("");
    await otpProvider.initialize(challenge.widgetId, challenge.tokenAuth);
    if (!active.current) return;
    const result = await otpProvider.send(`91${number}`);
    const requestId = providerValue(result, "request");
    await sent({ id: challenge.id, requestId });
    if (!active.current) return;
    setAttempt({ id: challenge.id, requestId });
    if (
      result.invisibleVerified === true &&
      typeof result["access-token"] === "string"
    ) {
      const token = providerValue(result, "token");
      setProof(token);
      await finish(challenge.id, token);
    }
  }
  return (
    <Screen>
      <Title>
        {attempt ? "Check your messages." : "Your style, with you."}
      </Title>
      <Copy>Sign in or create your account with a one-time SMS code.</Copy>
      <Muted>
        Your request stays here while you sign in. We verify your phone on the
        server before opening your account.
      </Muted>
      <Card>
        {!attempt ? (
          <Field
            label="Mobile number (+91)"
            keyboardType="phone-pad"
            autoComplete="tel-national"
            value={phone}
            maxLength={10}
            editable={!task.busy}
            onChangeText={(value) => setPhone(value.replace(/\D/g, ""))}
            placeholder="10-digit mobile number"
          />
        ) : (
          <>
            <Muted>Code sent to +91 {phone}</Muted>
            <Field
              label="SMS code"
              keyboardType="number-pad"
              autoComplete="sms-otp"
              textContentType="oneTimeCode"
              maxLength={8}
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, ""))}
              editable={!task.busy}
            />
          </>
        )}
        <Button
          label={
            attempt
              ? "Verify and continue"
              : remaining
                ? `Send code in ${remaining}s`
                : "Send code"
          }
          busy={task.busy}
          disabled={
            attempt
              ? code.length < 4 && !proof
              : phone.length !== 10 || remaining > 0
          }
          onPress={() =>
            void task.run(async () => {
              if (!attempt) return sendCode();
              const token =
                proof ??
                providerValue(
                  await otpProvider.verify(attempt.requestId, code),
                  "token",
                );
              setProof(token);
              await finish(attempt.id, token);
            })
          }
        />
        {attempt && (
          <>
            <Button
              secondary
              label={
                remaining ? `New code in ${remaining}s` : "Send a new code"
              }
              disabled={task.busy || remaining > 0}
              onPress={() => void task.run(sendCode)}
            />
            <Button
              secondary
              label="Change number"
              disabled={task.busy}
              onPress={() => {
                setAttempt(null);
                setProof(undefined);
                setCode("");
                task.clearError();
              }}
            />
          </>
        )}
      </Card>
      {task.error && <Notice error>{task.error}</Notice>}
    </Screen>
  );
}
