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

Flow: `hi` → ask for clothing type → ask for maximum budget → ask for size → check Flipkart and Amazon → reply with up to three product links per reachable store, prices, colour and fabric. A combined request such as `blue cotton kurta size M under 1000` skips questions already answered. `reset` starts again. A shopper can change colour, material, size or budget after a result. Without GEMINI_API_KEY this v0 uses explicit parsing rules. With the key configured, both channels use the shared Gemini/Convex Agent planning flow; voice is not connected.

Supported types: women's kurtas, dresses, tops and sarees. Material and colour requests are checked against merchant specifications or live listing titles; missing data cannot satisfy an explicit requirement. Size is collected and disclosed as unverified: this version does not select or verify size variants. Prices are dated observations, excluding any unverified checkout charges. No saved/sample catalogue substitutes for failed live access. Flipkart reads live product pages; Amazon reads live search cards when accessible. Each active store reports matched, no matches or unavailable independently. Meesho is paused after cloud access failures; it is not requested or displayed in the discovery chat. Its reader is retained for a future trial. Amazon access can still fail, in which case a direct store-search link is shown.

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

The signed-in `/app/` page is now a WhatsApp-like discovery chat. It uses the same conversation planner as the WhatsApp backend, quick reply buttons, typed refinements, live product cards and a reset action. Chat state is saved in Convex; saved size and budget seed new conversations. The header distinguishes basic rule-guided chat from Gemini mode. `app/LiveSearch.jsx` submits messages to authenticated `conversations:post` and subscribes to saved messages through `conversations:current`. The shared discovery workflow searches only when the required details are ready. Search runs are limited per user and overlapping runs are blocked.

Store requests run independently, so an unavailable store cannot discard another store's results. The chat shows each store's access/matching status and offers direct search links for missing results. Product cards identify their store, observation time, product-page or listing source, and starting-price status. Requested size availability remains unverified; no checkout is exposed and no sample products substitute for failed access.

On 8 October 2026, the original production form returned three live Flipkart products. The subsequent chat update passed 23 checks and backend type checking and pushed successfully to development. A local browser conversation accumulated clothing, budget and size across separate messages and returned live Flipkart results from Convex. Meesho's public search worked from the local terminal but returned HTTP 403 from Convex; Amazon returned HTTP 503. Amazon extraction was first checked with fixtures and then verified with live production results after correcting the title reader. The chat was deployed with `npm run deploy`; production browser searches returned live Flipkart results and correctly reported missing results from other stores. Separate typed replies, budget refinement, reset and the 390px phone layout were checked. Direct Amazon and Meesho searches opened real results in the user browser. Amazon cards place brand and product name in separate headings; the reader now uses the product heading. After fixing the Amazon heading reader, a production browser request for kurta, size M, under ₹1,000 returned three Flipkart and three Amazon options. Amazon prices were ₹284, ₹289 and ₹335 from current search rows; colour was not confirmed and starting-price/size disclosures were shown. Amazon access remains intermittent. Meesho still returned HTTP 403 from Convex; reliable cloud discovery there remains unverified. A backend browser capable of accessing these stores is the remaining bridge; none is configured or hosted by this app.

### Shared discovery conversations

`/app/` stores private messages, requirements and product results in Convex. Reload resumes the chat; Start again begins a fresh session using saved size and budget. Both web and WhatsApp use the same conversation functions and discovery workflow, but phone/account linking and real WhatsApp delivery are not configured. Product cards show store-sourced previews where available. Show more skips seen products; Not for me excludes that product for the current conversation; None of these asks what to change. Gemini planning and explicit taste memory are enabled with a server-side key in development and production; real Hinglish replies have been checked. Exact-product comparison and offer intelligence remain planned in `IMPLEMENTATION_PLAN.md`.

Verification on 8 October: 26 checks passed, including private saved conversations, profile defaults and explicit overrides, rejected-product exclusion, non-repeating batches, stale-result suppression and the simulated WhatsApp workflow saving into the shared conversation tables. Development and production deployments succeeded. The live browser used the test account’s saved size L and ₹2,000 budget after a Kurta quick reply, displayed three Flipkart product photos, accepted a rejection and returned three different products on Show more. Reload retained both results and feedback. Amazon was unavailable during this check and showed a fallback search link. None of these was checked locally and in production; the 390px phone layout had no horizontal overflow; richer learned taste and actual WhatsApp delivery remain unverified.

### Gemini free-text discovery

The backend uses Convex Agent with the Google AI SDK. Configure `GEMINI_API_KEY` separately in the development and production Convex environment settings. Never put it in a `VITE_` variable, source code, browser storage or chat. Optional `GEMINI_MODEL` overrides the default stable `gemini-3.1-flash-lite`; this model supports structured outputs according to [Google’s model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite). The builder explicitly selected Gemini keys; this overrides the skill’s default gateway route.

With a key, each free-text turn uses Gemini to interpret the conversation, current size/budget, language, taste and numbered latest results. The key and user identity are not included in the model prompt. Text history, preferences and product evidence are sent to Gemini; only the current shopper’s bounded context is used, with cross-thread search disabled. Normal replies, refinement, missing-detail questions and taste changes flow through the same web/WhatsApp workflow. Reset and direct product rejection remain deterministic controls. A missing key keeps the working basic chat and displays “AI not connected yet.” Model errors are shown honestly and do not silently switch to keyword rules.

New requirements include occasion, style, fit, pattern, sleeve and length. These guide search/ranking; explicit must-have attributes require store evidence. Gemini plans requests but cannot invent product cards, make purchases or approve prices. Backend checks budget/category/colour/fabric/mandatory terms, excludes known disliked details, ranks candidates by confirmed preference matches, and shows reasons plus preferences that remain unverified. The candidate pool is bounded: at most 12 Flipkart product pages and up to 12 Amazon rows; the displayed batch remains up to three per store. Soft style searches can include a broader query while hard requirements stay intact. Concise queries de-duplicate merchant style terms; negative phrases become dislikes instead of mandatory positive words. Plain/solid and embroidery/embroidered synonyms match store evidence. Both stores try bounded broad candidates alongside style searches, without dropping hard requirements. Ordinary styles stay soft unless the shopper explicitly asks for a must-have. Richer relevance still needs live evaluation, better merchant attributes and wider catalogue coverage.

Feedback such as “second one is too plain” references the latest numbered batch and records its product and reason. Session taste improves the next result. Explicit “remember my preferences” saves the current size, budget and taste for future web visits. “Forget my remembered preferences” clears taste; saved size/budget stay editable in account settings. Changing account settings preserves remembered taste. WhatsApp stores taste in its conversation; linking it to a web account is still pending.

Calls have a 30-second model timeout, no automatic model retry, bounded history/output and recorded token usage. Web model turns are limited to 12 per minute and one active turn; basic searches retain the three-per-minute limit. Store access is still intermittent. Price comparisons and offer calculations are not implemented.

Real Hinglish reply and style-search checks are recorded below. Wider quality evaluation still needs English/Hindi requests, missing-detail questions, a numbered refinement, rejection, remembered taste across reset, a budget override and an unavailable-model case. Automated checks mock model responses; those validate wiring and constraints, not real model understanding.

### Website and style verification — 11 October 2026

Reviewed the live [Phia](https://phia.com/) and [Wishi](https://wishi.me/) sites for clear shopping entry points and explanation of the experience. The homepage now leads to live discovery and keeps planned features and the fictional demo clearly separated. Its example switcher, FAQ and request-to-sign-in handoff were checked locally. A 390px phone review showed no horizontal overflow. Homepage styles live in `homepage.css`, isolated from the demo and account styles.

A real development request, “Office ke liye simple kurta chahiye. Size M, ₹1,500 tak. Heavy embroidery nahi.”, returned three solid Flipkart kurtas priced ₹203, ₹221 and ₹227, with product photos and evidence-backed reasons. Amazon was inaccessible during that run and showed a direct search link. Unknown occasion suitability and absence of heavy embroidery stayed disclosed. Model-generated mandatory filters were then further guarded so ordinary simple/understated requests remain preferences.

Production verification after deployment: the refreshed homepage and request handoff through sign-in worked. The same Hinglish style request returned three solid Flipkart options at ₹221, ₹251 and ₹270. The stored plan kept budget ₹1,500 and size M, had no mandatory style filters, and stored heavy embroidery as an avoided preference. Amazon was unavailable and showed its fallback link. All 35 automated checks, the production build and backend type checks passed.

The homepage journey uses native scrolling and clickable steps, with a compact mobile version and reduced-motion support. Its store prices and clothing drawings are illustrations, not live shopping results.


## Saved shopping tools — 11 October 2026

The signed-in `/app/` page now provides Save, More like this and I like this actions on verified result cards. Saving records the existing server-side merchant observation rather than accepting a price from the browser. Your private shortlist survives new chats and reload; select up to three items for a side-by-side comparison. This can compare different clothes and is not a cheapest-same-item promise. Refresh price attempts another dated store read; failures leave the old observation intact. Recorded prices keep up to 30 observations per saved URL.

The account panel shows explicitly remembered taste and supports forgetting taste independently of size/budget, plus clearing all saved profile preferences. Previous chats are read-only within the newest 300 messages/up to 20 sessions, with the latest 80 messages per selected session. Stop this request invalidates the current result; it cannot undo an already-started store request or model charge.

`convex/comparisonRules.ts` requires manufacturer identity, exact variant, stock, fresh full delivered totals, seller and returns before reporting comparable savings. `convex/offerRules.ts` computes eligibility-aware benefits with expiry, minimums, caps and cashback separated, and refuses unknown stacking. Offer records can only be prepared internally; no live offer reader or trusted browser worker is connected. Current saved-card comparisons and offer views show the missing evidence instead of fabricated totals.

WhatsApp now prepares up to six trusted product image messages after the text results, with per-option send claims and uncertain-send suppression. Merchant photos might be inaccessible to Meta, so this is only fixture-tested until the Chauffeur test number is connected. Existing Saathi settings remain untouched. Web-to-phone identity linking is not implemented.

Password recovery has an honest unavailable state. Account deletion, checkout/payment/order execution, tracking/returns, voice/photo interpretation and price alerts remain explicit placeholders. No additional service, merchant partnership or payment connection was introduced.

See [TESTING_LEDGER.md](TESTING_LEDGER.md) for what was actually tested and what we must check together.

### Daily personalised feed

`/app/` includes an opt-in daily edit. First generation starts immediately, then Convex checks due subscriptions every 15 minutes for the next 9 am India-time edition. The current chat supplies the need and taste; no new daily LLM call is required. Feed records are private and idempotent by owner/day. The existing workflow component runs store checks without automatic external-call retries.

Up to six matching items are shown. Three relevant saved Flipkart listings can be refreshed for dated listed-price changes. This is not exact-variant checkout comparison or sale/offer detection. Those readers and proactive WhatsApp delivery remain pending. Tests are in `convex/dailyFeed.test.ts`, `feedRules.ts` and `rankingVariety.test.ts`; real overnight scheduling and a genuine observed price drop need joint verification.

## Wardrobe outfits — 12 October 2026

The signed-in web app supports a private wardrobe with optional photos and confirmed clothing details, editing, laundry availability and wear history. Gemini suggests up to three outfits for a free-text daily plan using only available owned pieces; invented items, incomplete outfits and stale inventory results are rejected. Photos are previews, not AI image analysis. Outfit recommendations currently live in their own web section; WhatsApp delivery and wardrobe-aware shopping-feed ranking remain future work.

## AI wardrobe photos and styling context — 12 October 2026

Photo analysis now sends a compressed clothing image to Gemini and stores a private, editable draft. It extracts the garment group and specific type (such as gown, jeans or blouse), colour, pattern, cut and tentative occasion suggestions. Brand is retained only when the model supplies readable label evidence; fabric composition stays unknown without a readable label. AI guesses require shopper review: confirmed details and the original AI reading are stored separately with the clothing photo. Abandoned drafts expire after 24 hours; failed analysis deletes the uploaded image. Manual entry remains available.

Optional self-described body/proportion, fit, style and avoid preferences are saved privately and can be cleared. They guide wardrobe outfit generation and the web shopping conversation together with owned clothing details. Current occasion/size/budget requests take priority; this is not a fit or attractiveness guarantee. No body type is inferred from images. Wardrobe-based daily-feed ranking, visual analysis of merchant candidates, exact purchase-gap detection, automatic cross-channel identity and WhatsApp wardrobe photo intake remain future work.
