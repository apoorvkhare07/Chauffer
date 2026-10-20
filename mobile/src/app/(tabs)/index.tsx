import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import * as Crypto from "expo-crypto";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  useBackend,
  ConfigNotice,
  ConnectionNotice,
  deviceStorage,
  PrivateScreen,
} from "../../providers/Backend";
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
} from "../../components/ui";
import { ProductCard } from "../../components/ProductCard";
import { StoreStates } from "../../components/StoreStates";
import { discoveryView, requestText } from "../../core/discovery";
import { useTask } from "../../hooks/useTask";

function Intro() {
  return (
    <View style={{ gap: 12, paddingTop: 16, paddingBottom: 8 }}>
      <Title>More options.{"\n"}More you.</Title>
      <Copy>Your next find. A fresh way to wear what you own.</Copy>
      <Muted>
        Tell me the occasion, what you like, and your budget. We’ll find a place
        to start.
      </Muted>
      <Button
        secondary
        label="Ask a personal stylist"
        onPress={() => router.push("/stylist")}
      />
    </View>
  );
}
export default function Discover() {
  const { connected } = useBackend();
  if (!connected)
    return (
      <Screen>
        <Intro />
        <Card>
          <Field
            label="What do you have in mind?"
            placeholder="A relaxed linen shirt under ₹2,000"
            multiline
            editable={false}
          />
          <Button label="Find my next look" disabled onPress={() => {}} />
        </Card>
        <ConfigNotice />
      </Screen>
    );
  return <ConnectedDiscover />;
}
function ConnectedDiscover() {
  const auth = useConvexAuth();
  if (auth.isLoading)
    return (
      <Screen>
        <Loading label="Restoring your session…" />
        <ConnectionNotice />
      </Screen>
    );
  return auth.isAuthenticated ? (
    <PrivateScreen title="Discover">
      <SignedDiscovery />
    </PrivateScreen>
  ) : (
    <GuestDiscovery />
  );
}
function GuestDiscovery() {
  const [token, setToken] = useState<string>(),
    [draft, setDraft] = useState(""),
    [storageError, setStorageError] = useState("");
  const current = useQuery(api.guestSearch.current, token ? { token } : "skip");
  const start = useMutation(api.guestSearch.start),
    task = useTask();
  const [previewTimedOut, setPreviewTimedOut] = useState(false);
  useEffect(() => {
    if (current?.state !== "pending") return;
    const timer = setTimeout(
      () => setPreviewTimedOut(true),
      Math.max(0, current.createdAt + 120_000 - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [current?.createdAt, current?.state]);
  useEffect(() => {
    let active = true;
    void (async () => {
      let value = await deviceStorage.getItem("guest-capability");
      if (!value) {
        value = Crypto.randomUUID() + Crypto.randomUUID();
        await deviceStorage.setItem("guest-capability", value);
      }
      const retained = await deviceStorage.getItem("pending-request");
      if (active) {
        setToken(value);
        if (retained) setDraft(retained);
      }
    })().catch(() => {
      if (active)
        setStorageError(
          "Secure storage could not open. Restart the app to try again.",
        );
    });
    return () => {
      active = false;
    };
  }, []);
  async function login() {
    await deviceStorage.setItem(
      "pending-request",
      draft.trim() || current?.text || "",
    );
    router.push("/sign-in");
  }
  const pending =
    task.busy || (current?.state === "pending" && !previewTimedOut);
  return (
    <Screen>
      <Intro />
      <ConnectionNotice />
      <Button
        secondary
        label="Continue with phone"
        onPress={() => void task.run(login)}
      />
      <Muted>
        Try one search before signing in. Gemini interprets your request;
        products come from supported stores.
      </Muted>
      {current && (
        <Card>
          <Copy>{current.text}</Copy>
          {pending ? (
            <Loading label="Looking for your next find…" />
          ) : (
            <Copy>
              {current.reply ||
                "This preview could not finish. Sign in to continue."}
            </Copy>
          )}
        </Card>
      )}
      {current?.result?.options.map((product) => (
        <ProductCard key={product.url} product={product} affiliate={token?{reference:{kind:"guest",token,url:product.url},source:"guest-search"}:undefined}/>
      ))}
      {current?.result && <StoreStates result={current.result} />}
      <Card>
        <Field
          label={
            current ? "What would you change?" : "What do you have in mind?"
          }
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={1000}
          placeholder="Men’s linen shirts, size M, under ₹2,000"
        />
        <Button
          label={current ? "Sign in to keep chatting" : "Find my next look"}
          busy={task.busy}
          disabled={pending || !token || current === undefined || !draft.trim()}
          onPress={() =>
            void task.run(async () => {
              if (current) {
                await login();
                return;
              }
              const text = requestText(draft);
              await deviceStorage.setItem("pending-request", text);
              await start({ token: token!, text });
            })
          }
        />
      </Card>
      {!!(task.error || storageError) && (
        <Notice error>{task.error || storageError}</Notice>
      )}
    </Screen>
  );
}
function SignedDiscovery() {
  const current = useQuery(api.conversations.current, {}),
    saved = useQuery(api.savedProducts.list, {});
  const post = useMutation(api.conversations.post),
    cancel = useMutation(api.conversations.cancel),
    save = useMutation(api.savedProducts.save);
  const [draft, setDraft] = useState(""),
    [newSearch, setNewSearch] = useState(false),
    [showHistory, setShowHistory] = useState(false);
  const task = useTask(),
    edited = useRef(false);
  useEffect(() => {
    let active = true;
    void Promise.resolve(deviceStorage.getItem("pending-request"))
      .then((value) => {
        if (active && !edited.current && value) setDraft(value);
      })
      .catch(() => {
        /* Current server chat remains usable if a local draft is unavailable. */
      });
    return () => {
      active = false;
    };
  }, []);
  if (!current)
    return (
      <Screen>
        <Loading label="Loading your current chat…" />
        <ConnectionNotice />
      </Screen>
    );
  const view = discoveryView(current),
    disabled = current.pending || task.busy;
  const send = (
    text: string,
    extra?: {
      rejectUrl?: string;
      reference?: { messageId: Id<"messages">; url: string };
    },
  ) =>
    task.run(
      async () => {
        await post({
          text: requestText(text),
          ...(newSearch ? { newSearch: true } : {}),
          ...extra,
        });
        // A local cleanup failure must not present a successful server post as a failed send.
        try {
          await deviceStorage.removeItem("pending-request");
        } catch {
          /* Retry cleanup when signing out. */
        }
      },
      () => {
        setDraft("");
        setNewSearch(false);
      },
    );
  const requirements = Object.entries(current.requirements).filter(
    ([key, value]) =>
      !["askedDiscoveryFields", "mustHave", "pricePreference"].includes(key) &&
      value !== undefined,
  );
  const styling = view.fresh ? view.latest?.handoff?.styling : undefined;
  return (
    <Screen>
      <Title>Your next find.</Title>
      <Button
        secondary
        label="Ask my personal stylist"
        onPress={() => router.push("/stylist")}
      />
      <Muted>
        This is the same active chat as your website account. A new search or
        stop affects both devices.
      </Muted>
      <ConnectionNotice />
      {!!requirements.length && (
        <Row>
          {requirements.map(([key, value]) => (
            <Chip
              key={key}
              label={
                key === "budget"
                  ? `Up to ₹${Number(value).toLocaleString("en-IN")}`
                  : `${key}: ${value}`
              }
            />
          ))}
        </Row>
      )}
      <Button
        secondary
        label={
          showHistory ? "Hide this conversation" : "Read this conversation"
        }
        onPress={() => setShowHistory(!showHistory)}
      />
      {(showHistory
        ? current.messages
        : current.messages
            .slice(
              Math.max(
                0,
                current.messages.findLastIndex((m) => m.role === "user"),
              ),
            )
            .filter((m) => !m.result)
      ).map((message) => (
        <Card key={message.id}>
          <Muted>{message.role === "user" ? "You" : "Chauffer"}</Muted>
          <Copy>{message.text}</Copy>
        </Card>
      ))}
      {current.pending && (
        <Card>
          <Loading
            label={
              current.pendingPhase === "thinking"
                ? "Understanding your request…"
                : "Looking for options…"
            }
          />
          <Button
            secondary
            label="Stop this request"
            busy={task.busy}
            onPress={() => void task.run(() => cancel({}))}
          />
        </Card>
      )}
      {!current.pending && current.discoveryQuestion && (
        <Card>
          <Heading>{current.discoveryQuestion.question}</Heading>
          <Row>
            {view.choices.map((choice) => (
              <Chip
                key={choice.text}
                label={choice.label}
                disabled={disabled}
                onPress={() => void send(choice.text)}
              />
            ))}
            <Chip
              label="No preference, show options"
              disabled={disabled}
              onPress={() => void send("No preference, show options")}
            />
          </Row>
        </Card>
      )}
      {view.latest?.result && (
        <>
          <Heading>{view.fresh ? "Your shortlist" : "Previous picks"}</Heading>
          {!view.fresh && (
            <Muted>
              These are from an earlier turn. Refine your request for fresh
              matches.
            </Muted>
          )}
          {!showHistory && view.latest.result && (
            <Copy>{view.latest.text}</Copy>
          )}
          {styling && styling.state !== "not_requested" && (
            <Notice>
              {styling.summary}
              {styling.limitations.length
                ? ` ${styling.limitations.join(" ")}`
                : ""}
            </Notice>
          )}
          {view.latest.result.options.map((product) => (
            <ProductCard
              key={product.url}
              product={product}
              affiliate={{reference:{kind:"message",id:view.latest!.id as Id<"messages">,url:product.url},source:"search"}}
              saved={saved?.some((row) => row.option.url === product.url)}
              save={() =>
                save({
                  messageId: view.latest!.id as Id<"messages">,
                  url: product.url,
                })
              }
              feedback={
                disabled || !view.fresh
                  ? undefined
                  : (text) =>
                      void send(text, {
                        reference: {
                          messageId: view.latest!.id as Id<"messages">,
                          url: product.url,
                        },
                        ...(text === "Not for me"
                          ? { rejectUrl: product.url }
                          : {}),
                      })
              }
              pairing={
                styling?.state === "ready"
                  ? styling.matches
                      .filter((match) => match.productId === product.url)
                      .map(
                        (match) =>
                          `${match.items.map((item) => item.name).join(" + ")}: ${match.reason}`,
                      )
                      .join(" ")
                  : undefined
              }
            />
          ))}
          <StoreStates result={view.latest.result} />
        </>
      )}
      {current.discoveryStatus === "satisfied" && (
        <Notice>Shortlist confirmed. You can still refine it.</Notice>
      )}
      {view.canAccept && (
        <Button
          secondary
          label="These work for me"
          disabled={disabled}
          onPress={() => void send("These work for me")}
        />
      )}
      <Card>
        <Field
          label={
            newSearch ? "Start a fresh search" : "What do you have in mind?"
          }
          value={draft}
          onChangeText={(value) => {
            edited.current = true;
            setDraft(value);
          }}
          placeholder="Tell me what to find or what to change…"
          multiline
          maxLength={1000}
        />
        <Button
          label={newSearch ? "Start new search" : "Send request"}
          disabled={disabled || !draft.trim()}
          busy={task.busy}
          onPress={() => void send(draft)}
        />
        <Button
          secondary
          label={newSearch ? "Keep current chat" : "New search"}
          disabled={disabled}
          onPress={() => setNewSearch(!newSearch)}
        />
        {newSearch && (
          <Muted>
            The next request starts a fresh chat. Past chats remain in Settings.
          </Muted>
        )}
      </Card>
      {!!task.error && <Notice error>{task.error}</Notice>}
    </Screen>
  );
}
