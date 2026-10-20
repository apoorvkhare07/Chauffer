import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button, Card, Copy, Heading, Loading, Muted, Notice } from "./ui";
import { ProductCard } from "./ProductCard";
import { useTask } from "../hooks/useTask";

export function DailyPicks() {
  const data = useQuery(api.dailyFeed.current, {});
  const saved = useQuery(api.savedProducts.list, {});
  const setEnabled = useMutation(api.dailyFeed.setEnabled);
  const save = useMutation(api.savedProducts.saveDaily);
  const recordPass = useMutation(api.dailyFeed.recordPass);
  const task = useTask();
  const [position, setPosition] = useState<{ feedId?: string; value: number }>({ value: 0 });

  if (!data) return <Loading label="Preparing your style edit…" />;
  const feed = data.feed;
  const products = feed?.options ?? [];
  const ready = data.enabled && !data.changed && feed?.state === "ready";
  const index = position.feedId === feed?.id ? position.value : 0;
  const active = ready ? products[index] : undefined;
  const isSaved = Boolean(
    active && saved?.some((item) => item.option.url === active.url),
  );
  const update = (enabled: boolean) =>
    void task.run(() => setEnabled({ enabled }));

  return (
    <Card>
      <Heading>Picked for you</Heading>
      <Copy>A few finds shaped around your style, refreshed each day.</Copy>
      {data.changed && (
        <Notice>Your style changed. Refresh today’s edit to match.</Notice>
      )}
      {!data.needReady && (
        <Muted>Finish your style setup to get personal daily picks.</Muted>
      )}
      {!data.enabled ? (
        <Button
          label={feed ? "Resume daily picks" : "Make my daily edit"}
          disabled={!data.needReady}
          busy={task.busy}
          onPress={() => update(true)}
        />
      ) : data.changed ? (
        <Button
          label="Refresh today’s edit"
          busy={task.busy}
          onPress={() => update(true)}
        />
      ) : feed?.state === "building" || !feed ? (
        <Loading label="Finding the right mix for today…" />
      ) : feed.state === "failed" ? (
        <>
          <Notice error>{feed.note}</Notice>
          <Button
            label="Try again"
            busy={task.busy}
            onPress={() => update(true)}
          />
        </>
      ) : active ? (
        <>
          <Muted>
            Pick {index + 1} of {products.length}
          </Muted>
          <ProductCard
            product={active}
            affiliate={feed?{reference:{kind:"daily",id:feed.id,url:active.url},source:"daily"}:undefined}
            saved={isSaved}
            save={async () => {
              if (!feed) return;
              await save({ feedId: feed.id, url: active.url });
              setPosition({ feedId: feed.id, value: index + 1 });
            }}
          />
          <Button
            secondary
            label={index + 1 >= products.length ? "Finish today’s edit" : "Skip this pick"}
            busy={task.busy}
            onPress={() => void task.run(async () => {
              if (!feed) return;
              await recordPass({ feedId: feed.id, url: active.url });
              setPosition({ feedId: feed.id, value: index + 1 });
            })}
          />
          {isSaved && (
            <Button
              secondary
              label="Next pick"
              onPress={() => setPosition({ feedId: feed?.id, value: index + 1 })}
            />
          )}
        </>
      ) : products.length ? (
        <>
          <Copy>That’s today’s edit.</Copy>
          <Button secondary label="See the picks again" onPress={() => setPosition({ feedId: feed?.id, value: 0 })} />
        </>
      ) : (
        <Muted>No verified picks were available today. Check again tomorrow.</Muted>
      )}
      {data.enabled && (
        <Button
          secondary
          label="Pause daily picks"
          busy={task.busy}
          onPress={() => update(false)}
        />
      )}
      {!!task.error && <Notice error>{task.error}</Notice>}
    </Card>
  );
}
