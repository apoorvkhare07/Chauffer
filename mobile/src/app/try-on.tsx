import { useState } from "react";
import { Image } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { PrivateScreen, ConnectionNotice } from "../providers/Backend";
import { Button, Card, Copy, Empty, Heading, Loading, Muted, Notice, Screen, Title } from "../components/ui";
import { useTask } from "../hooks/useTask";

type Source =
  | { kind: "wardrobe"; id: Id<"wardrobeItems">; title: string; image: string }
  | { kind: "saved"; id: Id<"savedProducts">; title: string; image: string };

export default function TryOn() {
  return <PrivateScreen title="Visual try-on"><TryOnForm /></PrivateScreen>;
}
function TryOnForm() {
  const profile = useQuery(api.styling.get, {});
  const wardrobe = useQuery(api.wardrobe.list, {});
  const saved = useQuery(api.savedProducts.list, {});
  const previews = useQuery(api.tryOn.list, {});
  const request = useMutation(api.tryOn.request);
  const remove = useMutation(api.tryOn.remove);
  const task = useTask();
  const [selected, setSelected] = useState<string>("");
  const [consent, setConsent] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<Id<"tryOnPreviews"> | null>(null);
  const [notice, setNotice] = useState("");
  const options: Source[] = [
    ...(wardrobe ?? []).filter((item) => item.photoUrl && !["shoes", "accessory"].includes(item.details.category)).map((item) => ({ kind: "wardrobe" as const, id: item.id, title: `My wardrobe · ${item.details.name}`, image: item.cleanPhotoUrl || item.photoUrl! })),
    ...(saved ?? []).filter((item) => item.option.imageUrl).map((item) => ({ kind: "saved" as const, id: item._id, title: `${item.option.store ?? "Saved"} · ${item.option.title}`, image: item.option.imageUrl! })),
  ];
  const choice = options.find((item) => `${item.kind}:${item.id}` === selected);
  const ready = profile?.photoState === "ready" && profile.analysis?.usable;
  const building = previews?.some((preview) => preview.state === "building");

  return (
    <Screen>
      <Title>A visual preview, for reference.</Title>
      <Copy>See a saved clothing photo with your styling photo. This is not a fit check; details may change in real life.</Copy>
      <ConnectionNotice />
      <Card>
        <Heading>Your styling photo</Heading>
        {profile?.photoUrl ? <Image source={{ uri: profile.photoUrl }} accessibilityLabel="Your saved styling photo" style={{ width: "100%", height: 230 }} resizeMode="contain" /> : <Muted>Add an optional styling photo before you create a preview.</Muted>}
        <Button secondary label={profile?.photoUrl ? "Review or change photo" : "Add a styling photo"} onPress={() => router.push("/styling-photo")} />
      </Card>
      <Card>
        <Heading>Choose clothing</Heading>
        {!options.length ? <Empty title="No clothing photos yet" text="Add a wardrobe photo or save a product with a readable image first." /> : options.map((option) => {
          const key = `${option.kind}:${option.id}`;
          const chosen = selected === key;
          return <Button key={key} secondary={!chosen} label={chosen ? `Selected · ${option.title}` : option.title} onPress={() => { setSelected(key); setConsent(false); setNotice(""); }} />;
        })}
        {choice && <Image source={{ uri: choice.image }} accessibilityLabel={choice.title} style={{ width: "100%", height: 220 }} resizeMode="contain" />}
        <Button secondary label={consent ? "Photo use agreed" : "Agree to use my photo and this item"} onPress={() => setConsent(!consent)} />
        <Muted>Your saved photo and the selected clothing image are sent only when you start the preview.</Muted>
        <Button label={building ? "Making your preview…" : "Create preview"} busy={task.busy} disabled={!ready || !choice || !consent || building} onPress={() => void task.run(async () => {
          if (!choice) return;
          await request({ source: choice.kind === "wardrobe"
            ? { kind: "wardrobe", id: choice.id }
            : { kind: "saved", id: choice.id }, consent });
          setNotice("Your preview is being made. You can keep browsing.");
        })} />
      </Card>
      {!!notice && <Notice>{notice}</Notice>}
      {previews?.map((preview) => <Card key={preview.id}>
        <Heading>{preview.title}</Heading>
        {preview.url && <Image source={{ uri: preview.url }} accessibilityLabel={`Generated visual preview of ${preview.title}`} style={{ width: "100%", height: 340 }} resizeMode="contain" />}
        {preview.state === "building" ? <Loading label="Making your preview…" /> : <Muted>{preview.note}</Muted>}
        {confirmRemove === preview.id ? <>
          <Copy>Delete this preview permanently?</Copy>
          <Button danger label="Delete preview" busy={task.busy} onPress={() => void task.run(() => remove({ id: preview.id }), () => setConfirmRemove(null))} />
          <Button secondary label="Keep preview" onPress={() => setConfirmRemove(null)} />
        </> : <Button secondary label="Remove preview" onPress={() => setConfirmRemove(preview.id)} />}
      </Card>)}
      {!!task.error && <Notice error>{task.error}</Notice>}
    </Screen>
  );
}
