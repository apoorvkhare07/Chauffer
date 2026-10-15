import { useState } from "react";
import { Image, View } from "react-native";
import type { Product } from "../core/contracts";
import { openMerchant } from "../platform/links";
import { useTask } from "../hooks/useTask";
import { Button, Card, Copy, Heading, Muted, Notice, Row, colors } from "./ui";
export function ProductCard({
  product,
  save,
  saved,
  feedback,
  pairing,
}: {
  product: Product;
  save?: () => Promise<unknown>;
  saved?: boolean;
  feedback?: (text: string) => void;
  pairing?: string;
}) {
  const task = useTask(),
    [imageFailed, setImageFailed] = useState(false),
    [details, setDetails] = useState(false);
  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      {product.imageUrl && !imageFailed ? (
        <Image
          source={{ uri: product.imageUrl }}
          accessibilityLabel={product.title}
          resizeMode="contain"
          style={{ width: "100%", height: 230, backgroundColor: colors.white }}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View
          style={{
            height: 100,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.soft,
          }}
        >
          <Muted>Photo unavailable</Muted>
        </View>
      )}
      <View style={{ padding: 16, gap: 10 }}>
        <Muted>{product.store || "Store listing"}</Muted>
        <Heading>{product.title}</Heading>
        <Copy style={{ fontFamily: "Inter_600SemiBold", fontSize: 22 }}>
          {product.priceFrom ? "From " : ""}₹
          {product.price.toLocaleString("en-IN")}
        </Copy>
        <Muted>
          Listed{" "}
          {new Date(product.observedAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
          . Check the final price, size stock and fit on the store.
        </Muted>
        {!!product.reasons?.length && <Copy>{product.reasons.join(" ")}</Copy>}
        {pairing && <Notice>{pairing}</Notice>}
        <Row>
          <Button
            label="Open on store"
            onPress={() => void task.run(() => openMerchant(product.url))}
          />
          {save && (
            <Button
              secondary
              label={saved ? "Saved" : "Save"}
              disabled={saved}
              busy={task.busy}
              onPress={() => void task.run(save)}
            />
          )}
        </Row>
        <Button
          secondary
          label={details ? "Hide details" : "Details & feedback"}
          onPress={() => setDetails(!details)}
        />
        {details && (
          <>
            <Copy>
              {[
                product.brand,
                product.colour,
                product.fabric,
                ...(product.attributes ?? []),
              ]
                .filter(Boolean)
                .join(" · ") || "No further details were verified."}
            </Copy>
            {product.unknownPreferences?.map((text, index) => (
              <Muted key={index}>{text}</Muted>
            ))}
            {feedback && (
              <Row>
                <Button
                  secondary
                  label="More like this"
                  onPress={() => feedback("Show me more like this")}
                />
                <Button
                  secondary
                  label="Not for me"
                  onPress={() => feedback("Not for me")}
                />
              </Row>
            )}
          </>
        )}
        {task.error && <Notice error>{task.error}</Notice>}
      </View>
    </Card>
  );
}
