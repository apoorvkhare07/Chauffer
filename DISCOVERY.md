# Discovery agent

Discovery turns a shopper's intent into verified merchant options. It is the first specialist in the planned shared agent system; coordination with separate stylist and wardrobe agents is future work.

The current flow uses Convex Agent (`shoppingAI.ts`) for conversation planning, `aiDecision.ts` plus `discoveryPolicy.ts` and `discoveryQuestions.ts` for enforced decisions, `discoveryWorkflow.ts` for the sequence, `liveDiscovery.ts` for retrieval and `ranking.ts` for the shortlist. Retrieval remains responsible for merchant evidence; the model never invents products, prices or stock.

## Shopper decisions

- Preserve category, audience, maximum budget, size and explicit constraints during refinement. Clear item-specific brand/attributes when switching categories unless restated.
- Ask one question at a time. Missing category/budget/size comes first. Choose the highest-priority missing detail for this item: intended use for sneakers, fit for jeans/trousers, occasion or pattern for clothing, then style/colour/material/brand as relevant. Do not force a brand-first sequence. Ask at most one optional clarification before a broad search, and show results after the answer or skip. A focused request searches directly. Post-result questions refine the existing search; track offered fields so declined/unanswered questions do not repeat. A selected brand is a hard constraint; “any” records an explicit open choice. Multiple named brands prompt which to search first. New brands can be supplied in text.
- Default spending preference is 60–100% of the stated ceiling. Within that band, rank by stated style evidence and proximity to 80% of budget, with store variety. Cheaper alternatives follow when the band has fewer candidates, with a clear note. This is a preference, not a minimum restriction, quality score or instruction to spend the maximum. “Cheapest options” switches to lower-priced ranking; “best within budget” switches back.
- Include a selected brand in merchant terms; suppress optional style terms that can over-constrain a brand search, retaining explicit hard constraints. Match brand against the row's brand evidence or title, rejecting inspired-style substitutes. Brand presence does not verify authenticity or product quality.
- Guest preview stays one search. It follows budget ranking but does not block on optional brand clarification; follow-up requires sign-in. Without a supplied budget it uses the existing broad ceiling and lower-priced ordering, not an inferred spending target.
- After results, explain the spending range and ask one relevant brand, occasion or feedback question. Never claim a wider search than the bounded catalogues read.

## Future shared agent system

A coordinator should own conversation intent, permissions, budget and handoffs. Discovery should accept confirmed requirements, taste and excluded URLs, and return verified options, store access states and one useful next question. A stylist can propose explicit search preferences, and a wardrobe specialist can provide confirmed owned-item context; neither should invent stock or silently change budget/brand. Only the coordinator should reply to the shopper and trigger paid retrieval. Keep a shared evidence record and one search budget across specialists rather than allowing each to repeat store searches.

The existing separate wardrobe functions are not yet this shared coordinator. This change does not launch additional agents or duplicate searches. Existing backend functions already supply the retrieval input/output boundary; a later coordination layer can reuse them.

Question buttons carry the exact field/value chosen by the shopper, bypassing a second model call. Free-text replies still use the discovery agent. A skip starts retrieval without inventing the missing attribute; “no more questions” disables further optional questions for that item. Occasion words only improve ranking when merchant text supplies evidence (for example training/walking/formal); they are not suitability or comfort guarantees. Bounded merchant queries include confirmed occasion/style terms with broad fallback retaining hard constraints.

Within the spending band, explicit fit/pattern/style and occasion evidence come before store variety. Unknown/nonmatching preferences remain fallback; do not insert a straight-fit pair just to add another store when relaxed-fit matches exist. When needed to fill the shortlist with evidence matches, allow up to six per store; ordinary searches retain the normal source cap. Hard constraints still apply to every option.


## Goal and session boundaries

Discovery succeeds when the shopper explicitly confirms the shortlist is useful. Returning product cards only advances the conversation to refining. “These work for me” (or an equivalent explicit message) confirms the current shortlist without saving, purchasing or changing account preferences. A further refinement reopens discovery; new search/reset starts exploring again. Do not infer success from a result count, save, click or absence of feedback.

For jeans, after fit is known and results exist, ask colour before generic occasion questions. Colour answers preserve category, size, budget, fit, brand and other current requirements. Short model replies cannot silently clear unmentioned current requirements, must-haves or feedback; explicit “any fit/colour” can relax that field.

A session means the current chat until new search/reset, including reloads of that chat. Context contains only its bounded history, confirmed requirements, taste, shown/rejected URLs and references. New chats do not automatically import learned taste from profile/past chats. Explicit account size/budget/audience/language settings remain defaults, and saved records/history are retained. Stored wardrobe/styling context is supplied only when the current chat explicitly requests it. Convex Agent cross-thread search remains off. Earlier current-session information survives in structured state even when the bounded message window no longer contains the original wording.

## Coherent refinement replies

Keep the original request visible, show the latest shopper direction separately, and retain both its acknowledgement and the finished-result reply. Confirm changes from the previous structured requirements/taste instead of relying only on generated prose. Show confirmed occasion/style/fit/pattern alongside budget/size/brand/colour. An active question owns the answer buttons; do not replace them with generic search actions. AI chat questions return structured field/choices, including the named-brand clarification. Clicking an answer updates that field while retaining the other confirmed current-chat details. Older products remain labelled Previous picks while awaiting clarification or updating, so they are not presented as results of an unanswered question. Keep custom text and skip available.
