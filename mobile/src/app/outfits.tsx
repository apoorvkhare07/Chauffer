import { useState } from "react";
import { Image } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { wardrobeTitle } from "../../../shared/wardrobeTags";
import type { FunctionArgs } from "convex/server";
import { PrivateScreen, ConnectionNotice } from "../providers/Backend";
import {
  Button,
  Card,
  Chip,
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
import { requestText } from "../core/discovery";
import { useTask } from "../hooks/useTask";
type Event = NonNullable<FunctionArgs<typeof api.wardrobe.request>["event"]>;
function today(): Event {
  const now = new Date(),
    timeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return { timeZone, date, period: "auto", setting: "unspecified" };
}
export default function Outfits() {
  return (
    <PrivateScreen title="Wear what you own">
      <OutfitBuilder />
    </PrivateScreen>
  );
}
function OutfitBuilder() {
  const latest = useQuery(api.wardrobe.latest, {}),
    items = useQuery(api.wardrobe.list, {}),
    context = useQuery(api.wardrobeContext.get, {});
  const request = useMutation(api.wardrobe.request),
    wear = useMutation(api.wardrobe.wear),
    task = useTask();
  const [text, setText] = useState(""),
    [event, setEvent] = useState(today),
    [showContext, setShowContext] = useState(false);
  const pending = latest?.state === "building" && !latest.changed;
  return (
    <Screen>
      <Title>A fresh way to wear it.</Title>
      <Copy>
        Describe the day. We’ll work with your confirmed, available clothes.
      </Copy>
      <ConnectionNotice />
      <Card>
        <Field
          label="What are you dressing for?"
          value={text}
          onChangeText={setText}
          maxLength={700}
          multiline
          placeholder="Dinner outside on a warm evening. Keep it relaxed."
        />
        <Field
          label="Date (YYYY-MM-DD)"
          value={event.date}
          onChangeText={(date) => setEvent({ ...event, date })}
          maxLength={10}
        />
        <Muted>Time zone: {event.timeZone}</Muted>
        <Row>
          {(["auto", "morning", "afternoon", "evening", "night"] as const).map(
            (period) => (
              <Chip
                key={period}
                label={period === "auto" ? "Current time" : period}
                selected={event.period === period}
                onPress={() => setEvent({ ...event, period })}
              />
            ),
          )}
        </Row>
        <Row>
          {(["unspecified", "indoors", "outdoors", "mixed"] as const).map(
            (setting) => (
              <Chip
                key={setting}
                label={
                  setting === "unspecified"
                    ? "Any setting"
                    : setting === "mixed"
                      ? "Both / commuting"
                      : setting
                }
                selected={event.setting === setting}
                onPress={() => setEvent({ ...event, setting })}
              />
            ),
          )}
        </Row>
        <Muted>
          No location permission is requested. You can describe the weather in
          your request.
        </Muted>
        <Button
          label="Suggest outfits"
          busy={task.busy}
          disabled={
            !latest ||
            !items?.some((item) => item.available) ||
            pending ||
            !text.trim() ||
            !latest.aiEnabled
          }
          onPress={() =>
            void task.run(() =>
              request({ text: requestText(text, 700), event }),
            )
          }
        />
      </Card>
      <Button
        secondary
        label={
          showContext
            ? "Hide styling context"
            : "What will guide these outfits?"
        }
        onPress={() => setShowContext(!showContext)}
      />
      {showContext && context && (
        <Card>
          <Copy>Style: {context.style.stylePreferences || "Not set"}</Copy>
          <Copy>Fit: {context.style.fitPreferences || "Not set"}</Copy>
          <Copy>Avoid: {context.style.avoid || "Not set"}</Copy>
          <Copy>
            Body context: {context.shopper.body.description || "None shared"}
          </Copy>
          <Muted>
            {context.shopper.body.source === "confirmed_photo"
              ? "Reviewed photo description."
              : "Only your own saved descriptions are used."}{" "}
            You can edit these in Settings.{" "}
            {context.shopper.body.limitations.join(" ")}
          </Muted>
        </Card>
      )}
      {!latest ? (
        <Loading label="Loading outfits…" />
      ) : pending ? (
        <Loading label="Putting your clothes together…" />
      ) : latest.changed ? (
        <Notice>
          Your clothes or style preferences changed. Ask for fresh outfits.
        </Notice>
      ) : (
        <>
          {!!latest.note && (
            <Notice error={latest.state === "failed"}>{latest.note}</Notice>
          )}
          {latest.guidance && (
            <Card>
              <Copy>{latest.guidance.summary}</Copy>
              {latest.guidance.tips.map((tip, i) => (
                <Muted key={i}>{tip}</Muted>
              ))}
              {!!latest.guidance.question && (
                <Copy>{latest.guidance.question}</Copy>
              )}
            </Card>
          )}
          {latest.outfits.map((outfit, index) => (
            <Card key={index}>
              <Heading>{outfit.title}</Heading>
              <Copy>{outfit.reason}</Copy>
              {outfit.itemIds.map((id) => {
                const item = items?.find(
                  (item) => item.id === id && item.available,
                );
                return item ? (
                  <Card key={id}>
                    {(item.cleanPhotoUrl || item.photoUrl) && (
                      <Image
                        source={{ uri: (item.cleanPhotoUrl || item.photoUrl)! }}
                        accessibilityLabel={wardrobeTitle(item.details)}
                        style={{ height: 140, width: "100%" }}
                        resizeMode="contain"
                      />
                    )}
                    <Copy>{wardrobeTitle(item.details)}</Copy>
                  </Card>
                ) : null;
              })}
              <Button
                secondary
                label={
                  latest.wornIndex === index
                    ? "Recorded as worn"
                    : "I wore this"
                }
                disabled={task.busy || latest.wornIndex === index}
                onPress={() =>
                  void task.run(() => wear({ id: latest.id!, index }))
                }
              />
            </Card>
          ))}
          {latest.weather && (
            <Muted>
              {latest.weather.note}
              {latest.weather.status === "ready"
                ? ` ${latest.weather.condition ?? ""} ${latest.weather.temperatureC ?? ""}°C · ${latest.weather.source}, ${latest.weather.date}`
                : ""}
            </Muted>
          )}
        </>
      )}
      {!!task.error && <Notice error>{task.error}</Notice>}
    </Screen>
  );
}
