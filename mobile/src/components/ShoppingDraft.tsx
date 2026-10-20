import { useEffect, useRef, useState } from "react";
import { Image, View } from "react-native";
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { useAction } from "convex/react";
import * as DocumentPicker from "expo-document-picker";
import { api } from "../../../convex/_generated/api";
import * as FileSystem from "expo-file-system/legacy";
import { choosePhoto, discardPhoto, type PreparedPhoto } from "../platform/photos";
import { Button, Card, Copy, Muted, Notice } from "./ui";
import { useTask } from "../hooks/useTask";

type Kind = "photo" | "voice";
export function ShoppingDraft({ onDraft, disabled }: { onDraft: (text: string) => void; disabled?: boolean }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const read = useAction(api.shoppingInput.read);
  const task = useTask();
  const [kind, setKind] = useState<Kind>("photo");
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const photoRef = useRef<PreparedPhoto | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioMime, setAudioMime] = useState<string>("audio/mp4");
  const [audioName, setAudioName] = useState("");
  const audioRef = useRef<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<{ text: string; uncertainties: string[] } | null>(null);
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    void discardPhoto(photoRef.current);
    if (audioRef.current) void FileSystem.deleteAsync(audioRef.current, { idempotent: true });
  }, []);

  const reset = async (next: Kind) => {
    if (photoRef.current) await discardPhoto(photoRef.current);
    photoRef.current = null;
    setPhoto(null);
    if (audioRef.current) {
      try { await FileSystem.deleteAsync(audioRef.current, { idempotent: true }); } catch { /* Cache cleanup cannot undo a completed request draft. */ }
    }
    audioRef.current = null;
    setAudioUri(null);
    setAudioMime("audio/mp4");
    setAudioName("");
    setKind(next);
    setConsent(false);
    setResult(null);
    setNotice("");
  };
  const startRecording = async () => {
    setNotice("");
    try {
      if (audioRef.current) await FileSystem.deleteAsync(audioRef.current, { idempotent: true });
      audioRef.current = null;
      setAudioUri(null);
      setAudioName("");
      setResult(null);
      setConsent(false);
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) throw new Error("Microphone access is off. Choose a clothing photo or type your request instead.");
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      timer.current = setTimeout(() => { void stopRecording(); }, 25_000);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not start recording.");
    }
  };
  const stopRecording = async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (!recorder.uri) throw new Error("The recording could not be opened. Try again or type your request.");
      audioRef.current = recorder.uri;
      setAudioUri(recorder.uri);
      setAudioMime(recorder.uri.toLowerCase().endsWith(".webm") ? "audio/webm" : "audio/mp4");
      setAudioName("Recorded voice note");
      setNotice("Recording ready. It will only be sent after you agree and create a draft.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not finish recording.");
    }
  };
  const chooseAudio = async () => {
    setNotice("");
    let candidateUri: string | undefined;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/ogg", "audio/webm", "audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp4", "audio/x-m4a", "video/mp4"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      candidateUri = asset.uri;
      if (asset.size !== undefined && asset.size > 700_000) throw new Error("Choose audio smaller than 700 KB (about 25 seconds).");
      const rawMime = asset.mimeType?.toLowerCase() ?? "";
      const extension = asset.name.split(".").pop()?.toLowerCase();
      const mime = rawMime === "audio/x-m4a" || rawMime === "video/mp4" || extension === "m4a"
        ? "audio/mp4"
        : rawMime === "audio/x-wav" || extension === "wav"
          ? "audio/wav"
          : rawMime || ({ ogg: "audio/ogg", webm: "audio/webm", mp3: "audio/mpeg" } as Record<string, string>)[extension ?? ""];
      if (!mime || !["audio/ogg", "audio/webm", "audio/wav", "audio/mpeg", "audio/mp4"].includes(mime))
        throw new Error("Choose an OGG, WebM, WAV, MP3 or M4A audio file.");
      if (audioRef.current) await FileSystem.deleteAsync(audioRef.current, { idempotent: true });
      audioRef.current = asset.uri;
      setAudioUri(asset.uri);
      setAudioMime(mime);
      setAudioName(asset.name);
      setResult(null);
      setConsent(false);
      setNotice("Audio ready. It will only be sent after you agree and create a draft.");
      candidateUri = undefined;
    } catch (error) {
      if (candidateUri) {
        try { await FileSystem.deleteAsync(candidateUri, { idempotent: true }); } catch { /* OS cache cleanup is best effort. */ }
      }
      setNotice(error instanceof Error ? error.message : "Could not open that audio file.");
    }
  };
  const choose = async () => {
    setNotice("");
    try {
      const next = await choosePhoto(false);
      if (!next) return;
      if (photoRef.current) await discardPhoto(photoRef.current);
      photoRef.current = next;
      setPhoto(next);
      setResult(null);
      setConsent(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not read this photo.");
    }
  };
  const analyse = () => void task.run(async () => {
    if (!consent) throw new Error("Agree before sending this input for processing.");
    let base64: string;
    let mime: string;
    if (kind === "photo") {
      if (!photo) throw new Error("Choose one clothing photo first.");
      base64 = photo.jpegBase64;
      mime = "image/jpeg";
    } else {
      if (!audioUri) throw new Error("Record a short voice note first.");
      base64 = await FileSystem.readAsStringAsync(audioUri, { encoding: FileSystem.EncodingType.Base64 });
      if (base64.length > 930_000) throw new Error("That audio clip is larger than 700 KB. Record a shorter note.");
      mime = audioMime;
    }
    const value = await read({ kind, base64, mime, consent: true });
    setResult(value);
    if (photoRef.current) await discardPhoto(photoRef.current);
    photoRef.current = null;
    setPhoto(null);
    if (audioRef.current) {
      try { await FileSystem.deleteAsync(audioRef.current, { idempotent: true }); } catch { /* OS cache cleanup is best effort. */ }
    }
    audioRef.current = null;
    setAudioUri(null);
    setAudioName("");
    setNotice("");
  });

  return <Card>
    <Copy>Make an editable shopping request from a clothing photo or a short voice note. Your input is processed, then discarded.</Copy>
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Button secondary={kind !== "photo"} label="Photo" disabled={task.busy || recorderState.isRecording || disabled} onPress={() => void reset("photo")} />
      <Button secondary={kind !== "voice"} label="Voice" disabled={task.busy || recorderState.isRecording || disabled} onPress={() => void reset("voice")} />
    </View>
    {kind === "photo" ? <>
      <Button secondary label={photo ? "Choose another clothing photo" : "Choose a clothing photo"} disabled={task.busy || disabled} onPress={() => void choose()} />
      {!!photo && <Image source={{ uri: photo.uri }} accessibilityLabel="Selected clothing photo" style={{ height: 200, width: "100%" }} resizeMode="contain" />}
      <Muted>JPEG, PNG, WebP or HEIC · up to 12 MB. Only a JPEG copy is sent.</Muted>
    </> : <>
      <Button label={recorderState.isRecording ? "Stop recording" : audioUri ? "Record again" : "Record up to 25 seconds"} disabled={task.busy || disabled} onPress={() => void (recorderState.isRecording ? stopRecording() : startRecording())} />
      <Button secondary label="Choose an audio file" disabled={task.busy || disabled || recorderState.isRecording} onPress={() => void chooseAudio()} />
      {recorderState.isRecording && <Notice>Recording… Select Stop when you’ve finished.</Notice>}
      {!!audioUri && <Muted>{audioName} · short audio ready to review.</Muted>}
      <Muted>Chauffer transcribes the request in its original language. Recording stops after 25 seconds; uploads are limited to 700 KB.</Muted>
    </>}
    <Button secondary label={consent ? "Processing consent given" : `Agree to process this ${kind === "photo" ? "photo" : "voice note"}`} disabled={task.busy || recorderState.isRecording} onPress={() => setConsent(!consent)} />
    <Button label="Create request draft" busy={task.busy} disabled={disabled || task.busy || !consent || (kind === "photo" ? !photo : !audioUri)} onPress={analyse} />
    {!!notice && <Notice error>{notice}</Notice>}
    {!!task.error && <Notice error>{task.error}</Notice>}
    {result && <>
      <Notice>{result.text || "No clear shopping request was found. Please try another input or type your request."}</Notice>
      {result.uncertainties.map((item, index) => <Muted key={index}>{item}</Muted>)}
      <Button label="Use this request" disabled={!result.text || disabled} onPress={() => onDraft(result.text)} />
      <Button secondary label="Discard this draft" onPress={() => setResult(null)} />
    </>}
  </Card>;
}
