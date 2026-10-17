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


## India-routed recovery — 2026-10-15
- Standard access had failed for Amazon/Myntra/Meesho. One manual India residential Browserless request per store returned merchant HTTP 200 and priced listings: Amazon 12 qualifying candidates, Myntra 24, Meesho 17. Timings were 7.2s, 9.7s and 8.9s respectively. These were generic invented sneaker queries, no account cookies or shopper profiles. No CAPTCHA solving or paid plan enabled. The existing free allowance is charged 6 units/MB for residential traffic; subresource blocking reduces but does not cap provider billing.
- Added direct-first recovery for these three only, one India listing on unreadable direct results. Other four eligible stores retain standard Browserless. Seven browser pages maximum per search, two at a time; no app-wide concurrency/monthly budget guarantee. Meesho scoped card reader accepts the displayed current price/title/link/image and rejects MRP/conditional offers, missing evidence, unsafe links, known sold-out cards and unmet constraints.
- New regression checks failed before implementation and now pass; full suite after adding the shared deadline check: 4 website/demo + 125 backend = 129 tests, backend type check/build pass. Browser fallback stops at 90 seconds from discovery start, with each request still capped at 35 seconds, preserving direct matches when time runs out.

- Real combined local sneaker discovery completed in 13.8s with eight matched stores: Flipkart, Amazon, Myntra, AJIO, Bewakoof, Meesho, Souled Store and SNITCH. Amazon and Souled recovered via Browserless; other matched stores were direct. Bonkers Corner and NEWME had no qualifying sneaker matches. Eight matched sources still produce a six-card shortlist.
- Chrome local guest preview at localhost:5180/app/ returned six real cards with loaded photos: Flipkart ₹319, Meesho ₹389, Amazon ₹484, AJIO ₹558, Myntra ₹559 and Bewakoof ₹1,490. Screenshot: /tmp/chauffeur-india-local.png. No SMS, save, purchase or existing guest-state reset. Browserless India retrieval for Myntra/Meesho was verified by the manual listing trial, not exercised by these local direct hits.
- Builder explicitly selected waiting for the concurrent analytics release before publishing. Search changes remain on agent-mds; production has NOT received this India fallback. Existing production remains the previous standard-browser release. Preserve the other session’s unfinished main-checkout analytics changes; integrate and verify production after that release.

## Basic PostHog tracking — awaiting project configuration
- Implemented website/app pageviews, landing views, static button/form actions, successful phone login, server-confirmed new signups and onboarding milestones.
- Tracking defaults off without public project key/region. Session recording and automatic content capture disabled; private URL queries and referrers scrubbed.
- Build/tests passed; focused tests check private URL removal and signup payload excluding account phone/name. Backend typecheck passed after test type fixes.
- Pending: public PostHog project key and US/EU region, production environment configuration/deployment, and verifying received events in the actual PostHog project. Real sign-up funnel test requires a new phone account; existing logins must not count as new signups.
- Enabled and deployed with the user's public project key in PostHog US project 666497. Confirmed live Pageview (website and app), landing_page_viewed, button_clicked and Identify events in PostHog Activity. No session recordings were created. First full real new-account signup remains pending; server payload/privacy checks passed.


## India recovery production release after analytics — 2026-10-15
- Builder confirmed the analytics work was pushed and authorized proceeding. Merged 3dde252 into agent-mds, preserving both documentation additions and the two public PostHog build settings. Fast-forwarded main and pushed both branches. Unrelated untracked exports/scripts in main were preserved.
- Combined checks pass: 4 website/demo + 127 backend = 131 tests, backend typecheck and build. Deployed successfully with npm run deploy in 40.1 seconds to rare-chameleon-828.convex.site; website/app/demo/FAQ return HTTP 200. Verified the analytics public key and endpoint remain in the built bundle, without printing their values. This is not a new signup/event-delivery test.
- Real production women’s dress request (size M, budget ₹2,000) recovered all seven browser-eligible sources, including Amazon (12 options), Myntra (24), Meesho (12). Together with direct Bonkers Corner and NEWME, nine stores matched. SNITCH had no qualifying matches. Visible shortlist: Meesho ₹235, Flipkart ₹266, AJIO ₹270, Amazon ₹281.06, Myntra ₹389, Bewakoof ₹699. No size-stock, shipping or checkout-total claim. Browser sneaker verification follows.

- Signed-in Chrome production sneaker request (“Find men sneakers under ₹5000, size UK 8”) retained existing style preferences, reached eight matched sources, and showed six live cards. Amazon ₹599, Myntra ₹1,499 and Meesho ₹438 now appear alongside Flipkart ₹498, SNITCH ₹2,299 and AJIO ₹2,399. Bewakoof/Souled also matched without occupying a shortlist slot. Bonkers Corner/NEWME no verified sneaker matches. All ten configured stores have positive evidence across these two category requests, not all ten on every query.
- Browser inspected loaded photos, Meesho product details, dated ₹438 starting price and final price/size uncertainty; modal opened/closed correctly and no captured browser errors. Left live results open. Screenshot: /tmp/chauffeur-india-production.png. No SMS, save, purchase or profile edits. New real-phone/mobile-data verification was not performed. Store recovery logs for the browser request ran from 17:05:02 to 17:05:43 (additional model/request setup time is not included), so long waits remain a possible improvement.

## Session replay and footer cleanup — 2026-10-16
- Removed “Sample demo” from the website footer.
- PostHog project 666497’s replay screen showed “Recording is on. Waiting for the first session.” Website code was initializing PostHog with `disable_session_recording: true`, which prevented any session recording from starting even while other analytics events were delivered.
- Enabled browser session replay with all text masked, all input values masked, and images/video/canvas blocked. This preserves interaction/layout diagnostics without exposing chat or personal wardrobe content.
- Published web assets only with `npx @convex-dev/static-hosting upload --build --prod --no-spa`; Convex functions were not redeployed. Production homepage footer no longer includes the demo link. Production page loaded PostHog's `posthog-recorder.js` without browser console errors. Added an explicit `startSessionRecording()` call after SDK load and republished. PostHog now shows “1 recently active recording,” but after clearing the replay filters the list says “No recordings found”; a finished, playable replay is not yet confirmed. The activity indicates the client has started a recording; final ingestion/visibility still needs a later check.
- `npm test` passed (4 website/demo + 194 backend tests); `npm run build` and `git diff --check` passed. Finished replay playback remains pending.

## Discovery intent and spending preference — 2026-10-15
- Reproduced three production baselines: Nike men's sneakers ≤₹5,000 (first ₹2,148; ₹4,995 Nike option buried); women's dresses ≤₹3,000 (₹235–699 shortlist); men's casual shirts ≤₹2,500 (₹248–1,499 shortlist). Requests completed in 54.9s/55.6s/57.1s. Records are ignored under tmp/search-audit/discovery-baseline.json.
- Added optional brand/spending preference to the shared requirements validator; existing records remain compatible. One brand question for footwear ≥₹3,000 follows required size questions, and brand-only answers refine the same search. Explicit cheap requests skip optional brand clarification. No brand consent inferred from model suggestions. Known sneaker typo understood. Multiple named brands ask which first.
- Ranking and bounded candidate pools prefer 60–100% of budget, then style evidence and distance from 80%; cheaper candidates stay fallback and are disclosed. Store variety cannot put cheap stores ahead of remaining in-band slots. Hard budget, brand, category and explicit constraints remain enforced. Amazon's product-scoped brand heading is read separately from the product title. Higher price is not a quality guarantee.
- Five focused checks cover budget tiers/cheap opt-in/ceiling, brand questions/evidence, hallucinated/stale brands, typo/multiple-brand clarification and Amazon brand/title association. New checks failed before fixes; all 4 website/demo + 132 backend = 136 tests, backend types/build pass. Browser and production changed-flow checks pending.

- Merged the concurrent homepage/store-universe updates before deployment; combined 136 tests and build passed again. Published with npm run deploy in 51.6s. Optional validator fields deployed without existing-record validation errors. Updated generated API binding is included with the verification record.
- Repeated production dress request under ₹3,000: 5/6 picks in ₹1,800–3,000, priced ₹1,999, ₹1,899, ₹2,948, ₹1,899, ₹1,840, followed by a ₹999 alternative. Nine matched stores. Baseline was ₹235–699. Production casual shirt request under ₹2,500: 6/6 in ₹1,500–2,500, priced ₹1,699, ₹1,671, ₹1,599, ₹1,565, ₹1,869, ₹1,680, across six visible stores/eight matched sources. Baseline started ₹248. New requests completed in 42.1s and 50.6s. These are fresh merchant observations, not identical inventory snapshots or quality/stock claims.
- Chrome production broad request with reported typo (“men snearker under ₹5000, size UK 8”) asked one brand question with Nike/Adidas/Puma/Open to all brands buttons, retained size/ceiling, and did not show fabricated products. Screenshot: /tmp/chauffeur-discovery-brand-question.png. Nike selection/result verification follows.

- Chrome clicking Nike preserved men/₹5,000/UK 8 and searched Nike sneakers, suppressing optional style words in retrieval. Returned six Nike options from Amazon/AJIO/Myntra, all within ₹3,000–5,000: ₹3,997, ₹4,092, ₹3,777, ₹3,997, ₹4,248, ₹3,497. Verified product photos loaded, Nike brand evidence and budget reasons displayed, and result reply explained the preferred range with one feedback question. Screenshot: /tmp/chauffeur-smart-discovery-live.png. Left this separate app tab open; did not modify the homepage tab used by the concurrent session.
- Three changed production checks are therefore complete: dresses, casual shirts and the signed-in generic-footwear → brand question → Nike path. Cheapest opt-in, inspired-brand rejection, non-invented brand consent and stale brand removal are covered by automated checks; the cheapest button was not separately used for another paid live search. No new SMS, save, purchase or profile edits. No additional real-phone/mobile-data claim. Discovery/future coordinator boundary documented in DISCOVERY.md; stylist/wardrobe multi-agent coordination remains future work.


## Contextual discovery questions — 2026-10-15
- Builder clarified that useful questions must extend beyond brands. Removed the fixed brand-first gate. A shared question selector uses category, known preferences, previously offered fields and available colour evidence. Sneakers ask intended use; jeans/trousers prioritise fit; clothes can ask occasion/pattern/fit; later refinements cover style/colour/material/brand. Heels get heel styles rather than athletic-use/brand prompts.
- One optional clarification before a broad search, then retrieval after an answer or skip. Clicked answers apply exact confirmed fields without another model call; free text keeps the existing agent. Asked fields are conversation context, never assumed preferences. Skipping retains unknown values and ceiling/size, and no-more-questions disables optional follow-ups for that item. Reset/new category clears item-specific question history.
- Optional stored question is server-owned, returned with conversation state, and reused for matching visible choice buttons. Occasion terms influence bounded retrieval and evidence-based ranking; no invented comfort/suitability guarantees. Existing budget/brand hard constraints remain intact.
- Initial shared conversation check failed because the expected immediate search is now one clarification followed by search; updated that path to answer the purpose question and preserve its original privacy/exclusion assertions. New checks cover category/context selection, skipped/known fields, answer-driven query/ranking and a real Convex skip→results→different-question path. All 4 website/demo + 135 backend = 139 tests, backend types/build pass. Production/browser verification pending.

- Added confirmed-taste context when choosing questions, without promoting soft preferences into hard constraints. Known relaxed fit/classic style prevents asking those fields again. One further check covers this. Final pre-release checks: 4 website/demo + 136 backend = 140 tests, backend types and build pass, including concurrent homepage finale changes.

- Published with npm run deploy in 54.6s after merging the concurrent homepage finale update. Existing production schema validated with the new optional active-question field; static pages and app build succeeded. No paid plan or new provider added.
- Production Chrome jeans request (men, ₹2,500, waist 32) asked fit first with Slim/Straight/Relaxed/No preference choices. Clicking Relaxed fit preserved budget/waist and launched discovery directly, bypassing an unnecessary second model call. Screenshot: /tmp/chauffeur-jeans-fit-question.png. Results and separate sneaker-use question verification follow.

- Live relaxed-fit answer returned six jeans at ₹1,715–2,099 and changed the follow-up to occasion, avoiding the fit question. Five listings explicitly said relaxed; store interleaving admitted one straight-fit option despite additional matching candidates. Added a failing regression and fixed selection to order by budget band, confirmed intent evidence, then store variety. Evidence-matching candidates may use up to six slots from a store instead of inserting unrelated alternatives to satisfy a three-per-store cap. Ordinary unqualified searches retain the existing cap. Final checks: 4 website/demo + 137 backend = 141 tests, backend types/build pass. Publishing this observed-flow correction and rechecking.

- Production Chrome sneaker request now asks intended use (Everyday wear / Long walks / Workouts / No preference) instead of forcing brands. Budget ₹5,000 and UK 8 preserved. Screenshot: /tmp/chauffeur-contextual-discovery-question.png. The distinct jeans and sneaker screens verify category-based questions in the actual deployed app.
- Evidence-before-variety correction deployed successfully in 58.4s; focused relaxed-jeans request was checked below. No new SMS, save, purchase or profile edits. Skipping, no-repeat history, confirmed-taste avoidance and query/ranking effect are covered by automated checks; no new real-phone/mobile-data or Hindi/Hinglish question-copy verification is claimed.

- Final production Chrome focused request (men relaxed-fit jeans ≤₹2,500, waist 32) searched directly without repeating the fit question. Returned six candidates at ₹1,799–1,999: five explicitly relaxed-fit listings and one baggy-fit listing mentioning relaxed comfort. No straight-fit substitute occupied the shortlist. The next optional question asks occasion, and photos loaded with no captured browser errors. Fit is still merchant text evidence, not a guarantee of fit or size stock. Screenshot: /tmp/chauffeur-contextual-discovery-results.png. Left the live results open. All 141 automated tests/types/build already passed for this deployed code; only verification documentation changed afterward.


## Goal-driven, session-scoped discovery — 2026-10-15
- Builder asked for colour refinement after jeans results, an explicit useful-shortlist goal, and only current-chat context. Added exploring/refining/satisfied conversation state: cards alone remain refining; “These work for me” confirms only a current nonempty shortlist, without purchase/save/profile writes. New search/reset clears status and chat taste; continued refinement remains possible.
- Jeans with known fit and results ask colour before occasion. Choices preserve current category/fit/size/budget. Added guards for abbreviated model plans so unmentioned current attributes, must-haves and taste survive; explicit any-fit/colour requests can relax the field. Past-chat taste no longer automatically seeds new chats. Saved explicit size/budget/audience/language remain defaults; records/history are retained. Stored wardrobe/style are supplied only after an explicit current-session reference; existing owned-item requests remain supported.
- Regressions first failed on colour priority, omitted current requirements and missing success state. Two existing checks expected the old automatic saved-taste reset/wardrobe context; reset expectation was updated for the builder's new isolation rule, and explicit “wear with my” requests remain recognized. Added current-session history isolation, preserved records, success confirmation and current must-have/taste guards. Final check before releasing: 4 website/demo + 142 backend = 146 tests, backend types/build pass.
- Deployed with `npm run deploy`. Chrome verified the existing jeans chat survives reload, “Show more options” keeps men/₹2,500/waist 32 and asks colour, and Black returns six black options without repeating fit. Five titles explicitly say relaxed; one flared pair still appears, so fit ranking remains a separate improvement. Prices ₹1,599–₹1,999; size stock remains unverified. Tested “These work for me”: same six cards remain, assistant acknowledges and “Shortlist confirmed” appears without a new retrieval. This is a test confirmation, not customer satisfaction evidence. Browser console had no errors during retrieval. Screenshots: `/tmp/chauffeur-jeans-colour-followup.png`, `/tmp/chauffeur-discovery-confirmed.png`.

## Cohesive discovery refinements — 2026-10-15
- Reproduced the builder's current sneaker chat in Chrome: the request to exclude USPA, include Nike/Puma and raise ₹3,000 to ₹4,000 prompted a text-only brand choice. The UI showed only the final generic results reply, hiding the acknowledgement explaining the new budget/dislike.
- Added structured AI clarification choices, deterministic named-brand buttons and confirmed-change acknowledgement. Kept original request, latest user direction and all current-turn assistant replies visible; active question takes priority over generic buttons. Confirmed style/occasion/fit/pattern appear with current filters. Old cards are labelled Previous picks until a new retrieval finishes.
- New regressions failed before the fix on missing brand choices, discarded AI colour choices and missing view helpers. They now check the brand answer bypasses the model while preserving budget/size/occasion/dislikes, unchosen colour is not applied, and acknowledgement plus result both remain visible. One existing WhatsApp check caught replacement of the initial search acknowledgement; retained the original initial-request message and scoped change summaries to subsequent rule-based refinements. 4 website/demo + 145 backend checks pass, backend types/build pass. Browser verification of this release pending.

- Integrated the latest committed photo-first wardrobe release before publishing; combined full run: 4 website/demo + 147 backend = 151 passing checks, backend types/build and diff check pass. Deployed through Convex hosting; final deployment completed in 39.5s. Main and agent-mds contain the same release; unrelated export/script files remain untouched.
- Live Chrome repeated refinement in the builder's existing sneaker session: “Nike and Puma … budget 3500, keep UK 8 and everyday wear” acknowledged the budget and displayed Nike/Puma buttons. Selecting Puma kept those details and returned six Puma listings from Amazon/AJIO at ₹2,693–₹2,919. The brand-change acknowledgement remained visible with result summary and a material question with matching buttons. Reload preserved the chat. Requested size stock is still unverified.
- Checked 390px phone layout: all brand/skip choices were visible with no horizontal overflow (document 381px, viewport 390px); restored the normal viewport afterward. On the final release a typed request to choose colour without searching produced Black/White/Grey/Navy buttons, retained Puma/UK 8/₹3,500/everyday, did not choose a colour or run a retrieval, and labelled retained products Previous picks. Confirmation is hidden for those previous picks. No captured browser errors. Screenshots: `/tmp/chauffeur-cohesive-brand-choices.png`, `/tmp/chauffeur-cohesive-results.png`, `/tmp/chauffeur-cohesive-colour-question.png`. No real phone keyboard, SMS or Hindi/Hinglish copy check in this pass.

## Photo-first wardrobe tags — 2026-10-15
- Replaced the naming form with photo → AI tags → optional label details → confirmation. Wardrobe cards and outfit pieces refer to photos and tags; automatic titles remain for accessibility and existing internal consumers.
- Shared upload/review editor also serves onboarding. Category-specific visible details include sleeves, neckline, length, fastening, heel/sole and straps. Optional exact size is saved with brand/material. Unconfirmed details may remain blank; category changes clear inapplicable tags.
- The original AI reading stays separate from confirmed corrections. Private photo drafts expire after 24 hours. Multiple/unclear-item classifications fail without creating a saved piece and clean up their stored image.
- Checks: full tests, backend type checking and production build passed. Local browser checked phone upload/edit and category switching (shoe tags removed when changing to a top). A real Gemini development test used the public sneakers asset, returned shoe tags with blank size/material, confirmed a test size, verified storage and original metadata, and verified another identity could not read it. Temporary development piece/photo removed; wardrobe list confirmed empty afterward.
- Test together: upload a real owned garment on phone, review/correct AI tags, add label size/material if known, save, reload and use it in an outfit request. No personal photo was uploaded and no user wardrobe item was changed during these checks.
- Production browser verified Add clothing opens the new photo-first editor, analysis is disabled without a photo, and the phone page has no horizontal overflow. Desktop screenshot: `/tmp/chauffer-photo-first-wardrobe.png`. The live shopper's wardrobe remained empty.

## HEIC across image uploads — 2026-10-15
- Shared photo handling now accepts HEIC/HEIF (including empty MIME types and uppercase extensions) in wardrobe/onboarding, styling portraits used for try-on, and shopping-by-photo. Existing JPEG/PNG/WebP support and 12 MB limit remain.
- HEIC conversion happens in the browser, with native decoding when available and lazy-loaded heic-to otherwise. Wardrobe and portrait previews share the converted image with the upload path; conversion errors are visible and block analysis. The backend continues to receive compressed JPEG, with existing validation/consent checks.
- Tests and build/type checks passed. Chrome converted the official libheif example HEIC to a visible 1000×667 JPEG of 160,821 bytes, including a File with empty MIME type. Damaged HEIC produced the intended recovery message. Automated checks cover MIME/extension acceptance, oversized/unsupported input, and browser-transcoded JPEG with a .HEIC filename.
- Still to test together: an actual iPhone photo selection, portrait orientation and newer HDR/Live Photo variants on a physical iPhone. No personal photos were uploaded for these checks.

## Ten-store discovery expansion — 2026-10-15
- Researched official Indian store pages and inspected their public listing formats: Nykaa Fashion, Tata CLiQ, H&M, Uniqlo, Westside, FREAKINS, Off Duty, Superkicks, VegNonVeg and PUMA. Added trusted search/product/image destinations and bounded readers to the existing shared discovery pool; existing constraints, six-card ranking and seven-source Browserless recovery are retained.
- New checks cover rupee versus paise handling, row stock/price, H&M member-price exclusion, colour ownership, PUMA swatch/app-exclusive handling, trusted canonical Westside links, Uniqlo search-grid scope, malicious/overseas URLs, exclusions and shared search wiring. Existing store-count assertions updated from ten to twenty, retaining the failure/no-leak checks.
- Local direct fixed scenarios returned women-jeans matches from Nykaa/Tata/H&M/Westside/FREAKINS/Off Duty/VegNonVeg; men-shirts matches from Nykaa/Tata/Westside/Off Duty/Superkicks/VegNonVeg/PUMA. H&M was unavailable on the shirt request. Uniqlo direct was denied; Chrome showed real products but a standard Browserless trial returned no usable products. No automatic Uniqlo fallback enabled. Production checks pending.
- Initial build caught the recently merged HEIC dependency missing from this checkout's node_modules; npm install resolved it without source/dependency changes. A duplicate convex dev --once was refused because the existing watcher owns port 3210; verified that watcher pushed the new functions successfully instead. No backend process/settings reset.

## Wardrobe titles and clean images — 2026-10-15
- Confirmed tags now generate a visible title. New photo-backed pieces automatically queue a separate white-background image using Gemini 3.1 Flash Image. Original photo remains stored and accessible under View original photo; editing and try-on still use the original reference.
- Existing pieces have Create clean photo. Failures have Retry; generation times out safely, duplicate requests are ignored, attempts are capped at three per piece/day, and stale results are removed after edits/deletion. Removing a piece removes both photos. Visual tag changes invalidate the generated version.
- Checks: 152 backend tests plus four website/demo tests pass; backend types and production build pass. Automated tests cover provider request/output storage, separate original retention, ownership, stale output, tag changes, deletion, timeout and retry limits. Temporary development fixture removed.
- Real Gemini requests in development and production both returned HTTP 429 (rate/quota limit). No generated image was produced, so actual visual fidelity is NOT verified. Production sweater retains its original and displays the retry message; no other personal items modified.
- Browser: visible titles, generation failure/retry and original-photo disclosure checked; 390px phone layout has no horizontal overflow. Remaining: resolve Gemini image-model quota, generate a real clean image, compare colour/print/cut with original, and test a new confirmation end-to-end on phone.

- Production direct women-jeans and men-shirts probes confirmed Tata/Westside/Off Duty/VegNonVeg plus FREAKINS on jeans and Superkicks/PUMA on shirts. Nykaa/H&M/Uniqlo returned HTTP 403. Uniqlo's production standard-browser probe returned no_readable_products; Nykaa's fixed standard-browser probe loaded a page with no product links. H&M's standard browser loaded 26 links, and a priced-parser trial returned 24 women-jeans matches. A subsequent production H&M priced-parser check returned no_readable_products, so its automatic recovery was disabled before the final release. Keep all three new-source browser recoveries off; original seven sources, seven-page cap, concurrency/deadline and proxies remain unchanged. Local browser success is not treated as verified production prices.
- Live combined search already displayed new Tata CLiQ and PUMA products and twenty store states. It also caught a pre-existing refinement bug: a detailed message containing “no questions” was treated as a bare skip and lost new budget/brand details. Added a failing regression, then restricted skip handling to standalone skip requests so detailed messages go through normal interpretation. Final corrected-flow verification pending.
- Corrected production Chrome refinement preserved men/UK 8/everyday, raised the ceiling to ₹5,000 and cleared the Puma-only brand. Six results at ₹3,299–₹4,599 came from The Souled Store, PUMA, AJIO, Superkicks, SNITCH and Tata CLiQ. Twenty source states were shown; new Westside also had matching candidates. Nykaa/H&M/Uniqlo stayed unavailable, while readable category mismatches stayed no_matches. New-source browser recovery remains OFF after H&M's production price check failed; the original seven-source browser pool is retained. Final full checks: 4 website/demo + 163 backend = 167, backend types/build and diff check pass.
- Final release deployed successfully with npm run deploy in 68.2s, retaining only the original production-verified automatic browser sources. Seven new sources have production priced-product evidence across tested categories; H&M/Nykaa/Uniqlo are retained as attempted direct readers/search links with honest unavailable states. Local success is not advertised as production reliability. Chrome checked desktop and 390px results (document 381px, viewport 390px; no horizontal overflow) and restored the normal viewport. Saved proof: /tmp/chauffeur-expanded-stores-live.png. No real phone/SMS/checkout verification or private wardrobe changes in this task.

## Shared discovery / wardrobe / styling handoff — 2026-10-15
- Added validated version-1 packets with current conversation/session/revision, confirmed requirements, merchant facts and evidence times, unknowns, store states, next question/choices, goal state and optional owned-item pairings. Internal packet reader rejects old revisions; public current-chat reads remain owner-bound.
- One existing planner owns the conversation. Explicit wardrobe shopping requests load only that owner's available confirmed pieces/manual preferences; current-session follow-ups keep the scope, reset clears it and explicit opt-out disables it. One optional styling call follows one retrieval. Reference checks reject invented product/wardrobe IDs. Exact wardrobe/style snapshot changes suppress stale pairings before publication and on later reads. Model failure leaves merchant results usable.
- Live production Chrome first returned six sneakers at ₹1,999–₹2,599 within the requested ₹3,000 ceiling. This exposed a missing styling chat identifier; fixed it and added an assertion to the workflow test. A jeans follow-up exposed a planner placeholder (“any brand”) becoming a hard material filter. Added a failing regression, then cleared open/empty placeholders, including inherited bad fields, and clarified that owned garment attributes are not new-product requirements. Zero-result pairing messaging now explains that products must be found first.
- Automated checks cover one-search/one-styling orchestration, ordinary search avoiding the extra call, owner isolation, unavailable and invented item references, required source/price units, missing inventory, model failure, stale completion/display, explicit acceptance and reset. Final browser verification recorded below.

- Final production Chrome retry preserved men/waist 32/blue/relaxed/₹3,000 and cleared the invalid material/sleeve placeholders. Six verified products at ₹1,899–₹2,299 came from Flipkart, SNITCH, The Souled Store and Westside. The styling helper successfully attached the actual saved Black solid sweater to the SNITCH loose-fit jeans and Souled Store baggy jeans, with advisory reasons and the fit/colour/size-stock limitation. Existing owned items were read only; no wardrobe/photos/account settings changed. Proof: /tmp/chauffeur-wardrobe-discovery-live.jpg. Desktop layout fits (document 1272px, viewport 1281px); phone layout was not retested in this task.
- Final checks: 4 website/demo + 168 backend = 172 passing tests, backend type check, production build and diff check pass. Final npm run deploy completed in 46.4s. Main checkout has another session’s unfinished wardrobe/weather work, so this release stays on agent-mds without modifying that checkout.

## Clean-image quota resolved — 15 October 2026
- User requested another retry after changing Gemini access. Production browser successfully generated and displayed the two existing pieces (olive trousers and black sweater) against white backgrounds. Original photos remain separately accessible. Screenshot `/tmp/chauffer-clean-photos-ready.png`. Fine garment-detail fidelity still needs the owner's comparison.

## Wardrobe intelligence — 15 October 2026
- Added saved size/height, taste/fit/avoid and confirmed styling-photo descriptions to outfit context. Unconfirmed photo analysis and generated try-on pixels are excluded. UI adds prompt examples, date/period/setting, device-time prefill and a reviewable context panel. Optional city storage can be cleared; live weather is pending by builder choice.
- Added versioned internal wardrobe context/result adapters and documented routing, scope, stale-result checks and remaining integration. Merged discovery's already-deployed `agent-mds` handoff before deploying this work; shared shopper context is now used only inside discovery's existing explicit wardrobe scope.
- Automated: 175 backend tests plus four website/demo tests pass; backend type checks and production build pass. New coverage includes owner isolation, saved sizes, excluding unconfirmed/photo/name data, profile changes during/after generation, location rounding/removal, time-zone midnight, invalid dates, unavailable/stale weather, forecast parsing and lookup limits. Discovery tests verify changed size invalidates advisory pairings while preserving merchant results.
- Real Gemini development request: two invented pieces (relaxed white cotton shirt, straight black jeans), male shopping context, M/32 sizes, approximate height, self-described longer torso, minimal/relaxed preferences and warm-weather dinner prompt. Returned one valid owned-ID outfit with practical advice in English; no live weather invented. Development inventory fixtures removed. This is one wiring/quality sample, not proof of broad styling quality.
- Remaining: real weather key/provider tests, actual-phone location allow/deny, Hindi/Hinglish advice quality, more garment/occasion combinations, automatic cross-agent routing/refinement and a dedicated stylist advisory flow. Weather responses and browser geolocation were tested through fixtures/code paths, not a physical device or live weather provider.
- Production browser: submitted a warm-evening dinner request with Evening + Both/commuting controls. The user had added a third piece during development; the agent selected the actual beige linen shirt and olive corduroy trousers, returned practical tips, and did not invent saved body data. Context panel correctly showed English/men/casual-classic and no confirmed body description. No profile, location, availability or wear history was changed by this check. Mobile at 390px had no horizontal overflow; weather remained explicitly pending. Screenshots: `/tmp/chauffer-wardrobe-intelligence.png` and `/tmp/chauffer-wardrobe-intelligence-phone.png`. The newly uploaded shirt's separate clean-image job had failed and was shown as a placeholder, not falsely presented as generated.

## Clean-image failure diagnostics — 15 October 2026
- Recovered the failed beige shirt with one controlled production retry. Gemini returned a JPEG successfully; refreshed production wardrobe displays all three clean photos with originals still accessible. Earlier errors were swallowed, so their original cause remains unknown.
- Added bounded structural provider diagnostics (status, finish/block reason, image presence/size; no photo, prompt or credentials). Added clearer no-image, timeout and service-unavailable messages. The daily three-attempt limit now uses a public Convex error so production can display it.
- Removed the temporary internal repair endpoint after recovery. No automatic retries added and normal quotas remain unchanged.
- Checks: 178 backend + 4 website/demo tests pass, backend type check and production build pass. New mocked failure tests cover no image, HTTP 503 and 429, original preservation and no automatic retries. Production browser confirms the saved clean shirt after refresh; garment fidelity still needs owner review.

## Catalogue garment presentation — 15 October 2026
- Updated clean-photo prompt to remove accidental wrinkles/crumpling, straighten the collar/placket/hem/sleeves and present a professionally steamed garment. Preserve fabric grain, gentle drape, intentional pleats/ruching, designed crinkle textures, colour, cut and garment details.
- Regenerated only the requested beige shirt from its original photo; production browser visibly shows a neater, balanced shirt with linen texture on white. Original remains separately accessible. Screenshot: /tmp/chauffer-shirt-steamed.png.
- 178 backend + 4 website/demo tests, backend types and deploy build passed. Removed the narrowly guarded one-time rerender endpoint after use; ordinary quotas unchanged.

## Personal stylist and try-on hardening — 15 October 2026
- 186 backend tests plus four website/demo tests pass; backend type check, production build and deploy pass. New tests cover no-wardrobe advice, authenticated handoffs/parents, stale profile results, rate limits, source filtering/expiry, unsafe colour values, confirmed photo-style gating/removal, preview timeout and changed-garment late output.
- Production real Gemini: requested detailed English smart-casual dinner advice for a warm evening using saved preferences. Returned four explanatory sections, a palette, two concept outfits and linked dated trend adaptations without claiming ownership or body measurements. The first answer overused layering for the heat; tightened shared principles to favour practical single layers and avoid blanket natural-fibre performance claims.
- Real portrait try-on remains untested in this release: this account has no full-length styling photo. UI correctly requires photo setup and media consent. Existing preview generation is covered by mocked image success/failure tests; this is not evidence of real-person image fidelity.
- Production refinement: “no yellow and no layering” preserved the dinner context and produced two single-layer alternatives without yellow. This validates one English correction example, not universal fashion quality.
- Production shopping handoff: selected “Refined Coastal Classic”; discovery received the powder-blue linen/cotton shirt, previous dinner context and current exclusions, resolved men's/relaxed/solid preferences and asked for the missing maximum budget. No merchant purchase or profile write. No private brief appeared in the URL.
- Browser at 390 × 844: colour cards and prose reflowed with no horizontal overflow (document width 381, viewport 390); More highlighted for Stylist. Temporary viewport reset. Screenshots: /tmp/chauffer-stylist-phone.png and /tmp/chauffer-personal-stylist.png. Physical-phone keyboard/camera remain untested.
- Final release: all 190 tests pass, types/build/deployment pass. Live trend refresh is not implemented; dated curated references expire and are labelled accordingly.


## 15 October 2026 — real three-agent evaluations

Added 24 synthetic discovery/wardrobe/stylist scenarios, three real Gemini repeats each, independent rubric scoring and ten scorer checks. Latest combined evidence: 72/72 automated passes after fixes; this is not human-certified accuracy. Stock-photo reader rejected the cropped/obstructed case; two try-on generations succeeded technically but visual inspection remains partial (pose and underlayer fidelity). Fixed ambiguous brands/shoe systems, final Hindi confirmations, unavailable wardrobe context and several prompt constraints. 194 normal tests, backend types and build pass. No deployment/browser acceptance claimed. See [AI_EVAL_RESULTS.md](docs/AI_EVAL_RESULTS.md) for methodology, failed setup attempts, image flaws and remaining checks.

## 16 October 2026 — app visual and language polish (local preview)

- Added `docs/APP_STYLE_GUIDE.md`, linked from DESIGN.md, and the shared final styling layer `app/ui.css`: homepage Inter/denim identity, consistent type sizes, fields, controls, surfaces, spacing, focus and reduced motion.
- Simplified customer copy across home, onboarding, discovery, wardrobe, stylist, try-on, saved items, daily picks, settings and account support. Removed provider names and repeated explanations; retained explicit photo processing/retention consent, editable estimates, real errors and merchant checks.
- Wardrobe has separate clothes/outfit views; optional event details and saved-product tools expand on demand. Search shows the latest assistant response, retains the full conversation in history, avoids repeating the initial request and groups store availability links. Settings no longer shows an internal feature-readiness inventory.
- Browser testing found development was missing `stylist:latest`. Synced the existing backend to the verified development deployment using `npx convex dev --once`; stylist then rendered. Added a recoverable page error screen so a failed page does not remove navigation. Production was not deployed.
- Browser checks completed in signed-in local Chrome: home, wardrobe empty state, open/close photo editor, clothes/outfit switch, stylist initial form and expanded event fields, try-on photo consent/first-use state, settings form, saved empty and populated states, More navigation, daily disabled state, past chats and onboarding step 1. Checked desktop, 390 px phone layouts and 320 px saved/stylist/try-on/onboarding layouts. Saved and expanded stylist DOM width checks showed no document overflow at 320 px.
- Live development discovery: a synthetic men's black cotton T-shirt request returned six sourced results. Opened the product dialog, saved one SNITCH item and verified it appeared in Saved items. This test adds one search and one saved product to the development account; no purchase, photo upload or preference change was made.
- `npm test` passed: 4 frontend + 190 backend tests. `npm run build` passed; existing dependency directive and large HEIC chunk warnings remain. `npm run typecheck:backend` passed. Existing AI evaluation changes were preserved.
- Remaining: real phone keyboard/camera/HEIC and mobile-data checks; fresh generated stylist/outfit/try-on result layouts were not rerun in this visual pass. Onboarding steps 2/3 use the shared photo/wardrobe components but were not resubmitted. No claim of production release acceptance. After the extension panel closed, completed the final 390 px home screenshot check; the page content fits without horizontal overflow.

## 16 October 2026 — web asset release

- Published the polished Vite website/app files to `https://rare-chameleon-828.convex.site` with `@convex-dev/static-hosting upload --build --prod --no-spa`.
- Confirmed the production client was built with the production Convex URL, the static asset upload completed, and the live signed-in `/app/` home page loaded the updated copy and design.
- Production Convex functions were not deployed. The combined `npm run deploy` reached its backend step, detected the checkout's development target and stopped for confirmation; it made no production function change. The static-only upload then completed successfully.

## 16 October 2026 — For you daily picks
- Moved Daily picks into the For you home page and removed its desktop, mobile and More-page navigation entries. The old `#/daily` route now opens For you.
- Changed the feed from copies of one recent search into three separate live searches. Categories rotate across shirts/T-shirts, jeans and an accessory or outer layer. Results use the saved shopping audience, clothing/jeans sizes, optional budget, preferred/avoided terms and saved fit/style preferences; a confirmed photo-style note can guide search wording. The feed no longer depends on the latest chat, and it excludes recent feed picks and saved products.
- Kept daily picks opt-in, with pause/resume controls on For you. A style change hides stale picks and offers a same-day refresh. No footwear-size field exists in onboarding, so footwear is not selected automatically. Weather is not yet part of this feed.
- Removed the daily price-observation work and all price-change explanation from this page. The feed shows the current listing price only; it does not claim sale or price-drop intelligence.
- Checks: 190 automated tests pass, backend type check passes, production build passes. A signed-in local browser run returned three distinct live options (T-shirt, jeans, jacket); at 390 px the cards scroll horizontally without expanding the page into a long stack. Production browser confirms the home section and no separate Daily picks navigation. Production account was left opted out. Screenshot: `/tmp/chauffer-daily-picks-production.png`; phone layout: `/tmp/chauffer-daily-picks-phone.png`.
- Published website and Convex functions to `https://rare-chameleon-828.convex.site`. The production browser check was read-only; live daily recommendations were verified in development, not generated in the production account.

## 16 October 2026 — app navigation order
- Reordered the signed-in app pages to For you, Stylist, Wardrobe, Try-on, Saved items, Past chats and Settings. On phones, the first three remain in the bottom bar; More contains Try-on, Saved items, Past chats and Settings in the same order.
- Checks: `npm run build` and `git diff --check -- app/Account.jsx` passed. Production browser verified the desktop page order and the More-page links after deployment. No account data was changed.
- Published the site and Convex functions to `https://rare-chameleon-828.convex.site` with `npm run deploy` targeting production.

## 16 October 2026 — guest first-use previews
- Expanded the signed-out web app to offer one discovery conversation, one AI try-on preview and one AI wardrobe-photo analysis before phone sign-in. Further chat turns, another try-on/wardrobe item and saving a piece require sign-in. The UI explains that an account keeps preferences and wardrobe data for better recommendations.
- Guest try-on requires explicit photo-processing consent. Portrait, garment and generated preview are held in Convex storage temporarily and scheduled for deletion within 30 minutes; wardrobe tags expire at the same time. Capability tokens are hashed server-side, each feature is limited by Convex state, and server-side daily limits cap anonymous trials. Guest preview data expires after 24 hours.
- Checks: guest quota/concurrency tests added; `npm test` passes (191 tests), backend type check and production build pass. Signed-out local browser confirmed Chat, Try-on and Wardrobe entry screens. Real Gemini wardrobe-photo analysis and image generation were not run; a real-image customer test remains.
- Published the site and Convex functions to `https://rare-chameleon-828.convex.site`. A fresh signed-out browser origin against the production build confirmed all three guest entry screens and the public Convex connection. No account data or photos were submitted. Image-quality and full Gemini end-to-end checks remain for a controlled real-image session.

## 16 October 2026 — Free and Pro plans (local verification)

- Added a dedicated `/pricing/` page with Free and Pro plan cards, modeled on Relay’s clear plan comparison and primary call to action. The site header/footer and signed-in Settings link to it.
- Convex now assigns every signed-in account a persisted Free plan by default. Server-side monthly counters enforce 10 new shopping conversations and 3 stylist sessions per UTC month; refinements remain in the same counted conversation. Free wardrobes cap at 3 pieces. Existing pieces are preserved.
- Pro is priced at ₹99/month and removes the plan-level limits. Payment collection and Pro activation are explicitly pending; Razorpay has not been connected. Existing technical safety limits remain.
- Automated tests cover default Free access, the conversation limit, the stylist limit and Free-to-Pro wardrobe capacity. `npm test`: 194 passed; backend typecheck and production build passed.
- Local and live Chrome checks confirmed both pricing cards and the payment-pending state; the live URL is `/pricing/index.html` because Convex static hosting does not map `/pricing/` to the index file. The existing signed-in production account showed its Free plan and exhausted-wardrobe notice; no wardrobe data was changed.
- Published the frontend and Convex functions to `https://rare-chameleon-828.convex.site`. No Razorpay calls, customer charges or plan upgrades were made.

## 16 October 2026 — pricing layout correction

- Centered plan button labels independently of the arrow icon, aligned both cards’ action rows, and adjusted phone spacing and card flow.
- Checked full-page desktop and 390 px phone layouts in local Chrome and on the live `/pricing/index.html` page. Labels are centered and cards remain inside the viewport. Published static files only; no backend redeploy.
- `npm run build` and `git diff --check` pass. Existing dependency directive and large HEIC chunk warnings remain.

### 16 October — WhatsApp account channel

- Added a native WhatsApp channel around existing discovery, stylist, wardrobe, input-reading and try-on services. Details and acceptance checklist: `docs/WHATSAPP_CHANNEL.md`.
- Automated fixtures cover sender-account reuse, recipient isolation, duplicates, stale buttons/web changes, consent before media processing, shared monthly limits, private draft ownership, corrected photo draft confirmation, voice review before search, Meta-only bounded downloads and JPEG conversion. Existing web feature tests continue to exercise their unchanged public authentication wrappers.
- Development backend compiled and pushed successfully. Production phone ID/token were saved from builder-provided configuration without printing values; read-only Meta number lookup succeeded. A separate verification token was generated in production. App secret, test-recipient setting, webhook subscription and real delivery still require setup/verification. No real WhatsApp message or private uploaded photo was used for these automated checks.
- Full native parity is not claimed: settings/deletion/history/account management retain web handoffs; WhatsApp Flows, outside-window notifications, reply audio, location sharing and translated setup remain pending.
- Final checks for this release: 4 frontend/demo tests + 212 backend tests passed; backend type-check and Vite build passed. Deployed with `npm run deploy` to `rare-chameleon-828` (static deployment `9d01168b-dd0f-4337-9bf5-d81c14d40618`). Production GET webhook challenge returned the expected value. Signed-in For You rendered in the browser after backend publication. This does not verify WhatsApp UI or delivery.
- Last configuration check: `META_APP_SECRET` and `WHATSAPP_TEST_RECIPIENTS` still absent. Incoming WhatsApp POST processing therefore remains disabled with a configuration response. No proactive WhatsApp messages were sent.
