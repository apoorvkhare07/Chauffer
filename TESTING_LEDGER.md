# Chauffeur build and joint testing ledger

This is the handover checklist for the 11–12 October functionality build. Automated checks, real browser checks and work needing the builder are recorded separately. A placeholder is never a working integration.

## Live discovery test pass

| Case | Expected | Result |
|---|---|---|
| Hinglish office kurta, M, under ₹1,500, no heavy embroidery | Preserve constraints, use merchant facts | Live production returned three Flipkart kurtas under ₹1,500; Amazon unavailable. Heavy-embroidery absence remains unknown. |
| Second one too plain; printed instead | Reject the referenced option; no invented floral preference | Live production passed: generic printed query, three printed products, previous second URL excluded. |
| None of these | Ask what to change, no guessed preference | First real AI turn failed; retry asked a question but also searched. Fixed with a deterministic clarification path; automated check passed. Live production recheck passed: a clarification reply appeared without a new result batch. |
| English dress request | Correct category, size and budget | Live production returned three dresses under ₹2,000, L requested. Reply incorrectly stayed Hinglish; language-selection fix passed live recheck with a full English office-kurta request; dress-category language recheck remains pending. |
| Hindi request | Correct requirements; readable reply | Initial request returned cotton blends and replied in Roman-script Hindi. Fixed language and cotton-only interpretation; live recheck returned three pure-cotton options with a Hindi-script AI reply. Optional-question wording while searching still needs quality review. |
| Show more | New batch without rejected/repeated URLs | Live production returned three different pure-cotton products. Final code makes bare “show more” preserve the existing search without a model call; final live recheck passed: three new pure-cotton products below ₹1,000 with M retained, followed by a batch with three Flipkart and two Amazon options. |
| Remember, new chat, reload, forget | Explicit memory only; forget clears taste | Pending |

## Build scope

- Saved favourites and side-by-side comparison of different products.
- Saved price observations (up to 30 per saved item) and a server-side refresh attempt. A failed refresh keeps the old dated price.
- Product identity and exact-variant price comparison rules. Unknown identity, size, shipping or stock prevents a cheapest-total claim.
- Offer calculation rules with evidence, eligibility, caps, expiry and cashback separated. No invented merchant offers.
- Preference visibility and clearing, conversation history, retry and stale-result messaging.
- WhatsApp image-message preparation using the same verified products; real connection stays gated.
- Checkout readiness checklist, with login/payment/order execution explicitly disconnected.
- Password recovery placeholder until an approved email delivery connection exists. No insecure reset workaround.
- Account deletion stays a visible placeholder until full cleanup of sign-in records, application data and AI component history is verified. No removal endpoint is exposed and no account is deleted.

## Joint tests still required

- A broader set of real English/Hindi/Hinglish requests, including ambiguous references, contradictions and mandatory versus preferred styles.
- Quality of later recommendations after repeated feedback, and variety of options.
- Repeated searches on both stores; Amazon access failures; empty matches; unavailable photos; fresh versus stale observations.
- Remembered taste across new chats/reload, and two real accounts cannot see each other's saved items or chats.
- Exact item identity and variant matching against actual store pages; full delivered totals and stock.
- Actual advertised offer extraction and checkout eligibility. Calculation tests alone do not prove a merchant accepts an offer.
- WhatsApp test number: credentials, callback, allowed test recipient, greeting, requirements, previews, feedback, delivery/read/failed events and repeats. Do not replace Saathi's callback.
- Verified web-to-WhatsApp identity linking. Phone numbers are not trusted proof of ownership.
- Email verification and password recovery once email delivery is approved/configured.
- Account deletion on a disposable account, including active sessions and component data cleanup.
- Browser checkout: merchant login, size/variant, cart, address, updated total, approval, payment handoff, order receipt, duplicate-order prevention, tracking and returns.
- Voice and photo search: providers, consent and real-device tests remain open.

## Gaps and placeholders

No real purchase, automatic payment, order tracking, refunds, offer alerts, voice or photo interpretation is enabled by this build. These require real connections and tests; their readiness must be visible rather than implied by a demo.

## Implementation evidence

- Private shortlist takes products only from the shopper’s stored search messages. Public callers cannot submit invented prices. Saved items are deduplicated, limited to 50, and independent of the current chat.
- Card actions bind to the selected stored product, including older batches within the current chat. Like feedback does not automatically trigger a search or durable memory.
- Remembered taste is visible and can be cleared separately from size/budget. General preference clearing is also available.
- Previous chats are readable within a bounded history window. Stopping a request invalidates its revision; late results cannot update the chat. It stops accepting results, rather than promising a network request or AI charge can be undone.
- Exact-product comparisons are connected to saved items and show missing evidence; no current discovery card has verified size-specific delivered totals, so no cheapest-total claim is possible.
- Offer evidence storage is backend-only. Offer arithmetic handles minimums, caps, percentage rounding, expiry, bank/card/payment/membership/coupon restrictions and cashback; stacking must be explicitly allowed. The client receives unverified status until checkout evidence exists. Live extraction is not connected.
- WhatsApp photo messages follow [Meta’s image-message format](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/messages/image/). Only approved store image hosts are allowed; each option has its own send claim and uncertain sends are not retried. Merchant image availability to Meta still needs a real test.
- Recovery, account removal, voice, photo understanding, checkout, tracking, returns and price alerts remain placeholders. This build does not claim those integrations exist.

## Regression checks added

- Shortlist ownership, verified-message sourcing, deduplication, reset persistence, private price history and comparison access.
- Late completion after stop; private conversation history.
- Clear taste without erasing size/budget; bare rejection without AI.
- Generic printed style, optional “not a must”, reply-language switching and negative memory consent.
- Older-card reference mapping and like-without-search.
- Exact match versus unknown identity/variant, shipping, starting prices, stale prices, stock and return terms.
- Discounts versus cashback, bank eligibility, minimum spend, caps, expiry and unknown stacking.
- Private offer evidence and refusing a confirmed discount on an unverified variant.
- Trusted WhatsApp photo URLs, separate send claims, duplicate and uncertain sends.

## Browser checks completed (production, 11–12 October)

- Saved two actual result products; both appeared in the private shortlist.
- Compared them side by side. The backend explicitly reported missing same-item, variant, stock, delivered-total and return evidence.
- Refreshed one Flipkart product: the observed price remained ₹215 and its checked time advanced. This is a live observation, not a checkout total.
- Clicked “I like this”: the assistant acknowledged session taste in English, and no extra result batch appeared. Permanent memory was not requested.
- Fixed “None of these” was checked live and asked what to change without searching.
- Hindi-script request returned three pure-cotton products below ₹1,000. “Show more” returned three different products.
- Local recovery placeholder correctly said no reset email was sent.

Automated verification: 45 checks (4 page/demo checks and 41 backend checks) pass. Backend type checking and the production build pass. Actual WhatsApp delivery, checkout, recovery and account deletion are not verified or enabled.

## Final publication and checks (12 October)

- Final production deployment: `8829625c-2e70-473c-b21c-73cab5fcaa46`; development functions updated too.
- Saved products and both merchant photos survived reload and starting a new chat.
- Previous-chat reader displayed the earlier requests, product links and stop acknowledgement.
- Stopped an active production search; the acknowledgement appeared and no late batch appeared before starting a new chat. Automated checks cover late completion.
- Desktop page had no horizontal overflow and both shortlist images loaded. The browser viewport override did not produce a 390px viewport, so mobile testing remains pending.
- Preference budget bounds and blocking clear while a request is active passed automated checks; actual preference deletion was not exercised on the real account.
- Screenshot: `tmp/chauffeur-shopping-tools.jpg`.

## Feedback quality pass (12 October)

- English request: understated office kurta, M, ₹1,500, cotton preferred, small prints optional, avoid heavy embroidery. Six real options returned across Flipkart and Amazon; the assistant replied in English. Optional prints did not exclude solid options. Small-print evidence was correctly marked unknown.
- Correction: first too plain, printed instead, same size/budget, blue preferred. Returned three blue printed kurtas under ₹1,500 and retained M. Found a bug: old solid preference still earned ranking points. Added a failing regression check and fixed normalization to remove that outdated preference when explicitly correcting plain to printed, without banning mixed-print titles.
- Clicked More like this on the third card: returned three new blue printed kurtas under ₹1,500, retained M. Visual similarity is not proven; this uses merchant text, not photo understanding.
- Two Amazon cards in the first batch had identical titles. Distinct product links can still look like duplicates; stronger visual/variant grouping remains a quality gap.
- Real searches took roughly a minute. Store access changed between turns: Amazon matches, then no verified matches, then unavailable.
- Current automated total: 46 passing checks (4 page/demo and 42 backend), with backend type checking and production build passing.

- Post-fix live correction returned three blue printed products and no solid-match ranking reason. However, old solid wording remained in unknown-preference notes; model-generated fields need broader contradiction cleanup. Changing preferences also allows some earlier products to reappear, so diversity across changed requests needs review.
- Optional neck-style question appeared while searching; it did not become a stated product constraint. Reply wording still needs improvement.
- Fix published with `npm run deploy`; screenshot `tmp/chauffeur-feedback-check.jpg`.
