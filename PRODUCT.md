# Chauffeur

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Vite + React, requested by the user. Convex is the only authorized backend, authentication and hosting provider. This iteration is local frontend work, not deployment.

## Users
People shopping for women's clothing across Indian marketplaces. More specific audience research is open.

## Product Purpose
Build a WhatsApp-first, voice-first AI shopping agent that understands requests, personalises recommendations, remembers user preferences, helps compare prices and offers, and follows orders through tracking and return reminders. A voice-led app is part of the vision, not a confirmed release.
The current separate web demo turns a shopping request into a comparable shortlist, with price, delivery, size and return information together.

## Capabilities and Constraints
Existing prototype searches eight fictional products across sample Amazon, Flipkart and Meesho catalogues. English, Hindi and Hinglish keyword requests are supported. Demo approval, cancellation, simulated delivery and return requests work. Size preferences and orders last only for the current session. No store connections, real AI service, real payments, WhatsApp, voice or backend exist yet.
The user approved proceeding with a public homepage and a working shopping demo, then clarified that they must remain separate, linked pages. The homepage lives at / and the demo at /demo/, with separate HTML files and React entry points. Preserve the existing shopping behavior while moving the interface to React. No fabricated customer, review, savings or availability claims.
The user requested the website describe the broader offerings above and use Hermes Agent as a section-structure reference. These are planned capabilities; describing them does not authorize claiming they are connected or building integrations in this website-content iteration. Pricing/offers help is interpreted as shopping price and promotion comparisons. Subscription pricing remains undecided; the sample demo is free.

## Brand Commitments
Chauffeur. A modern AI website with a desi or Renaissance quirk. Reference videos: Pallet Ross website animation on Pinterest (737183032788146890), Digital Art Website by QClay on Dribbble (25807235), Pinterest pin 341218109286424063. First two observed in Chrome; the third video loaded controls but its pixels remained blank.

## Evidence on Hand
engine.js and engine.test.js contain the existing working demonstration. Reference videos favor oversized type, spacious modern layouts and animated artwork. No customer evidence or live merchant integrations.

## Account foundation

The separate `/app/` page connects Convex Auth email/password account creation, sign-in, sign-out and persistent size, budget and language preferences to Chauffeur's own Convex project, with separate development and production databases. The homepage and fictional demo remain separate. Email verification and password recovery are not connected. Browser purchasing, real AI, payments, WhatsApp and voice remain planned.

## WhatsApp discovery v0 backend

A test-only WhatsApp discovery backend now handles greetings, basic requirements and multi-store live discovery attempts without checkout. It uses rules rather than an LLM, returns up to three dated options per reachable store, and does not claim verified size availability. Convex cloud discovery and a simulated full message workflow have been checked. The Meta number connection and real WhatsApp message delivery remain pending; the existing Saathi callback must not be replaced without an explicit choice. This does not change the fictional web demo or establish merchant partnerships.

## Live web discovery

The signed-in `/app/` page provides a WhatsApp-like discovery conversation, quick replies and typed refinements. It attempts Flipkart and Amazon separately and shows verified merchant data with each store's access status. Flipkart product-page results and Amazon live search-card results were verified in production. Amazon access is intermittent. Meesho is paused and removed from active discovery after cloud access failures. Failed stores fall back to direct store-search links. Reliable Meesho results need another browser connection. Requested size availability remains unverified; checkout and WhatsApp number connection are not enabled. Chat clears on reload. The separate `/demo/` remains fictional.
