import { test } from "node:test";
import assert from "node:assert/strict";
import { readConfig } from "../src/core/config";
import { discoveryView, requestText } from "../src/core/discovery";
import {
  finishPhoneSignIn,
  normalizePhone,
  providerValue,
} from "../src/core/otp";
import {
  JPEG_LIMIT,
  SOURCE_LIMIT,
  resizeTarget,
  validateJpeg,
  validateSource,
} from "../src/core/photos";
import { trustedMerchantUrl } from "../src/core/links";
import type { Conversation, Message } from "../src/core/contracts";

const current = (messages: Message[], pending = false): Conversation => ({
  messages,
  pending,
  requirements: { category: "jeans", budget: 3000, size: "32", fit: "relaxed" },
  pendingPhase: "idle",
  aiEnabled: true,
  discoveryStatus: "refining",
});
const product = {
  title: "Invented blue jeans",
  price: 1999,
  url: "https://www.myntra.com/jeans/test",
  colour: "blue",
  fabric: "unknown",
  observedAt: 1,
};
const results: Message = {
  id: "invented-result",
  role: "assistant",
  text: "Fictional fixture",
  result: { options: [product], stores: [], failed: false },
};
test("configuration never silently chooses production or an environment", () => {
  assert.throws(() => readConfig({}), /Choose development/);
  assert.throws(
    () => readConfig({ environment: "development" }),
    /EXPO_PUBLIC_CONVEX_URL/,
  );
  assert.throws(
    () =>
      readConfig({
        environment: "preview",
        url: "https://rare-chameleon-828.convex.cloud",
      }),
    /production backend/,
  );
  assert.throws(
    () =>
      readConfig({
        environment: "development",
        url: "https://rare-chameleon-828.convex.site",
      }),
    /convex.cloud/,
  );
});
test("reject credentials, remote HTTP, paths and local addresses without explicit opt-in", () => {
  for (const url of [
    "https://user:pass@test.convex.cloud",
    "http://test.convex.cloud",
    "https://test.convex.cloud/path",
    "https://evil.example",
    "http://127.0.0.1:3210",
  ])
    assert.throws(() => readConfig({ environment: "development", url }));
  assert.throws(() =>
    readConfig({
      environment: "preview",
      url: "http://127.0.0.1:3210",
      allowLocal: "true",
    }),
  );
  assert.equal(
    readConfig({
      environment: "development",
      url: "http://127.0.0.1:3210",
      allowLocal: "true",
    }).local,
    true,
  );
});
test("session storage is isolated by environment and deployment", () => {
  const dev = readConfig({
    environment: "development",
    url: "https://invented-dev.convex.cloud",
  });
  const preview = readConfig({
    environment: "preview",
    url: "https://invented-dev.convex.cloud",
  });
  const other = readConfig({
    environment: "development",
    url: "https://invented-other.convex.cloud",
  });
  assert.notEqual(dev.namespace, preview.namespace);
  assert.notEqual(dev.namespace, other.namespace);
});
test("question buttons use exact backend answer text, not labels", () => {
  const c = current([]);
  c.discoveryQuestion = {
    field: "colour",
    question: "Which colour?",
    choices: [
      {
        label: "Blue",
        value: "blue",
        text: "Blue jeans, keep my other requirements",
      },
    ],
  };
  assert.deepEqual(discoveryView(c).choices, [
    { label: "Blue", text: "Blue jeans, keep my other requirements" },
  ]);
  assert.equal(c.requirements.budget, 3000);
});
test("old result rows without a versioned handoff are readable", () => {
  const view = discoveryView(current([results]));
  assert.equal(view.fresh, true);
  assert.equal(view.canAccept, true);
});
test("a new user direction makes earlier results previous picks", () => {
  const view = discoveryView(
    current([
      results,
      { id: "new-user", role: "user", text: "Only black" },
      { id: "answer", role: "assistant", text: "Black selected" },
    ]),
  );
  assert.equal(view.fresh, false);
  assert.equal(view.canAccept, false);
  assert.equal(view.latest, results);
  assert.equal(view.replies[0].text, "Black selected");
});
test("pending, empty and explicitly satisfied states cannot be accepted again", () => {
  assert.equal(discoveryView(current([results], true)).canAccept, false);
  assert.equal(discoveryView(current([])).canAccept, false);
  const satisfied = current([results]);
  satisfied.discoveryStatus = "satisfied";
  assert.equal(discoveryView(satisfied).canAccept, false);
});
test("acceptance acknowledges the existing shortlist without making it previous picks", () => {
  const accepted = current([
    results,
    { id: "accept", role: "user", text: "These work for me" },
    { id: "ack", role: "assistant", text: "Shortlist confirmed" },
  ]);
  accepted.discoveryStatus = "satisfied";
  assert.equal(discoveryView(accepted).fresh, true);
  assert.equal(discoveryView(accepted).canAccept, false);
});
test("Hindi and Hinglish requests are retained and long input is rejected, not truncated", () => {
  assert.equal(
    requestText("  नीली जीन्स, budget 2000  "),
    "नीली जीन्स, budget 2000",
  );
  assert.throws(() => requestText("a".repeat(1001)));
  assert.throws(() => requestText(" "));
  assert.throws(() => requestText("a".repeat(701), 700));
});
test("phone proof must be verified on backend before Convex Auth receives a grant", async () => {
  const calls: string[] = [];
  await finishPhoneSignIn(
    "challenge",
    "provider-proof",
    async (id, token) => {
      calls.push("server");
      assert.equal(id, "challenge");
      assert.equal(token, "provider-proof");
      return "single-use-secret";
    },
    async (args) => {
      calls.push("auth");
      assert.deepEqual(args, {
        challenge: "challenge",
        secret: "single-use-secret",
      });
    },
  );
  assert.deepEqual(calls, ["server", "auth"]);
});
test("wrong, expired and empty server proof never opens a session", async () => {
  let signedIn = false;
  await assert.rejects(() =>
    finishPhoneSignIn(
      "challenge",
      "proof",
      async () => {
        throw new Error("Expired");
      },
      async () => {
        signedIn = true;
      },
    ),
  );
  await assert.rejects(() =>
    finishPhoneSignIn(
      "challenge",
      "proof",
      async () => "",
      async () => {
        signedIn = true;
      },
    ),
  );
  assert.equal(signedIn, false);
});
test("leaving sign-in while verification runs prevents late sign-in", async () => {
  let active = true,
    signedIn = false;
  await finishPhoneSignIn(
    "challenge",
    "proof",
    async () => {
      active = false;
      return "secret";
    },
    async () => {
      signedIn = true;
    },
    () => active,
  );
  assert.equal(signedIn, false);
});
test("provider error text never becomes an access token or request ID", () => {
  assert.throws(() =>
    providerValue({ type: "error", message: "bad code" }, "token"),
  );
  assert.throws(() => providerValue({ type: "success" }, "request"));
  assert.equal(
    providerValue({ type: "success", message: "request-123" }, "request"),
    "request-123",
  );
  assert.equal(
    providerValue(
      {
        type: "success",
        "access-token": "proof",
        message: "request-123",
        invisibleVerified: true,
      },
      "token",
    ),
    "proof",
  );
});
test("phone input rejects invalid numbers before reserving a server attempt", () => {
  assert.throws(() => normalizePhone("123"));
  assert.throws(() => normalizePhone("1234567890"));
  assert.equal(normalizePhone("99999 00000"), "9999900000");
});
test("photo source limits reject huge or unreadable images", () => {
  assert.throws(() => validateSource(SOURCE_LIMIT + 1, 3000, 4000));
  assert.throws(() => validateSource(100, 0, 0));
  validateSource(SOURCE_LIMIT, 3000, 4000);
});
test("image sizing preserves portrait and landscape ratios without upscaling", () => {
  assert.deepEqual(resizeTarget(3000, 4000), { width: 750, height: 1000 });
  assert.deepEqual(resizeTarget(4000, 3000), { width: 1000, height: 750 });
  assert.deepEqual(resizeTarget(320, 480), { width: 320, height: 480 });
});
test("JPEG submission respects the stricter base64 cap and rejects raw PNG/HEIC/data URIs", () => {
  const bytes = Buffer.alloc(697_500);
  bytes.set([0xff, 0xd8, 0xff]);
  assert.equal(validateJpeg(bytes.toString("base64")), 697_500);
  const tooLarge = Buffer.alloc(JPEG_LIMIT);
  tooLarge.set([0xff, 0xd8, 0xff]);
  assert.throws(() => validateJpeg(tooLarge.toString("base64")), /too large/);
  for (const input of [
    "data:image/jpeg;base64,/9j/",
    "iVBORw0K",
    "HEIC",
    "/9j/\n",
  ])
    assert.throws(() => validateJpeg(input));
});
test("merchant links reject lookalike hosts and non-web schemes", () => {
  for (const url of [
    "https://amazon.in.evil.example/x",
    "https://amazon.in@evil.example",
    "javascript:alert(1)",
    "file:///photo.jpg",
    "http://myntra.com",
    "https://evil.example/?store=myntra.com",
  ])
    assert.throws(() => trustedMerchantUrl(url));
  assert.equal(
    trustedMerchantUrl("https://www.myntra.com/jeans/123"),
    "https://www.myntra.com/jeans/123",
  );
});
