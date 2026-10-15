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

## Photo onboarding, proportion estimates and virtual try-on — 12 October 2026

Signed-in web onboarding now saves usual size, language, per-item budget and fit/style/avoid preferences, then offers an optional full-length styling photo and a wardrobe step. It can be skipped or reopened. Existing taste and confirmed body descriptions are preserved when basic setup is saved.

With explicit consent, Gemini can suggest a tentative visible body/proportion description and conventional shape shorthand. The shopper edits and confirms it before recommendations use it. Photo suitability for try-on is separate from whether body proportions are visible: an acceptable photo may have no shape estimate. Pose, camera angle and clothing affect reliability; no measurements, size, health or attractiveness assessment is made. Clothing-only photo analysis continues to describe the garment, not its wearer.

The virtual fitting-room flow uses one wardrobe garment with a photo or one owned saved merchant product with an allowlisted image. It queues a Gemini image-editing request through Convex Workflow. Results are labelled AI visual previews, not size/fit verification. Generation is limited to five attempts in 24 hours while testing, without automatic provider retries. Output previews expire after seven days. Removing/replacing the portrait deletes its analysis and previews, clears an unchanged photo-derived description, and discards late output; manually edited preferences remain.

**Known gap:** the real development image-generation call returned HTTP 429 (provider quota). No real generated try-on image has been verified; UI and backend integration are built, with success/cleanup checked using controlled image fixtures. Image quota/access must be resolved before live try-on can be called working. Full outfit/layered previews, garment-fidelity evaluation, body-estimate quality across photos, phone upload and WhatsApp photo onboarding remain joint/future work.

## Buying intelligence and request input — 14 October 2026

Built in the requested order:
1. Saved-product price and advertised-offer checks read fresh merchant pages, refresh dated prices, search up to three other-store candidates and separate manufacturer-code identity matches from alternatives. Offer text is linked to its source; cashback and conditional offers are labelled separately. No offer is applied and no cheapest delivered total is claimed without exact variant, shipping, seller, returns and eligibility evidence. Failed checks preserve old dated observations. Missing readable terms do not mean no offers exist.
2. Wardrobe-aware buying reviews use a saved merchant product, confirmed inventory, optional styling preferences and a supplied occasion. Gemini proposes available owned pairings, flags similar owned pieces and explains possible usefulness or reuse. Invented IDs and unavailable pairings are removed; wardrobe/product changes during generation reject stale advice. This lives in the shortlist, not the daily feed. Photos are not visually compared.
3. Photo and voice inputs create editable chat drafts with explicit Gemini consent. A shopper reviews and sends the draft before the usual shared discovery flow runs. Photos search similar visible styles, not guaranteed exact products; they do not infer person details, size, brand or fabric composition. Voice supports short WebM/WAV/MP3/M4A uploads and up to 25-second recording on supported browsers. Raw input files and Agent messages are not stored by Chauffeur; sending the edited draft saves the usual text chat.
4. Account support includes a partial shopping-data snapshot and sign-out on all devices using Convex Auth session invalidation. The snapshot discloses its limits: latest 100 web messages, seven daily edits, preferences, wardrobe metadata and saved products; no image files, older history or AI logs. Password recovery/email verification remain pending an approved email-delivery connection. Full account deletion is still pending comprehensive application, file, authentication and AI-history cleanup; no unsafe partial deletion is presented as complete removal.

Known gaps: Amazon access is intermittent, exact manufacturer codes often absent, readable offer extraction is limited by merchant markup and location/account context. Exact-price/offer arithmetic remains conservative until verified checkout evidence exists. Real virtual try-on remains pending the separate Gemini image-generation quota. WhatsApp delivery/account linking and voice replies remain unconnected.

### Phone sign-in and guest discovery (15 October 2026)

The public `/app/` entry is now a discovery-only guest view. A homepage request runs one free-text preview; another message, saving or refining asks for phone sign-in. Other features remain authenticated. Guest request/results expire after 24 hours, retaining only a quota marker. Quotas are per browser capability, not per verified person, plus global hourly/daily limits.

Phone access uses Convex Auth's `msg91` credentials provider. Set `MSG91_WIDGET_ID`, `MSG91_WIDGET_TOKEN`, `MSG91_AUTHKEY` in Convex, never Vite or source control. CAPTCHA and SMS use the official MSG91 browser widget; Convex independently verifies the provider token and phone, then issues a 60-second single-use hashed grant. Send limits: one/minute, five/phone/hour, 100 total/day; five verification attempts and 15-minute challenge expiry. Phone accounts start fresh; legacy email records remain untouched, and password sign-in is disabled. Existing sessions can remain active until sign-out or expiry.

Production SMS and merchant availability must be checked separately: valid sign-in does not guarantee merchant pages are readable. See `TESTING_LEDGER.md`.
## Search coverage update — 15 October 2026

This section supersedes the earlier two-store/category descriptions above. Discovery attempts all ten stores shown on the website. Product readers currently support Flipkart, Amazon, Myntra, AJIO, Bonkers Corner, Bewakoof, SNITCH and NEWME. Meesho and The Souled Store do not currently supply readable priced product catalogues to these readers, so they return an unavailable status plus a direct-search link. Do not describe those two as working product integrations. Amazon access remains intermittent. No blocked page, login or CAPTCHA is bypassed.

The shared category vocabulary now includes common men’s/women’s apparel (including hoodies, sweatshirts, cardigans, blazers, coats, suits, co-ords, jumpsuits, leggings, joggers, tracksuits, kurta sets, lehengas, salwar, sleepwear, activewear and socks) and footwear including sneakers/trainers, shoes, boots, loafers, heels, sandals and flats. Existing accessories remain supported. This is a defined vocabulary, not a claim to cover every fashion item. Shoe sizes still require a size system; store size availability is not verified.

A category switch clears stale item-specific filters even if the model repeats them, including while asking for a missing shoe size. Explicit “any colour/material” also clears the corresponding old ranking preference, unless the shopper restates a specific exception. Sneaker/trainer synonyms match; children’s products and sneaker-themed T-shirts are excluded from adult footwear searches. Up to six results interleave evidence-ranked store candidates, with at most three per store. Available candidates from a store remain marked as found even if another store’s candidates take the six visible slots.

Merchant readers use public page JSON, listing data or Bonkers’ public predictive search. They use listed INR prices, never conditional coupon/member/app “best prices”. NEWME uses the lowest available web variant sale price and labels it as a starting price. Merchant product/image destinations are allowlisted. Search responses are bounded, timed out and isolated by store. All hard constraints remain enforced; empty catalogues, unreadable pages and no qualifying options are distinct.

Initial validation used an isolated local Convex deployment (3210/3211), with Vite on 5179. The search release was then combined with the latest phone/guest and required-onboarding changes from main. A cloud sneaker probe returned three Amazon products; Meesho, AJIO and Bewakoof returned HTTP 403, while Myntra, SNITCH and The Souled Store provided no readable catalogue. Local success therefore does not establish cloud availability. Store status remains visible and no sample products replace failures. See TESTING_LEDGER.md for the release checks.

SNITCH uses its public `api.snitch.com/products/search` catalogue with one bounded request (25 products), no merchant account, cookies or API credentials. Its website search uses `/search/<keyword>`; products use `/men-<type>/<handle>/<id>/buy`. The reader uses `selling_price`, this product’s `color` rather than other variant colours, active products, and available/unknown inventory. Known sold-out requested clothing sizes are excluded. Bare shoe sizes have no declared UK/US/EU system, so shoe size availability remains unverified. No delivery location or quick-delivery promise is inferred.

### Meesho reader investigation — 15 October 2026

Meesho's website loads products using a JSON POST to `/api/v1/products/search`, rather than including priced products in the initial search HTML. The reader now uses that same public request, with a fixed maximum of 20 returned catalogue rows, no account credentials/cookies and the existing timeout/response-size bounds. It accepts an explicit hero-product price when supplied; current minimum product prices are accepted only for single-product catalogues with matching product-image IDs. Multi-product minimum prices and ambiguous audience evidence are rejected. Product images and previously shown exclusions are supported; final size stock, shipping and checkout totals remain unverified.

The request and real product link/₹389 listed price were verified locally and in Chrome. Both development and production Convex deployments receive HTTP 403 from this product request, so Meesho is **not working for live shoppers**. The fallback remains an unavailable status plus a direct merchant search link. No browser service, proxy or new provider account has been added.

### Store access and Browserless experiment — 15 October 2026

A successful local reader is not a reliable production connection. AJIO, Bewakoof and Meesho have refused Convex requests with HTTP 403; Amazon is intermittent; Myntra/The Souled Store have returned unreadable catalogues. A no-match result is limited to the products actually inspected. Flipkart now reports unavailable if every attempted product page is blocked/unreadable, rather than disguising that as no matching products. Known sold-out products, readable nonmatches and already-shown exclusions remain distinct.

The builder approved a free Browserless access test. `storeBrowserProbe:run` is an **internal manual experiment only**, using a fixed invented sneaker query, one browser request, a 35-second deadline and a 5 MB response bound. It reports observed product-link evidence; it does not certify product prices, stock or completed search integration. It is not connected to shopper discovery and does not add automatic browser calls, proxies, CAPTCHA solving or retries. Configure `BROWSERLESS_API_KEY` only in the Convex server environment; never paste the key into chat or frontend settings. The builder supplied the Browserless key, now configured only in production server settings. Real local/provider and production checks are recorded below. A browser may load dynamic pages but can still be refused; individual store readers remain necessary.

Browserless comparison: the local app returned six real stores (Flipkart, Meesho, AJIO, Myntra, Bewakoof, SNITCH) without a browser service. Standard Browserless loaded product links for Flipkart, AJIO, Bewakoof and The Souled Store. NEWME returned unrelated products for the sneaker query; this is not matching inventory. Meesho loaded its shell without product cards, Myntra returned “Site Maintenance”, and Amazon returned a target HTTP 503. A production manual Browserless AJIO call returned 45 product links, verifying the server key/connection. Link evidence does not certify prices or stock. The initial probe was manual; the combined-store update below adds the approved automatic fallback.

### Combined store access — 15 October 2026

Discovery now combines direct readers with Browserless per store. It tries all ten stores directly first. If Flipkart, AJIO, Bewakoof or The Souled Store is unreadable, it can read one rendered listing through Browserless and run the same hard budget/category/audience/preferences checks. A readable no-match is not retried through the browser. Other stores do not use browser fallback because those access/price paths have not been demonstrated. Maximum four browser pages per discovery, two concurrently; no automatic retries, proxies or CAPTCHA solving. The existing free provider quota and account/user search limits still apply; no paid plan or global monthly spending guarantee is introduced.

AJIO and Bewakoof retain their exact page-JSON price readers. Flipkart's rendered fallback binds current displayed price, title, photo and `pid` to the same product card, excluding crossed-out/coupon prices. Souled Store binds product name, category, current offer price and image within one product link. These remain dated **listing starting prices**: exact size stock, material if absent, shipping and checkout totals are unverified. Changed/unreadable markup remains unavailable rather than becoming invented products. Existing direct results survive a failed browser read.

A real combined local sneaker check reached seven stores: Flipkart, Myntra, AJIO, Bewakoof, Meesho, SNITCH directly and The Souled Store through Browserless. The shortlist still shows at most six products; a store can have matches without occupying a visible slot. This does not establish seven production sources: live verification is separate. The FAQ discloses that only store search terms are sent to Browserless, not full chats or photos.

Production verification of the combined release: a fresh sneaker guest preview reached five stores (Flipkart, AJIO, Bewakoof, Souled Store and SNITCH), and a women's dress request reached six (Flipkart, AJIO, Bewakoof, Souled Store, Bonkers Corner and NEWME). Seven distinct stores across those requests is not seven matches for every query. Amazon, Myntra and Meesho remain unreliable/unavailable in production. Signed-in Chrome search, recovered product details/photos and a 390px layout check passed; see TESTING_LEDGER.md for exact evidence.


### India access recovery — 15 October 2026

The next access experiment returned real priced sneaker listings from Amazon, Myntra and Meesho using Browserless’s India residential route. A residential route sends the store request through an Indian household-network address. This observation supports using that route; it does not prove the exact reason the standard route was refused. Existing readers extracted 12 Amazon and 24 Myntra matches; the new scoped Meesho card reader extracted 17. Meesho uses each linked card’s title and current price heading, ignoring crossed-out/adjacent MRP and conditional offers; the price remains a listing starting price, with size stock unverified.

The combined policy above is expanded to seven eligible stores. Direct requests still run first; only unavailable Amazon, Myntra and Meesho use one India-routed browser listing each. The other four keep standard Browserless access. Bonkers Corner, SNITCH and NEWME keep direct readers only. Readable nonmatches never cause browser calls. Maximum seven browser pages per search, batches of two, a shared 90-second deadline from discovery start for browser recovery, no CAPTCHA solver or repeated browser attempts. Images, media, fonts and stylesheets are blocked to reduce transfer. The existing server key is reused; no paid plan was enabled. Browserless charges residential traffic at [6 units per MB](https://docs.browserless.io/rest-apis/proxies), so the free allowance can run out sooner. No global concurrency or monthly spend guarantee is implemented. Production verification follows in TESTING_LEDGER.md.


Local combined verification reached eight sneaker sources in 13.8 seconds, with six real product cards/photos checked in Chrome. All 129 tests, backend type checking and build passed. After the analytics release, the builder approved publication. The combined release is now deployed; production verification is recorded below.

### Basic PostHog analytics
Set the public project key as `VITE_POSTHOG_KEY` in `.env.local` and region endpoint as `VITE_POSTHOG_HOST` (`https://us.i.posthog.com` or `https://eu.i.posthog.com`) before `npm run deploy`. These are public browser settings, not a personal API key. Set the same values in production Convex as `POSTHOG_KEY` and `POSTHOG_HOST` for confirmed account-creation events. Without configuration, tracking stays off; localhost is excluded.

Events: `$pageview`, `landing_page_viewed`, `button_clicked`, `form_submitted`, `login_completed`, `signup_completed`, `onboarding_step_completed`, `onboarding_completed`. Signups are emitted only when Convex Auth creates a new account. Returning logins do not increment signups. Buttons use static action tags where supplied; other controls are counted as generic buttons/links without recording their text. App page changes count as pageviews; homepage section anchors do not.

Recording, heatmaps, automatic form capture, performance and exception capture are disabled. URL search terms, referrers and initial URL properties are removed before sending. No phone, name, profile details, photos or conversation text are sent. Signed-in activity uses the opaque Convex user ID. Existing visits/signups cannot be backfilled by this setup. Browser blockers may prevent client events; server signup delivery is best effort.

Suggested PostHog dashboard: pageviews by page, unique landing visitors, button clicks grouped by action, daily `signup_completed`, and an onboarding completion trend. Verify incoming events in PostHog after enabling the project key.


Production India-route verification: the women’s dress request (size M, budget ₹2,000) returned nine matched stores, including recovered Amazon, Myntra and Meesho. SNITCH had no qualifying women’s dress matches. The six-card shortlist contained Meesho ₹235, Flipkart ₹266, AJIO ₹270, Amazon ₹281.06, Myntra ₹389 and Bewakoof ₹699. Matched-store counts can exceed six visible picks; exact size stock and checkout totals remain unverified.


Signed-in production Chrome sneaker search (men, UK 8, ₹5,000, retained style preferences) reached eight stores: Flipkart, Amazon, Myntra, AJIO, Bewakoof, Meesho, Souled Store and SNITCH. Bonkers Corner and NEWME had no verified matches. Amazon ₹599, Myntra ₹1,499 and Meesho ₹438 appeared in the six-card shortlist. Loaded photos, Meesho detail panel and dated starting-price disclosures were checked. All ten configured stores returned matches across the women’s dress and men’s sneaker requests; this does not guarantee every store matches every query or remains reachable.

### Smarter discovery — 15 October 2026

See [DISCOVERY.md](DISCOVERY.md) for the current discovery agent and planned specialist handoffs. A budget now guides a preferred spending band, rather than always selecting the cheapest readable products: ₹5,000 favours ₹3,000–5,000, with explicitly described cheaper fallbacks. Selected brand is preserved and enforced. Discovery asks one relevant question based on the item and existing preferences; intended use, fit, occasion, pattern, colour, material and brand are supported. A broad search can pause once for clarification; a skip still searches, and optional post-result questions do not repeat. “Cheapest options” and “best within budget” switch ordering without silently changing the ceiling. Price is not treated as proof of quality; size stock and checkout totals remain unverified.


Live verification: the brand question → Nike flow returned six Nike choices at ₹3,497–4,248 under ₹5,000, preserving UK 8. Women's dresses under ₹3,000 now put five ₹1,840–2,948 picks before a cheaper fallback; men's casual shirts under ₹2,500 returned six ₹1,565–1,869 choices. All 136 tests, backend types and build pass. The changed flow is deployed and checked in Chrome; detailed evidence is in TESTING_LEDGER.md. This establishes budget/brand relevance, not product quality, authenticity or size stock.


Contextual question verification: Chrome now asks fit for a broad jeans request and intended use for a broad sneaker request. Choosing relaxed fit changes retrieval and ranking while retaining budget/size; a focused relaxed-jeans request searches directly and then offers an occasion question. Known or previously offered fields are skipped, and “No preference, show options” searches without inventing a preference. Confirmed intent evidence precedes store variety. Final suite: 141 tests, backend types/build pass; live evidence and limitations are in TESTING_LEDGER.md.


### Discovery keeps refining within the current chat

Jeans results now prioritise a colour follow-up once fit is known. A short answer such as “black” retains current budget, size and fit. Success requires explicit shopper confirmation through “These work for me”; displaying results keeps discovery open for refinement. New search/reset clears working chat context and does not automatically load past-chat taste. Saved size/budget settings remain starting defaults and saved history is retained. See DISCOVERY.md for the session boundary and evidence rules.

## Additional discovery sources · October 2026

Search now attempts twenty configured destinations. The additional ten, their public readers and access limitations are documented in [STORE_EXPANSION.md](docs/STORE_EXPANSION.md). Uniqlo access remains unverified for automatic discovery; unavailable stores retain a labelled direct search. This expands the candidate pool, keeps the six-card shortlist and retains the seven-page browser limit. New-source browser trials do not enable automatic paid recovery.
