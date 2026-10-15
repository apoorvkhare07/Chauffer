# Discovery handoff, version 1

`discoveryHandoff.ts` is the validated shared output format. Completed signed-in discovery messages carry it alongside the existing merchant result. `discoveryCoordinator.handoff` is an internal reader: it returns only the requested current conversation revision, never a previous run's result. Public current-chat reads remain bound to the signed-in owner. Older messages without packets remain readable.

| Field | Meaning |
| --- | --- |
| schemaVersion / agent | Contract version 1, producing specialist discovery |
| request | Conversation ID, current session, turn revision and latest request text |
| scope / createdAt | Current session only; packet creation time |
| currency / priceUnit | INR, rupees; different from account budgetPaise |
| requirements / taste | Confirmed search fields and current-chat preferences |
| constraints | Required fields versus ranking preferences; size requirements do not imply verified size stock |
| status | Exploring, needs clarification, refining, unavailable or explicitly satisfied |
| products | Stable product ID (merchant URL), immutable merchant facts, URL/time/source evidence and unknowns |
| stores | Per-store access and match states, with original store search links |
| nextQuestion | Optional relevant question with selectable field/value choices |
| styling | Not requested, ready, needs wardrobe, unavailable or stale; optional pairs by product and owned item ID/name, with advisory reasons and limitations |

## Sequence

1. Existing conversation planner interprets current-session messages and preserves confirmed constraints.
2. Coordinator reads the matching pending revision. Only an explicit wardrobe/style request loads this owner's bounded saved wardrobe (up to 80, at most 24 available pieces supplied) and manual style preferences.
3. Discovery retrieves/ranks real products once. Store/browser retry limits stay unchanged.
4. One optional styling call assesses those products against supplied available clothes. It receives no wardrobe photos, exact private snapshot key, other-user data or past-chat search history. The current-session brief is bounded to eight recent user messages within a thirty-message read.
5. Unknown product/owned IDs are rejected. Server-owned names are used in the UI. The specialist cannot change product evidence, budget or trigger another store search.
6. Completion checks turn revision and exact wardrobe/style snapshot. Later edits also clear stale pairings when current-chat results are read. Shopping products remain usable if styling fails or becomes stale.
7. Explicit acceptance produces a satisfied packet at the new revision. Saves/clicks do not count as acceptance. A refinement reopens discovery; reset clears current-chat wardrobe scope.

The 15-second maximum styling call runs only within the existing conversation deadline, with no retry. Model token usage is recorded with the discovery conversation. This does not yet add image-based styling, automatic body-profile imports, product-specific size/stock verification, agent-generated search loops, or a general evaluation/quality scoring system.
