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

## Try-on homepage directions — builder review, 22 October 2026

The builder selected try-on as the proposed lead feature and requested two alternatives for homepage section two. Both currently appear after the existing hero: (01) a horizontal lookbook of interactive before/after comparisons, and (02) a blue split panel with copy and an interactive fitting-room illustration. Both link to `/app/#/try-on`, which resolves to the existing guest or signed-in fitting room. The five-step shopping story is not mounted; its component and optional `showJourney` flag remain available. The existing hero and later wardrobe/store/finale sections are preserved. This is a comparison preview awaiting the builder's choice, not a complete repositioning of the app/navigation.

Original generated example photography is labelled as illustrative; do not present it as a customer or actual Gemini output. Generation details and saved files are in public/images/CREDITS.md. Layout inspiration: the hero comparison carousel and next split feature section at https://tryiton.now/, visually inspected in Chrome on this date. Its assets, testimonials, platform claims and fit/speed guarantees were not reused.

## Selected try-on direction — 23 October 2026

Builder chose the first direction and asked for more movement and narrower cards. Removed the blue split-panel variant. The lookbook now has six illustrated looks in 288px portrait cards (mobile up to258px), in a full-width horizontal rail. It pans continuously back and forth and independently animates before/after wipes. Hover, keyboard focus, deliberate manual interaction, offscreen/hidden-page state and reduced-motion preferences pause or disable automatic motion. Pause/play and manual arrows remain available; ordinary vertical scrolling does not permanently stop motion. Illustrations remain labelled and link to the existing fitting room.

### Fixed model, incoming products — 23 October 2026

Replaces the moving six-person lookbook. One fixed photographic model and one fixed centre divider: original on the left, outfit preview on the right. Standalone garment cards slide from the left and the corresponding outfit appears as the card reaches the divider. Two matching looks share the same model and framing. Pause/play and previous/next remain available; motion stops offscreen, on a hidden tab, or with reduced motion enabled. Marketing images are explicitly illustrative. The second split-panel variant remains removed.

### Reference-style try-on carousel — 23 October 2026

Supersedes the fixed single-model scene. Match the TryItOn hero carousel's structure: 256×416 portrait cards, 16px gaps, continuous horizontal loop, soft edge fades and one fixed centre divider over the entire row. Two perfectly aligned tracks show originals with small garment thumbnails on the left and dressed previews on the right. No per-card captions or individual moving dividers. Retain Chauffer typography, blue CTA, own illustrative imagery and accessible pause/previous/next controls. Mobile uses 216×350 cards.

### Try-on copy and CTA — 23 October 2026

Heading now reads “Don't Guess It, Just Try It On.” Removed the supporting two-line paragraph. Centre the Try It On CTA below the carousel; remove previous/next and pause/play controls. Keep automatic left-to-right45px/s motion and reduced-motion/offscreen/hidden-tab stops.

### Try-on steps — 23 October 2026

Remove the carousel's “AI-created illustrations” caption at the builder's request; provenance remains in asset credits. Below the wardrobe section, add “How Does the Try-On Work?” with four numbered visual cards: add your photo, pick something to try, see it on you, try another look. Use existing own synthetic photos in code-built illustrations. Desktop four columns, tablet two, phone one. Copy describes actual photo/image/link/wardrobe entry and reusing the same session photo; no autosave, sharing, guaranteed fit or speed claim. Header “How it works” links to this section. CTA opens the existing fitting room.

### Unified try-on section — 23 October 2026

Move the four steps inside the existing try-on showcase, directly below its carousel and above wardrobe. Keep the main try-on heading. Simplify the steps subheading to “How Does It Work?” and remove its separate kicker/subtitle. Use one shared Try It On CTA at the end of all four steps; remove the carousel's duplicate CTA. Keep header anchor targeting steps within this unified section.

### Centred fashion assistant banner — 23 October 2026

Replace the two outward-moving product lanes with six gently floating feature illustrations (three per side): two product photos, a before/after try-on, a styling chat, wardrobe pieces and an outfit-calendar composition. These are marketing illustrations, not clickable controls or a newly implemented calendar feature. Centre the heading/search/supporting copy as one compact group: “Your personal assistant for everything fashion.” with “everything fashion.” blue, no top kicker. Keep existing search behavior. On phones, five compact cards frame the centre (second product hidden to protect space); respect reduced motion and pause decoration offscreen.

### Hero feature tags — 23 October 2026

Replace the two supporting text lines under the hero search with five rounded feature pills inspired by the supplied screenshot: Discover, Virtual try-on, Personal styling, Wardrobe, Fashion chat. Use own small product/try-on thumbnails and existing icons. These are descriptive tags, not tab controls; wrap into centred rows on phones.

### Compact phone hero — 23 October 2026

Phone banner now shows only three product-photo cards on top (knit, bag, sneakers); hide chat, try-on, wardrobe and calendar decorative cards there. Remove full-screen minimum height and bottom decoration space; bring heading/search/tags nearer top photos. Desktop feature cards move modestly inward while retaining all six illustrations.

### Wardrobe calendar preview — 23 October 2026

Add outfit-history/planning illustration inside the existing wardrobe section, after the clothing orbit and before its common CTA. Two-column copy/calendar on desktop; stacked on phone. Calendar month contains own product thumbnails, worn/planned markers, highlighted illustrative today and upcoming outfit. Explicit “Planned wardrobe feature” and “Preview” labels: no functional tracking or saved calendar was implemented in this homepage change.

### Calendar budgeting, pricing intelligence and creators — 23 October 2026

Extend the wardrobe calendar illustration to include saved items to buy, amber purchase-day markers and a sample monthly shopping budget (₹6,500 of ₹10,000, ₹3,500 remaining). Follow wardrobe with Pricing Intelligence (sales across stores, buy timing, lower-priced similar styles), then For Creators (try-on image export and planned3–5-second video exports without buying every featured garment). Existing own assets/code-built mockups; prices are fictional Store A/B/C examples, explicitly not live offers or forecasts. Keep planned/concept labels. This homepage change adds no price-history collection, purchase execution, saved calendar/budget database or video generation service.

### Expanded creator studio — 23 October 2026

Replace the single creator summary panel with a shared introduction plus three detailed illustrated workflows: (1) a worn-outfit photo becomes5–6 approximately5-second motion directions for brands/influencers/social posts, (2) a product image becomes a directed photo shoot with standing/seated poses, background, lighting and framing instructions, (3) create and reuse a personal avatar/brand model across outfits, scenes and later photo/video projects. Alternating illustration/copy desktop; copy then illustration on phones. New own synthetic walking/seated stills retain the existing illustrative coral-shirt model. Explicit concept/planned labels; storyboard is still images, no fake generated videos or playable controls.

### Homepage finishing pass — 23 October 2026 (preview)

Supersedes the separate wardrobe orbit/calendar and three long creator articles. Keep the established Inter/blue identity, centred assistant hero and left-to-right try-on comparison. Make the hero tags useful links; use a stable search hint and a fitting-room primary CTA. Reduce the how-it-works area to four short steps. Combine wardrobe, outfit calendar and purchase budgeting into one interactive presentation with three selectors; the calendar and budget remain labelled coming soon. Follow with a shorter price-insight section, then one creator studio with three selectable visual panels (motion, directed shoot, reusable model). Add original editorial model imagery, clear image framing and a real five-second muted stock-video sample with play/pause controls. Do not claim it was generated by the product. Replace the animated store wall with a quiet store strip and the scroll-pinned finale with a compact closing CTA. Phone layouts are stacked; controls retain keyboard operation; motion observes reduced-motion and visibility. All functional app journeys remain in the separate app entry. Design notes: design/homepage-finishing.md. Preview only; production unchanged.

### Restore the previous ending — 23 October 2026

Builder prefers the earlier animated store universe and scroll-driven conversation/search finale. Restore StoreUniverse and ShoppingFinale to their pre-polish design, including moving logo columns, original headlines, loader artwork, changing final headline and working search form. Keep all other homepage finishing changes. This supersedes only the compact store strip and closing CTA decision above. Preview only.

### Current-feature banner and compact step visuals — 23 October 2026

Remove only the white conversation chapter from the restored ending. Keep one blue-gradient “Get the best of your wardrobe” search section and footer, without a two-screen scroll transition. Store universe remains unchanged. Update banner tags to virtual try-on, discover/style, wardrobe, product-to-model, photo-to-video and reusable model. Creator links select their matching illustrated studio view; upcoming tools remain labelled. Desktop decorative cards now include product-to-model photography, a real stock sample clip and the reusable-model triptych. Phone uses three feature-image cards (product/model, try-on, video), replacing the previous three product-only cards at this explicit request. Add compact photo/product/comparison/save-share cues to the four try-on steps; keep two columns on phones.

### App alignment — 23 October 2026 (preview)
- Primary navigation is Discover → Try-on → Wardrobe on desktop and phone. Existing home/chat/search/saved routes remain compatible; Discover has an explicit `#/discover` link. Personal stylist, past chats and settings remain secondary.
- Discover uses a compact search card with editable starting ideas, a current-search return link, visual fitting-room/wardrobe shortcuts, and existing daily picks.
- Try-on uses numbered input steps and a separate result/illustration panel. Sources remain image, owned/saved pieces and product link. Temporary-photo consent and clearing behavior remain unchanged; illustration is labelled. Native upload remains keyboard-accessible through its label.
- Wardrobe groups My clothes, Outfit ideas and Saved finds. Calendar/budget and creator photo/video/model tools are labelled Coming soon; no simulated working controls were added.
- `app/app-refresh.css` is loaded last for these app surfaces. The public homepage styles are unchanged.

### Homepage visual variety — 23 October 2026 (preview)
Try-on now includes four new matched pairs spanning women/men, fuller/broad/petite/lean builds, dress/denim/linen/layered clothing and indoor/outdoor/mirror-selfie photography. Preserve the paired image proportions and aligned carousel layers. Homepage badges/captions are reduced to a compact feature-availability note and video-reference credit; do not label stock video as generated output. Pricing Intelligence now lives on the roadmap page. Asset prompts: design/tryon-variety-prompts.md.

### Wardrobe feature tour — 23 October 2026 (preview)
Inspired by the animated feature demonstrations in Flora's second section, the wardrobe keeps three prominent choices visible and rotates its shared preview every seven seconds. Retains Inter, blue #2950B8, ink #242A38, muted #667084, white #FFFFFF and pale #F0F3F8. Full desktop choice cards expose the calendar/wishlist descriptions; phone uses three equal large icon buttons. Active progress and numbered preview toolbar show the current state. Clothing tiles appear in sequence, calendar outfits arrive in date cells, wishlist rows enter and its budget line fills. Manual selection/keyboard focus pauses the tour; explicit Play resumes; offscreen/hidden-page and reduced-motion handling limits animation. Common wardrobe CTA remains the real app entry; calendar/budget availability remains honest.

### Wardrobe deck refinement — 23 October 2026 (preview)
The three wardrobe previews now remain mounted as overlapping cards, with two lower layers offset toward the bottom-right (18px per layer desktop, 12px phone). Timer or scroll over the stack moves the front card to the back through a two-phase transition; the next card rises into place. Headline, description, selector highlight and caption follow the active card. The user's normal page scroll is preserved. Manual selection and scroll pause auto-rotation; Play resumes. Background cards are hidden from accessibility navigation and inert. Existing reduced-motion behavior remains.

### Wardrobe scroll sequence — 23 October 2026
The wardrobe deck now follows page position: pieces → calendar → wishlist, then the creator section. A sticky viewport sits inside a 340svh track. Each card gets one third of the pinned travel; scrolling backwards reverses the sequence. Feature buttons scroll to the corresponding chapter. There is no independent timer or wheel interception. The bottom-right layered deck and matching copy remain. Phone layouts fit the preview and controls into the stage; reduced-motion settings remove transition animation.

### Creator connected canvas — 23 October 2026
Replace the three selectable creator panels with one visible, connected product → model → video composition inspired by Flora's “Every model. One canvas.” Three short captions preserve directed shoots, reusable avatars/models and short motion clips. Use a new taupe coat product illustration with the matching existing licensed model still and video. Desktop cards are staggered around the heading; phone layout follows a vertical curved path. Connections draw on entry, video retains play/pause, reduced-motion and offscreen handling. Hero creator links now all land at the complete section. No creator-generation backend or model identity feature was added. Design/prompt detail: design/creator-connected-flow.md.

### Creator reference layout correction — 23 October 2026
Keep the heading upper-left and a small product image directly below it. Stack the model photo above the wider video in the right column, rather than spreading the three cards across a diagonal row. Use a continuous visible 18px dot grid across the section. Retain the mobile connected flow and full 16:9 video framing.

### Creator branches — 24 October 2026
The product is the shared source: arrows go directly from 1→2 (model) and 1→3 (video), with no model→video connection. Apply to desktop and phone; visible arrowheads make direction clear. Accessible diagram description reflects the branching flow.

### Flora mobile canvas and continuous flow — 24 October 2026
After inspecting Flora's real mobile layout at390px, replace the tall caption-heavy mobile diagram with model upper-left, smaller product to its right, wider video centered below. Keep small media labels, move the three ideas into a short introduction, and hide the repeated node captions/prompt/badge on phones. Preserve desktop arrangement. Pipes connect product→model and product→video without arrowheads. A short blue segment continuously travels along each pipe (3.2s loop), pauses offscreen/hidden, and is omitted for reduced-motion users.

### Creator social-content destination — 24 October 2026
Add a fourth destination after the model photo and video: both feed into “Made for your feed,” with an illustrative brand campaign post and influencer reel cover, Instagram/Facebook labels, and clearer “For fashion brands & influencers” positioning. Retain 1→2 and1→3, add2→4 and3→4 using repeating plain pipes. No arrowheads, engagement counts, publish buttons, connected-account or automatic-sharing claim. Existing licensed still supplies both illustrative formats; no extra media fetches. On phones, the compact Flora arrangement stays above a naturally sized content panel so text and attribution cannot overlap.

### Horizontal creator flow with stacked social outputs — 24 October 2026
Replace the previous product/model/video diagram with product 01 → model 02 → brand post 03 and influencer reel 04. Product and model sit horizontally; the two social cards stack vertically at the right. Remove the separate landscape video node and put the existing playing video inside the reel. Keep the dotted background and repeating pipes without arrowheads. Measure media-card edges when their sizes change so the pipes stay attached across widths. Phones show the small product/model row above two centred stacked social cards, with a shared branch down the right. Retain the brand/influencer positioning, Instagram/Facebook labels and existing availability/credit links.

### Influencer reel proportions — 24 October 2026
Keep the stacked social cards, but use a true9:16 portrait frame for the influencer reel on every screen width. Video fills that frame; the connecting pipes follow its resized edges.

### Homepage label cleanup — 24 October 2026
Remove the “In development” labels from the wardrobe calendar/budget slides and creator header. Retain the existing feature content and roadmap page.

### App Discover browsing — 24 October 2026
Keep the existing search composer. The Try-on/Wardrobe promotional cards were removed on25October2026; brand browsing follows the search with32px desktop/24px phone spacing. Replace DailyFeed on Discover with a horizontal circular brand/store row and a photo-first product grid inspired by TryItOn Explore. Cards show merchant/brand, title, observed INR price and a save heart; product details offer merchant handoff and Try it on without saving first. Add category chips, price/category/audience/store filters, price sorting and Show more. Four columns on desktop, three on medium screens and two on phones; horizontally scrollable brands/categories, accessible modal details and filters. Brands with no current product evidence are omitted after loading, avoiding empty destinations. Existing daily subscriptions are preserved but no longer rendered here.

### Fixed brand navigation — 25 October 2026
Discover has sixteen stable brand icons: H&M, Nike, Adidas, PUMA, Jockey, Levi’s, Mango, ONLY, Vero Moda, SNITCH, NEWME, The Souled Store, Roadster, HRX, Bonkers Corner and FableStreet. The row never changes with refreshes or filters. Myntra, AJIO and other marketplaces are stores, not brands. Cards show the product brand plus a separate “at [store]” product link. Brand and Store are independent filters. Missing product evidence leaves an honest empty selection; it does not remove a fixed brand icon.

### Try-on basket — 25 October 2026
Discover and chat share an account-bound try-on basket, separate from saved products. Add to try-on buttons leave users in their current browsing context; a floating basket button opens an overlay fitting room. A desktop side list and phone horizontal strip keep up to eight picks accessible. Upload one temporary photo, explicitly consent, and preview the current piece or all untried pieces sequentially. Compare ready looks together or switch between a preview and the original. Keep browsing closes the panel without losing the photo or previews; generation already started can finish. Stop after this finishes the active preview and skips the rest. Store links remain beside the chosen look. Product picks survive refresh; photo and preview state does not. Existing standalone try-on remains available.

### Discover-only basket button — 25 October 2026
The floating try-on basket button appears only on Discover after setup. Hide it on every other page, including chat, Try-on and Wardrobe. Keep the shared basket and temporary fitting-room state mounted when navigating; product-level basket actions remain available.

### Creator Lounge — 25 October 2026
The app's primary destinations are Discover, Try-on, Wardrobe and Creator Lounge. Hide Personal stylist and Past chats from navigation and chat headers; legacy hashes show Discover without deleting their data. Settings remains in the desktop navigation and the app header on phones.
Creator Lounge uses three task tabs: Photo shoot, Motion video, My models. Compact inputs sit beside a large output on desktop and stack on phones. Product uploads support a fresh generated model, own photo or saved model. Scene, pose, direction and output format remain editable. Finished images can become a video or saved model without a new upload. The example image is explicitly labelled and is never substituted for a failed generation. Saved models and drafts survive a refresh; local unsent inputs do not.

### Basket session reset — 25 October 2026
Starting a new chat/search clears the temporary try-on basket, its local portrait and generated previews. Refinements, tab navigation and a normal refresh preserve basket picks. Saved products remain separate. A failed creation caused by provider credit exhaustion is labelled Creation is paused, with an account-allowance explanation rather than photo-change advice.

## Guest try-on preview — 26 October 2026
Keep the homepage intact. The existing guest preview page contains the portrait and product-link form, with image upload as an alternative. Show the generated preview before asking for phone sign-in. Download and Save to wardrobe open the OTP flow with the result retained; another generation also needs sign-in. Saved try-on photos live under Wardrobe → Saved looks and are distinct from owned clothes. Keep the same blue/Inter styling and check phone layouts.

## Guest preview refinements — 26 October 2026

Guest try-on supports product link or garment upload, without the long photo-format instruction. Guest discovery presents twelve cards initially and twelve more per Show more click from the stored, ranked result pool. Wardrobe is sign-in only: use a four-column, twelve-photo editorial outfit/garment collage inspired by the builder’s reference, soft blue/cream backdrop, concise copy and a clear sign-in CTA. Stack copy and image on phones. The homepage stays unchanged.

## Two-step guest fitting room — 26 October 2026

Replace the asymmetric portrait/product columns with one centred card, at most560px wide. Step1: portrait upload and Next. Step2: compact portrait summary with Change, product-link/upload toggle, explicit consent and Try it on. Keep choices across back navigation and failed requests. Use a compact two-step indicator, blue active control and the existing Inter identity; no change to the homepage or signed-in fitting room. Add a Log in heading to the shared phone sign-in form.

### Shoppable post edit — 27 October 2026 (local/development)
A separate, public `/edits/diwali/` entry for Instagram DMs/bio links: compact wordmark/share header, short blue/Inter heading, four actual merchant photos, post prices, direct store links and individual Try it on actions. Two-column cards on desktop and phone; actions stack with44px targets on phones. The selected piece carries into both anonymous and signed-in fitting rooms, with a return link to the edit. Homepage unchanged. Product links remain exact, open in a new tab, and have no affiliate parameters or redirect tracking. Static images/content avoid paid scraping on page views; the shared reader recognizes these four exact URLs and uses checked merchant image references.

### Individual post slugs — 27 October 2026
Shoppable edits use `/edits/{slug}/`; the first is `/edits/diwali-post-1/`. One shared layout renders the matching record's copy and products. Share links, static social metadata, fitting-room handoffs and return links stay bound to that post. Duplicate/unsafe slugs and duplicate product IDs within a post fail validation. Old Diwali links redirect to the first post; legacy try-on query IDs remain compatible.
