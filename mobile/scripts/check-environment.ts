import { load } from "@expo/env";
import { readConfig } from "../src/core/config";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { randomUUID } from "node:crypto";
async function main() {
  load(process.cwd());
  const config = readConfig({
    environment: process.env.EXPO_PUBLIC_APP_ENV,
    url: process.env.EXPO_PUBLIC_CONVEX_URL,
    allowLocal: process.env.EXPO_PUBLIC_ALLOW_LOCAL_BACKEND,
  });
  if (config.environment === "production")
    throw new Error("This probe is for development or preview only.");
  const client = new ConvexHttpClient(config.url, { logger: false });
  // Read-only proof of the public contract. Creates no guest search or SMS.
  await Promise.race([
    client.query(api.guestSearch.current, {
      token: randomUUID() + randomUUID(),
    }),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Backend did not respond within 10 seconds.")),
        10_000,
      ),
    ),
  ]);
  process.stdout.write(
    `Connected read-only to ${config.environment}: ${config.url}. No search, SMS or upload sent.\n`,
  );
}
main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message.split("\n")[0] : "Environment check failed."}\n`,
  );
  process.exitCode = 1;
});
