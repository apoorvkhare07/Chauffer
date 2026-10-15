import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { otpProvider, resetOtpWidget } from "../platform/otp.web";
import { Button, Loading, Notice } from "./ui";
import { errorText } from "../hooks/useTask";

export default function OtpChallenge({
  onReady,
  hidden,
}: {
  onReady: (ready: boolean) => void;
  hidden: boolean;
}) {
  const config = useAction(api.otp.widgetConfig);
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void config({})
      .then((value) => otpProvider.initialize(value.widgetId, value.tokenAuth))
      .then(() => {
        if (active) {
          setLoading(false);
          onReady(true);
        }
      })
      .catch((error) => {
        if (active) {
          setError(errorText(error));
          setLoading(false);
          onReady(false);
        }
      });
    return () => {
      active = false;
      resetOtpWidget();
    };
  }, [config, onReady, attempt]);
  return (
    <>
      <div id="chauffeur-captcha" aria-label="Security check" hidden={hidden} />
      {loading && <Loading label="Loading security check…" />}
      {!!error && (
        <>
          <Notice error>{error}</Notice>
          <Button
            secondary
            label="Retry security check"
            onPress={() => {
              setError("");
              setLoading(true);
              onReady(false);
              setAttempt((value) => value + 1);
            }}
          />
        </>
      )}
    </>
  );
}
