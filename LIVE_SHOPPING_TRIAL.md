# Live shopping trial — 7 October 2026

## Result

Live search without a pre-scraped product catalogue worked on Amazon India, Flipkart and Meesho. On Amazon, browser controls selected a blue cotton kurta in size M, added it to cart at ₹526 and reached the sign-in barrier. No order was placed and no payment was attempted.

This proves local browser discovery and Amazon cart preparation for one example. It does **not** prove server-browser access, unattended purchasing, payment completion or a reliable production integration. No merchant partnership or private merchant API was used. Ability to operate the website does not establish permission for a production automation service.

The test request was “blue cotton kurta for women, size M, under ₹1,000.” Prices and stock below were observations during this trial, not current promises.

## What was actually checked

| Store | Observed result | Stopping point |
| --- | --- | --- |
| Amazon India | Fresh search; Aurelia cotton blue kurta; product opened in size L; explicitly selected M; cart confirmed M, blue, ₹526, quantity 1 | Proceed to Buy opened “Sign in or create account.” No credentials submitted |
| Flipkart | Fresh search; FANESHMA dark blue pure cotton kurta at ₹453; product showed size M as an option; separate ₹430 price depended on a payment offer | Product inspection only. Browser already had a signed-in account and five cart items; those were left untouched |
| Meesho | Typed request into the site's search box; resulting search heading matched the request; live results included a navy blue cotton listing at ₹349 and unrelated rayon items | Search only. Product material, size availability, cart and checkout not verified |

Amazon's initially empty anonymous cart was restored to zero items after the trial. The test item was visibly confirmed removed. Existing Flipkart cart contents were not changed. No address, phone number, password, payment details or OTP was entered. Screenshots are local, ignored test artifacts in `tmp/`.

Observed public pages:

- [Amazon search](https://www.amazon.in/s?k=blue+cotton+kurta+women) and [selected size M product](https://www.amazon.in/dp/B0BRNFSJW4).
- [Flipkart search](https://www.flipkart.com/search?q=blue%20cotton%20kurta%20women) and [inspected product](https://www.flipkart.com/faneshma-women-printed-straight-kurta/p/itm1091fa420ad28).
- [Meesho search](https://www.meesho.com/search?q=blue%20cotton%20kurta%20women&searchType=manual&searchIdentifier=text_search).

## Gap ledger

“Observed” means encountered in this trial. “Untested” means a bridge we still need to prove, not an established failure. Proposed bridges below are hypotheses until tested.

| Step | Gap and evidence | Proposed bridge | Next proof |
| --- | --- | --- | --- |
| Live discovery | **Observed:** all three searches returned products; results also included materials and categories outside the request | Search on demand, then verify each shortlisted product against the request; cache only dated observations | Compare shortlisted items against product details for material, colour, size and budget |
| Ranking | **Observed:** Amazon qualifying result was sponsored; Meesho included rayon despite “cotton” query | Treat rankings as discovery, not a recommendation; apply explicit fit rules | Reject a sponsored or high-ranked item that fails a requirement |
| Navigation | **Observed:** duplicated Amazon product links made a first click ambiguous | Match the intended card and canonical product/variant; handle redirects and new tabs deliberately | Repeat on sponsored cards and ordinary results |
| Page readiness | **Observed:** Meesho briefly showed the old homepage after submitting search; Amazon variant labels changed after loading | Wait for the requested result or selected variant to be visible; read again before acting | Slow-page trial that never uses the previous page's data |
| Variant | **Observed:** Amazon opened L although request was M; selecting M changed the variant identifier and stock display | Store the exact variant, size, colour and quantity, then verify the cart | Trial where requested size is unavailable; never substitute silently |
| Stock | **Observed:** stock messages differed during variant update | Recheck selected variant after the page settles and again at checkout | Item becomes unavailable between discovery and checkout |
| Delivery location | **Observed:** anonymous Amazon pages used default delivery locations that differed | Obtain the shopper's chosen delivery postcode/address through an authorized flow; verify serviceability | Signed-in trial to an explicitly chosen address |
| Price and offers | **Observed:** Amazon cart was ₹526; Flipkart ₹430 depended on an offer rather than the ₹453 displayed base price | Separate ordinary price from conditional discounts; use final payable total | Checkout including shipping, eligible offers and any extra charges |
| Cart ownership | **Observed:** local browser already had a Flipkart account with five items | Separate browser storage per shopper; track cart before/after and intended purchase items | Two isolated shoppers; existing unrelated cart items are never purchased |
| Merchant login | **Observed:** Amazon checkout required sign-in | Secure shopper takeover to sign in directly to the merchant; Chauffeur sign-in does not sign users into stores | User completes merchant login, agent resumes the same session |
| OTP and re-login | **Untested:** merchant may require SMS/email verification or re-authentication | Pause and request direct shopper takeover; keep secrets out of AI prompts and logs | Expired session and OTP challenge during checkout |
| Account/session storage | **Untested:** this was a personal Chrome profile, not an isolated server browser | Decide whether sessions stay on the user's device or on an approved server; isolate storage, encrypt retained session access, support disconnect and expiry | Restart browser without crossing accounts; disconnect removes access |
| Server execution | **Untested:** no remote server browser or server credentials used | Define a browser worker, the process that operates the browser, separately from Convex's account/order logic; select its execution location before setup | Repeat the same trial from the actual intended server/network |
| Bot checks | **Untested:** no CAPTCHA or access block encountered locally; this says nothing about server traffic | Detect the challenge, pause for user assistance or stop; do not bypass it | Observe actual server behavior and document store-specific limits |
| Store rules | **Unresolved:** website access alone does not settle allowed automation | Check each merchant's current terms and applicable access conditions before offering automated purchasing | Document whether the intended use is allowed and any required change |
| Address selection | **Untested:** checkout stopped before address review | Show the shopper the chosen address privately; never infer one from the browser's default | Verify the exact destination without leaking it into logs |
| Final consent | **Untested:** cart subtotal is not a final checkout quote | Create a short-lived Convex review for exact item, seller, address reference, shipping, return terms and total; require approval and recheck before ordering | A price/address/variant change invalidates previous approval |
| Payment | **Untested:** no payment screen reached | First prove user-completed payment in the merchant flow; investigate UPI/card verification and cash on delivery only where actually offered | Reach available payment choices, stop before commitment, record required user actions |
| Cash on delivery | **Untested:** Flipkart product displayed it, but checkout eligibility was not checked | Treat COD as a real order requiring explicit approval, not a purchase-free workaround | Confirm actual address/item eligibility and any fee at checkout |
| Purchase completion | **Untested:** no final order button pressed | Only submit the exact approved order within the spending limit; stop if the checkout materially changes | Separately authorized low-value purchase with merchant confirmation |
| Uncertain result/retries | **Untested:** timeout after submission could hide a successful order | Save attempt state in Convex; reconcile merchant order history before retrying; never blindly press order twice | Interrupted confirmation produces one order, not duplicates |
| Order evidence | **Untested:** neither cart success nor payment success proves an order was accepted | Record merchant order ID, confirmed items, total and status; distinguish pending from confirmed | Confirmation and order-history entry agree |
| Tracking and returns | **Untested:** product showed return terms, but no order lifecycle was tested | Store the observed policy and order reference; use authorized account access for tracking/returns | One delivered order and separately approved return/refund check |
| Untrusted pages | **Untested:** merchant text is data, not authority to change instructions | Restrict actions/domains and enforce budget, consent and secrets handling outside page content | Page text cannot change approved item, destination or payment |
| Reliability and cost | **Untested:** one cart success gives no useful completion-rate estimate | Record duration, interventions, failures and browser/AI costs without secrets | Repeat a fixed trial set across stores, variants and session conditions |
| Chauffeur connection | **Not built:** these controls were operated by Codex, not the deployed Chauffeur backend | Connect the future worker to Convex using verified credentials and trusted observations; clients cannot claim an order was placed | End-to-end private review in Chauffeur from a real browser observation |

## What we can build with confidence

Keep live discovery as the first approach; no full product catalogue scrape is required for this test flow. Store timestamped shortlist observations and canonical variant references, not permanent claims about price or availability.

Use explicit progress states: searching → verifying product → preparing cart → needs login → reviewing delivery/total → needs approval → needs payment assistance → submitting → confirming → confirmed or needs investigation. A stopped trial cannot become a confirmed order. Add a session owner, store, attempt ID, last verified step and reason for user assistance to each attempt. Convex already has private purchase reviews and exact approval rules; the real browser observation path remains to be connected.

Do not select another hosting, authentication or payment service merely to fill a gap. The project uses Convex; the browser execution location and any additional service need a separate decision.

## Next trial

Start with one isolated Amazon browser session and let the shopper sign in directly. Resume the same size M item, confirm delivery, shipping and the final total, then inspect payment choices **without placing the order**. This resolves login, address and payment-flow uncertainty. Repeat that trial from the intended server before claiming server-side checkout works.

## Follow-up: signed-in local browser

The shopper signed into Amazon directly, and the agent resumed the same Chrome tab. This was the existing personal Chrome profile, not an isolated or server-hosted session.

The size M blue kurta remained ₹526 on the product page and in the cart. Checkout reached the payment-method page using the account's existing delivery address. No address was entered or changed. A recommendations page appeared before checkout and required “Continue to checkout”; it was skipped without adding extras.

The payment page displayed an order total of ₹531, but item, delivery and marketplace-fee breakdown values were placeholders (`--`). The ₹5 difference therefore remains unexplained; it must not be attributed to a specific fee without a complete review. Available choices included saved cards, a preselected account balance, net banking, Scan and Pay with a QR code, and Cash on Delivery/Pay on Delivery. COD displayed a ₹14 convenience fee. No payment method was submitted, no QR was generated, no payment verification was attempted and no order was placed. The final item/shipping review was not expanded at this step.

The signed-in cart initially contained another item. After adding the test kurta, the next cart view showed only the kurta eligible for checkout, alongside unavailable-item notices. The agent did not delete, deselect or restore the unrelated item, and did not establish why its eligibility changed. This is another reason to reconcile cart contents rather than rely on the header count. Removing the test kurta afterward was confirmed, with zero active cart items shown; existing saved/unavailable items were left untouched.

Do not retain private addresses, card identifiers or account balances in this report or the product logs. The proof screenshot in `tmp/amazon-signed-in-cleanup.jpg` contains only the test-item removal notice.

Updated conclusion: login takeover and agent resumption worked locally, and the agent reached address/payment choices. Filling a shopper-authorized address is a plausible next test, not yet verified here. Payment completion, exact final charges, final order submission, server access, session isolation and repeatability remain unproven. The next technical trial is this same flow from the intended server, with a separate shopper session, stopping before purchase.
