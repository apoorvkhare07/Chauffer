import { useState } from "react";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PrivateScreen, ConnectionNotice } from "../../providers/Backend";
import {
  Button,
  Card,
  Copy,
  Empty,
  Loading,
  Notice,
  Screen,
  Title,
} from "../../components/ui";
import { ProductCard } from "../../components/ProductCard";
import { useTask } from "../../hooks/useTask";
import type { Id } from "../../../../convex/_generated/dataModel";
export default function Saved() {
  return (
    <PrivateScreen title="Keep your favourites">
      <SavedItems />
    </PrivateScreen>
  );
}
function SavedItems() {
  const rows = useQuery(api.savedProducts.list, {}),
    remove = useMutation(api.savedProducts.remove),
    task = useTask();
  const [removing, setRemoving] = useState<Id<"savedProducts"> | null>(null);
  return (
    <Screen>
      <Title>Worth coming back to.</Title>
      <ConnectionNotice />
      {!rows ? (
        <Loading label="Loading your saved finds…" />
      ) : !rows.length ? (
        <Empty
          title="No saved finds yet"
          text="Save something from your search results to keep it here."
        >
          <Button label="Discover something" onPress={() => router.push("/")} />
        </Empty>
      ) : (
        rows.map((row) => (
          <Card key={row._id}>
            <ProductCard product={row.option} />
            {removing === row._id ? (
              <>
                <Copy>
                  Remove this product from Saved? This also removes its saved
                  price observations.
                </Copy>
                <Button
                  danger
                  label="Remove saved product"
                  busy={task.busy}
                  onPress={() =>
                    void task.run(
                      () => remove({ id: row._id }),
                      () => setRemoving(null),
                    )
                  }
                />
                <Button
                  secondary
                  label="Keep it"
                  onPress={() => setRemoving(null)}
                />
              </>
            ) : (
              <Button
                secondary
                label="Remove from Saved"
                onPress={() => setRemoving(row._id)}
              />
            )}
          </Card>
        ))
      )}
      {!!task.error && <Notice error>{task.error}</Notice>}
    </Screen>
  );
}
