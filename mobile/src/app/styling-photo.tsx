import { useEffect, useRef, useState } from "react";
import { Image, Switch } from "react-native";
import { router } from "expo-router";
import { useAction, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import { PrivateScreen, ConnectionNotice } from "../providers/Backend";
import {
  Button,
  Card,
  Copy,
  Field,
  Heading,
  Loading,
  Muted,
  Notice,
  Row,
  Screen,
  Title,
} from "../components/ui";
import {
  choosePhoto,
  discardPhoto,
  type PreparedPhoto,
} from "../platform/photos";
import { useTask } from "../hooks/useTask";

type Profile = FunctionReturnType<typeof api.styling.get>;
export default function StylingPhoto() {
  return (
    <PrivateScreen title="Optional styling photo">
      <PhotoScreen />
    </PrivateScreen>
  );
}
function PhotoScreen() {
  const profile = useQuery(api.styling.get, {});
  const upload = useAction(api.stylingPhoto.upload),
    retry = useAction(api.stylingPhoto.retry),
    remove = useMutation(api.styling.removePhoto);
  const task = useTask(),
    picker = useTask();
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null),
    [consent, setConsent] = useState(false),
    [removing, setRemoving] = useState(false);
  const current = useRef<PreparedPhoto | null>(null),
    active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      void discardPhoto(current.current);
      current.current = null;
    };
  }, []);
  async function pick(camera: boolean) {
    const next = await choosePhoto(camera);
    if (!next) return;
    if (!active.current) {
      await discardPhoto(next);
      return;
    }
    await discardPhoto(current.current);
    current.current = next;
    setPhoto(next);
    setConsent(false);
    setRemoving(false);
  }
  const busy = task.busy || picker.busy || profile?.photoState === "building";
  return (
    <Screen>
      <Title>A photo, only if you want.</Title>
      <Muted>
        Use a clothed, full-length photo. You can edit every suggestion or
        describe yourself in your own words. A photo cannot establish
        measurements or guarantee fit.
      </Muted>
      <ConnectionNotice />
      {!profile ? (
        <Loading label="Loading your styling photo…" />
      ) : (
        <>
          {!!(photo?.uri || profile.photoUrl) && (
            <Image
              source={{ uri: photo?.uri || profile.photoUrl! }}
              accessibilityLabel={
                photo
                  ? "Selected styling photo, not uploaded"
                  : "Your saved styling photo"
              }
              resizeMode="contain"
              style={{ width: "100%", height: 300 }}
            />
          )}
          <Row>
            <Button
              secondary
              label="Choose styling photo"
              disabled={busy}
              onPress={() => void picker.run(() => pick(false))}
            />
            <Button
              secondary
              label="Take styling photo"
              disabled={busy}
              onPress={() => void picker.run(() => pick(true))}
            />
          </Row>
          {(!!photo || profile.photoState === "failed") && (
            <Card>
              <Copy>
                Your photo is sent to Google Gemini for optional styling
                analysis and kept privately in your account until you remove or
                replace it.
              </Copy>
              {!!photo && !!profile.photoId && (
                <Notice>
                  Replacing this photo removes its previous analysis, confirmed
                  photo notes and any saved try-on previews.
                </Notice>
              )}
              <Row>
                <Switch
                  accessibilityLabel="I agree to share this styling photo"
                  value={consent}
                  onValueChange={setConsent}
                  disabled={busy}
                />
                <Copy>I agree to share this styling photo.</Copy>
              </Row>
              {photo ? (
                <>
                  <Button
                    label={
                      profile.photoId
                        ? "Replace photo & analyse"
                        : "Upload & analyse photo"
                    }
                    disabled={!consent || busy}
                    busy={task.busy}
                    onPress={() =>
                      void task.run(
                        async () => {
                          if (!consent)
                            throw new Error("Confirm photo sharing first.");
                          await upload({
                            jpegBase64: photo.jpegBase64,
                            consent: true,
                          });
                          await discardPhoto(current.current);
                          current.current = null;
                        },
                        () => {
                          setPhoto(null);
                          setConsent(false);
                        },
                      )
                    }
                  />
                  <Button
                    secondary
                    label="Discard selected photo"
                    disabled={busy}
                    onPress={() => {
                      void discardPhoto(current.current);
                      current.current = null;
                      setPhoto(null);
                      setConsent(false);
                    }}
                  />
                </>
              ) : (
                <>
                  <Notice error>
                    The photo could not be read. You can retry deliberately,
                    choose a clearer photo or use your own description.
                  </Notice>
                  <Button
                    label="Retry photo analysis"
                    disabled={!consent || busy}
                    onPress={() =>
                      void task.run(
                        () => retry({ consent: true }),
                        () => setConsent(false),
                      )
                    }
                  />
                </>
              )}
            </Card>
          )}
          {profile.photoState === "building" && (
            <Loading label="Reading your photo. Suggestions still need your review…" />
          )}
          {!photo &&
            profile.photoState === "ready" &&
            !!profile.photoId &&
            !!profile.analysis && (
              <PhotoReview key={profile.photoId} profile={profile} />
            )}
          {!!profile.photoId && (
            <Card>
              {removing ? (
                <>
                  <Copy>
                    Remove your saved photo, its analysis, confirmed photo notes
                    and any saved try-on previews? This cannot be undone.
                  </Copy>
                  <Button
                    danger
                    label="Confirm removal"
                    disabled={busy}
                    onPress={() =>
                      void task.run(
                        () => remove({}),
                        () => {
                          setRemoving(false);
                          setConsent(false);
                        },
                      )
                    }
                  />
                  <Button
                    secondary
                    label="Keep saved photo"
                    disabled={busy}
                    onPress={() => setRemoving(false)}
                  />
                </>
              ) : (
                <Button
                  secondary
                  danger
                  label="Remove saved styling photo"
                  disabled={busy}
                  onPress={() => setRemoving(true)}
                />
              )}
            </Card>
          )}
        </>
      )}
      {!!(task.error || picker.error) && (
        <Notice error>{task.error || picker.error}</Notice>
      )}
      <Button
        secondary
        label="Use my own body description"
        onPress={() => router.push("/preferences")}
      />
    </Screen>
  );
}
function PhotoReview({ profile }: { profile: Profile }) {
  const analysis = profile.analysis!;
  const confirmBody = useMutation(api.styling.confirmProportions),
    confirmStyle = useMutation(api.styling.confirmVisualStyle);
  const task = useTask();
  const [body, setBody] = useState(
      profile.confirmedDescription ?? analysis.proportions,
    ),
    [style, setStyle] = useState(
      profile.confirmedVisualStyle ?? analysis.visibleStyle ?? "",
    ),
    [saved, setSaved] = useState("");
  return (
    <Card>
      <Heading>Review the suggestions</Heading>
      <Muted>
        These are uncertain AI guesses. Clothes, pose and camera angle affect
        what can be seen. Nothing below is confirmed until you save it.
      </Muted>
      {analysis.limitations.map((text, index) => (
        <Muted key={index}>{text}</Muted>
      ))}
      {analysis.usable && analysis.canEstimate ? (
        <>
          <Field
            label="Body context to keep"
            value={body}
            onChangeText={(value) => {
              setBody(value);
              setSaved("");
            }}
            maxLength={300}
            multiline
          />
          <Button
            secondary
            label={
              body.trim() ? "Confirm body context" : "Clear photo body context"
            }
            busy={task.busy}
            onPress={() =>
              void task.run(
                () =>
                  confirmBody({ photoId: profile.photoId!, text: body.trim() }),
                () => setSaved("Body context saved."),
              )
            }
          />
        </>
      ) : (
        <Notice>
          This photo is not clear enough for body context. You can still write
          your own description in preferences.
        </Notice>
      )}
      <Field
        label="Visible outfit note to keep"
        value={style}
        onChangeText={(value) => {
          setStyle(value);
          setSaved("");
        }}
        maxLength={300}
        multiline
      />
      <Muted>
        This describes the visible outfit. It does not establish your taste or
        add clothes to your wardrobe.
      </Muted>
      <Button
        secondary
        label={
          style.trim()
            ? "Confirm visible outfit note"
            : "Clear visible outfit note"
        }
        busy={task.busy}
        onPress={() =>
          void task.run(
            () =>
              confirmStyle({ photoId: profile.photoId!, text: style.trim() }),
            () => setSaved("Visible outfit note saved."),
          )
        }
      />
      {!!saved && <Notice>{saved}</Notice>}
      {!!task.error && <Notice error>{task.error}</Notice>}
    </Card>
  );
}
