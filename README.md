# Chauffeur

A Vite + React marketing website with a separately linked shopping demo.

## Run locally

From this folder, run `npm install` then `npm run dev`. Vite prints the local address. The default port is 5174; if that port is busy, use the address Vite prints.

- `/` — the public website. `App.jsx` and `main.jsx`.
- `/app/` — email/password sign-in, a live discovery chat and saved preferences. `app/main.jsx`.
- `/demo/` — the shopping demo. `ShoppingDemo.jsx` and `demo/main.jsx`.

These are three separate HTML pages and React entry points. Website links can pass a sample request to `/demo/?q=...`. The demo's shopping state never runs on the website.

## Check and build

- `npm test` — catalogue/order rules, a homepage-render check and Convex backend access/approval tests.
- `npm run build` — builds all three pages into `dist/` using the three entries in `vite.config.js`.

The demo contains eight fictional clothing items. No real purchases, live AI, store accounts, backend, voice or WhatsApp are connected. Preferences and orders last only until the demo page reloads.

The site uses original generated brand art (`public/images/style-gallery.jpg`). It is not product photography. Art direction and exact prompt live under `design/`. Fonts are self-hosted with their licenses under `public/fonts/`.

Hosting must use the project's Convex static hosting workflow. The website and backend are deployed to production at https://rare-chameleon-828.convex.site. Accounts and saved preferences use the production database. Development uses a separate deployment.

## Production hosting

Run `npm run deploy` to build against the production backend, push Convex functions and upload the website. Pushing to GitHub does not deploy. The homepage is `/`, accounts are `/app/` and the fictional demo is `/demo/`; the latter two redirect to their own `index.html` files while preserving query strings. Unknown paths return 404. Convex Auth routes stay at their original root paths.

Production sign-in keys are separate from development and live only in Convex deployment environment settings. For a fresh production deployment, configure `JWT_PRIVATE_KEY`, `JWKS` and `SITE_URL` before deploying. Do not rotate existing keys during routine releases.

## Convex backend foundation

The browser-purchase roadmap is in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

- `convex/profiles.ts`: private saved preferences, editing and clearing.
- `convex/purchases.ts`: trusted backend purchase reviews, exact approval and revocation. Approval does not execute a purchase.
- `npm run dev:backend`: push backend changes to Chauffeur's selected development deployment.
- `npm run test:backend`: exercise backend rules in Convex's local test simulator.
- `npm run typecheck:backend`: check backend types.

The Convex project is separate from the parent workspace. Local deployment settings live in ignored `.env.local`. The public functions reject callers without a verified identity; Convex Auth is connected on `/app/` with email/password account creation, sign-in and sign-out. Saved preferences belong to the stable user ID, not an individual session. Email verification and password recovery are not configured; this is an early development account flow. No browser worker or payment service is configured. Do not expose the internal review preparation function as a public client endpoint.

## Authentication configuration

`convex/auth.ts`, `auth.config.ts` and `http.ts` configure Convex Auth. The schema includes the library's auth tables. `JWT_PRIVATE_KEY` and `JWKS` are deployment-only secrets; never put them in frontend environment variables or commit them. `SITE_URL` should match the app origin when adding redirects or email flows. Password-only sign-in does not require a redirect origin. Use the address printed by Vite if port 5174 is occupied.

Auth dependencies are pinned, with `@auth/core` on patched version 0.41.3. No email sender, Google credentials or external authentication service is configured. Public functions require sign-in; the fictional demo remains independent.

## WhatsApp discovery v0

The discovery backend accepts signed Meta WhatsApp callbacks at `/whatsapp`. It is separate from the fictional web demo and has no checkout path. Connection to a WhatsApp number requires the settings below; deployment alone does not connect a number.

Flow: `hi` → ask for clothing type → ask for maximum budget → ask for size → check Flipkart, Amazon and Meesho → reply with up to three product links per reachable store, prices, colour and fabric. A combined request such as `blue cotton kurta size M under 1000` skips questions already answered. `reset` starts again. A shopper can change colour, material, size or budget after a result. This v0 uses explicit parsing rules, not an LLM; flexible conversation and voice are not connected.

Supported types: women's kurtas, dresses, tops and sarees. Material and colour requests are checked against merchant specifications or live listing titles; missing data cannot satisfy an explicit requirement. Size is collected and disclosed as unverified: this version does not select or verify size variants. Prices are dated observations, excluding any unverified checkout charges. No saved/sample catalogue substitutes for failed live access. Flipkart reads live product pages. Meesho reads its public live search response and labels prices as starting prices; Amazon reads live search cards when accessible. Each store reports matched, no matches or unavailable independently. Amazon and Meesho blocked the tested Convex cloud requests (HTTP 503 and 403); their direct store-search links remain available. This does not establish reliable live discovery on those stores.

Everything runs on Convex using direct live page requests, without a separate browser service or a local Mac worker. `convex/liveDiscovery.ts` runs in Convex's Node environment because it parses HTML. A successful browser trial does not guarantee these direct requests will continue to work; merchant markup or access restrictions can break the extractor. The no-results/access-failure replies explain that honestly.

Configuration values go in **Convex deployment environment settings**, never the frontend or Git:

| Setting | Purpose |
| --- | --- |
| `WHATSAPP_PHONE_ID` | The selected Meta sender's phone number ID |
| `WHATSAPP_TOKEN` | Meta access token with permission to send from that number; temporary test tokens expire |
| `META_APP_SECRET` | Verifies the signature on incoming callbacks |
| `WHATSAPP_VERIFY_TOKEN` | A random private string shared with Meta when verifying the callback |
| `WHATSAPP_TEST_RECIPIENTS` | Comma-separated approved test phone numbers, country code included, no spaces or `+` required |

Set these for the chosen deployment. The intended production callback is `https://rare-chameleon-828.convex.site/whatsapp`; development uses `https://mellow-spaniel-636.convex.site/whatsapp`. In Meta's WhatsApp configuration, verify the chosen callback and subscribe to `messages`. Never replace another app's callback without the builder approving that switch. At inspection on 7 October 2026, the open Meta app was Saathi and its callback pointed to Saathi, not Chauffeur. That connection was left unchanged.

Meta's configuration page displayed a notice that unpublished apps receive dashboard test events rather than production message data. Verify actual inbound delivery for the selected test setup; a dashboard event is not proof that a real person's `hi` reaches this backend. The backend additionally restricts replies to the configured test recipients and the recent inbound reply window.

`convex/discoveryWorkflow.ts` uses Convex Workflow to coordinate replies and live discovery. Incoming Meta message IDs are deduplicated; requests are limited per sender; old results are suppressed when the conversation changes. Outgoing message claims prevent repeat sends. An ambiguous send timeout is recorded as uncertain and is not automatically retried. Meta delivery/read callbacks update known outgoing message records. None of the WhatsApp tables or discovery actions are public client functions.

Checks: `npm test` includes the hello-to-options workflow with fake merchant and Meta responses, wrong-recipient/signature checks, repeat-message/send checks and product-filter checks. This simulated workflow is distinct from a real WhatsApp test. A development Convex action also returned three actual blue cotton kurta options under ₹1,000; size availability was not checked. Once Meta is connected, send `hi` from an approved test recipient, then `blue cotton kurta size M under 1000`, and confirm the greeting and live links arrive on WhatsApp.

Production verification on 7 October: `npm run deploy` succeeded; homepage, account and demo routes returned HTTP 200. A production discovery call initially failed, then a later call returned three actual blue cotton options. The first failure's cause was not captured; this is intermittent access, not established reliability. Internal failures now retain a short diagnostic reason, without sending technical errors to shoppers. Opening one returned product in the signed-in browser showed ₹380 while the live anonymous page and its structured offer showed ₹342. Replies therefore explicitly disclose that prices were checked without sign-in and can differ by account/location. The WhatsApp endpoint rejects verification without its secret and returns HTTP 503 for incoming messages until all required deployment settings are present. No real WhatsApp send has been verified for Chauffeur yet.

## Web discovery test screen

The signed-in `/app/` page is now a WhatsApp-like discovery chat. It uses the same clothing/budget/size parser as the WhatsApp backend, quick reply buttons, typed refinements, live product cards and a reset action. Chat state clears on reload; saved account preferences remain separate. This is a rule-guided conversation, not an LLM. `app/LiveSearch.jsx` calls the authenticated `liveDiscovery:webSearch` action only when the required details are ready. Search runs are limited per user and overlapping runs are blocked.

Store requests run independently, so an unavailable store cannot discard another store's results. The chat shows each store's access/matching status and offers direct search links for missing results. Product cards identify their store, observation time, product-page or listing source, and starting-price status. Requested size availability remains unverified; no checkout is exposed and no sample products substitute for failed access.

On 8 October 2026, the original production form returned three live Flipkart products. The subsequent chat update passed 23 checks and backend type checking and pushed successfully to development. A local browser conversation accumulated clothing, budget and size across separate messages and returned live Flipkart results from Convex. Meesho's public search worked from the local terminal but returned HTTP 403 from Convex; Amazon returned HTTP 503. Amazon extraction was first checked with fixtures and then verified with live production results after correcting the title reader. The chat was deployed with `npm run deploy`; production browser searches returned live Flipkart results and correctly reported missing results from other stores. Separate typed replies, budget refinement, reset and the 390px phone layout were checked. Direct Amazon and Meesho searches opened real results in the user browser. Amazon cards place brand and product name in separate headings; the reader now uses the product heading. After fixing the Amazon heading reader, a production browser request for kurta, size M, under ₹1,000 returned three Flipkart and three Amazon options. Amazon prices were ₹284, ₹289 and ₹335 from current search rows; colour was not confirmed and starting-price/size disclosures were shown. Amazon access remains intermittent. Meesho still returned HTTP 403 from Convex; reliable cloud discovery there remains unverified. A backend browser capable of accessing these stores is the remaining bridge; none is configured or hosted by this app.
