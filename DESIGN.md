---
name: Chauffeur
description: Modern shopping with painterly desi soul and a classical twist.
colors:
  canvas: "#f7f8fa"
  ink: "#242438"
  muted: "#646576"
  accent: "#4149cf"
  accent-hover: "#3138a8"
  soft: "#e9edfa"
  line: "#dfe2eb"
  green: "#176557"
  white: "#ffffff"
  focus-soft: "#cbd2f3"
  memory-band: "#303879"
  memory-profile: "#384383"
  memory-text: "#f6f7ff"
  whatsapp-preview: "#f0f5f1"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(54px, 6.25vw, 88px)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-.04em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "43px"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-.04em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "13px"
    fontWeight: 700
  wordmark:
    fontFamily: "Instrument Serif, serif"
    fontSize: "35px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-.025em"
rounded:
  field: "6px"
  navigation: "10px"
  message: "12px"
  card: "14px"
  conversation: "16px"
  pill: "100px"
spacing:
  compact: "8px"
  control-gap: "14px"
  card-padding: "16px"
  panel-padding: "23px"
  section-mobile: "65px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    typography: "{typography.label}"
    padding: "14px 22px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "14px 22px"
  product-card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.card}"
  conversation-panel:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.conversation}"
    padding: "23px"
  memory-profile:
    backgroundColor: "{colors.memory-profile}"
    textColor: "{colors.memory-text}"
    rounded: "{rounded.conversation}"
    padding: "29px 32px"
  whatsapp-preview:
    backgroundColor: "{colors.whatsapp-preview}"
    rounded: "20px"
  voice-preview:
    backgroundColor: "#f7f8ff"
    rounded: "{rounded.conversation}"
    padding: "25px 30px"
  active-navigation:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.accent}"
    rounded: "{rounded.navigation}"
    padding: "13px 12px"
---

# Design System: Chauffeur

## Homepage refresh — 11 October 2026

The `/` page now uses `homepage.css` and a quieter discovery-first layout, following visual reviews of Phia and Wishi. Preserve the existing porcelain `#f7f8fa`, ink `#242438`, cobalt `#4149cf`, soft blue `#e9edfa`, muted `#646576` and green `#176557` palette, locally served Manrope and Instrument Serif. The serif stays in brand details; main headings and controls stay in Manrope.

Desktop layout: restrained navigation → split hero with request field and painterly portrait/bust → store-search strip → three real process steps → interactive illustrative conversation → consented memory → available/planned features → FAQ → closing action and footer. The artwork is the single decorative focal point; there are no fabricated logos of customers, reviews or numerical savings. Primary actions open `/app/`; the sample demo is a secondary, clearly labelled link. Conversation examples are illustrative and never invented live product cards.

The same 1184px container is retained. At 760px columns stack, navigation anchors hide, the main action stays visible, and request chips wrap. The phone view is checked at 390px. There is no automatic motion; feedback from pressed example controls and expanded FAQ rows is immediate. Focus remains visible and reduced motion is respected. The earlier website component descriptions below are historical; demo styles and behavior remain unchanged.

## Overview

**Creative North Star: "Old-school charm. New-school shopping."**

A spacious modern shopping identity with painterly Indian fashion and a Renaissance twist. Clean Manrope headlines and cobalt controls keep the interface contemporary; the Instrument Serif wordmark and classical bust supply the historical quirk. Art belongs to the brand, while shopping results use explicitly labelled colour illustrations.

This record describes the implemented code, supported by the completed homepage review; it is not an approved visual comparison image. The separate surfaces at `/` and `/demo/` share this visual language, with spacious storytelling on the website and denser working controls in the demo.

**Key Characteristics:**
- Pale canvas and cobalt actions.
- Oversized sans-serif headlines with a restrained serif brand voice.
- Painterly portrait fan and a shawled classical bust.
- Softly bordered panels, pill controls and honest sample labels.

## Colors

### Primary
Cobalt accent identifies calls to action, selected navigation, icons and keyboard focus. The darker accent supplies hover feedback.

### Secondary
Peacock green marks the small brand dot and order status. Pale blue soft surfaces group messages, active navigation and review content; periwinkle highlights selection and search focus.

The offerings illustrations add local treatments: the WhatsApp preview uses a pale green conversation surface, and voice uses the existing pale-blue soft band with a lighter preview panel. Their colours describe examples, not connected services. The memory band uses its own indigo surface, lighter indigo profile and pale text; preserve those roles only within that section.

### Neutral
Porcelain canvas supports ink text, muted supporting copy, white cards and subtle cool dividers. Product colour illustrations add local blue, pink, white and green swatches without replacing the core palette.

**The Action Rule.** Reserve solid cobalt fills for actions; keep everyday content panels pale or white. The memory story is a local exception: its indigo band and lighter profile panel form one deliberate contrast section, not a global dark theme.

## Typography

Locally served Manrope is the main family; locally served Instrument Serif provides the wordmark, sidebar title and handwritten-feeling brand aside. The regular Manrope file serves weights 400–600, and the bold file serves 650–800 as declared in the source.

Display uses the frontmatter ramp on desktop, rises to 96px at wide screens, and changes to `clamp(48px, 9.4vw, 65px)` on phones. Section headings vary from 36–43px on desktop. Demo headings use 34px, stepping down to 30px, 28px and 25px across narrower layouts. Main supporting copy ranges from 12–15px; operational card details and disclosures are smaller. Prices use tabular numerals.

**The Serif Rule.** Keep serif type in brand accents; use Manrope for shopping controls and main headings.

## Layout

The shared centered container is `min(1184px, calc(100% - 88px))`. Side margins narrow to 28px at 1050px and 20px at 760px. Website navigation is 105px tall on desktop and 84px on phones; anchor links hide on phones while the demo action remains.

The website has a centered hero and five overlapping art cards, an asymmetric two-column explanation, pale-blue manifesto, split FAQ and centered closing action. Desktop section gaps are generous, around 90–120px; phone sections usually use 65px vertical padding. Below 760px, explanation and FAQ stack. The manifesto retains two columns until 430px, then stacks. The hero clips outer decorative cards while preserving the central art and controls.

The demo uses a 200px sidebar with a 55px gap; at 1050px these become 165px and 30px. Below 760px navigation becomes a horizontal strip above the content. Product grids use three columns on desktop and two on phones. Review fields collapse from three columns to two, then one below 430px. Marketing links may pass a query into `/demo/?q=...`; the surfaces have independent React roots and shopping state.

New capability rows preserve the two-column copy/preview relationship and 110px desktop gap, narrowing to 55px at 1050px and stacking with a 35px gap below 760px. The availability summary uses three columns before stacking on phones. Language tabs and occasion buttons switch illustrative examples without entering the separate demo.

## Elevation & Depth

Most content depth comes from pale fills and thin borders. Shadows are reserved for artwork, floating notes and primary actions: art cards use `0 14px 35px #30314a25`, notes use `0 6px 24px #30314a12`, and primary actions use `0 5px 15px #4149cf15`. The search field has a very faint `0 7px 20px #30314a05` shadow. Product cards stay flat; selected cards use a cobalt outline.

## Shapes

Pill buttons and search fields contrast with softly rounded rectangular panels. Conversation panels use the largest everyday corner radius; product and review cards use the card radius. Messages have asymmetric corners in the static website sample. Portrait cards use 13px corners and restrained rotation; the manifesto portrait uses a tall arched top. Lucide line icons remain crisp and sparse.

## Components

- **Buttons:** white bordered secondary controls, cobalt primary controls, underlined text actions and circular icon buttons. Primary hover darkens and lifts 2px over 180ms. Disabled controls lower opacity and remove the active pointer cursor.
- **Search:** rounded white field with an accessible hidden label and circular submit action. The surrounding field shows periwinkle focus; global interactive focus is a 3px cobalt outline with 5px offset.
- **Navigation:** serif wordmark with cobalt asterisk; desktop website anchors; demo sidebar with pale-blue active state and order count. Mobile demo navigation becomes a row.
- **Suggestion chips:** outlined small pills with text and an arrow, pale-blue hover and wrapped layout.
- **Cards:** white outlined conversation and product panels. Product swatches use garment line art, explicit sample labels and item colour fills. Review panels use pale blue.
- **Capability previews:** locally coloured, thin-bordered illustrations of planned services. The WhatsApp panel has 20px corners and asymmetric message bubbles; voice uses 16px corners and pill language tabs with cobalt selected state. Occasion pills use a white selected state. The indigo memory profile uses pale text, quiet dividers and a serif follow-up brand note. These examples remain clearly labelled as planned or illustrative.
- **Comparison and timeline:** white 16px panels, tabular sample totals, understated dividers and cobalt current-state icons. Availability status pills distinguish the working sample demo from services that are not connected.
- **FAQ:** native details/summary rows with cool dividers and a plus icon rotating 45 degrees when open.
- **Portrait fan:** five slices of the generated gallery asset fan open over 1.1s with `cubic-bezier(.16,1,.3,1)`, then spread gently on scroll. Hover brightens the artwork. Reduced motion removes transitions and animations and renders the final fan pose; selected demo reviews use automatic rather than smooth scrolling.

Website examples now respond directly to the visitor: replay reveals chat bubbles with a clipped 520ms entrance and staggered delays (250ms, 650ms, 1050ms); language and occasion changes, edited example preferences, price totals and tracking feedback use a 300ms fade with a 5px rise. Both use `cubic-bezier(.16,1,.3,1)`. Voice waveform movement is visual only, starts on explicit activation, pulses over 700ms and stops after 8 seconds or when the example leaves view or the page becomes hidden. Selected price controls use cobalt; selected delivery rows use pale blue and cobalt. Example size/fabric selectors remain local to the illustration, and comparison toggles use fictional catalogue figures.

New example controls use a 2px periwinkle focus outline with 4px offset. State feedback remains visible through selected fills, text updates and pressed/selected attributes. Memory replies and delivery feedback announce updates politely. Reduced motion removes the new keyframe animations and spatial arrow movement while preserving usable controls and their state feedback. These interaction additions do not change the global palette, type, art or separate website/demo boundary.

- **Care story:** scenario buttons move an illustrated parcel route and swap a care message for delay, wrong fit or return-window examples. This local green stage uses white softly rounded cards and a brief serif detail; route motion takes 600ms with the established entrance curve, while the clipped message reveal takes 420ms. The graphic is decorative, selected buttons expose pressed state, and the message announces changes politely.
- **Approval story:** a pale-periwinkle band contains a white 16px receipt with fictional item, delivery and total. Its rectangular cobalt approval button switches to replay. A 650ms handoff sweep (second line delayed 250ms) and 350ms shield rotation acknowledge the action, alongside persistent text and green seal feedback. It remains an explicitly labelled visual example with no payment processing or purchase. The receipt reuses an existing brand-art crop with the explicit caption “Brand artwork · not a product photo” directly beneath the item, before totals.
- **Voice agent graphic:** a cobalt circular asterisk core and two elliptical dotted orbits extend the visual-only voice preview. Activation drives 4s and reverse 5s orbits plus a 1100ms breathing core, bound to the existing explicit activation, 8-second maximum and offscreen/hidden stop behavior. Reduced motion shows static orbits and a colour-changing core.

Care and approval stories use equal desktop columns with a 90px gap, narrowed to 45px at 900px and stacked at 650px with a 35px gap. Mobile approval copy precedes the receipt. Reduced motion removes route interpolation, clipped note reveals, handoff sweeps and seal rotation while preserving final positions, selected colours and readable acknowledgements. These graphics extend local story surfaces; core typography, identity and the separate demo remain unchanged.

Inputs and selects have programmatic labels, icon-only buttons have accessible names, chat updates use a polite live log, errors use alerts, and both surfaces provide a skip link. These are observed implementation features, not a claim of a full accessibility audit.

## Do's and Don'ts

### Do:
- Do keep the marketing website and shopping demo separate and linked.
- Do use painterly Indian fashion and classical art for brand imagery.
- Do preserve visible keyboard focus, labelled inputs and reduced-motion final poses.
- Do label fictional catalogue details and brand illustrations clearly.

### Don't:
- Don’t present brand artwork as product photography.
- Don’t imply real store connections, payments or purchases.
- Don’t make motion necessary to read or operate the page.

### Five-step homepage journey
The homepage now has a scroll-driven, sticky five-step story: a need, a conversation, discovery, personalised recommendations and price comparison, then purchase approval. Clickable steps also work on smaller screens and with reduced motion. Clothing drawings and comparison prices are illustrative. WhatsApp, exact-product comparison and one-click checkout remain explicitly planned; web discovery and feedback ranking are live.

### Photography refresh
The marketing homepage now uses individual high-resolution clothing photographs, replacing the enlarged five-panel painterly collage. Keep local images sharp with object-fit cropping; retain the original artwork only for the separate demo. Homepage photos are style inspiration, not live products or customer endorsements. Source and license details are in public/images/CREDITS.md.

### Shopping assistant direction
The homepage leads with a direct clothing-shopping promise and an example assistant shortlist. Three photo cards start style-specific live chat drafts; photos remain clearly labelled inspiration. Shopping ideas include office kurtas, everyday tops, wedding guest sarees and weekend dresses. Cobalt #4149cf, white #ffffff, porcelain #f7f8fa, ink #242438 and muted #646576 remain; Manrope carries shopping copy, Instrument Serif the brand. Keep the shopping board the main visual, with compact store and category rows, the retained scroll journey and a prominent Chat to shop action.
