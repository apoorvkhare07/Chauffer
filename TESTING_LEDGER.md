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

## Preference cleanup and variety (12 October)

- Avoided styles are removed from positive style/pattern/fit/sleeve/length fields, preventing conflicting match/unknown notes after a refinement.
- Previously shown URLs remain excluded across changed requirements within the same chat, until Start again. The exclusion window remains bounded to the existing 120 URLs. Exhausted catalogues can return fewer or zero options rather than recycled items.
- Within a batch, equal normalized store/title/colour/fabric uses one recommendation slot. This reduces identical-looking text cards without claiming exact identity or comparing variant prices. Distinct titles/colours remain eligible; grouping can hide an unknown variant, so store detail confirmation is still required.
- Automated checks: 49 pass (4 page/demo and 45 backend). New tests cover conflicting positive/avoided fields, grouping similar titles, and no repeats after refinement. Existing discovery fixture titles were made distinct to represent different designs. Type checking and build pass.

- First live check revealed older chats had lost seen URLs under the previous behavior. Recovered up to 30 recent stored messages when applying AI feedback; automated regression simulates missing seen URLs.
- Final production check: changed to geometric prints, retained blue/cotton/M/₹1,500, returned three distinct titles and zero URLs from prior batches in this chat. Geometric evidence was honestly unknown; it was preferred rather than mandatory. Positive solid notes disappeared, while the unknown absence of solid remained disclosed.
- Similar-title grouping is automated-tested; no duplicate-title pair appeared in the final live batch. Amazon was unavailable, so real Amazon grouping remains a joint test.
- AI optional questions and overconfident search acknowledgements remain a reply-quality gap; product evidence still states unverified attributes. No photo understanding is implied.
- Final fix deployed and screenshot saved at `tmp/chauffeur-variety-check.jpg`.

## Daily edit (12 October)

Built: opt-in web feed, first edit immediately, then one edition per India-calendar day around 9 am. A Convex timer checks due subscriptions every 15 minutes; jobs use the existing workflow component. Pause stops future editions and invalidates unfinished results. No unsolicited WhatsApp messages are sent.

- Uses the current chat’s clothing, size, budget and taste; needs older than 30 days are not searched. Preferences come from the existing AI conversation rather than another daily model call.
- Targets 4–6 real products, with up to six from one readable store. Fewer matches are shown honestly. No budget/mandatory requirement is relaxed.
- Excludes rejected and recently shown chat products and products from up to seven recent feed records. Similar store/title/colour/fabric occupies one slot. Relevant saved-listing price drops receive priority.
- Checks up to three matching saved Flipkart listings for newer observations. A listed-price-drop badge requires identical URL/title/colour/fabric, product-page evidence, no starting price, and a lower fresh observation. It does not prove selected-size price, checkout savings or a sale event.
- Saves feed picks using only owned stored results; clients cannot invent prices. Price history updates use the existing private shortlist.
- A changed shopping need hides the old daily edit; the next day follows the latest chat. No second edition is generated merely by toggling the subscription. Pending chat turns are deferred 15 minutes rather than consuming that day’s edition.
- Real offer/coupon/bank eligibility and sale-event extraction remain disconnected, explicitly shown in the feed. WhatsApp proactive delivery and cross-channel identity linking remain disconnected.

Automated: 56 checks pass (4 page/demo and 52 backend); type checking and frontend build pass. Daily tests cover India-day timing, same-listing price evidence, owner privacy, opt-in, once-per-day claims, pause, changed requirements, saving trusted feed items, scheduled generation, and price-drop priority. The price-drop workflow test uses controlled merchant fixtures; it is not evidence of an actual current promotion.

Joint tests pending: next morning’s timer execution, repeated daily variety, a real observed price fall, Amazon consistency, and stale/changed requirements across days.

Live daily-feed browser check: six real Flipkart picks appeared, saving added a private shortlist item, and pause/resume restored the same edition. Saved-listing observations updated; no actual price drop was observed. Amazon was unavailable in that run. Tomorrow's scheduled edition remains untested.

## Wardrobe outfits (12 October)

Built: private confirmed inventory, optional compressed photo previews, editing/removal, laundry availability, up to three Gemini outfits based on today's plans, and marking an outfit worn. Photos are not analysed by AI. Owned IDs and complete combinations are checked after model output; changes to clothing availability/details invalidate old results. Wardrobe-aware shopping-feed ranking and WhatsApp wardrobe interactions remain unconnected.

Automated: 61 total checks pass, with backend type checking and frontend build. Wardrobe tests cover owner privacy, stored photos, invented/unavailable/incomplete item rejection, wear history, and stale completion. A separate development identity with three fictional garments received two valid outfits from real Gemini (green dress; blue shirt with black trousers). No fictional wardrobe was added to the actual shopper account.

Joint tests pending: upload actual clothes, assess outfit quality for real occasions, edit/laundry/wear controls with real inventory, and phone layout. Weather is used only when supplied in the request.

Production published successfully: `ee9e3c5d-a1f5-48ad-808a-54242b5ac90b`. Live signed-in browser verified the empty wardrobe, expanded detail/photo form and disabled outfit action before inventory exists. Screenshot: `/tmp/chauffeur-wardrobe-live.jpg`. Development fixture garments were removed after the Gemini check.

## AI wardrobe photos and optional styling preferences (12 October)

Supersedes the earlier preview-only photo limitation. Built: Gemini image input, owned draft storage, review/confirmation with original AI metadata retained, specific garment kind, colour/pattern/cut, readable-brand evidence, unknown fabric handling, compressed previews, three photo attempts/minute, failed-photo cleanup and 24-hour abandoned-draft cleanup. Body/fit/style/avoid descriptions are optional shopper input and can be cleared. Changes invalidate old wardrobe outfits. Outfit AI and web shopping context receive these preferences and confirmed inventory; WhatsApp has no wardrobe account link.

Automated: 66 total checks pass (4 page/demo, 62 backend), type checking and production build pass. Added tests exercise image input, authenticated drafts, foreign-owner confirmation rejection, corrections vs original reading, duplicate confirmation, failed-photo deletion, rate limiting, expiry cleanup, private/clearable styling and outfit invalidation, styling in outfit prompts, and owner-only shopping context.

Real Gemini development test: repository clothing image was read as a white floral kurta with pink/green accents and a straight cut. Brand and fabric remained empty. Confirmed metadata, original analysis and a stored photo URL were checked under a separate test identity; the test garment and image were removed. This does not establish accuracy on all garments; print vs embroidery and occasion descriptions still need shopper review.

Joint tests pending: real shopper upload and correction, readable/obscured labels, gowns/jeans/other types, multiple items and unclear images, body/fit preference usefulness for occasions, saved wardrobe matching during shopping, phone upload, and scheduled draft cleanup over actual time. Daily-feed wardrobe ranking and merchant-photo styling are not connected.

Published production deployment `97836c90-cbe5-47c9-a52e-99c0b392350d`. Signed-in browser verified the photo-analysis form, editable metadata fields, optional styling form and disabled analysis without a selected photo. Browser upload/confirmation with actual shopper clothes remains a joint test; the real Gemini photo and saved-metadata check above used the development backend. Screenshot: `/tmp/chauffeur-ai-wardrobe-live.jpg`.

## Photo onboarding and virtual try-on (12 October)

**Pending: real virtual try-on.** Resolve Gemini image-generation quota/access, generate a real preview, and test whether it preserves the shopper’s appearance and garment details. The screens and backend flow are built; this feature is not yet verified working end to end.

Builder reports prior wardrobe/photo testing complete; this is user-reported, not a new agent browser verification.

Built: three-step optional onboarding; saved size/language/budget/fit/style; consented portrait upload and tentative Gemini proportion/shape suggestions; human confirmation before styling context; separate try-on-photo suitability and shape visibility; one-piece previews from private wardrobe photos or saved merchant images; Workflow job state; allowlisted image hosts, rejected redirects and bounded downloads; five attempts/rolling 24h; no automatic generation retries; seven-day output expiry; portrait replacement/removal cleanup and stale-result rejection. Existing preference/taste records are preserved. No face identification or measurements are inferred.

Automated: 75 total checks pass (4 page/demo and 71 backend), backend type checking passes, frontend build passes. New tests cover onboarding preservation/privacy/budget validation, photo consent/auth, unconfirmed estimates, ownership, stale confirmation, photo/derived-description/output deletion, usable photo without body inference, image request/response storage, quota messages/no retry, removal during generation, unsafe merchant hosts, caps after result deletion, and expiry cleanup. Controlled generated-image bytes test transport/storage and do not establish visual quality.

Real Gemini: a repository clothing model photo under a separate development test identity received low-confidence tentative proportions and a rectangle shorthand, with explicit caveats that the loose garment/angled pose hide contours. This may be inaccurate and was not confirmed as shopper truth. The real image-generation attempt failed with HTTP 429 and correctly became a failed preview; no output image was claimed. Google API access/quota is the concrete try-on blocker.

Joint tests pending: actual shopper onboarding photo, confirming/correcting estimates, multiple people/partial photos/obscured contours, generation after quota access is resolved, identity/body/garment preservation, saved-product image access, expiry over real elapsed time, and mobile uploads. Full multi-item outfit previews and WhatsApp onboarding remain outside this version.

Retry requested by the builder: a second real Gemini image-generation attempt also returned the quota failure. Both development test portraits, garments and preview records were removed; no actual shopper photos were added or removed.

Production published with the final onboarding and styling-form changes. Signed-in browser verified saved existing preferences, navigation through all three onboarding steps, optional-photo continuation, saved-product selection and disabled generation without a photo/consent. Final live account asset: `account-BkTE2NBi.js`. Screenshots: `/tmp/chauffeur-photo-onboarding-live.jpg` and `/tmp/chauffeur-tryon-flow-live.jpg`. Actual shopper upload and a generated visual remain joint tests.

## Buying intelligence, multimodal drafts and account controls (14 October)

Built: fresh saved-product checks; bounded other-store lookup with exact manufacturer identity distinguished from alternatives; source-linked advertised offer text with cashback/conditional labels; preserved old observations on failure; private report cleanup when favourites are removed. Wardrobe buying reviews use available owned pieces and reject invented IDs or changed inventory/product data. Photo/voice drafts require sign-in, consent, container validation and user review before search; raw files and Agent messages are not saved. Partial data downloads and all-device sign-out are connected; password recovery/email verification and complete account deletion remain pending.

Automated: 86 total checks pass (4 page/demo, 82 backend), backend type checking and frontend build pass. Added checks cover private intelligence, deletion cleanup, unsafe offer sources/hidden markup, cashback vs conditional terms, exact identity vs alternatives, unreadable live pages, fresh price/offer extraction without delivered-price claims, owned available wardrobe IDs, stale advice, audio containers/limits, input consent, private partial export and owned session/token invalidation.

Real development tests: a public repository clothing photo produced a white floral straight-kurta draft with uncertainties; a synthetic spoken request became “blue cotton kurta size medium under 1000 rupees.” A live Flipkart product refreshed successfully; Amazon was unavailable, no manufacturer code or readable offer terms were found, and no savings were inferred. A real Gemini wardrobe buying review paired the candidate with the separate test account’s black trousers. The first AI shopping turn and first buying review hit temporary model high demand; one manual retry succeeded for each. These tests do not prove all languages, merchants or styling quality.

Production browser: signed-in app loads the new controls. An actual saved Flipkart price refreshed, and the evidence panel honestly showed unknown stock/shipping/identity, no readable offer terms and unavailable other-store search. Photo input is disabled without file/consent; automated browser file upload was blocked by Chrome extension file-URL permission. No actual shopper photo, voice or fictional wardrobe was added. Account snapshot preparation succeeded without console errors; the first browser download-event capture timed out, so the UI now offers an explicit save link after preparation. Full download-file capture is checked separately below.

Joint checks pending: real advertised terms across both stores, manufacturer-code matches and exact variants/totals, cashback/coupon/bank applicability on checkout, real wardrobe overlaps/occasion usefulness, ambiguous/multiple-item photos, Hindi/Hinglish voice and microphone recording on real phones, upload permissions, all-device sign-out in two actual sessions, and recovery/deletion after their missing connections/cleanup are built. Real virtual try-on remains pending.

Development fixture cleanup: the test trousers and saved product/report/history were removed successfully. Real shopper wardrobe and favourites were preserved.

Final production browser check: asset `account-DSc9obO9.js` loaded successfully. Empty wardrobe disables buying review, photo/voice selection works, and draft creation remains disabled without file/consent. Account data preparation produced an explicit “Save my data file” link. The extension still timed out capturing the download after that direct click, so actual file saving remains a joint check; no successful file capture is claimed. All-device sign-out confirmation and cancel were checked without ending the actual shopper’s session. Screenshot: `/tmp/chauffeur-buying-intelligence-live.png`. Final `npm run deploy` completed successfully in 106.4 seconds.

## Fashion assistant positioning — 14 October 2026

The homepage now presents Chauffeur as a Fashion AI assistant for women and men: shopping, wardrobe styling, shoes and accessories. Hero inspiration includes real menswear, sneakers, a bag and existing clothing photography. Copy, examples, journey and page metadata reflect broader fashion assistance. This is a website positioning update: wider live store categories remain clearly marked as next; existing live discovery categories and the fictional demo are unchanged.

Checks: 86 tests and the frontend build passed. Browser verified hero photos/framing, pause controls, switching to the wardrobe-styling example, and the expanded fashion-scope FAQ. Production deployment `662d4088-d4da-49e5-bfa9-205a6a932e29` completed; live homepage asset `website-Z5TbhEHu.js` and the new heading were checked. Screenshot: `/tmp/chauffeur-fashion-homepage-live.png`.

## 2026-10-14 — broader fashion discovery
- Added shared categories across AI decisions, basic chat, live discovery, price-check candidates, photo input and daily-feed readiness. Explicit men/women/unisex requests guide search; no default gender is assumed.
- Shoe sizes require UK/US/EU notation; incompatible clothing sizes are cleared. Waist sizes are accepted for trousers/jeans/shorts/belts. Bags/watches/sunglasses/sarees need no size. Only letter-based clothing sizes are saved into the existing general size preference; shoe/waist sizes remain in the conversation.
- Passed 90 automated checks (4 website/demo + 86 backend), backend type check and production build. Development backend pushed successfully.
- Real development store checks: men's shirts returned 6 options from Flipkart and Amazon; men's sneakers returned 3 Flipkart options; bags returned 3 Flipkart options. Amazon access unavailable for sneakers and bags. These are observed listing/product prices, not size-specific stock or checkout totals.
- Real Gemini chat attempted twice with isolated development identity fashion-expansion-check-20261014; provider returned high-demand failures. Full free-text-to-results verification remains pending while Gemini is unavailable. No fake products were substituted.
- Joint checks remaining: free-text category switching, shoe size clarification, new-category photo/voice requests, saved-product price checks on footwear/accessories and the next daily feed for a new category. Real try-on remains pending provider quota; account recovery and full deletion remain pending as previously recorded.
- Production deployed successfully with npm run deploy (58 seconds). Browser verified the updated signed-in chat placeholder, suggestions, editable request and enabled Send button, with no captured console errors. A sneaker request was left as an unsent draft; existing user chat and daily preferences were preserved. Screenshot: /tmp/chauffeur-fashion-search-live.png. This browser check does not establish Gemini search success.

## 2026-10-15 — signed-in app navigation
- Replaced the single long feature page with Chat, Daily picks, Wardrobe, Saved items, Try-on, Past chats and Settings destinations. Links support reload and browser back/forward through URL fragments on the existing Convex-hosted app entry point.
- Active first-time setup gets its own three-step page. Completing or skipping opens chat; completed/skipped setup can be edited from Settings. The last step can finish directly into Wardrobe. Existing preferences are kept.
- Chat stays mounted while switching feature pages so an unsent draft is not lost. Account support and feature readiness live in Settings. Try-on links now open the corresponding destinations.
- Automated checks: 90 tests and production build passed. Browser verification recorded below after deployment.
- Production browser checks: opened Settings → Edit styling setup; advanced through style, optional photo and wardrobe steps without changing the saved field values; finished back into the app. Verified Chat, Wardrobe, Saved items, Daily picks, Try-on and Past chats as separate destinations, browser Back, and a draft preserved across Chat → Saved items → Chat. No captured browser errors. Screenshot: /tmp/chauffeur-chat-navigation.png. New-account automatic setup gating and mobile layout still need a joint check.
- Deployed successfully through npm run deploy (56.7 seconds). PRODUCT.md was not replaced with the pasted Saathi plan while its intended destination awaits clarification.

## 2026-10-15 — phone-first signed-in app
- Phone navigation is a fixed five-item bottom bar: Chat, Daily picks, Wardrobe, Saved items, More. More contains Try-on, Past chats and Settings. Desktop keeps its sidebar.
- Chat uses the available screen height with scrolling messages, horizontal suggestion chips and a reachable composer. Photo/voice controls expand in a bounded scrollable panel. Mobile no longer auto-focuses the composer on every response.
- Added visible-viewport resize handling for keyboard space, safe-area padding, larger touch targets and 16px form controls. Forms and detailed product cards stack on phones; optional setup stays step-by-step.
- All 90 automated tests and the production build passed. Physical iOS/Android keyboard, safe-area and photo/voice picker checks remain joint testing items; desktop viewport previews do not prove those device behaviours.
- Published phone previews verified at 360×740 and 390×844: no horizontal page overflow; chat page fits viewport; composer stays above bottom navigation with photo controls collapsed or expanded. More → Settings works after correcting a routing bug found during the browser check. Small-screen onboarding fields were visually inspected. No captured console errors. Screenshot: /tmp/chauffeur-phone-first.png. Browser viewport restored afterward.

## 2026-10-15 — Shop-inspired assistant layout
- Added For you as the default signed-in destination; existing /#/chat and marketing query links still open chat. Home uses actual current requirements, saved preferences, wardrobe counts and saved-item counts, with empty/loading states.
- Home search and prompts transfer an editable draft into the existing chat. No external search is made until Send. Wardrobe, saved items, daily edit and settings retain their existing backend functions.
- Product results now use a compact image grid, save controls, expandable evidence/actions and subtle motion with reduced-motion support. No new ratings, sale labels or availability claims.
- 90 automated tests passed; production build passed. Browser checks follow below. Phone keyboard and actual upload picker remain real-device checks.
- Production deployed (54.2 seconds). Browser verified the personalised home on desktop and at 390px, the home request transfer into an unsent chat draft, three-column desktop/two-column phone result grids, and expanded product evidence/actions. Phone content had no horizontal overflow and composer remained above bottom navigation. No captured console errors. Screenshots: /tmp/chauffeur-personal-home-desktop.png and /tmp/chauffeur-personal-home-phone.png. No new search or purchase was submitted from Chauffeur during these UI checks.

## 2026-10-15 — supplied Mobbin home references
- Inspected both supplied Shop welcome/home screens and added a floating fashion-photo composition around the home message/search. Existing licensed photos, no invented product recommendations. Phone layout gathers imagery above the search; desktop surrounds it.
- Pause control verified through the rendered animation play state. Reduced-motion CSS removes decorative movement. Home request handoff verified with an unsent draft. All four images loaded; no horizontal overflow at 390px and no captured console errors. Desktop checked at 1280px.
- 90 automated tests and build passed; npm run deploy completed in 47.1 seconds. Screenshots: /tmp/chauffeur-floating-home-phone.png and /tmp/chauffeur-floating-home-desktop.png.

### Website banner / app home handoff
- Public banner now uses floating real photos, a central search, pause control and phone layout; authenticated home is a quieter search-first page.
- Checked local phone and desktop banner, pause control, and a website request reaching the signed-out screen with the exact text intact.
- All 90 automated tests passed; production build passed.
- Still needs a fresh-user walkthrough: website request → account creation → onboarding → chat. Existing authentication is unchanged; onboarding return now selects chat when a request is present.
- Production verified after deployment: cleaner signed-in home on desktop and 390px phone layout; public website search while already signed in opens chat with the exact draft intact (no automatic message sent).

### Centred wardrobe spiral and shopping slides
- Inspected the user-supplied Grail reference and its public site; built original 3D wardrobe cards with existing attributed photos, pause/play, reduced-motion support and off-screen pausing.
- Checked desktop and 390px phone layouts. Verified step selection, next, keyboard previous (5 → 4), and the discovery slide's plain/print toggle. All five scenes render in the horizontal scroll-snap track; vertical page scrolling stays free.
- Website/demo: 4 tests pass. Backend: 86 tests pass with `npx vitest run --maxWorkers=1`. Parallel runs hit 5-second limits in three workflow tests under local load; no assertions failed in the successful serial run. Production build passes.
- Still needs a real-phone finger swipe check; browser checks covered responsive layout, buttons and keyboard navigation.

### Coherent centred marketing page
- Checked desktop conversation and expanded FAQ, plus 390px conversation and feature cards. No horizontal page overflow at phone width.
- Switched conversation examples and verified the corresponding messages update; expanded a FAQ answer.
- All 90 tests passed and build passed. Signed-in app and separate demo layouts unchanged.

### Scroll-driven photo story
- Inspected the supplied Pinterest animation in browser. Replaced the shopping carousel and garment SVG placeholders with continuously moving real-photo cards and conversation/comparison/buying overlays.
- Browser checked vertical keyboard scrolling through all five stages in sequence, phone-sized scene layout and the five stacked scenes on a short landscape screen.
- All 90 existing tests passed; build passed. Real-device finger scrolling and reduced-motion OS setting still need a device check (short-screen fallback uses the same static rendering).

### Original five-step content and parallax restoration
- Restored the occasion/calendar opening, office-look conversation, discovery, illustrative price comparison and final size/address/total review. Checkout remains explicitly planned; sample comparison prices are fictional.
- Added different scroll speeds for background, photos, calendar and thought bubble, with continuous offsets (no midpoint position jumps).
- Checked the distinct first scene at phone size and original chapter text through native page scrolling. Existing 90 tests and build passed; production build also runs during deployment.

### Snappy story and teal primary
- Story now selects discrete chapters, with 150–180ms transitions and a 130ms scroll-settle snap to the nearest chapter. Background depth movement remains; entry/exit edges are free to leave the section.
- Verified exact primary button colour rgb(27,153,157), desktop chapter settling and phone banner appearance. All 90 tests and build passed.
- Teal palette applied to marketing styles only; account/demo styles remain separate.

### Purple palette restoration
Restored the exact pre-teal marketing styles while retaining chapter snap logic and short transitions. Browser verified primary #7956a3; 90 tests and build passed.

### Blue palette trial
Verified primary rgb(41,80,184) (#2950B8) and homepage appearance in browser. All 90 tests and build passed. Only marketing palette styles changed.

### Meetup typography trial
- Inspected the Mobbin screenshot and Meetup live heading/body computed font styles.
- Installed self-hosted Inter with its SIL licence; this is an alternative to commercial NeuSans, not an exact font match.
- All 90 tests and production build passed. Desktop hero visually reviewed; phone story card and banner reviewed, no horizontal page overflow at 390px.

### Compact header and logo variants
All 90 tests and build passed. Browser reviewed both desktop versions and the orbit variant at 390px. Confirmed header height of 68px on desktop and changing orbit transforms. Both animations include reduced-motion and existing pause handling.

### Shopping-bag logo trial
All 90 tests and production build passed. Visually checked both star and bag phases on desktop, phone header at 390px (62px high), and confirmed pause freezes the animation. Reduced-motion styling uses a static bag.

### Continuous loop and named wordmark
All 90 tests and build passed. Browser checked original six-spoke and bag phases, Inter wordmark and exact blue dot, and combined header at 390px. Final rotation easing keeps the bag upright during its central phase; reduced-motion/pause handling retained.

### Six-feature loader
All 90 tests passed. Browser verified six tiles, expanding/collapsing phases, working pause/play, and 390px phone layout without horizontal overflow. Loader replaces existing account/sign-in pending messages without changing account logic or adding delays. Preview is available at `/?preview=loader`. Real account-loading transitions were not manually exercised in this design pass.

### App brand alignment
All 90 tests and build passed. Verified live authenticated desktop home and phone home, chat, and wardrobe navigation; Inter heading weight 700 and sign-in button rgb(41,80,184) confirmed. Sign-in layout checked locally on desktop and 390px phone. Shared website/app logo uses the same component; reduced motion retained. No account data changed during browser checks.

### Stable bag icon and reusable asset kit
All 90 tests passed. Browser confirmed fixed bag path (no animation/transform), independently rotating spokes, full-logo and standalone loader SVG exports, and the three-asset library. Website/app share the same component. Reduced-motion disables the spoke rotation; old morph animation CSS removed. Full-logo export contains outlined text, with no external font required.

### Loader motion refinement
Kept the original opening acceleration. Centre-spoke rotation now uses linear timing from 28% to 94% of each loop (180° over 4.488 seconds), including the icon-collapse phase. Updated both React/CSS and the standalone SVG/ZIP exports; production build passed.

### Banner colour and loading handoff
All 90 tests and production build passed. Browser verified all four requested banner accents as rgb(41,80,184) with full opacity and zero public hero suggestion chips. Account setup query is gated on authentication; both pending stages share one loader branch rather than mounting a second loader in SignedIn.

### Saved fashion audience, age and reply language
Added men/women/unisex and optional age to onboarding and Settings. Shared preference saving updates existing conversations immediately and clears the old item request when the shopping audience changes; chat history remains intact. AI context reads the current saved profile on every turn. Saved reply language takes priority unless explicitly overridden for that message. Search normalization retains the current audience even when the model drops or contradicts it; explicit shopping for someone else can override it.
Checks: 92 tests passed, production build and TypeScript checks passed. Regression coverage includes repairing a pre-existing Hindi/women conversation, preserving age and audience in model context, rejecting conflicting products, and explicit gift requests. Production profile saved through Settings as men, 28, English while retaining existing size and budget. Live search verification recorded below.
Production browser check: existing chat request "Find casual shirts using my saved preferences." replied in English and returned three men's shirts from Flipkart; Amazon returned no verified matches. The store search used men's audience and the saved Rs 2,000 budget. Confirmed persisted men/28/English in Settings and the onboarding form, with the phone layout inspected at 390px. Existing historical messages/products are retained, not rewritten. Hindi/Hinglish live model responses and a full new-account onboarding save remain manual checks; language selection and preference saving are covered by automated checks.

### Shopping-first For you and results
93 tests, build and TypeScript checks passed. Added a backend regression check that a new home search keeps saved audience/size/budget, starts a fresh need and preserves the old session in history. Production browser verified direct home submission without a second send, in-place refinement, selected For you navigation, loading and empty-result states, and 390px phone layout. Both live shirt searches returned no verified matches (Amazon unavailable), so richer card layout, detail dialog, save feedback, modal dismissal and More like this were additionally checked using a clearly labelled local-only sample client in ignored tmp/. That client makes no external calls or account writes and is not included in deployment. Live store-card save/refinement should be rechecked when merchants return results. Existing backend ownership/reference tests still pass.

## 15 October — phone OTP and one-message guest preview

- Removed password provider and email/password forms. Phone accounts start fresh (builder choice); old email records are not deleted or automatically linked.
- Reused Saathi's MSG91 widget configuration and server key in Chauffeur development and production, without modifying Saathi. Server key stays server-side. CAPTCHA widget token is intentionally browser-facing.
- One guest request per browser capability, reserved atomically on the server. Duplicate submission reloads the same result; another message opens phone sign-in. Guest quota markers persist, while request text/results expire after 24 hours. A new browser or cleared storage can obtain a new capability; this is not a verified per-person limit. Global safeguards: 30 guest requests/hour and 100/day.
- Guests see only discovery/results and phone sign-in. Private features retain their existing server authentication checks. Product links open stores; save/refine requests require sign-in. Follow-up carries the original requirement through onboarding.
- Automated: OTP phone normalization, resend/attempt limits, provider-verified identity mismatch/forgery rejection, one-use expiring grants, real Convex Auth session creation with a mocked provider and stable phone identity; guest isolation, quota, retry deduplication, content expiry, private API rejection and disabled legacy password provider.
- Browser: initial guest query executes without sign-in; a second message opens phone-only sign-in. No private app navigation shown. Live store attempts currently return no verified Flipkart matches and unavailable Amazon. Explicit store-search links provided; no fictional products substituted.
- MSG91 server authorization check passes in development without sending an SMS. Real production SMS, CAPTCHA, sign-in, post-login onboarding and preserved follow-up require the builder's phone test (in progress).
- Production phone test: builder received the SMS and completed the browser code, but server-side access-token verification returned `AuthenticationFailure`. The three copied values were compared without exposing them and match Saathi production. Saathi's internal probe accepts its server credentials; Chauffeur production rejects them, including with MSG91's documented body-auth format and control endpoint. MSG91 dashboard inspection is pending builder sign-in. No token-verification bypass is implemented.

## Onboarding refresh — 2026-10-15
- Shipped three-step layout using the homepage font, denim palette, soft panel transitions and shared brand loader.
- Step 1: name, age, gender and styles; general preferences and dislikes optional. Removed budget and language questions (existing language retained; English default).
- Step 2: optional photo, top/T-shirt size, jeans size with units, approximate height; explains stored fit context and photo limitations. Existing photo consent and confirmed body-description flow retained.
- Step 3: image-led wardrobe upload, AI draft review and explicit confirmation before saving. Both later steps skippable.
- Checked: production step-one layout at desktop and 390px phone width; style chip toggle updates free text. No test preferences saved into the builder's account.
- Automated: 4 website/engine tests plus 99 backend tests pass, backend typecheck and production build pass. Added private fit-detail persistence and invalid-height checks.
- Test together next: fill actual step-one details; save/skip step two; upload a personal photo with consent and a wardrobe image, confirm analysis, finish setup and revisit Settings. These changed upload screens have not yet been exercised end to end with real personal images.

## Required onboarding gate — 2026-10-15
- App access now checks saved name, valid age, gender choice and nonblank style preferences, independent of legacy skipped/complete flags. No private app pages mount until that check loads and passes.
- Server rejects marking onboarding skipped/complete while those basics are missing. Saving setup reopens the optional sequence so legacy flags cannot prematurely dismiss it.
- Regression checks cover old skipped flags, rejected completion, saved basics, optional photo absence, and cleared required style. Full suite: 104 tests; backend typecheck/build passed.
- Live browser verified: refreshing `#/home` with missing basics shows step one; direct `#/wardrobe` navigation still shows step one. No required details entered or changed during verification.
### Search and store expansion — 15 October 2026

- Reproduced with failing checks: AI category switch carrying shirt fabric/cut/colour into sneakers, missing trainer synonym, and footwear accepting a sneaker-themed T-shirt. Fixed and protected with regression tests.
- Added public readers for Myntra, AJIO, Bonkers Corner, Bewakoof and NEWME; ten-store status/search-link coverage. Tests verify actual listed prices rather than coupons/member prices, INR, owned source paths, blocked shells, size/audience constraints and first-page store variety.
- Real local network checks: men’s sneakers under ₹5,000 returned six options from Flipkart/AJIO/Myntra/Bewakoof; blue men’s sneakers under ₹3,000 returned six options across five stores including Amazon; men’s T-shirts under ₹2,000 returned Bonkers Corner; women’s dresses under ₹2,000 returned NEWME and Bonkers Corner alongside four other stores. Prices are observations from those checks, not permanent offers. Amazon sometimes failed.
- Meesho’s public search was an unpopulated client-rendered shell. SNITCH’s public search also lacked priced product data; an observed public API route returned 404. Souled’s search page lacked priced product data; public API search attempts returned input-validation errors. Further attempts on that API stopped after repeated validation failures. All three remain unavailable with usable direct links; no invented products or credentials were used.
- Backend functions compiled and pushed to an isolated local Convex backend. Local auth keys were generated using the convex-auth skill; the existing approved Gemini key was configured without printing it. Production/shared cloud development were not changed.
- Browser: created an invented local-only shopper, skipped optional setup, submitted “Find men sneakers UK 8 under 5k”, saw six sourced cards with correct budget/system and ten store statuses, opened an AJIO detail dialog and saved the product. Refined to blue sneakers under ₹3,000 and saw six matching options; all six photos loaded at 390px with no horizontal page overflow. Switched to women’s dresses size M under ₹2,000. This exposed stale blue taste after “any colour”; fixed with a regression check, then verified varied colours and no blue-only matching reason. Reload retained the request/results, and Saved items retained the AJIO product. Updated FAQ store disclosure was opened and checked.
- Cloud acceptance and a real phone remain pending. This branch predates production phone/guest changes, so deployment requires combining the search changes with that newer implementation first.

- Final verification: 4 website/demo checks plus 98 backend checks pass; TypeScript and production build pass. Build emits existing dependency “use client” warnings, without errors. Local Convex watcher pushed the final functions. No deployment to shared cloud or production, no Git commit/push.

### Combined search release — 15 October 2026

- Integrated main through b999c38 (phone/guest access plus required-onboarding enforcement), preserving the latest account screens/backend. Saved combined implementation as 9b3916c, fast-forwarded main and pushed it to GitHub.
- 4 website/demo plus 109 backend checks pass; backend types and the production build pass. Published with npm run deploy to rare-chameleon-828.convex.site. An intervening deployment from another worktree briefly restored two-store code; the final deployment uses the combined main version.
- Production direct sneaker probe initially returned three Amazon options. Production reported Meesho/AJIO/Bewakoof HTTP 403 and no readable catalogue for Myntra/SNITCH/The Souled Store. A fresh guest request after the final deployment completed with all ten store statuses but zero products; Amazon was unavailable on that request. The expanded search is deployed, but reliable cloud catalogue access remains unresolved.
- Opened production FAQ in Chrome and verified the updated store disclosure. Website/app/demo/FAQ routes returned HTTP 200; final app opened the existing signed-in home. No SMS or purchase was triggered. Opened Meesho in Chrome and saw sneaker products after browser rendering; SNITCH also rendered product cards after its initial shell. Those browser checks do not establish an automated browser running inside the product: discovery still uses direct Convex page requests.

## SNITCH public catalogue repair — 2026-10-15
- Found that the existing search route (`/search?q=...`) and product URL rule did not match SNITCH's current website. Verified `/search/shirt` in Chrome and traced its public, unauthenticated `api.snitch.com/products/search` JSON response. No merchant credentials, browser cookies or additional service used.
- Added a bounded 25-product reader using active products, `selling_price`, product-specific colour, material, images and exact product destinations. Rejects malformed links, known sold-out requested clothing sizes and mismatched category/audience/budget; does not infer a UK/US/EU system from bare shoe sizes. Existing size/location/checkout uncertainty disclosures remain.
- Three new regression tests failed before the change and pass after it. Full checks: 4 website/demo tests plus 112 backend tests (116 total), backend type check and production build pass.
- Local real search returned SNITCH sneakers alongside five other stores. First production request after deployment returned three real SNITCH sneakers (₹1,999–₹2,049). A subsequent request/browser check reverted to the old SNITCH query route, confirming a concurrent deployment overwrote the fix. Carrying the change into main before the final release; final live checks to follow.
- Final release completed through `npm run deploy` to `https://rare-chameleon-828.convex.site` after fast-forwarding main with the SNITCH repair, preserving unrelated uncommitted wardrobe edits. Remote main includes the repair.
- Final production checks: public guest sneaker preview reached `ready` with three SNITCH products (₹1,999–₹2,049); direct production shirt search returned three SNITCH products (₹999–₹1,099). Signed-in Chrome chat search with existing casual/classic styling returned three SNITCH sneaker options (₹2,299–₹2,499), with loaded photos and working product details. Opened one merchant link and confirmed the same title/colour/₹2,299 price on SNITCH. Checked the detail panel at 390px width; restored normal width. No save, SMS or purchase triggered. Real phone/mobile-data verification remains separate. Other store access failures remain unresolved.

## Wardrobe add entry points — 2026-10-15
- Added a header Add clothing button and an empty-wardrobe Add your first piece button. Both open and scroll to the existing upload form, focusing its first input.
- Production browser: verified both buttons with keyboard activation; form opened and photo chooser received focus. Browser mouse automation timed out, so pointer activation was not separately verified. No personal photo uploaded or wardrobe data changed.
- npm test (109 backend tests plus website/engine checks) and npm run build passed.
- Next shared test: choose a clothing photo, analyse it, review details and save the first piece.

## Meesho product-source investigation — 2026-10-15
- Traced the current public website bundles to POST `/api/v1/products/search`. Without cookies, credentials or browser impersonation, local requests return real catalogue JSON; the same request from dev Convex returns HTTP 403.
- Added the bounded JSON request and conservative current response parsing: single-product price evidence, matching hero/image IDs, invalid/prebooking/ambiguous-audience rejection, allowed product/image URLs and excluded URLs. Existing explicit hero-price handling is preserved. No catalogue-wide minimum is used for multiple products.
- Two regression tests failed before the fix and pass after it. Full checks: 4 website/demo plus 114 backend tests (118 total), backend type check and build pass. Dev Convex push completed cleanly.
- Local real sneaker search included Meesho's ₹389 sneaker alongside five other stores. Opened the exact merchant URL in Chrome and confirmed the same title and ₹389 price. No account sign-in, cart or purchase used. Production access remains to be checked; another service would require builder approval.
- Production release completed with `npm run deploy`. Production also refuses the public search request with HTTP 403; stopped further direct-request retries after the dev/prod failures. Fresh production action still returned three SNITCH sneakers. Opened the live search page in Chrome: previous SNITCH cards load and Meesho's unavailable/direct-link state remains visible; no new end-to-end Meesho success is claimed.
- No extra service or paid plan was added. Asked the builder whether to test Browserless's free hosted browser plan with generic test queries; it is an unproven access experiment and needs approval under the project's outside-service rule.

## Store access disclosure and Browserless test preparation — 2026-10-15
- Builder reported only SNITCH succeeding in production. Reviewed recent cloud logs and source: local successes do not establish cloud access. AJIO/Bewakoof/Meesho HTTP 403, unreadable Amazon/Myntra/Souled responses and category-dependent no-match states have different causes. NEWME's latest exact failure was not separately diagnosed.
- Reproduced Flipkart swallowing all failed product-detail requests into an empty success result. A regression test failed before the fix; blocked/unreadable product pages now report unavailable when none are readable. Real readable nonmatches, explicit sold-out products and already-shown exclusions are preserved.
- Prepared internal, manual `storeBrowserProbe:run` after the builder approved the free Browserless test. Fixed synthetic sneaker request only; no private account/profile data, no app-wide automatic usage, one bounded request, no proxies/solvers/retries, and credential-safe failures. Mocked tests verify the missing-key path makes no network call and errors do not leak keys.
- Full checks: 4 website/demo + 118 backend tests (122 total), backend type check and build pass. Browserless free signup is open in Chrome; account/key setup and real Browserless access remain pending. No claim that it fixes every store.

## Browserless comparison and local browser check — 2026-10-15
- Builder supplied a Browserless key and explicitly requested local testing, a local browser view and production key configuration. Set `BROWSERLESS_API_KEY` in production only; key values are not in source or this record. No paid plan enabled.
- Restarted the isolated local Convex backend and opened `http://localhost:5179/app/` in Chrome. A fresh guest sneaker search returned six real products from Flipkart (₹388), Meesho (₹389), AJIO (₹558), Myntra (₹559), Bewakoof (₹1,490) and SNITCH (₹1,999), without Browserless. Loaded photos were visually inspected; left the local result tab open. No SMS, save or purchase used.
- First standard Browserless pass: Flipkart product links were readable; Meesho navigation timed out; Amazon/Myntra had no product links. Replaced network-idle waiting with bounded product-element waiting plus diagnostic best-attempt output, retaining a 35-second request deadline and no proxy/solver/retry. Added provider-vs-target status and page-title diagnostics without logging credential-bearing failures.
- Final manual local Browserless pass: Flipkart 39 links; AJIO 45; Bewakoof 18; Souled Store 24. NEWME 29 links were unrelated apparel, not sneaker evidence. Meesho page HTTP 200 contained no product links; Myntra title “Site Maintenance” with no products; Amazon target HTTP 503 with no products. Stopped those unsuccessful store attempts; no assertion that a standard browser fixes every store.
- Verified production key/connection through `storeBrowserProbe:run` for AJIO: `page_read`, 45 product links. Probe samples are diagnostic page evidence, not a verified priced recommendation reader. Automatic shopper fallback remains disconnected.
- 122 checks pass (4 website/demo + 118 backend), backend types and build pass. Local backend push succeeded. Flipkart status correction was deployed in the preceding release; diagnostic metadata improvements are being released with this checkpoint.

## Combined direct/browser discovery — 2026-10-15
- Builder requested combining access methods per store. Added direct-first recovery for unreadable Flipkart, AJIO, Bewakoof and Souled Store only, using the approved server Browserless key. Readable empty/nonmatching results do not cause browser calls. Four pages maximum per discovery, two concurrently, no retries/proxies/solvers. Other stores keep their independent direct reader/failure state.
- Actual rendered-page extraction: AJIO 24 qualifying candidates; Bewakoof 19; Flipkart 24; Souled Store 24 for men sneakers below ₹5,000. AJIO/Bewakoof retain their page-JSON readers. New card readers bind product URL, current price and image together, exclude MRP/conditional prices, preserve exact Flipkart PID and reject unsafe links, mismatched audience and unmet hard requirements. Listing price/size uncertainty remains explicit.
- Four new tests cover rendered price evidence and direct-first recovery, concurrency, preserving direct results, exclusion/constraint enforcement, missing keys and avoiding unnecessary browser calls. They failed before implementation; full check passes: 4 website/demo + 122 backend tests (126 total), backend types/build pass.
- Real combined local search completed in 10.9s: seven matched stores (Flipkart, Myntra, AJIO, Bewakoof, Meesho, SNITCH direct; Souled via browser). Six-card shortlist remains intentional. No seven-store production claim yet. FAQ and operating docs updated for the new provider data flow and access policy.
- Published the combined implementation with `npm run deploy`; main and remote include 81c2c92. Configured the already-approved Browserless key in the isolated local Convex server as well; no key values printed or committed.
- Fresh production guest sneaker preview completed in 28.4s and returned six options from five matched stores: Flipkart, AJIO, Bewakoof, The Souled Store and SNITCH. Amazon/Myntra/Meesho unavailable on this request; Bonkers/NEWME no qualifying sneaker matches. This is the live comparison with the earlier SNITCH-only result, not a claim that all seven local sources work in production.
- Signed-in Chrome “show more” preserved the existing casual/classic request and exclusions, returning six fresh products from Flipkart/AJIO/Bewakoof/Souled Store; SNITCH's already-shown candidates were not repeated. Opened a recovered Souled product detail with a loaded photo, date and price/size uncertainty. Checked its panel at 390px width, restored normal width and left the live results open. Opened Souled's Yugen Brown merchant page and confirmed its ₹2,599 listed price against the rendered-reader evidence. No SMS, save or purchase used. Real phone/mobile-data testing remains separate.
- Additional direct production action for women's dresses under ₹2,000 returned six stores: Flipkart, AJIO, Bewakoof, The Souled Store, Bonkers Corner and NEWME. The four eligible stores recovered through the browser; Bonkers/NEWME worked directly. Seven unique production stores across the two category checks does not mean seven per search. Fresh website/demo checks also pass after FAQ changes.

## Basic PostHog tracking — awaiting project configuration
- Implemented website/app pageviews, landing views, static button/form actions, successful phone login, server-confirmed new signups and onboarding milestones.
- Tracking defaults off without public project key/region. Session recording and automatic content capture disabled; private URL queries and referrers scrubbed.
- Build/tests passed; focused tests check private URL removal and signup payload excluding account phone/name. Backend typecheck passed after test type fixes.
- Pending: public PostHog project key and US/EU region, production environment configuration/deployment, and verifying received events in the actual PostHog project. Real sign-up funnel test requires a new phone account; existing logins must not count as new signups.
- Enabled and deployed with the user's public project key in PostHog US project 666497. Confirmed live Pageview (website and app), landing_page_viewed, button_clicked and Identify events in PostHog Activity. No session recordings were created. First full real new-account signup remains pending; server payload/privacy checks passed.
