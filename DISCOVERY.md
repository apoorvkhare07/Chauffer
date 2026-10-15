# Discovery agent

Discovery turns a shopper's intent into verified merchant options. It is the first specialist in the planned shared agent system; coordination with separate stylist and wardrobe agents is future work.

The current flow uses Convex Agent (`shoppingAI.ts`) for conversation planning, `aiDecision.ts` plus `discoveryPolicy.ts` for enforced decisions, `discoveryWorkflow.ts` for the sequence, `liveDiscovery.ts` for retrieval and `ranking.ts` for the shortlist. Retrieval remains responsible for merchant evidence; the model never invents products, prices or stock.

## Shopper decisions

- Preserve category, audience, maximum budget, size and explicit constraints during refinement. Clear item-specific brand/attributes when switching categories unless restated.
- Ask one question at a time. Missing category/budget/size comes first. For footwear budgets of ₹3,000 or more, ask Nike, Adidas, Puma or open to all brands before a signed-in search when brand is unknown. A selected brand is a hard constraint; “any” records an explicit open choice. Multiple named brands prompt which to search first. New brands can be supplied in text.
- Default spending preference is 60–100% of the stated ceiling. Within that band, rank by stated style evidence and proximity to 80% of budget, with store variety. Cheaper alternatives follow when the band has fewer candidates, with a clear note. This is a preference, not a minimum restriction, quality score or instruction to spend the maximum. “Cheapest options” switches to lower-priced ranking; “best within budget” switches back.
- Include a selected brand in merchant terms; suppress optional style terms that can over-constrain a brand search, retaining explicit hard constraints. Match brand against the row's brand evidence or title, rejecting inspired-style substitutes. Brand presence does not verify authenticity or product quality.
- Guest preview stays one search. It follows budget ranking but does not block on optional brand clarification; follow-up requires sign-in. Without a supplied budget it uses the existing broad ceiling and lower-priced ordering, not an inferred spending target.
- After results, explain the spending range and ask one relevant brand, occasion or feedback question. Never claim a wider search than the bounded catalogues read.

## Future shared agent system

A coordinator should own conversation intent, permissions, budget and handoffs. Discovery should accept confirmed requirements, taste and excluded URLs, and return verified options, store access states and one useful next question. A stylist can propose explicit search preferences, and a wardrobe specialist can provide confirmed owned-item context; neither should invent stock or silently change budget/brand. Only the coordinator should reply to the shopper and trigger paid retrieval. Keep a shared evidence record and one search budget across specialists rather than allowing each to repeat store searches.

The existing separate wardrobe functions are not yet this shared coordinator. This change does not launch additional agents or duplicate searches. Existing backend functions already supply the retrieval input/output boundary; a later coordination layer can reuse them.
