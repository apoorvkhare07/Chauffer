# Chauffeur

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Vite + React, requested by the user. Convex is the only authorized backend, authentication and hosting provider. Changes are checked locally and deployed to the existing Convex static host.

## Users
People shopping for women's clothing across Indian marketplaces. More specific audience research is open.

## Product Purpose
Build a WhatsApp-first, voice-first AI shopping agent that understands requests, personalises recommendations, remembers user preferences, helps compare prices and offers, and follows orders through tracking and return reminders. A voice-led app is part of the vision, not a confirmed release.
The current separate web demo turns a shopping request into a comparable shortlist, with price, delivery, size and return information together.

## Capabilities and Constraints
Existing prototype searches eight fictional products across sample Amazon, Flipkart and Meesho catalogues. English, Hindi and Hinglish keyword requests are supported. Demo approval, cancellation, simulated delivery and return requests work. Size preferences and orders last only for the current session. This fictional demo has no live store connections, real AI, payments, WhatsApp, voice or backend; live discovery and saved accounts are separate at `/app/`.
The user approved proceeding with a public homepage and a working shopping demo, then clarified that they must remain separate, linked pages. The homepage lives at / and the demo at /demo/, with separate HTML files and React entry points. Preserve the existing shopping behavior while moving the interface to React. No fabricated customer, review, savings or availability claims.
The user requested the website describe the broader offerings above and use Hermes Agent as a section-structure reference. These are planned capabilities; describing them does not authorize claiming they are connected or building integrations in this website-content iteration. Pricing/offers help is interpreted as shopping price and promotion comparisons. Subscription pricing remains undecided; the sample demo is free.

## Brand Commitments
Chauffeur. A modern AI website with a desi or Renaissance quirk. Reference videos: Pallet Ross website animation on Pinterest (737183032788146890), Digital Art Website by QClay on Dribbble (25807235), Pinterest pin 341218109286424063. First two observed in Chrome; the third video loaded controls but its pixels remained blank.

## Evidence on Hand
engine.js and engine.test.js contain the existing working demonstration. Reference videos favor oversized type, spacious modern layouts and animated artwork. No customer evidence or live merchant integrations.

## Account foundation

The separate `/app/` page connects Convex Auth email/password account creation, sign-in, sign-out and persistent size, budget and language preferences to Chauffeur's own Convex project, with separate development and production databases. The homepage and fictional demo remain separate. Email verification and password recovery are not connected. Gemini free-text discovery is connected; browser purchasing, payments, real WhatsApp delivery and voice remain planned.

## WhatsApp discovery v0 backend

A test-only WhatsApp discovery backend now handles greetings, basic requirements and multi-store live discovery attempts without checkout. It uses shared Gemini planning when configured, or labelled rules mode without a key, and returns up to three dated options per reachable store, and does not claim verified size availability. Convex cloud discovery and a simulated full message workflow have been checked. The Meta number connection and real WhatsApp message delivery remain pending; the existing Saathi callback must not be replaced without an explicit choice. This does not change the fictional web demo or establish merchant partnerships.

## Live web discovery

The signed-in `/app/` page provides a WhatsApp-like discovery conversation, quick replies and typed refinements. It attempts Flipkart and Amazon separately and shows verified merchant data with each store's access status. Flipkart product-page results and Amazon live search-card results were verified in production. Amazon access is intermittent. Meesho is paused and removed from active discovery after cloud access failures. Failed stores fall back to direct store-search links. Reliable Meesho results need another browser connection. Requested size availability remains unverified; checkout and WhatsApp number connection are not enabled. Chat is saved in Convex and survives reload. The separate `/demo/` remains fictional.

## Discovery update — 8 October 2026

Web and WhatsApp now share saved Convex conversation planning and a discovery workflow. Web chats survive reload; fresh sessions use saved size and budget. Results include store-sourced images where available, and shoppers can reject a product, ask for more without repeats, or say none of these and refine colour/fabric/budget. This records the initial rule-based milestone; Gemini and taste ranking supersede that limitation below. WhatsApp identity linking and real message delivery remain unverified. Price sorting is not exact-product comparison. Price comparison and offer intelligence are planned, not built. See `IMPLEMENTATION_PLAN.md` for the phased discovery plan.

## Gemini discovery implementation

Convex Agent and Gemini now provide an optional shared free-text planner for web and WhatsApp. It interprets richer preferences and numbered product feedback, with deterministic ranking of real merchant candidates and evidence-backed recommendation reasons. Explicitly remembered size/budget/taste persist in the web profile. GEMINI_API_KEY is configured in development and production. A real Hinglish reply was verified on 11 October; style-search verification is recorded in README.md. Without a key, the app clearly identifies its basic rules mode. Store facts, size availability, price comparison, offer intelligence and real WhatsApp delivery retain their existing limits.

## Style discovery and website refresh — 11 October 2026

Negative requests are kept out of positive search terms. Concise style queries and bounded broad fallbacks run on both stores; hard budget, colour, fabric and explicitly required attributes remain enforced. Merchant synonyms such as plain/solid and embroidery/embroidered are matched when ranking. Ordinary style preferences cannot become mandatory filters without explicit wording. Preferences described while asking to wait before searching are retained. Store details still cannot prove suitability for an occasion or absence of an unmentioned detail.

The professional homepage prioritises the live `/app/` conversation. Request examples and the hero search carry a draft through sign-in; the shopper sends it themselves. The fictional `/demo/` stays separate. Marketing distinguishes available discovery from planned price comparisons, offers, WhatsApp, voice and checkout. No customer, review, savings or availability claims are invented.

### Five-step homepage journey
The homepage now has a scroll-driven, sticky five-step story: a need, a conversation, discovery, personalised recommendations and price comparison, then purchase approval. Clickable steps also work on smaller screens and with reduced motion. Clothing drawings and comparison prices are illustrative. WhatsApp, exact-product comparison and one-click checkout remain explicitly planned; web discovery and feedback ranking are live.


## Saved discovery and comparison foundations

The live web assistant now supports private saved favourites, side-by-side comparisons, dated price observations and refresh attempts, older-card feedback, visible consented taste and clearing controls, read-only chat history and stopping requests. Exact same-item delivered-price comparison and offer calculations have conservative backend rules and evidence storage; merchant identity/variant/shipping/terms collection is still missing. These foundations must not be marketed as live price comparison or verified savings. WhatsApp photo-message preparation is built but actual delivery remains untested. Recovery, account removal, checkout, order support, voice/photo search and alerts remain placeholders. Joint testing is tracked in TESTING_LEDGER.md.

Daily edit is an opt-in feature on `/app/`: fresh picks for the current shopping need, size, budget and taste, once daily around 9 am India time. It targets 4–6 real options and discloses fewer verified matches. Matching saved Flipkart products can carry dated listed-price-drop evidence; size-specific checkout savings, coupons, bank offers, sale detection and WhatsApp delivery remain unconnected. Pause is available, and needs older than 30 days require another chat.

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
