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
