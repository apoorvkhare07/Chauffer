import {MerchantButton} from "../../components/MerchantButton";
import { useState } from "react";
import { router } from "expo-router";
import { useAction, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../../convex/_generated/api";
import { PrivateScreen, ConnectionNotice } from "../../providers/Backend";
import {
  Button,
  Card,
  Copy,
  Empty,
  Field,
  Heading,
  Loading,
  Muted,
  Notice,
  Screen,
  Title,
} from "../../components/ui";
import { ProductCard } from "../../components/ProductCard";
import { useTask } from "../../hooks/useTask";
import type { Id } from "../../../../convex/_generated/dataModel";
import { openMerchant } from "../../platform/links";
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
  const [selected, setSelected] = useState<Id<"savedProducts">[]>([]);
  const compared = (rows ?? []).filter((row) => selected.includes(row._id));
  const comparison = useQuery(api.commerce.compareSaved, { ids: compared.map((row) => row._id) });
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
            <ProductCard product={row.option} affiliate={{reference:{kind:"saved",id:row._id},source:"saved"}}/>
            <Muted>
              Saved price observed {new Date(row.option.observedAt).toLocaleString("en-IN")}
            </Muted>
            <Button
              secondary
              label={selected.includes(row._id) ? "Remove from comparison" : `Compare this option (${selected.length}/3)`}
              disabled={!selected.includes(row._id) && selected.length >= 3}
              onPress={() => setSelected((ids) => ids.includes(row._id) ? ids.filter((id) => id !== row._id) : [...ids, row._id])}
            />
            <SavedDetails id={row._id} url={row.option.url} />
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
      {compared.length > 0 && (
        <Card>
          <Heading>Compare saved options</Heading>
          <Muted>Compare observed details. Size stock, delivery cost and final checkout price still need checking on the store.</Muted>
          {comparison?.some((pair) => pair.status === "unverified") && (
            <Notice>A lowest delivered price cannot be confirmed yet: {[...new Set(comparison.flatMap((pair) => pair.gaps))].join(" ")}</Notice>
          )}
          {compared.map((row) => (
            <Card key={row._id}>
              <Heading>{row.option.title}</Heading>
              <Copy>{row.option.store} · {row.option.priceFrom ? "From " : ""}₹{row.option.price.toLocaleString("en-IN")}</Copy>
              <Muted>Colour: {row.option.colour || "Not confirmed"} · Fabric: {row.option.fabric || "Not confirmed"}</Muted>
              <Muted>Requested size stock and shipping: not verified · Offers: eligibility not checked</Muted>
              <MerchantButton label="Open store to check details" url={row.option.url} affiliate={{reference:{kind:"saved",id:row._id},source:"saved"}}/>
            </Card>
          ))}
        </Card>
      )}
      {!!task.error && <Notice error>{task.error}</Notice>}
    </Screen>
  );
}

type WardrobeReview = FunctionReturnType<typeof api.wardrobeBuyingAI.review>;
function SavedDetails({ id, url }: { id: Id<"savedProducts">; url: string }) {
  const [open, setOpen] = useState(false);
  const [occasion, setOccasion] = useState("");
  const [reviewResult, setReviewResult] = useState<{ snapshot: string; value: WardrobeReview } | null>(null);
  const [notice, setNotice] = useState("");
  const history = useQuery(api.savedProducts.history, open ? { id } : "skip");
  const offers = useQuery(api.offerEvidence.forSaved, open ? { id } : "skip");
  const report = useQuery(api.priceIntelligence.get, open ? { id } : "skip");
  const wardrobe = useQuery(api.wardrobe.list, open ? {} : "skip");
  const refresh = useAction(api.productRefresh.refresh);
  const checkPrices = useAction(api.priceIntelligenceWorker.check);
  const review = useAction(api.wardrobeBuyingAI.review);
  const task = useTask();
  const snapshot = JSON.stringify(wardrobe?.map((item) => [item.id, item.details, item.available, item.lastWornAt, item.photoUrl])) ?? "";
  const freshReview = reviewResult?.snapshot === snapshot ? reviewResult.value : null;
  return (
    <>
      <Button secondary label={open ? "Hide price and wardrobe tools" : "Details, price checks & wardrobe fit"} onPress={() => setOpen(!open)} />
      {open && <Card>
        <Heading>Price and wardrobe tools</Heading>
        <Button secondary label="Refresh observed price" busy={task.busy} onPress={() => void task.run(async () => {
          const result = await refresh({ id });
          setNotice(result === "refreshed" ? "Store price refreshed. Size, shipping and checkout total still need checking." : "The store could not confirm a fresh price. The earlier observation remains dated.");
        })} />
        {!!notice && <Notice>{notice}</Notice>}
        <Button secondary label="Check this listing and other stores" busy={task.busy} onPress={() => void task.run(() => checkPrices({ id }))} />
        {!!history?.length && <>
          <Heading>Recorded prices</Heading>
          {history.map((row, index) => <Muted key={index}>{new Date(row.observedAt).toLocaleString("en-IN")} — {row.priceFrom ? "From " : ""}₹{row.price.toLocaleString("en-IN")}</Muted>)}
        </>}
        {report && <>
          <Notice>{report.note}</Notice>
          <Muted>Checked {new Date(report.checkedAt).toLocaleString("en-IN")}. Listed prices don’t include verified shipping or size-specific offers.</Muted>
          <Heading>Advertised offers</Heading>
          {report.offers.length ? report.offers.map((offer, index) => <Muted key={index}>{offer.kind === "cashback" ? "Cashback, not money off today" : offer.kind === "conditional" ? "Conditional offer" : "Advertised discount"}: {offer.text}</Muted>) : <Muted>No readable offer terms found; this does not mean none exist.</Muted>}
          {offers?.map((offer, index) => <Button key={index} secondary label={`Check terms: ${offer.label}`} onPress={() => void task.run(() => openMerchant(offer.sourceUrl))} />)}
          <Heading>Other-store options</Heading>
          {report.matches.length ? report.matches.map(({ option, identity }) => <Card key={option.url}>
            <Muted>{identity === "same_product" ? "Manufacturer identity matches; variant still needs checking" : "Similar alternative, not confirmed as the same product"}</Muted>
            <ProductCard product={option} affiliate={{reference:{kind:"comparison",id,url:option.url},source:"price-comparison"}}/>
          </Card>) : <Muted>No other-store options verified.</Muted>}
          {report.gaps.map((gap, index) => <Muted key={index}>{gap}</Muted>)}
        </>}
        <Heading>Check it with your wardrobe</Heading>
        <Field label="Buying for" value={occasion} onChangeText={(value) => { setOccasion(value); setReviewResult(null); }} placeholder="Office, a wedding, everyday…" maxLength={300} />
        <Button label="Review this purchase" busy={task.busy} disabled={!wardrobe?.length} onPress={() => void task.run(async () => {
          const value = await review({ id, occasion });
          setReviewResult({ snapshot, value });
        })} />
        {!wardrobe?.length && <Muted>Add confirmed clothes to your wardrobe before reviewing a purchase.</Muted>}
        {freshReview && <>
          <Copy>{freshReview.summary}</Copy>
          <MerchantButton url={url} affiliate={{reference:{kind:"saved",id},source:"wardrobe-review"}}/>
          {freshReview.pairs.map((pair, index) => <Muted key={index}>{pair.name}: {pair.reason}</Muted>)}
          {!!freshReview.similar.length && <Muted>You own similar pieces: {freshReview.similar.join(", ")}</Muted>}
          {freshReview.gaps.map((gap, index) => <Muted key={index}>{gap}</Muted>)}
        </>}
        {!!task.error && <Notice error>{task.error}</Notice>}
      </Card>}
    </>
  );
}
