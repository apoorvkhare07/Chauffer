# Chauffeur implementation plan

Chauffeur will purchase clothing on the shopper's behalf using a browser, after the shopper approves the exact checkout details. Merchant partnerships are not assumed to be a prerequisite. Browser purchasing must be proven separately for each store before it is offered to users.

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

Use Convex Workflow when implementing long-running purchase execution. Do not implement a parallel job queue. Add Convex Agent when building real conversations rather than creating a second conversation engine now.

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
