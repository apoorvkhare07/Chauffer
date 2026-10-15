import { useEffect, useRef, useState } from "react";
import { Image, Switch } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  clothingCategories,
  categoryAttributes,
  attributeLabels,
  wardrobeTitle,
} from "../../../shared/wardrobeTags";
import { PrivateScreen } from "../providers/Backend";
import type { Garment, PhotoDraft, WardrobeItem } from "../core/contracts";
import {
  Button,
  Card,
  Chip,
  Copy,
  Empty,
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

export default function WardrobeEdit() {
  return (
    <PrivateScreen title="Add to your wardrobe">
      <LoadEditor />
    </PrivateScreen>
  );
}
function LoadEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>(),
    items = useQuery(api.wardrobe.list, id ? {} : "skip");
  if (id && !items)
    return (
      <Screen>
        <Loading label="Loading this piece…" />
      </Screen>
    );
  const item = items?.find((row) => row.id === id);
  if (id && !item)
    return (
      <Screen>
        <Empty
          title="This piece is no longer here"
          text="Return to your wardrobe to choose an available piece."
        />
      </Screen>
    );
  return <GarmentEditor key={id || "new"} item={item} />;
}
function GarmentEditor({ item }: { item?: WardrobeItem }) {
  const add = useMutation(api.wardrobe.add),
    update = useMutation(api.wardrobe.updateDetails),
    analyse = useAction(api.wardrobePhoto.analyse),
    addPhoto = useAction(api.wardrobePhoto.add),
    confirm = useMutation(api.wardrobeMetadata.confirm);
  const task = useTask(),
    photoTask = useTask();
  const [details, setDetails] = useState<Garment>(
    item?.details ?? { name: "", category: "top", colour: "" },
  );
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null),
    [draft, setDraft] = useState<PhotoDraft | null>(null),
    [consent, setConsent] = useState(false),
    [manual, setManual] = useState(!!item);
  const currentPhoto = useRef<PreparedPhoto | null>(null),
    active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      void discardPhoto(currentPhoto.current);
      currentPhoto.current = null;
    };
  }, []);
  function change(key: keyof Garment, value: string) {
    setDetails((current) => ({ ...current, [key]: value }));
  }
  async function pick(camera: boolean) {
    const next = await choosePhoto(camera);
    if (!next) return;
    if (!active.current) {
      await discardPhoto(next);
      return;
    }
    await discardPhoto(currentPhoto.current);
    currentPhoto.current = next;
    setPhoto(next);
    setDraft(null);
    setConsent(false);
    setManual(false);
    setDetails({ name: "", category: "top", colour: "" });
  }
  const showEditor = manual || !!draft;
  const busy = task.busy || photoTask.busy;
  async function save() {
    const clean = {
      ...details,
      name: wardrobeTitle(details),
      colour: details.colour.trim() || "unknown",
    };
    if (item) await update({ id: item.id, details: clean });
    else if (draft) await confirm({ id: draft.id, details: clean });
    else if (photo) {
      if (!consent)
        throw new Error("Confirm photo sharing before saving this photo.");
      await addPhoto({ details: clean, jpegBase64: photo.jpegBase64 });
    } else await add({ details: clean });
    await discardPhoto(currentPhoto.current);
    currentPhoto.current = null;
  }
  return (
    <Screen>
      <Title>
        {item ? "Make the details yours." : "One piece. More ways."}
      </Title>
      <Muted>
        {item
          ? "Corrections replace the confirmed tags. The original AI reading stays separate."
          : "Choose one garment per photo. Review every guess before adding it."}
      </Muted>
      {(photo?.uri || item?.photoUrl) && (
        <Image
          source={{ uri: photo?.uri || item?.photoUrl || undefined }}
          accessibilityLabel="Selected clothing photo"
          style={{ width: "100%", height: 260 }}
          resizeMode="contain"
        />
      )}
      {!item && (
        <>
          <Row>
            <Button
              secondary
              label="Choose photo"
              disabled={busy}
              onPress={() => void photoTask.run(() => pick(false))}
            />
            <Button
              secondary
              label="Take photo"
              disabled={busy}
              onPress={() => void photoTask.run(() => pick(true))}
            />
          </Row>
          {photo && (
            <Card>
              <Copy>
                Your selected photo is sent to Convex for private storage and to
                Google Gemini to read clothing details. Confirmed pieces may
                also get a separate AI clean photo. Your original stays
                available. Unconfirmed photo drafts expire after 24 hours.
              </Copy>
              <Row>
                <Switch
                  accessibilityLabel="I agree to share this photo for clothing analysis and a clean image"
                  value={consent}
                  onValueChange={setConsent}
                  disabled={busy || !!draft}
                />
                <Copy>I agree to share this photo.</Copy>
              </Row>
              <Button
                label={
                  draft ? "Photo read — review below" : "Read clothing details"
                }
                disabled={!consent || busy || !!draft}
                busy={task.busy}
                onPress={() =>
                  void task.run(
                    () => analyse({ jpegBase64: photo.jpegBase64 }),
                    (value) => {
                      setDraft(value);
                      setDetails(value.analysis.details);
                    },
                  )
                }
              />
            </Card>
          )}
          {!showEditor && (
            <Button
              secondary
              label="Enter details myself"
              disabled={busy}
              onPress={() => setManual(true)}
            />
          )}
        </>
      )}
      {draft && (
        <Notice>
          These are AI guesses. {draft.analysis.uncertainties.join(" ")}{" "}
          {draft.analysis.brandEvidence}
        </Notice>
      )}
      {showEditor && (
        <Card>
          <Heading>Review clothing details</Heading>
          <Muted>
            Unknown details can stay blank. Do not guess a label size or
            material.
          </Muted>
          <Row>
            {Object.entries(clothingCategories).map(([category, label]) => (
              <Chip
                key={category}
                label={label}
                selected={details.category === category}
                disabled={busy}
                onPress={() =>
                  setDetails((current) => ({
                    ...current,
                    category: category as Garment["category"],
                    kind: "",
                    attributes: {},
                  }))
                }
              />
            ))}
          </Row>
          <Field
            label="Type of piece"
            value={details.kind || ""}
            onChangeText={(value) => change("kind", value)}
            maxLength={80}
            placeholder="Shirt, jeans, trainers…"
          />
          <Field
            label="Colour"
            value={details.colour}
            onChangeText={(value) => change("colour", value)}
            maxLength={60}
            placeholder="Blue, black, or unknown"
          />
          {(
            ["pattern", "cut", "brand", "fabric", "size", "occasion"] as const
          ).map((key) => (
            <Field
              key={key}
              label={
                {
                  pattern: "Pattern",
                  cut: "Fit / cut",
                  brand: "Brand, if known",
                  fabric: "Material, if known",
                  size: "Size on the label",
                  occasion: "Useful occasions",
                }[key]
              }
              value={details[key] || ""}
              onChangeText={(value) => change(key, value)}
              maxLength={["pattern", "fabric", "size"].includes(key) ? 40 : 80}
            />
          ))}
          {(categoryAttributes[details.category] ?? []).map((key) => (
            <Field
              key={key}
              label={attributeLabels[key]}
              value={details.attributes?.[key] || ""}
              onChangeText={(value) =>
                setDetails((current) => ({
                  ...current,
                  attributes: { ...current.attributes, [key]: value },
                }))
              }
              maxLength={60}
            />
          ))}
          <Field
            label="Anything else?"
            value={details.notes || ""}
            onChangeText={(value) => change("notes", value)}
            maxLength={240}
            multiline
          />
          <Button
            label={item ? "Save changes" : "Confirm & add to wardrobe"}
            busy={task.busy}
            disabled={photoTask.busy || (!!photo && !consent)}
            onPress={() =>
              void task.run(save, () => router.replace("/wardrobe"))
            }
          />
        </Card>
      )}
      {(task.error || photoTask.error) && (
        <Notice error>{task.error || photoTask.error}</Notice>
      )}
      <Button
        secondary
        label="Cancel"
        disabled={busy}
        onPress={() => router.back()}
      />
    </Screen>
  );
}
