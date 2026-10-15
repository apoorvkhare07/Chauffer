import { useState } from "react";
import { Switch, View } from "react-native";
import { router } from "expo-router";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
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
import { EventFields } from "../components/EventFields";
import { todayEvent } from "../core/event";
import { requestText } from "../core/discovery";
import { useTask } from "../hooks/useTask";
import { openEditorial } from "../platform/links";

export default function Stylist() {
  return (
    <PrivateScreen title="Your personal stylist">
      <StyleBrief />
    </PrivateScreen>
  );
}
function StyleBrief() {
  const latest = useQuery(api.stylist.latest, {}),
    context = useQuery(api.wardrobeContext.get, {});
  const request = useMutation(api.stylist.request),
    clear = useMutation(api.stylist.clear),
    post = useMutation(api.conversations.post),
    client = useConvex();
  const [text, setText] = useState(""),
    [event, setEvent] = useState(todayEvent),
    [refine, setRefine] = useState(false),
    [showContext, setShowContext] = useState(false),
    [confirmClear, setConfirmClear] = useState(false);
  const task = useTask();
  const run = latest?.run,
    advice = !latest?.stale && run?.state === "ready" ? run.advice : undefined;
  const pending = run?.state === "building";
  const disabled = task.busy || pending;
  async function shop(index: number) {
    if (!run || !advice) return;
    const brief = await client.query(api.stylist.shoppingBrief, {
      id: run.id,
      index,
    });
    await post({ text: brief.text, newSearch: true });
  }
  return (
    <Screen>
      <Title>Your style.{"\n"}With a little direction.</Title>
      <Copy>
        Explore colours, fits and ways to put a look together—with or without a
        wardrobe upload.
      </Copy>
      <Muted>
        Gemini uses your question and confirmed styling preferences. Photos are
        optional. These are ideas, not verified products or clothes we assume
        you own.
      </Muted>
      <ConnectionNotice />
      <Button
        secondary
        label="Style clothes I own"
        onPress={() => router.push("/outfits")}
      />
      <Button
        secondary
        label={
          showContext
            ? "Hide my starting point"
            : "What will guide my style brief?"
        }
        onPress={() => setShowContext(!showContext)}
      />
      {showContext && (
        <Card>
          {context ? (
            <>
              <Copy>Styles: {context.style.stylePreferences || "Not set"}</Copy>
              <Copy>Fit: {context.style.fitPreferences || "Not set"}</Copy>
              <Copy>Avoid: {context.style.avoid || "Not set"}</Copy>
              <Copy>
                Top size: {context.shopper.topSize || "Not set"} · Jeans:{" "}
                {context.shopper.jeansSize || "Not set"}
              </Copy>
              <Copy>
                Body context:{" "}
                {context.shopper.body.description ||
                  "None shared. Preference-led advice still works."}
              </Copy>
              <Muted>{context.shopper.body.limitations.join(" ")}</Muted>
              {context.shopper.body.needsReview && (
                <Notice>
                  Your photo observations need review before they can guide
                  styling.
                </Notice>
              )}
              <Button
                secondary
                label="Edit preferences"
                onPress={() => router.push("/preferences")}
              />
            </>
          ) : (
            <Loading label="Loading your preferences…" />
          )}
        </Card>
      )}
      <Card>
        <Field
          label="What would you like help with?"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1200}
          placeholder="A relaxed dinner look in understated colours. Explain what to choose and why."
        />
        <Row>
          {[
            "Build my everyday style guide",
            "What colours and fits could I explore?",
            "Help me dress for a wedding reception",
          ].map((prompt) => (
            <Chip
              key={prompt}
              label={prompt}
              disabled={disabled}
              onPress={() => {
                setText(prompt);
                setRefine(false);
              }}
            />
          ))}
        </Row>
        <EventFields event={event} onChange={setEvent} disabled={disabled} />
        {!!advice && (
          <Row>
            <Switch
              accessibilityLabel="Refine the latest style brief"
              value={refine}
              onValueChange={setRefine}
              disabled={disabled}
            />
            <Copy>Refine the latest style brief</Copy>
          </Row>
        )}
        <Muted>
          Your current question takes priority. Refining uses the latest brief;
          it does not save new preferences automatically.
        </Muted>
        <Button
          label={
            refine && advice ? "Refine my style brief" : "Create my style brief"
          }
          busy={task.busy}
          disabled={disabled || !text.trim() || !latest?.aiEnabled}
          onPress={() =>
            void task.run(
              () =>
                request({
                  text: requestText(text, 1200),
                  event,
                  ...(refine && advice && run ? { parentId: run.id } : {}),
                }),
              () => setRefine(false),
            )
          }
        />
      </Card>
      {!latest && <Loading label="Loading your stylist…" />}
      {latest && !latest.aiEnabled && (
        <Notice>
          The stylist is not available on this test server yet. Your question
          stays here.
        </Notice>
      )}
      {pending && <Loading label="Considering your preferences and plans…" />}
      {latest?.stale && (
        <Notice>
          Your saved details changed. Ask again for advice using your updated
          preferences.
        </Notice>
      )}
      {run?.state === "failed" && !latest?.stale && (
        <Card>
          <Notice>{run.note}</Notice>
          {!!run.request && (
            <Button
              secondary
              label="Restore my question"
              disabled={disabled}
              onPress={() => {
                setText(run.request);
                setRefine(false);
                setEvent(run.event);
              }}
            />
          )}
        </Card>
      )}
      {!!advice && (
        <>
          <Card>
            <Heading>Your style brief</Heading>
            <Muted>{run!.request}</Muted>
            <Copy>{advice.summary}</Copy>
            <Heading>What this advice uses</Heading>
            {advice.contextUsed.map((item, i) => (
              <Muted key={i}>{item}</Muted>
            ))}
          </Card>
          {advice.palette.length > 0 && (
            <Card>
              <Heading>Your colour direction</Heading>
              {advice.palette.map((colour, i) => (
                <Row key={i}>
                  <View
                    accessible={false}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: /^#[0-9a-f]{6}$/i.test(colour.hex)
                        ? colour.hex
                        : "#e9edf6",
                      borderWidth: 1,
                      borderColor: "#dfe4ef",
                    }}
                  />
                  <View style={{ flex: 1, minWidth: 180 }}>
                    <Copy>{colour.name}</Copy>
                    <Muted>{colour.use}</Muted>
                  </View>
                </Row>
              ))}
              <Muted>
                Illustrative swatches. Product and screen colours vary.
              </Muted>
            </Card>
          )}
          {advice.sections.map((section, i) => (
            <Card key={i}>
              <Heading>{section.title}</Heading>
              <Copy>{section.advice}</Copy>
              <Muted>Why: {section.reason}</Muted>
            </Card>
          ))}
          {advice.looks.length > 0 && (
            <>
              <Heading>Put it together.</Heading>
              <Muted>
                Outfit ideas to explore. Choosing “Find the main piece” starts a
                new Discover chat; it does not buy anything.
              </Muted>
            </>
          )}
          {advice.looks.map((look, i) => (
            <Card key={i}>
              <Muted>{look.occasion}</Muted>
              <Heading>{look.title}</Heading>
              {look.pieces.map((piece, j) => (
                <Copy key={j}>• {piece}</Copy>
              ))}
              <Copy>{look.why}</Copy>
              <Copy>How to wear it: {look.styling}</Copy>
              <Muted>A different take: {look.alternative}</Muted>
              {!!look.search && (
                <Button
                  secondary
                  label="Find the main piece"
                  disabled={disabled}
                  onPress={() =>
                    void task.run(
                      () => shop(i),
                      () => router.replace("/"),
                    )
                  }
                />
              )}
            </Card>
          ))}
          {advice.trends.map((trend, i) => {
            const source = latest!.sources.find(
              (source) => source.id === trend.sourceId,
            );
            return source ? (
              <Card key={i}>
                <Heading>A seasonal detail to explore</Heading>
                <Copy>{trend.adaptation}</Copy>
                <Muted>
                  Curated editorial reference · reviewed {latest!.trendReview}.
                  Runway reporting, not live popularity or stock.
                </Muted>
                <Button
                  secondary
                  label={`${source.publisher}: ${source.title}`}
                  onPress={() => void task.run(() => openEditorial(source.url))}
                />
                <Muted>
                  Published {source.published}. {source.scope}
                </Muted>
              </Card>
            ) : null;
          })}
          {advice.caveats.length > 0 && (
            <Card>
              <Heading>A few useful limits</Heading>
              {advice.caveats.map((caveat, i) => (
                <Muted key={i}>{caveat}</Muted>
              ))}
            </Card>
          )}
          {!!advice.question && <Notice>{advice.question}</Notice>}
          <Muted>{run!.note}</Muted>
        </>
      )}
      {!!run &&
        (confirmClear ? (
          <Card>
            <Copy>
              Clear your saved style briefs? Their content cannot be restored.
              Request limits still apply.
            </Copy>
            <Button
              danger
              label="Clear my style briefs"
              busy={task.busy}
              onPress={() =>
                void task.run(
                  () => clear({}),
                  () => {
                    setConfirmClear(false);
                    setRefine(false);
                    setText("");
                  },
                )
              }
            />
            <Button
              secondary
              label="Keep my briefs"
              disabled={task.busy}
              onPress={() => setConfirmClear(false)}
            />
          </Card>
        ) : (
          <Button
            secondary
            label="Clear style briefs"
            disabled={task.busy}
            onPress={() => setConfirmClear(true)}
          />
        ))}
      {!!task.error && <Notice error>{task.error}</Notice>}
    </Screen>
  );
}
