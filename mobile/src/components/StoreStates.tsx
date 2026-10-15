import { useState } from "react";
import type { Message } from "../core/contracts";
import { openMerchant } from "../platform/links";
import { useTask } from "../hooks/useTask";
import { Button, Card, Copy, Notice } from "./ui";
export function StoreStates({
  result,
}: {
  result: NonNullable<Message["result"]>;
}) {
  const [open, setOpen] = useState(false),
    task = useTask();
  return (
    <Card>
      <Button
        secondary
        label={
          open
            ? "Hide store coverage"
            : `Store coverage (${result.stores.length})`
        }
        onPress={() => setOpen(!open)}
      />
      {open &&
        result.stores.map((store) => (
          <Button
            secondary
            key={store.store}
            label={`${store.store}: ${store.status === "matched" ? "matches read" : store.status === "unavailable" ? "unavailable" : "no verified matches"}`}
            onPress={() => void task.run(() => openMerchant(store.searchUrl))}
          />
        ))}
      {open && (
        <Copy>
          Tap a store to open its search. Coverage changes with each request.
        </Copy>
      )}
      {task.error && <Notice error>{task.error}</Notice>}
    </Card>
  );
}
