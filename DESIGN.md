# Chauffeur · Design

Updated 15 October 2026. Read before changing a screen or message. Follow [PRODUCT.md](PRODUCT.md): discovery, personal styling and smart wardrobe suggestions. Preserve the existing website; this brief does not request a redesign.

The current blue/Inter system below supersedes the old purple/Manrope and teal trials. Earlier detail is preserved in [the previous design record](docs/history/DESIGN-before-growthx.md). Historical painterly/desi/Renaissance direction in design/ remains useful for brand art, not a reason to replace current fashion photos or controls.

The private app’s shared typography, spacing, controls and product language are specified in [the app style guide](docs/APP_STYLE_GUIDE.md).

## 1. The feeling, in labels

- **Centred request field:** one wide rounded input beneath a two-line promise, with a blue submit action; fashion photos surround it without covering the input.
- **Image-first browsing:** product photos lead a compact grid, with merchant, dated price and matching evidence close to each result. Keep unknown stock/fit details discoverable.
- **Personal context in view:** short editable preference chips and actual wardrobe/saved counts, rather than invented personalised products.
- **Wardrobe as usable clothes:** recognisable garment photos and editable details, availability and outfit combinations; no body scoring.
- **Motion with a purpose:** small transitions confirm changes; floating photos and the wardrobe spiral explain the brand. Pause, reduced motion and static alternatives keep content usable.

## 2. References, one per component

Borrow the named treatment, using our colours, assets and words. These are component references, not instructions to clone whole sites.

| Component | Reference | Take | Ignore |
|---|---|---|---|
| Headings/body | [Meetup reference](https://mobbin.com/screens/f1a261c2-eba3-40dc-a564-89e79621f243) | Bold upright headings, restrained hierarchy and easy-to-read supporting copy. Current implementation uses licensed self-hosted Inter. | Meetup’s brand colours/content and commercially licensed NeuSans. |
| Search home | [Shop desktop reference](https://mobbin.com/screens/d2e173a4-6aea-45f9-be74-d58ea757ffd6) | Prominent central search, generous space and small navigation. | Store promotions, offers or recommendations without our own evidence. |
| Fashion around the entry | [Shop welcome reference](https://mobbin.com/screens/cfb5f163-40cf-438f-a57a-99624e6120a9) | Fashion imagery framing the central message; photos gather above the input on phones. | Other brands’ assets and obstructive movement. |
| Results and saved controls | [Shop](https://shop.com/) | Image-first grid, save control on the image, compact context and expandable details. | Unverified discounts, ratings, checkout or dense sales banners. |
| Input-led public story | [Relay Studio](https://relaystudio.ai/) | A central promise and input, visual examples, short step-by-step explanation and a repeated closing invitation. | Orange/cream styling, serif headline, pricing, performance claims and automatic publishing. |
| Wardrobe presentation | [Existing WardrobeSpiral.jsx](WardrobeSpiral.jsx) | Owned-clothing concept shown through rotating photo cards and patterned backs. Static alternative preserves the explanation. | Treating inspiration photos as a person’s actual wardrobe. |
| Shopping explanation | [Existing ShoppingFlow.jsx](ShoppingFlow.jsx) | Photos persist between scroll scenes; a need becomes discovery, feedback and a decision. | Making priced examples look live, or planned checkout look completed. |
| Logo/loading | [Approved brand kit](brand/README.md) | Stationary bag outline with inner rotating six-spoke mark; separate FashionLoader for real waiting. | Prior bag-morph and orbit logo trials; loader icons as proof of working features. |

Provenance: the previous DESIGN.md records earlier visual inspection of Meetup/Shop and supplied Mobbin screens. This session read those decisions and re-opened the current Chauffeur and Relay websites in Chrome, including visual inspection; it did not repeat an authenticated Shop trial or capture a new reference gallery. Reference screenshots/assets must retain attribution and must not be reused as our product imagery.

## 3. Type and colour

**Fonts:** self-hosted Inter for public website and private app headings, body, controls and wordmark. Bold upright headings; no decorative serif italics in the current marketing system. The separate fictional demo retains its legacy type unless specifically changed. Keep script-compatible fallbacks for Hindi.

| Role | Current decision |
|---|---|
| Hero | 52–76px responsive desktop treatment; preserve phone-specific rules in fashion-hero.css and inspect wrapping at 320px/390px. Weight 700, line height about 1.05. |
| Section heading | Use the existing shared heading styles; bold Inter, tight spacing. Avoid adding a new arbitrary size per section. |
| Body | Existing marketing copy is generally 14–16px; future task/conversation copy should target 16px or larger. |
| Supporting text | Existing labels vary and some are below 14px. Do not hide essential stock, price, consent or error information in tiny captions. |

These describe the existing system and a readability target, not a completed migration to four type sizes. Measure the affected page before claiming compliance.

| Colour | Role |
|---|---|
| #2950B8 | Primary blue: submit/main action, selected states, focus and restrained brand emphasis. |
| #242a38 | Main ink. |
| #f7f8fa / #f9fafc | Existing app/public canvas respectively. |
| #ffffff | Cards, fields and product surfaces. |
| #646e80 / #6b7180 | Existing app/public supporting text. |
| #e9eefa | Soft blue grouping/selection. |
| #dfe4ef | App boundaries; public pages use their existing matching dividers. |

Reuse existing success/error styles with words and icons; red means a problem, not a sale. Blue may identify selected states and brand details as already implemented; do not copy the handbook’s example palette literally.

**Layout:** retain the existing roughly 1184px public content container and 90px desktop/60px phone section rhythm. Public header is compact, approximately 68px desktop/62px phone. Cards are softly rounded and fields/actions pill-shaped. Use existing component styles before adding new values. Product grids remain two columns on phones and three on desktop; explanatory panels/forms stack on phones.

**Accessibility targets:** readable contrast (4.5:1 normal text, 3:1 large text), visible keyboard focus, named icon buttons, labelled fields, large touch targets around 44–48px, and no essential action dependent on hover. Check 320px, 390px and desktop widths, long Hindi text and the open keyboard. These are checks to perform, not a claim of a completed audit.

## 4. Screens

Main journey: need → retained request → account/optional setup → discovery and refinement → save or merchant handoff. Wardrobe journey: confirmed pieces → occasion → outfit suggestions → choose/correct. Waiting, error and correction stay within the relevant task rather than adding screens.

The following state wording is a design specification based on existing behavior; exact copy and every state have not been audited or implemented by this document edit.

### Public website · start a request

Top to bottom: compact header, fashion-framed headline/input, five-step shopping story, wardrobe section, store-world section and closing input/footer. Main action: **Chat to shop / submit request → /app/**.

- Empty, first visit: existing headline and request placeholder below. Returning: same public entry; do not fabricate personal data.
- Loading: keep the typed request while navigating; do not pretend a search already ran.
- Error: explain a missing/invalid request next to the field and retain the text.
- Done: original request reaches the assistant as an editable draft.
- Correction: edit before sending. Store logos/inspiration and sample prices do not establish connected inventory or partnerships.

### Account access · preserve the destination

Top to bottom: shopping purpose, existing sign-in/sign-up form and help. Main action: **Send code / verify code → setup or retained request**. The integrated checkout offers one guest preview and MSG91 phone access for continuing or private features.

- Empty: explain account access and private saved clothes/preferences. Returning: sign in to the same account.
- Loading: “Getting your assistant ready…” with FashionLoader while actual auth/setup resolves.
- Error: explain failure without losing the destination; preserve safe fields, never echo a password.
- Done: open the pending request or For you.
- Correction: edit account fields. Offer code retry/change-number only when supported; never request payment secrets or expose codes.

### Styling setup · optional context

Top to bottom: basic preferences, optional body/fit/style context, optional photo consent/review, optional wardrobe step. Main action: **Save preferences → continue**. Current basic setup requires name, age, gender choice and preferred styles; photos and wardrobe steps can be skipped.

- Empty: explain that photos and body information are optional. Returning: show saved editable preferences.
- Loading: “Saving your preferences…” or “Reading your photo…” for the actual task.
- Error: retain entered details and allow manual description or skipping.
- Done: confirm what was saved and continue the retained need.
- Wrong AI answer: edit, reject or clear the estimate before it guides advice. No measurement or attractiveness claims.

### For you / discovery · find and refine

Top to bottom: request field, brief assistant guidance, preference chips and product grid. Earlier chat can be collapsed; details stay available. Main action: **Send request → sourced results**; results support refinement and opening a product.

- Empty, first visit: ask what they need with a concrete outfit example. Returning: actual preferences/current need and useful shortcuts, without invented feed items.
- Loading: “Understanding your request…” then “Looking for options…” only when that phase is known. Preserve the request; no fake cards/progress percentages.
- Error: “I couldn’t finish that search. Your request is still here.” Deliberate retry; distinguish AI failure from a blocked store.
- Done: image, merchant, dated listed price and reasons; disclose unknown requested-size stock and store failures.
- Wrong answer: refine, reject, more like this, or none of these; keep existing hard constraints. Do not quietly turn every preference into a must-have.

### Product detail and Saved items · decide

Top to bottom: merchant photo/title, dated price, matching evidence and uncertainty, save/feedback, merchant link and available wardrobe review. Main action: **Open on store → merchant product page**; a save action confirms saving only.

- Empty: “No saved items yet. Save something from your results.” Returning: actual saved cards.
- Loading: “Loading your saved items…” or “Checking wardrobe pairings…”
- Error: keep dated known information and label failed refresh/review; do not erase it or invent replacements.
- Done: saved state or owned-piece pairings with clear limits.
- Wrong answer: edit wardrobe details/preferences, reject the suggestion or remove the saved item.
- Boundary: listed-price/offer experiments do not become V1 pricing intelligence or cheapest-total claims. Checkout remains on the merchant.

### Wardrobe · manage owned pieces

Top to bottom: item grid, Add item, editable garment details/photo review, availability controls and outfit request. Main action: **Add item → review/confirm**, then **Suggest outfits → combinations**.

- Empty: “Add a few pieces you own to start making outfits.” Returning: real pieces and availability.
- Loading: “Reading this garment…” / “Putting outfits together…”; preserve the photo/request.
- Error: offer manual entry for failed image reading; explain insufficient available pieces instead of inventing an outfit.
- Done: confirmed item saved, or up to three combinations referencing actual available pieces.
- Wrong answer: edit garment details and rerun; remove or mark a piece unavailable. Clothing analysis describes the garment, not the wearer.

### Settings and past chats · control saved context

Top to bottom: styling/basic preferences, saved taste, privacy/account controls; history remains its own read-only view. Main action: **Save preferences → confirmed update**; clearing states its exact scope.

- Empty: “No saved preferences yet.” / “No past chats yet.” Returning: the owner’s actual records.
- Loading: “Loading your preferences…” / “Saving changes…”
- Error: preserve entered values and explain that changes were not saved.
- Done: confirm the specific save/clear; do not claim complete account deletion from a partial reset.
- Correction: edit/clear preferences and photo-derived context; do not expose another account or silently restore cleared taste.

### Separate demo and experimental surfaces

/demo/ remains explicitly fictional; reset-on-reload and simulated purchases/returns are visible. Do not merge it with the private app. Daily picks, try-on and pricing tools may already have screens, but do not imply they are required or verified V1 features. Real try-on is pending provider access and end-to-end verification. No “order placed” or working WhatsApp delivery state without corresponding evidence.

## 5. The first screen’s words

Preserve existing website copy as requested:

- Headline: **More options. More you.**
- Under it: **Your next find. A fresh way to wear what you own. An AI assistant that shops around your style.**
- Field: **What do you have in mind?**
- Main navigation action: **Chat to shop**.
- Submit accessible name: **Continue to your shopping assistant**.

This is current website copy, not a new user-tested claim. Five-second understanding test: not run. Show the page briefly to a shopper and ask what it does and where they would start; do not invent their response. Any new state wording above is a draft for builder review, not a quote from research.

**Assistant voice:** brief practical replies in the chosen language; at most one missing-detail question. Explain a suggestion using confirmed context and distinguish a possibility from verified fit. Never judge bodies, promise attractiveness, fabricate facts or claim shopping completion.

Draft examples: “These options match your budget and preference for solid colours. Size stock still needs checking on the store.” / “You could pair your white shirt with your available dark trousers. Want a more casual option?” Bad: “This will make your body look perfect, and it’s the cheapest online.” Review real replies before calling this voice validated.

## 6. Principles

- One clear main action for the current task; secondary controls stay easy to find.
- Current shopper instructions override saved preferences; optional body context never becomes a restriction on what they may wear.
- Every AI guess has a visible correction path. Confirm clothing/body drafts before treating them as facts.
- Product evidence and recommendation judgement are distinct; stock, fit and final price uncertainty stay readable.
- Source photos represent actual products; public inspiration and brand artwork are labelled accordingly.
- Maintain the shared blue/Inter identity and approved stationary-bag mark. Do not revive old trials or copy a reference’s branding.
- Motion cannot block reading or input. Respect reduced motion, pause controls and offscreen/hidden states; never delay a real answer for animation.
- Check phone layout, keyboard, empty/loading/error/done/correction and persistence before claiming a changed flow works.
- Keep marketing, private app and fictional demo separate. Existing wider website storytelling does not expand the V1 cut.

Method: [GrowthX Design thinking](https://growthx.club/learn/build-sprint#/design-thinking), all four chapters, read 15 October 2026. Saathi’s design brief informed the structure; its garden palette, family roles and WhatsApp-first screens are not Chauffeur requirements. No new usability test or Shaktimaan review is claimed.
