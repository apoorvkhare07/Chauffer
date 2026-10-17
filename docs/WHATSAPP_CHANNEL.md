# Chauffeur WhatsApp channel

Implementation: 16 October 2026. This replaces the HTTP webhook's legacy, unlinked discovery entry with an account-bound channel. It follows Saathi's signed webhook → phone account → shared backend → guarded delivery pattern. Saathi files and settings were only read; none were changed.

## What is connected

| Journey | WhatsApp v0 |
| --- | --- |
| First visit | Consent, name, age, profile/clothing preference, language, styles; optional photos later. Existing completed web setup is reused. |
| Account | Signed Meta sender maps to the exact MSG91 provider account used by web OTP. No OTP secret, browser session or owner ID is accepted from a message. |
| Discovery | Same `web:<userId>` conversation, current constraints, owner-based search limits and monthly plan usage. Text replies and up to six real product image/link previews. Reply `save 1` to keep a current result. A changed web search invalidates old WhatsApp selections. |
| Photo search | Send a WhatsApp image → Find similar → review the extracted request → Search this. No search before confirmation. |
| Voice shopping | Send a short voice note → consent → review transcription → confirm search. OGG, WAV, MP3, M4A and WebM, at most 700 KB. Raw voice is not stored by this channel. |
| Stylist | Choose Ask my stylist, then ask a question; uses the existing stylist, preferences, limits and follow-up context. Up to three looks in the reply. Choose the menu again to start a fresh brief. |
| Wardrobe | Image → explicit purpose consent → AI tag draft → optional `brand:`, `size:`, `fabric:`, `colour:` or `pattern:` corrections → Save to wardrobe. Uses the same saved pieces, clean-image queue and monthly allowance as web. List up to twelve pieces and send up to six owned photos. |
| Wardrobe outfits | Choose Style my wardrobe, then give an occasion. Uses confirmed available items and rejects results when inventory/preferences changed. |
| Body photo | Explicit consent before downloading/analysing and replacing the saved body photo. Tentative proportions require separate confirmation; try-on can use a usable photo without confirming proportions. |
| Try-on | Choose a wardrobe item or saved product → explicit generation confirmation → existing generation workflow → image reply. Existing owner, photo, expiry and daily limits apply. |
| Saved products | Read shortlist and save numbered current search results. Removal/editing uses the web page. |
| Daily picks | Enable shared daily generation, request today's current edit, or send `daily:disable`. No unsolicited delivery or outside-window templates. |
| Settings/history | Web handoff using the same phone login. WhatsApp discovery appears in shared web history. Data export includes latest 100 WhatsApp receipts, without attachment handles. |
| Pause | STOP pauses channel assistance; START returns to the menu. This does not erase saved account data. |

Native menu commands include `help`, `shop`, `stylist`, `wardrobe`, `style my wardrobe`, `try on`, `saved`, `daily picks`, and `settings`. Free text is interpreted inside the selected feature; this is not yet a universal cross-feature intent router. Onboarding currently uses text/buttons; voice input is connected to shopping after onboarding. Fixed menu/setup copy is currently English; existing agents retain the saved response language.

## Backend boundaries

- `whatsappProtocol.ts`: bounded webhook parsing and HMAC verification; takes button/list IDs, not their untrusted display titles.
- `http.ts`: `/whatsapp` GET verification and signed POST events. Only the configured destination phone ID is accepted.
- `whatsappChannel.ts`: consent, verified owner, setup, menus, feature dispatch, stale checks and bounded job completion polling.
- `whatsappMedia.ts`: server-only Meta download, allowlisted HTTPS media hosts, redirects rejected, streaming size bounds; Sharp converts image uploads to stripped/compressed JPEG before existing AI actions. At most 5 MB incoming image, 25 million decoded pixels, 700 KB final JPEG. HEIC documents use the existing web uploader.
- Existing feature functions now expose plain owner-bound helpers. The public web mutations still authenticate before calling them. No public function accepts an arbitrary WhatsApp owner.
- `whatsapp.ts`: duplicate-safe send claims, 24-hour response window, test-recipient gate, delivery callbacks and no automatic resend after uncertain delivery. Account-channel sends are spaced by at least 6.5 seconds.
- Buttons that confirm data carry a channel revision. Late AI results and replies from superseded web/WhatsApp requests are suppressed. A newer incoming WhatsApp message can supersede an unfinished reply; completed shared results remain available on web. This is not yet Saathi's FIFO conversation queue.
- Merchant product images use the existing trusted-host check. Private output images resolve from an owned current wardrobe item or unexpired try-on record, not arbitrary attachment URLs.
- Existing model budgets, monthly feature limits and consent checks remain in force. Adding a channel does not create another free allowance.

## Meta configuration

Chauffeur uses its own **separate Meta app and phone number**, confirmed by the builder. Do not change Saathi's webhook or reuse its credentials.

Production Convex settings:

- `WHATSAPP_PHONE_ID`
- `WHATSAPP_TOKEN`
- `META_APP_SECRET`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_TEST_RECIPIENTS`: comma-separated approved Indian phone numbers including `91`, no spaces or plus needed.

Put secrets directly in Convex deployment settings, not source or chat. Read the verification token from Convex when configuring Meta. Callback: `https://rare-chameleon-828.convex.site/whatsapp`. Subscribe the app to the WABA and the `messages` webhook field. Merely verifying the callback does not establish actual message delivery. Use a durable appropriately scoped Meta token for sustained operation; a developer test token may expire.

Development is `https://mellow-spaniel-636.convex.site/whatsapp`. Do not point the same sender at both environments. Do not copy production credentials into development just to run automated fixtures.

The backend remains recipient-restricted. Production rollout, public onboarding access and approved outside-window templates are separate decisions.

## Required live acceptance

Automated fixtures are not evidence that Meta delivered a message or that the AI produced useful advice.

1. Verify callback and sender subscription; send `hi` from the approved test phone and finish setup. Check that the same number's web profile is reused.
2. Search a product, answer a clarification, see actual images and links, save a result and check web Saved. Test simultaneous web/WhatsApp changes.
3. Send a clothing photo; verify nothing is analysed before purpose consent; correct brand/size, confirm and check the web wardrobe and clean image.
4. Send a short Hindi/Hinglish/English voice note with a budget/size; review and correct inaccurate words before search. Check real Meta media MIME/host responses.
5. Ask stylist and wardrobe outfit questions; change inventory during generation to check stale-result handling.
6. Add an optional full-length photo; decline body observations; generate a try-on from clothing and verify private image delivery. Delete/replace the source before completion and verify suppression.
7. Exhaust only one feature allowance; other features must remain usable.
8. Check duplicate webhook delivery, STOP/START, failure callbacks, expired token, 24-hour window and real phone image/button rendering.

Remaining web handoffs: full preference/size editing, wardrobe deletion/availability/worn marking, detailed photo/body corrections, saved-item removal, history browsing, account export/support and plan page. Dedicated WhatsApp Flows forms, catalogue commerce, automatic daily notifications, reply audio, location sharing and fully translated setup are not implemented. Checkout/payment is unchanged and not implied by product links.

Reference checked: [Meta's interactive message format](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/messages/interactive/) (the SDK itself is archived; implementation uses the existing Graph API HTTP approach, not that SDK).
