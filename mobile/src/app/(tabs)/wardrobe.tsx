import { useState } from "react";
import { Image } from "react-native";
import { router } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { clothingTags, wardrobeTitle } from "../../../../shared/wardrobeTags";
import { PrivateScreen, ConnectionNotice } from "../../providers/Backend";
import {
  Button,
  Card,
  Copy,
  Empty,
  Heading,
  Loading,
  Muted,
  Notice,
  Row,
  Screen,
  Title,
} from "../../components/ui";
import { useTask } from "../../hooks/useTask";
export default function Wardrobe() {
  return (
    <PrivateScreen title="A wardrobe that works for you">
      <WardrobeList />
    </PrivateScreen>
  );
}
function WardrobeList() {
  const items = useQuery(api.wardrobe.list, {}),
    available = useMutation(api.wardrobe.setAvailable),
    remove = useMutation(api.wardrobe.remove),
    task = useTask();
  const [removing, setRemoving] = useState<Id<"wardrobeItems"> | null>(null),
    [original, setOriginal] = useState<string>();
  return (
    <Screen>
      <Title>Already yours.{"\n"}New possibilities.</Title>
      <Muted>
        Keep track of what you own, then find fresh ways to wear it.
      </Muted>
      <ConnectionNotice />
      <Row>
        <Button
          label="Add clothing"
          onPress={() => router.push("/wardrobe-edit")}
        />
        <Button
          secondary
          label="Make an outfit"
          onPress={() => router.push("/outfits")}
        />
      </Row>
      {!items ? (
        <Loading label="Opening your wardrobe…" />
      ) : !items.length ? (
        <Empty
          title="Start with a few favourites"
          text="Add a top and bottom, or a dress. A photo helps you recognise each piece; you can also enter it manually."
        />
      ) : (
        <Muted>
          {items.length} pieces ·{" "}
          {items.filter((item) => item.available).length} available
        </Muted>
      )}
      {items?.map((item) => (
        <Card key={item.id}>
          {(original === item.id
            ? item.photoUrl
            : item.cleanPhotoUrl || item.photoUrl) && (
            <Image
              accessibilityLabel={wardrobeTitle(item.details)}
              source={{
                uri: (original === item.id
                  ? item.photoUrl
                  : item.cleanPhotoUrl || item.photoUrl)!,
              }}
              resizeMode="contain"
              style={{ height: 220, width: "100%" }}
            />
          )}
          <Heading>{wardrobeTitle(item.details)}</Heading>
          <Copy>{clothingTags(item.details).join(" · ")}</Copy>
          <Muted>
            {item.available
              ? "Available for outfits"
              : "Unavailable — excluded from outfits"}
          </Muted>
          {item.cleanPhotoState === "building" && (
            <Muted>
              Preparing a clean photo. Your original is ready to use.
            </Muted>
          )}
          {item.cleanPhotoState === "failed" && (
            <Muted>
              {item.cleanPhotoNote ||
                "The clean photo could not finish. Your original is still available."}
            </Muted>
          )}
          {item.cleanPhotoUrl && item.photoUrl && (
            <Button
              secondary
              label={
                original === item.id
                  ? "View clean photo"
                  : "View original photo"
              }
              onPress={() =>
                setOriginal(original === item.id ? undefined : item.id)
              }
            />
          )}
          <Row>
            <Button
              secondary
              label="Edit details"
              onPress={() =>
                router.push({
                  pathname: "/wardrobe-edit",
                  params: { id: item.id },
                })
              }
            />
            <Button
              secondary
              label={item.available ? "Mark unavailable" : "Mark available"}
              disabled={task.busy}
              onPress={() =>
                void task.run(() =>
                  available({ id: item.id, available: !item.available }),
                )
              }
            />
          </Row>
          {removing === item.id ? (
            <>
              <Copy>
                Remove this piece and its original and clean photos? This cannot
                be undone.
              </Copy>
              <Button
                danger
                label="Remove piece and photos"
                busy={task.busy}
                onPress={() =>
                  void task.run(
                    () => remove({ id: item.id }),
                    () => setRemoving(null),
                  )
                }
              />
              <Button
                secondary
                label="Keep this piece"
                onPress={() => setRemoving(null)}
              />
            </>
          ) : (
            <Button
              secondary
              label="Remove piece"
              onPress={() => setRemoving(item.id)}
            />
          )}
        </Card>
      ))}
      {task.error && <Notice error>{task.error}</Notice>}
    </Screen>
  );
}
