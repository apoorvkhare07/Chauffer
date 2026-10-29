import { useEffect, useRef, useState } from "react";
import { Image, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAction, useQuery } from "convex/react";
import * as Crypto from "expo-crypto";
import { api } from "../../../convex/_generated/api";
import { clothingTags, wardrobeTitle } from "../../../shared/wardrobeTags";
import { choosePhoto, discardPhoto, type PreparedPhoto } from "../platform/photos";
import { deviceStorage, useBackend } from "../providers/Backend";
import {
  Button,
  Card,
  Copy,
  Loading,
  Muted,
  Notice,
  Screen,
  Title,
} from "../components/ui";
import { useTask } from "../hooks/useTask";

type Mode = "tryon" | "wardrobe";
export default function GuestPreview() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: Mode = params.mode === "tryon" ? "tryon" : "wardrobe";
  const { connected } = useBackend();
  const [token, setToken] = useState<string>();
  const [portrait, setPortrait] = useState<PreparedPhoto | null>(null);
  const [garment, setGarment] = useState<PreparedPhoto | null>(null);
  const photos = useRef<{ portrait: PreparedPhoto | null; garment: PreparedPhoto | null }>({ portrait: null, garment: null });
  const [consent, setConsent] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const task = useTask();
  const trial = useQuery(api.guestTrials.current, token ? { token } : "skip");
  const runTryOn = useAction(api.guestTrialsAI.tryOn);
  const runWardrobe = useAction(api.guestTrialsAI.wardrobe);

  useEffect(() => {
    let active = true;
    void (async () => {
      let value = await deviceStorage.getItem("guest-capability");
      if (!value) {
        value = Crypto.randomUUID() + Crypto.randomUUID();
        await deviceStorage.setItem("guest-capability", value);
      }
      if (active) setToken(value);
    })().catch(() => setError("Secure storage could not open. Restart the app to try again."));
    return () => { active = false; };
  }, []);
  useEffect(() => () => {
    void discardPhoto(photos.current.portrait);
    void discardPhoto(photos.current.garment);
  }, []);

  if (!connected)
    return (
      <Screen>
        <Title>Photo previews</Title>
        <Notice error>Connect the app to its development server before using photo previews.</Notice>
      </Screen>
    );

  const used = mode === "tryon" ? Boolean(trial?.tryOnUsed || trial?.tryOnState === "ready") : Boolean(trial?.wardrobeUsed);
  const building = mode === "tryon" ? trial?.tryOnState === "building" : trial?.wardrobeState === "building";
  const resultUrl = mode === "tryon" ? trial?.tryOnUrl : undefined;
  const analysis = mode === "wardrobe" ? trial?.wardrobeAnalysis : undefined;
  const choose = async (which: "portrait" | "garment" | "wardrobe", camera: boolean) => {
    setError("");
    try {
      const photo = await choosePhoto(camera);
      if (!photo) return;
      if (which === "portrait") {
        await discardPhoto(photos.current.portrait);
        photos.current.portrait = photo;
        setPortrait(photo);
      } else if (which === "garment") {
        await discardPhoto(photos.current.garment);
        photos.current.garment = photo;
        setGarment(photo);
      } else {
        await discardPhoto(photos.current.garment);
        photos.current.garment = photo;
        setGarment(photo);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open that photo.");
    }
  };
  const submit = () =>
    void task.run(async () => {
      if (!token) throw new Error("Guest session is still loading.");
      if (mode === "tryon") {
        if (!portrait || !garment || !consent) throw new Error("Choose both photos and agree before creating a preview.");
        await runTryOn({ token, portraitJpeg: portrait.jpegBase64, garmentJpeg: garment.jpegBase64, consent: true });
      } else {
        if (!garment) throw new Error("Choose a clothing photo first.");
        setConfirmed(false);
        await runWardrobe({ token, jpegBase64: garment.jpegBase64 });
      }
    });

  return (
    <Screen>
      <Title>{mode === "tryon" ? "See a piece on you" : "Add a piece you own"}</Title>
      <Muted>
        {mode === "tryon"
          ? "Create one visual preview with a photo of you and a clothing item. It does not check size or fit."
          : "We’ll read visible details from one clothing photo for you to review. Guesses stay temporary drafts."}
      </Muted>
      {!token || trial === undefined ? <Loading label="Opening your private preview…" /> : null}
      {mode === "tryon" ? (
        <>
          <Card>
            <Button secondary label={portrait ? "Change your photo" : "Choose your photo"} onPress={() => void choose("portrait", false)} />
            <Button secondary label="Use camera for your photo" onPress={() => void choose("portrait", true)} />
            {!!portrait && <Image source={{ uri: portrait.uri }} accessibilityLabel="Your selected photo" style={{ height: 220, width: "100%" }} resizeMode="contain" />}
          </Card>
          <Card>
            <Button secondary label={garment ? "Change clothing photo" : "Choose clothing photo"} onPress={() => void choose("garment", false)} />
            <Button secondary label="Use camera for clothing photo" onPress={() => void choose("garment", true)} />
            {!!garment && <Image source={{ uri: garment.uri }} accessibilityLabel="Selected clothing item" style={{ height: 220, width: "100%" }} resizeMode="contain" />}
          </Card>
          <Button
            secondary={!consent}
            label={consent ? "Photo use agreed" : "Agree to use both photos"}
            onPress={() => setConsent(!consent)}
          />
          <Muted>Photos are sent only after you create the preview and are held temporarily, then deleted within 30 minutes.</Muted>
          {resultUrl && <Card><Image source={{ uri: resultUrl }} accessibilityLabel="Visual clothing preview" style={{ height: 360, width: "100%" }} resizeMode="contain" /><Muted>Visual preview only; it does not verify size or fit.</Muted></Card>}
          {!!trial?.tryOnNote && <Notice error={trial.tryOnState === "failed"}>{trial.tryOnNote}</Notice>}
        </>
      ) : (
        <Card>
          <Button secondary label={garment ? "Change clothing photo" : "Choose clothing photo"} onPress={() => void choose("wardrobe", false)} />
          <Button secondary label="Use camera" onPress={() => void choose("wardrobe", true)} />
          {!!garment && <Image source={{ uri: garment.uri }} accessibilityLabel="Selected clothing item" style={{ height: 240, width: "100%" }} resizeMode="contain" />}
          <Muted>The photo and its tags are temporary and deleted within 30 minutes. You can also add clothes manually after signing in.</Muted>
          {analysis && <View style={{ gap: 8 }}><Title>{wardrobeTitle(analysis.details)}</Title><Copy>{clothingTags(analysis.details).join(" · ")}</Copy>{analysis.uncertainties?.length ? <Muted>Check the label for details a photo cannot confirm, such as size, brand or material.</Muted> : null}<Button secondary={!confirmed} label={confirmed ? "Tags confirmed" : "Confirm these clothing tags"} onPress={() => setConfirmed(true)} /></View>}
          {!!trial?.wardrobeUsed && !analysis && <Muted>Your one-time clothing preview is complete. Sign in to continue with your wardrobe.</Muted>}
          {trial?.wardrobeState === "failed" && <Notice error>The clothing photo could not be read. Try a clearer photo.</Notice>}
        </Card>
      )}
      {!used && !building && (
        <Button
          label={task.busy ? "Preparing…" : mode === "tryon" ? "Create my preview" : "Read this piece"}
          busy={task.busy}
          disabled={mode === "tryon" ? !portrait || !garment || !consent : !garment}
          onPress={submit}
        />
      )}
      {!!(error || task.error) && <Notice error>{error || task.error}</Notice>}
      {((mode === "tryon" && used) || (mode === "wardrobe" && ((used && !analysis) || (analysis && confirmed)))) && <Card><Title>Keep going with your style</Title><Muted>Sign in to save wardrobe pieces and get styling ideas with your account.</Muted><Button label="Continue with phone" onPress={() => router.push("/sign-in")} /></Card>}
    </Screen>
  );
}
