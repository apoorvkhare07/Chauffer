# Chauffeur implementation plan

Chauffeur will purchase clothing on the shopper's behalf using a browser, after the shopper approves the exact checkout details. Merchant partnerships are not assumed to be a prerequisite. Browser purchasing must be proven separately for each store before it is offered to users.

## Discovery-first build plan — 8 October 2026

Web is the current user interface. Discovery, feedback, ranking and comparison must live in Convex so WhatsApp can use the same functions. Checkout remains a later, separate phase. Flipkart and Amazon are active; Meesho is paused.

### Current delivery

- Private saved conversations, messages, requirements and live results in Convex. Reload resumes the latest conversation; Start again starts a new session while retaining old records. The interface shows the latest 80 messages. An archive browser and retention/deletion controls are not built.
- Both web and WhatsApp use the same turn planning, saved conversation model and Convex Workflow for discovery. WhatsApp still needs real Meta configuration and phone/account linking; web and WhatsApp identities remain separate until a verified linking flow is added.
- Saved size and budget seed a new web conversation; explicit requests override them. Profile updates apply to the next new conversation. Saved language is not yet used to translate conversations.
- Store-sourced product images, with an honest unavailable state if a photo is absent or blocked. Product prices are observations, not guaranteed checkout prices.
- Show more skips previously shown products; Not for me records rejection for the current conversation and asks what to change. None of these asks for feedback before searching. Changes to colour, fabric, size or budget update the next search. Unsupported style/occasion requests ask for supported constraints rather than pretending to understand.
- Result batches remain small, up to three per store. Flipkart currently reads at most 12 catalogue links per search and Amazon reads the returned search page. Exhausting those candidates is not the same as exhausting the entire store. No new matches must be shown honestly.

### Gemini implementation and verification gate

Implemented: Convex Agent threads, structured Gemini request planning, English/Hindi/Hinglish prompt guidance, richer style/occasion/fit/pattern fields, latest-batch numbered references, explicit feedback records, consented profile memory, bounded wider candidate retrieval, deterministic evidence-based ranking, displayed recommendation reasons and unknown preferences. Both channels use the same functions. The default model is Gemini 3.1 Flash-Lite, overridable by server configuration. User-requested direct Gemini keys override the skill’s gateway default.

Activation requires GEMINI_API_KEY in each intended Convex deployment. Until configured, keep the working basic chat and label it honestly. Mocked model workflow checks are not proof of free-text understanding. Run real requests and measure quality, latency and token usage once the key is available. Confirm free text across English/Hindi/Hinglish, one-question follow-ups, explicit budget overrides, same-session rejection, numbered refinement, remembered preferences across reset and model failure. Real Hinglish replies are verified and a live development style search returned three solid kurtas on 11 October. Wider language, feedback and memory evaluation remains pending.

Still missing: image-based style inference, richer attribute matching beyond the initial merchant synonyms, deep catalogue pagination, preference editing/history interface, true relevance evaluation and broader diversity. Rankings use confirmed title/specification words; they cannot establish suitability for an occasion or absence of a disliked detail when the store omits it. Expose those unknowns.

### Next: adapt to taste, not just fetch another batch

1. Persist explicit feedback with the product/result reference, reason and time: like, dislike, too expensive, wrong fit, fabric, colour, pattern and occasion. Distinguish preferences for this request from preferences the user agrees to remember across visits. Current rejection is conversation-specific.
2. Use Convex Agent for flexible conversation and references such as “more like number two but less shiny.” Its tools call the same search functions; a language model must not invent product facts, images, availability, discounts or prices. Select/configure the model and measure cost before enabling it.
3. Add structured occasion, pattern, cut, sleeve, length and fit fields. Extract these only from store evidence, keeping unknown values unknown. Offer a follow-up choice when evidence is insufficient.
4. Search a wider candidate pool using bounded pagination when supported, remove duplicates and rejected products, then rank by budget, requested constraints, confirmed attributes and explicit taste. Include variety so the first batch is not just the three cheapest products. Do not silently relax a must-have constraint; ask permission first.
5. Show “why this fits” and any compromise on each product. Add shortlist, compare and “more like this.” Capture which results were shown so numbered references stay correct after another batch.
6. Check relevance with a fixed set of shopping requests and rejection/refinement sequences. Measure shortlist rate, repeated rejected products, useful results after feedback, response time and cost. More results alone is not a relevance improvement.

### Price comparison — not built yet

Current price sorting compares different clothes. It does not prove that the same item is cheaper on another store.

- Create a product identity with brand, model/style code, image and category; attach separate store listings and observations. Match the same product only when evidence supports it. Visually similar alternatives must be labelled alternatives.
- Compare the same size, colour, quantity and seller conditions. A starting price for an unspecified variant cannot be declared the cheapest exact match.
- Keep item price, shipping, mandatory charges and final payable amount separate. Show unknown shipping as unknown; do not rank an unknown delivered total as a verified cheapest total.
- Show source, checked time, seller, variant availability and return conditions beside each comparison. Refresh before any future checkout review.
- Add optional price history and user-requested alerts later, with recorded observations rather than invented previous prices.
- Required checks: exact match versus lookalike; different size prices; out-of-stock variants; missing shipping; stale prices; one store blocked. Savings claims require comparable observed totals.

### Offer intelligence — not built yet

- Store each offer with source, checked time, expiry, eligible bank/card/payment method, minimum spend, cap, coupon, account restrictions and stacking rules. Do not request card numbers or payment secrets.
- Separate unconditional price, potentially eligible discount and confirmed payable total. Cashback is later money back, not an immediate checkout discount.
- Ask only the eligibility details needed, such as bank and card type, with an “I don’t know” choice. Do not assume first-order, membership or bank eligibility.
- Calculate discounts deterministically in the backend from recorded terms. Return the explanation, eligibility status and missing information. Preserve unknowns when store/account access is needed.
- Validate on the store before marking an offer confirmed. A visible banner is an advertised offer, not proof it applies to this product and shopper.
- Required checks: spend threshold, maximum discount, expiry, excluded seller/category, coupon and bank stacking, variant changes, membership and unknown eligibility. Do not advertise false savings.

### Channel work after the shared discovery system

Connect Chauffeur’s WhatsApp number, verify phone-to-account linking, and format the same result records for WhatsApp text/images/buttons. Test real inbound/outbound messages, repeated deliveries, superseded searches and delivery failures. Preferences and recommendation logic must not be reimplemented per channel. Voice and photo-based discovery remain later enhancements.

### Recommended sequence

Shared saved conversations and previews → richer feedback and preference memory → flexible conversation and relevance ranking → exact-product comparison → verified offer calculation → real WhatsApp channel test. No checkout work is required for these discovery milestones.

## Current foundation

The homepage at `/` and fictional shopping demo at `/demo/` remain separate. The initial Convex backend stores private preferences and immutable purchase reviews with approval and revocation. It does not place orders, process payments or run browsers. Public functions require a verified sign-in identity; Convex Auth and the `/app/` email/password account screen are connected in development and production. Sign-in, account creation, sign-out and preference persistence are verified. Email verification, recovery and account removal remain future work.

Amounts are stored as whole paise, avoiding rounding errors. Clients cannot submit their own trusted price quotes. A backend-only function prepares a review; approval checks its owner, exact total and expiry. Every changed checkout needs a new review and approval.

## First browser purchase trial

Use one store and one clothing category. Select the store after checking its current automation terms and running a non-purchasing access trial. Amazon, Flipkart and Meesho remain candidates, not confirmed integrations. Do not bypass access challenges or store restrictions.

1. Begin with a user-provided product link and exact size and colour; discovery comes later.
2. Open a separate browser session for that shopper. Provide a secure user takeover for login and verification; never ask the AI to remember passwords or payment secrets.
3. Read product and variant details, select the variant and add it to cart.
4. Reach final checkout and verify the delivery address, seller, quantity, item price, shipping, discounts, total and return conditions. Unknown conditions remain unknown and prevent an unsupported promise.
5. Send a trusted checkout observation to Convex. Save its time, short expiry and session/cart reference, then show the review to the shopper.
6. End this first trial before payment or the final order button. No trial approval triggers a purchase.
7. Repeat across unavailable sizes, price changes, expired login, blocked access and slow pages. Record completion rate, time, cost and user interventions without storing secrets.

Pass condition: repeated trials reach the correct final review with accurate details and no purchases. A single successful demonstration is insufficient evidence for unattended purchasing.

## Browser execution boundary

Convex remains responsible for accounts, preferences, reviews, approvals and order records. A browser worker means the process that runs the actual browser. Its hosting or service is not selected or authorized yet. Keep its interface separate so the browser choice does not change shopping rules.

The eventual worker may claim only one authorized purchase attempt at a time. Claims expire and use unique attempt identifiers so an old worker cannot resume a completed or reassigned attempt. Browser callbacks require verified worker credentials; public clients cannot mark an order as placed. Sessions belong to individual users, are never shared, and can be disconnected.

Page content is untrusted information, never an instruction to change the user's budget, address or purchase. Allow only intended store domains and approved actions. Scrub payment details and session credentials from recordings and logs.

## Backend build stages

| Stage | Deliverable | Required check |
| --- | --- | --- |
| Foundation | Private preferences; backend-created purchase reviews; exact approval and revocation | Sign-in required, user separation, stale quotes, changed totals and repeated approval tests |
| Accounts | Convex Auth, sign-in screen, saved preferences interface and account removal | Real browser sign-in, reload and sign-out; access isolation |
| Browser trial | Isolated sessions, user takeover and trusted checkout observations | Correct checkout details; stops before purchase |
| Purchase execution | Fresh review validation, one active attempt, cancellation boundary and durable progress | Changed checkout cannot reuse approval; repeated clicks do not create extra attempts |
| Payments | Choose a supported method and handle user authentication when required | Verify payment and merchant order independently; resolve uncertain results before retrying |
| Aftercare | Merchant order verification, delivery checks, cancellation, returns and refund status | Source-backed updates; refund requested distinguished from refund received |
| AI shopping | Convex Agent conversations, catalogue discovery, comparisons and preference consent | English, Hindi and Hinglish; tools cannot bypass approval |
| Channels | WhatsApp and voice using the same shopping backend | Account linking, repeated message handling, user verification handoff |
| Launch | Convex static hosting through npm run deploy | Tests, build, sign-in and all page routes on deployed site |

Use Convex Workflow when implementing long-running purchase execution. Do not implement a parallel job queue. The shared conversation layer supports Gemini via Convex Agent when a server key is configured; otherwise it stays in visibly labelled rules mode. Shared discovery tools and result records are used by both channels.

## Payment and uncertain outcomes

Chauffeur delegates buying; the merchant still supplies the goods and executes its checkout. Decide separately whether the shopper uses merchant checkout payment with a user verification step or an approved agent payment method. India availability and UPI support need verification. No payment service is selected by this plan.

Before the final purchase action, re-read the checkout and compare every approved field. A mismatch or expired review requires fresh approval. Show when approval can no longer be revoked because submission has begun; later cancellation is a separate merchant action.

Track payment status separately from merchant order status. After a timeout, inspect order history and payment evidence before attempting another submission. A success page alone is insufficient. Save the merchant order reference and confirmed item details. An unresolved attempt stays pending for investigation rather than reporting success or retrying blindly.

## Open decisions

- First marketplace, based on access and trial results.
- Browser execution environment, operating cost and secure session storage.
- Payment method, availability in India and user authentication flow.
- Responsibility and support process for incorrect purchases, cancellations and refunds.
- WhatsApp and speech services, each requiring builder approval before introduction.

## Evidence

Instinct describes operating devices like a person: [Instinct](https://instinct.com/). Stripe names Instinct as an agent-wallet user: [agent purchasing](https://stripe.com/blog/helping-personal-agents-shop-more-intelligently-and-reliably-with-link). These establish that delegated purchasing exists, not support for Chauffeur's target marketplaces.

Amazon's documented createOrder operation ships seller inventory: [Amazon](https://developer-docs.amazon/sp-api/lang-en_en/reference/createorder). Flipkart's documented seller tools manage seller listings and existing orders: [Flipkart](https://seller.flipkart.com/api-docs/FMSAPI.html?highlight=flipkart+seller). Neither source establishes general buyer checkout access.

## Style search refinement — 11 October 2026

Implemented negative-term separation, concise positive queries, bounded broad fallbacks for both stores, initial merchant synonyms, and a guard against making ordinary style preferences mandatory. Descriptions can be saved in the current conversation without immediately searching. See README.md for actual live test results and the remaining quality checks.

### Five-step homepage journey
The homepage now has a scroll-driven, sticky five-step story: a need, a conversation, discovery, personalised recommendations and price comparison, then purchase approval. Clickable steps also work on smaller screens and with reduced motion. Clothing drawings and comparison prices are illustrative. WhatsApp, exact-product comparison and one-click checkout remain explicitly planned; web discovery and feedback ranking are live.


## Functionality build — 11 October 2026

The current build follows the discovery milestones above. Detailed evidence, unresolved gaps and joint checks are recorded in [TESTING_LEDGER.md](TESTING_LEDGER.md).

Built in this batch:
- Private saved shortlist (up to 50), side-by-side choice comparison (up to three), backend-sourced price refresh and dated observation history (up to 30 checks per item).
- More-like-this and like feedback linked to the actual stored card, including earlier batches in the current chat. Likes do not automatically search or permanently save taste.
- Visible remembered preferences, separate taste clearing, general preference clearing, bounded read-only chat history and a stop-request control that suppresses late results.
- Product identity fields only when a store supplies brand/manufacturer code; store SKU and visual similarity cannot establish the same item.
- Exact-variant comparison rules connected to saved products. Unknown stock, variant, delivered total or conditions blocks cheapest-price claims. Actual cross-store identity collection and variant checking remain pending.
- Backend-only offer evidence records, eligibility/calculation rules and an honest empty/unverified offer view. Live term extraction and confirmed cart eligibility remain pending; no offer is claimed or applied.
- WhatsApp image previews with separate send claims and no resend after an uncertain send. Actual number connection and photo delivery remain pending.
- Explicit readiness placeholders for checkout, tracking/returns, voice/photo requests, recovery and account deletion.

The live test pass found and corrected bare-batch rejection launching a search, language selection staying on a previous language, optional “not a must” being treated as a mandatory signal, and “only cotton” allowing cotton blends. The generic printed-feedback fix was confirmed live. Model and merchant reliability still need a broader real request set. Automatic tests exercise rules and simulated providers; they do not prove real checkout or WhatsApp delivery.

## Buying intelligence and request input — 14 October 2026

Built in the requested order:
1. Saved-product price and advertised-offer checks read fresh merchant pages, refresh dated prices, search up to three other-store candidates and separate manufacturer-code identity matches from alternatives. Offer text is linked to its source; cashback and conditional offers are labelled separately. No offer is applied and no cheapest delivered total is claimed without exact variant, shipping, seller, returns and eligibility evidence. Failed checks preserve old dated observations. Missing readable terms do not mean no offers exist.
2. Wardrobe-aware buying reviews use a saved merchant product, confirmed inventory, optional styling preferences and a supplied occasion. Gemini proposes available owned pairings, flags similar owned pieces and explains possible usefulness or reuse. Invented IDs and unavailable pairings are removed; wardrobe/product changes during generation reject stale advice. This lives in the shortlist, not the daily feed. Photos are not visually compared.
3. Photo and voice inputs create editable chat drafts with explicit Gemini consent. A shopper reviews and sends the draft before the usual shared discovery flow runs. Photos search similar visible styles, not guaranteed exact products; they do not infer person details, size, brand or fabric composition. Voice supports short WebM/WAV/MP3/M4A uploads and up to 25-second recording on supported browsers. Raw input files and Agent messages are not stored by Chauffeur; sending the edited draft saves the usual text chat.
4. Account support includes a partial shopping-data snapshot and sign-out on all devices using Convex Auth session invalidation. The snapshot discloses its limits: latest 100 web messages, seven daily edits, preferences, wardrobe metadata and saved products; no image files, older history or AI logs. Password recovery/email verification remain pending an approved email-delivery connection. Full account deletion is still pending comprehensive application, file, authentication and AI-history cleanup; no unsafe partial deletion is presented as complete removal.

Known gaps: Amazon access is intermittent, exact manufacturer codes often absent, readable offer extraction is limited by merchant markup and location/account context. Exact-price/offer arithmetic remains conservative until verified checkout evidence exists. Real virtual try-on remains pending the separate Gemini image-generation quota. WhatsApp delivery/account linking and voice replies remain unconnected.

## Wardrobe intelligence — 15 October 2026

Current request adds a standalone wardrobe assistant using confirmed inventory, saved taste/fit/avoid, top and jeans sizes, approximate height, reviewed photo description, event date/period/setting and the backend clock in the user's time zone. It produces up to three validated owned-piece outfits with reasons, a summary, practical tips and at most one clarification. No raw body images or generated try-on pixels are used as fit evidence.

Discovery's completed handoff has been merged. Its existing optional pairing reviewer now uses the same confirmed shopper context behind the current-request wardrobe gate; profile/style changes invalidate pairing advice without removing sourced products. The wardrobe-side internal adapters and sequence are in [WARDROBE_AGENT_HANDOFF.md](docs/WARDROBE_AGENT_HANDOFF.md), alongside the existing [discovery contract](docs/AGENT_HANDOFF.md).

Live weather remains pending by builder choice. A server-only WeatherAPI adapter and optional city/approximate-location path are implemented; without WEATHER_API_KEY the UI says weather is not connected and the model relies on user-described conditions. No city/location is inferred silently.

Next integration: route appropriate discovery-chat requests to standalone wardrobe outfits, carry refinement feedback and selected items through the common envelope, connect a dedicated stylist advisory response, and add an explicitly accepted shopping handoff for wardrobe gaps. Current independent request editing and discovery pairing do not claim these cross-agent flows are complete.
