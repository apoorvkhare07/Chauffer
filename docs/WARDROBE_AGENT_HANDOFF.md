# Wardrobe intelligence and agent coordination

Status: wardrobe-side implementation, 15 October 2026. Discovery’s completed envelope is in [AGENT_HANDOFF.md](AGENT_HANDOFF.md) and has been merged. The adapters below are versioned wardrobe payloads for that envelope, not a replacement. Discovery’s optional pairing reviewer now consumes the same confirmed shopper context through `shoppingContext`. Do not change discovery's active-request consent or search routing to adopt this document automatically.

## Responsibilities and order

1. **Discovery / conversation coordinator** owns the active request, constraints, language, clarification budget and merchant search. It asks whether to use wardrobe/personal styling in that chat when the shopper hasn't already asked for that context. It resolves the authenticated channel to an owner; the model never chooses an owner ID.
2. **Stylist** owns photo assessment and fit/style guidance. The current photo reader records tentative proportions; only the user's confirmed description enters saved styling context. Sizes and height are self-reported, never guessed from images. Preview pixels are not fit evidence. The future stylist can interpret this context into recommendations with reasons and uncertainty; it must not silently write guesses into the profile.
3. **Wardrobe intelligence** owns combining confirmed available owned pieces, outfit explanations, practical tips and wear-history variety. It uses saved taste, fit/style/avoid, top/jeans sizes, approximate height, confirmed photo description, request date/period/setting, and sourced weather only when connected. It does not browse stores or fabricate missing pieces.
4. **Discovery** searches only when the user asks to buy or explicitly accepts a shopping handoff. A wardrobe mismatch is not consent to shop. Discovery owns hard brand/size/budget constraints and its existing single bounded retrieval flow; wardrobe does not duplicate it.
5. **Candidate review**: discovery supplies a sourced saved-product ID, then the existing `wardrobeBuying.plan`/review path can pair the candidate with owned items. Candidate IDs/URLs must remain separate from owned IDs. Reuse this shared context in that path when discovery's envelope is integrated; it currently uses its older style subset.

## Implemented boundaries

- `wardrobeContext.wardrobeContext(ctx, owner)`: shared server helper; returns style, taste, shopper, optional location, and a fingerprint (`contextKey`) to reject results after saved inputs change.
- `wardrobeContext.forAgent({owner})`: internal helper for trusted backend consumers. Contains private context: only call after deriving owner and checking the active request's requested scope.
- `wardrobeHandoff.context({owner,request,useWardrobe,useStyling})`: internal read-only adapter. Returns `version: wardrobe-context.v1`, source, bounded request, timestamp, scope, confirmed available items, inventory fingerprint, and styling context only if requested. No photo URLs, raw media, phone/name or precise coordinates. It performs no model or merchant calls.
- `wardrobe.request({text,event?})`: authenticated wardrobe UI entry. Existing callers with `{text}` remain supported (India time default); web passes the device time zone and explicit event controls. It snapshots wardrobe/context fingerprints and queues one model call. `event` is `{timeZone,date,period,setting}` with date YYYY-MM-DD, period auto/morning/afternoon/evening/night, setting unspecified/indoors/outdoors/mixed. Current prompt wins over defaults.
- `wardrobeHandoff.result({owner,id})`: internal result adapter. Returns `version: wardrobe-result.v1`, requestId, status pending/ready/needs_context/failed/stale, up to three validated owned-ID outfits, bounded summary/tips/one question, event/weather evidence and fingerprints. Cross-owner reads return null; stale results omit advice/outfits/weather.
- `wardrobe.latest`: reactive web result; profile, taste, confirmed styling, location or inventory changes hide old suggestions. `wardrobe.wear` rechecks the same versions before recording wear.

`contextKey` and `inventoryKey` are opaque freshness markers for application code, not prompts and not facts to display. They must not go in telemetry. Do not cache private payloads across users or requests.

## Mapping into discovery's envelope (partial integration)

| Coordinator route | Payload / receiver | Result and next step |
|---|---|---|
| “What can I wear from my wardrobe?” | owner-bound wardrobe request + event; wardrobe scope true | Outfits or one missing-detail question; no store search |
| “Find a jacket for my existing trousers” | context adapter with wardrobe true; styling only if requested | Discovery constraints plus selected owned IDs; one existing search |
| “What silhouettes suit my confirmed proportions?” | stylist context with confirmed description and stated goals | Advice with source/uncertainty; no wardrobe assumption or purchase |
| “Will this saved jacket work with my wardrobe?” | trusted saved-product ID + owned context | Pairing review; product remains a candidate, never owned |
| User rejects an outfit | coordinator carries occasion/constraints + current feedback + referenced outfit IDs | Regenerate with current snapshot; no automatic long-term preference write |

Coordinator envelope should carry correlation/request ID, authenticated owner (server only), active session/revision, source/target, intent, requested scopes, explicit hard constraints, bounded current prompt, current context payload, and a no-loop/deadline budget. Return the original correlation/revision. Before rendering, verify the active request/revision and ownership again. Do not restart discovery because wardrobe returns a clarification; ask one question through the coordinator.

Wardrobe consumes only the current request and saved consented context today. Cross-agent conversational feedback, selected-item constraints and automatic routing are pending agreement with discovery's envelope. The web UI supports editing the full request and re-running; it does not claim multi-turn reference resolution.

## Weather and time

Live weather is **pending by builder choice**. Time/day prefills from the device time zone; the backend computes the actual clock. Explicit outfit date and period override the default. No city is inferred from IP or photo.

The optional WeatherAPI.com adapter is implemented behind server-only `WEATHER_API_KEY`. Manual city is saved by explicit action; device location is requested only by a button when weather is enabled. Coordinates are rounded to 0.01° before transmission and again on the server. User can remove the saved location. Weather receives only the city/approximate coordinates, not wardrobe, identity or body data. Gemini receives labelled weather, not coordinates.

A bounded HTTPS forecast request (8 seconds, 250 KB, no retry) covers current conditions or a requested period within the provider's three-day response. Unknown/stale/out-of-range weather returns a clear unavailable state and never blocks outfit suggestions. Provider data is not assumed to match a different place/date explicitly described in the prompt. Rate limit: six checks per owner per minute. No automatic background location tracking or daily forecast job. Weather snapshot records source, date/hour, time zone, observed/fetched times and current-vs-forecast. Attribution/disclaimer appears with weather.

Before enabling: configure key in dev/prod, validate real city disambiguation and response times, test location allow/deny on an actual phone, and check morning/evening and midnight time-zone boundaries. No real weather acceptance test has been completed without a key.

## Acceptance and remaining collaboration

- Test ownership, preferences/sizes/photo-confirmation precedence, changing profile mid-request, unavailable pieces, insufficient inventory, guessed IDs, time-zone/date validation and unavailable weather.
- Test real English/Hindi/Hinglish advice and body-neutral explanations; inspect whether model respects fabric unknowns and never promises fit.
- Discovery owner: automatic wardrobe-request routing and result packets still need mapping into your handoff contract; retain your current consent gating and store retrieval limits. Do not wire a second merchant search in wardrobe.
- Stylist owner: reuse confirmed description + limitations and explicit style/fit goals; return advisory decisions with sources. Any new photo inference must go through review before saved use.
- Pending: integrated cross-agent routing, shared refinement history, explicit shopping opt-in handoff, sourced candidate re-review using the complete context, real phone location and live weather. These are separate from the working standalone wardrobe request.

### Integrated in this change

The production discovery handoff from `agent-mds` was merged before deployment. `shoppingContext.loadShoppingContext` retains its explicit active-request gate and 24-piece bound, and now adds the shared confirmed shopper summary. `discoveryStyling.review` uses that summary for its existing optional pairing call. Saved-size/body/preference changes invalidate pairing advice while merchant results remain intact. This does not add an automatic route from discovery chat to standalone wardrobe outfits or the future specialist stylist.
