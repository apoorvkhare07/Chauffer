# Personal stylist and visual try-on

Implemented 15 October 2026. General styling can propose clothes the user does not own; these concepts must never be represented as verified products or owned garments.

## Context and reasoning
Current prompt/corrections → event/date/setting → chosen styles, fit/avoid and taste → self-reported sizes/height and confirmed photo observations. Body observations remain tentative, editable and separate from measurements. The photo reader also drafts visible outfit style; separate confirmation is required, and it is not lasting taste or ownership. Removing/replacing a photo clears derived notes. Portraits and generated try-on pixels do not enter the text stylist.

wardrobeContext provides the shared snapshot, including optional shopper.photoStyle. Profile changes invalidate in-flight/completed advice. Ordinary shopping retains its explicit styling/wardrobe scope gate.

stylistRules.stylePrinciples is shared by general stylist, wardrobe and discovery pairing. It explains line, proportion/volume, length/ease, texture/drape, colour harmony/contrast, occasion and comfort. Body labels are not restrictions, scores, health judgements or fit guarantees. No inferred undertone or seasonal colour typing; unknown fabrics/weather remain unknown.

Broad briefs target 500–900 words: summary, context used, up to six reasoned sections, three outfit formulas, five palette swatches, trend adaptations, relevant caveats and at most one question. Focused corrections may be shorter. The UI uses full paragraphs and cards.

## Trend evidence
stylistTrends.ts contains a small reviewed editorial collection from Vogue India and Vogue's 2026 runway reporting, with publication/review dates and scope. Review expires 29 November 2026; expired evidence is excluded from new prompts and source cards. This is not live search, sales evidence or proof of Indian popularity. Model citation IDs are checked against supplied evidence. Automatic refresh and broader Indian occasion coverage remain pending; the UI labels the references curated.

## Calls and handoffs
- stylist.request: authenticated text up to 1,200 characters, optional event and owner-bound current parentId. One active run, twenty requests per rolling day. One bounded parent brief for refinement; no cross-thread retrieval or automatic preference writes.
- stylistAI.generate: one Convex Agent/Gemini structured call, 6,500 output tokens, 65-second deadline, zero retries. Watchdog expires at 120 seconds. No photo, merchant or extra search call.
- stylist.latest hides stale advice and returns only the signed-in owner's latest run.
- stylist.handoff: internal stylist-result.v1 containing status, brief, event and advisory result. Caller derives owner from authentication; cross-owner returns null and stale advice is omitted.
- stylist.shoppingBrief validates owner, selected look and current context, returning stylist-shopping.v1 with a bounded single-garment brief. “Find the main piece” sends it directly to conversations.post with newSearch:true; no personal brief goes in a URL. Discovery asks for missing requirements and owns budget/brand/size enforcement, evidence and search limits.
- Wardrobe keeps actual available owned-ID outfits only. The general stylist does not read wardrobe inventory. Common confirmed context and principles keep advice consistent; automatic conversation routing remains pending.
- A real saved product or wardrobe garment goes to try-on selection, explicit photo consent, then Gemini preview. A concept cannot masquerade as a merchant photo.
- Clear removes saved brief content in batches, retaining minimal records for rate limits. Late completion cannot restore cleared results. Account export includes the latest hundred style briefs and confirmed photo style note.

## Try-on
Uses GEMINI_TRYON_MODEL or gemini-3.1-flash-image directly, avoiding a model-list request per preview. Existing original portrait + original garment pipeline retained. One piece, five previews per rolling day, zero retries; bounded HTTP/image sizes and approved merchant image hosts. 150-second watchdog, changed/removed portrait or garment, expiry and late-result checks. Originals preserved; previews expire after seven days or can be removed manually.

Old blanket quota warning removed. Styling, try-on and owned wardrobe link to each other. A real test needs a consented full-length photo. Preview pixels cannot establish physical fit, measurements or exact real-world appearance.

## Tests and pending checks
Automated: ownership, cross-owner parents/handoffs, stale preferences, daily limits after clearing, no-wardrobe input, refinements, timeout/late results, citation filtering, palette sanitization, confirmed photo-style gating/removal, changed garment rejection and original preservation.

Pending real-person tests: upload and observation correction, identity/garment fidelity, garment categories, Hindi/Hinglish, physical-phone camera/HEIC and interruptions. Live weather stays pending by builder choice. Provider availability remains external.
