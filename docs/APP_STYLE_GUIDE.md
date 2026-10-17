# Chauffeur app style guide

The public homepage is the visual reference: Inter, denim blue, generous space and image-led fashion discovery. This guide governs the private app; the public website keeps its own responsive compositions.

## Foundation

| Role | Value |
| --- | --- |
| Primary / active / focus | Denim `#2950B8` |
| Primary hover | `#214299` |
| Text | `#242A38` |
| Secondary text | `#646E80` |
| Canvas | `#F7F8FA` |
| Surface | White |
| Border | `#DFE4EF` |
| Selected background | `#E9EEFA` |
| Typeface | Self-hosted Inter, system fallback |

Use the existing shopping-bag logo, rotating six-spoke symbol and approved **chauffer.** wordmark. Do not introduce another typeface or accent colour.

## Typography and spacing

- Page title: 36 px desktop / 30 px phone, bold, short and sentence case.
- Home headline: 36–48 px. Section heading: 24 px; card heading: 18–22 px.
- Body and inputs: 16 px. Labels, supporting copy and buttons: 14 px. Compact tags: 13 px.
- Body line height: 1.6. Heading line height: 1.2. Avoid all-caps labels and long display headings.
- Space in 8 px increments: 8 between related controls, 16 inside groups, 24 between cards, 32 between major sections. Phone panels use 16–20 px padding.
- Cards: 20 px corners (16 on phone). Inputs and buttons: 12 px. Use borders and whitespace before shadows.

## Page structure

One clear page title, one short purpose statement, one primary task. Page headers sit directly on the canvas. White panels group actual tasks, not every paragraph.

- For you: assistant-led search, compact preference chips and a visual daily edit. Product cards use sourced store photos. Swipe right to save or left to pass; keep equivalent visible buttons for people who do not swipe. Keep the current search and wardrobe shortcuts compact.
- Wardrobe: separate **Pieces** and **Outfit ideas** views. Show owned clothing as an image-led closet, with availability, tag editing and removal easy to reach. Outfit suggestions use only confirmed available pieces; swipe right to mark a look for today or left to pass, with matching buttons. Adding a piece stays image-first; hide the duplicate empty-state invitation while the editor is open.
- Stylist: prompt first; date, time and setting are optional expanded controls. Saved context remains available on request.
- Saved items: image, name, price and actions first; additional price/styling tools behind **Details and styling**.
- Settings: editable preferences followed by privacy/account tools. Internal implementation readiness does not belong in the customer interface.
- Keep results image-led, readable and clickable. Do not hide price timestamps, missing availability or actual failures.

## Product language

Calm, direct and consistent. Say what happened and what the person can do next. Prefer “Save photo”, “Suggest outfits”, “Get styling advice” and “Retry display photo”. Avoid provider names, implementation terms, repeated AI disclaimers, exaggerated promises and casual filler.

Photo processing and retention consent stays visible at the decision point. Photo estimates remain editable and unconfirmed until reviewed. A try-on preview is not a fit check; explain that once near creation. Errors retain the request and provide a useful next action. Never remove genuine store, privacy or service limitations to make the interface look finished.

## Interaction and accessibility

- Inputs use 16 px text to avoid phone focus zoom. Interactive targets aim for at least 44 px height.
- Visible denim focus outlines, native labels and buttons, explicit loading/error states.
- Mobile navigation retains safe-area space; content must fit at 320 and 390 px without document overflow.
- Keep optional forms inside native disclosures. Do not collapse a required correction or consent.
- Respect reduced-motion settings. Do not use animation to delay access.

## Implementation

`app/ui.css` is the final shared styling layer imported in `app/main.jsx`. Component styles still define their structure; shared rules own typography, controls, spacing and surface treatment. Keep future changes here instead of adding another conflicting theme file.

Browser checks and remaining release checks are recorded in `TESTING_LEDGER.md`. This guide does not certify live service behaviour.
