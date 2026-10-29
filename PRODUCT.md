# Chauffeur · Product

Updated 15 October 2026 from the builder’s decisions, existing website and GrowthX Product thinking. This defines V1; it does not certify that every milestone works. The approved logo reads **chauffer.**; the project remains Chauffeur.

Read [Idea-lock.md](Idea-lock.md), [DESIGN.md](DESIGN.md) and [AGENTS.md](AGENTS.md) together. Earlier implementation notes are preserved in [the previous product record](docs/history/PRODUCT-before-growthx.md). This brief takes priority over older scope statements; README.md and TESTING_LEDGER.md retain historical verification details.

## 1. The job

**When I’m choosing what to wear for an occasion and still feel unsure after spending time and money shopping, I want to find a look that suits my body, taste and what I already own, so I can feel confident in how I look.**

Other moments: getting ready for work, a wedding or a weekend; seeing something I like but not knowing how to wear it; deciding whether a purchase works with my clothes; feeling I have nothing to wear despite a full wardrobe.

**Who, by situation:** an Indian fashion shopper who browses multiple stores, spends on clothes and still struggles to achieve the look they expected. Women’s and men’s clothing, footwear and accessories follow the existing website’s scope. Start trials with a concrete outfit need rather than every category at once.

**Today they hire:** marketplace searches, social inspiration, friends’ advice, general AI chats and trial and error with their clothes. Sometimes they abandon the search or repeat a familiar outfit.

**The one we serve first:** the shopper choosing their own outfit; no caregiver, seller or professional stylist account.

- Practical: a relevant selection and usable combinations.
- Emotional: confidence, feeling understood and less purchase regret.
- Social: expressing their own style comfortably for the occasion.

The core pain is that even after spending a lot of money and time, someone may not look or feel as they expected. Searching across websites adds effort without necessarily solving styling. These are the builder’s problem statements, not validated interview findings.

## 2. The switch

**What they’d fire:** repeated browsing, re-entering filters and guessing whether another purchase will work.

| Force | What matters | Product response |
|---|---|---|
| Push | Time and money spent still leave me unhappy with the look. | Connect discovery to the occasion, preferences and owned clothes. |
| Pull | I want outfits that feel like me. | Let me describe, reject and refine in my own words. |
| Anxiety | Another generic assistant, or one that judges my body. | Explain suggestions, accept correction and keep body context optional. |
| Habit | I know my stores and ask friends. | Bring sourced options together and retain merchant checkout. |

**The one worry onboarding must remove:** “Will this understand what looks right to me, or just show me more clothes?”

## 3. The core flow

### Today

1. I need a look for an occasion and feel unsure what works.
2. I look for inspiration.
3. I search one store.
4. I repeat sizes, budget and filters on another store.
5. I collect screenshots or links.
6. I compare across tabs.
7. I ask someone or a general AI, explaining my context again.
8. I check my wardrobe and guess what goes together.
9. I settle on a look, or give up and repeat something familiar.

Buying, trying on and possibly returning clothes follow. They reveal whether expectations were met; a shortlist alone does not prove a better final look.

### With Chauffeur · discovery and styling

1. I describe my outfit need, occasion, budget and preferences in the assistant.
2. I answer only missing details. Chauffeur uses saved preferences and relevant confirmed wardrobe context, searches supported stores and shows sourced options with reasons and uncertainty.
3. I review and refine: “less formal”, “not this print” or “something with my white shirt”.
4. I save a useful choice or choose an outfit, knowing how to wear it or what to check on the merchant site.

**Step comparison:** illustrative current journey: 9 actions; intended returning-user journey: 4, including one refinement. First-time sign-in, wardrobe entry and extra questions add actions. This is a hypothesis to measure, not a proven time saving.

**V1 completion:** a look or shortlist I can act on, with an understandable reason it may work for me. Actual fit and how I feel wearing it need follow-up; checkout is separate.

### With Chauffeur · style what I own

1. I need an outfit for my day and open Wardrobe.
2. I add relevant pieces manually or confirm details read from clothing photos, and mark unavailable pieces.
3. I describe my day and get up to three combinations using available owned pieces, guided by my chosen style and body/proportion context.
4. I choose or revise a combination. If I want something new, I start discovery and can review a saved candidate against my wardrobe.

These are two routes to the same job; buying something is not required for wardrobe styling.

### What must not happen

- Discovery step 2: invented products, stock, discounts or merchant partnerships; silent budget increases or dropped must-haves; inaccessible stores presented as having no stock.
- Styling: compulsory body photos/labels, inferred measurements or identity, body shame, attractiveness scores or guaranteed fit.
- Refinement step 3: forgotten dislikes, ambiguous product references acted on, or durable preference memory claimed without permission.
- Wardrobe step 3: invented owned pieces, unavailable clothes presented as wearable now, or stale results after inventory changes.
- Saving: another account’s data exposed, or saved preferences/clothes lost on reload.
- Handoff: a store link described as an order placed. Size stock, delivery, returns and final totals are checked on the store.

## 4. Onboarding

**First value:** relevant options for the shopper’s actual need, with a reason tied to their preferences; or a useful combination from confirmed owned clothes. An account or body label is not first value.

**Smallest useful input:** the current need, category, budget and relevant size when required. Ask audience only when needed and unknown. Photos and wardrobe entry are optional for initial discovery.

Current path in this branch:

1. Open the website and start a request, try-on or wardrobe photo preview without creating an account.
2. Get one discovery conversation, one visual try-on and one AI-read wardrobe piece. Guest photos and results are temporary and cleared within 30 minutes; no guest preference or wardrobe profile is saved.
3. On the next turn or when saving/continuing a preview, sign in with phone OTP. Explain that an account keeps preferences, wardrobe and history so recommendations can improve.
4. Complete the basic setup (name, age, gender choice and preferred styles); photo and wardrobe steps remain optional. No compulsory portrait or full inventory.
5. Continue refining, save a piece and get personalized recommendations from the account.

**Login:** one discovery conversation, one temporary try-on and one temporary wardrobe photo analysis come before phone sign-in. A second turn, another preview or saving wardrobe information requires a verified account. User photos used for guest try-on are sent for generation only with explicit consent, held temporarily and deleted within 30 minutes. SMS delivery and store access are separate checks.

**Not asked on day one:** full wardrobe, compulsory body shape/photo, payment credentials, store accounts, WhatsApp connection, notifications or a tour.

**Asked later:** optional fit/body/style goals for personal advice; garment details when adding a piece; numeric shoe size plus UK/US/EU system when searching footwear. Clothing sizes cannot substitute for shoe sizes.

## 5. V1

### Does · three core capabilities

1. **AI and chat discovery:** understand English, Hindi and Hinglish requests, search supported Indian marketplaces, show manageable sourced results, explain matches, accept feedback, and save favourites/conversation.
2. **Personal styling:** use optional editable body/proportion, fit and preferred-style context. Current requests override remembered preferences. Photo descriptions require consent and confirmation and remain tentative; they are not measurements or fit verification.
3. **Smart wardrobe suggestions:** save/edit confirmed owned pieces and availability, suggest outfits for the day, and review how a saved candidate could work with the wardrobe. Clothing-photo readings remain correctable drafts.

Private accounts, persistence, correction and honest failure states support these three capabilities. Purchases finish on merchant websites.

### After V1 · parked

- **In-app checkout:** payments, automatic spending, one-click ordering, verified tracking and return execution.
- **Pricing intelligence:** exact same-item comparisons, cheapest delivered totals, coupon/bank/cashback optimisation, verified savings and price alerts.
- Reliable WhatsApp delivery/account linking and a voice-first conversational channel.
- Real virtual try-on, full outfit image generation and verified-fit claims.
- Automatic wardrobe-gap detection and wardrobe-aware daily-feed ranking.

Listed-price/advertised-offer checks, daily picks, photo/voice drafts and try-on foundations already exist. Preserve these experiments; their presence does not make them V1 requirements or validated promises.

**Nice to have:** better explanations, fewer repeated questions and better category relevance after all three loops work.

### Plans (builder decision)

- **Free:** 3 saved wardrobe pieces, 10 new shopping conversations per UTC calendar month, and 3 personal stylist sessions per UTC calendar month. Refinements within an existing conversation do not start another conversation.
- **Pro:** ₹99 for 30 days of unlimited plan access to the wardrobe, shopping conversations and stylist. This is a one-time purchase with manual renewal; existing system safety limits still apply.
- New signed-in accounts are assigned Free by default. Convex owns plan state and usage counts; limits are enforced on the server. At a limit, the app links to `/pricing/`.
- Convex creates and verifies one-time Razorpay payments before enabling Pro. Each successful ₹99 payment grants 30 days; renewals are manual. Existing technical safety limits still apply. Live payment has not been verified until a production test charge is completed.

**How we’ll know it worked:** proposed trial: of five shoppers with a current outfit need, at least three save or choose a relevant option and independently return for another need within two weeks. Ask what they actually wore and how it felt; count questions, browsing effort and rejected suggestions. Sign-ups and compliments alone do not establish success. These are proposed criteria, not results.

## 6. The riskiest guess

**If false, the product is pointless:** taste, optional body context and owned clothes lead to more useful outfit decisions than the shopper’s normal browsing or a general AI chat. More product cards alone do not solve the pain.

Supporting technical risk: merchant pages must provide enough reliable information; access remains intermittent. Working searches do not prove good styling.

**Thirty-minute check, no code:** ask two shoppers about their last disappointing outfit purchase. For one current occasion each, collect constraints and a few owned pieces, then manually prepare three sourced options with a chat tool. Have them choose/reject and explain, comparing effort with their usual process and counting follow-ups. Do not upload personal photos to a new service without permission. Failure means no useful option, generic advice unchanged by context, or extra effort without a better decision.

**What happened:** not run in this documentation task. Historical merchant and generated-outfit checks are implementation evidence, not evidence shoppers look or feel better.

## 7. Milestones

Acceptance checks for the existing build, riskiest first. These are not newly completed milestones.

1. I can describe an occasion and preferences and find a useful sourced option, with an understandable reason.
2. I can reject/refine it without losing budget, size or must-haves.
3. I can add, correct or clear optional body/fit/style context and see advice respect it without body judgement or fit guarantees.
4. I can add/correct owned pieces, mark availability and receive an outfit using only confirmed available clothes.
5. I can review a saved candidate against my wardrobe and open the merchant knowing what still needs checking.
6. I can recover from an empty wardrobe, no matches, blocked store or AI failure without lost input or invented results.
7. I can close and reopen the app and find my saved preferences, clothes, favourites and conversation; another account cannot access them.

## Current implementation and evidence limits

Source review finds separate `/`, `/app/` and `/demo/` entries; Gemini discovery, saved styling context, wardrobe generation and saved-product wardrobe reviews. Readers now cover Flipkart, Amazon, Myntra, AJIO, Bonkers Corner, Bewakoof and NEWME. Meesho, SNITCH and The Souled Store are attempted but currently return unavailable/direct-search links without readable catalogue data. The expansion is locally tested; cloud acceptance is pending. Other website store logos do not prove active connections. The eight-product demo is fictional and resets on reload.

Previous notes record development/production checks; authenticated V1 loops were not rerun for this writing task. Real try-on previously hit provider quota; WhatsApp delivery remains unverified. See [TESTING_LEDGER.md](TESTING_LEDGER.md), [README.md](README.md) and [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). The older plan includes broader work; this brief controls the V1 cut.

Method: [GrowthX Product thinking](https://growthx.club/learn/build-sprint#/product-thinking), including all five chapters, read in Chrome on 15 October 2026. Saathi’s product brief informed the structure, not Chauffeur’s market or features. No shopper validation or Shaktimaan approval is claimed.

### WhatsApp implementation update — 16 October 2026

The builder has now requested a WhatsApp interface alongside web. An account-bound v0 is implemented and deployed with discovery, reviewed photo/voice shopping input, stylist, wardrobe photo drafts/outfits, try-on and requested daily picks. This reuses the existing account and feature limits. Meta setup and real-phone acceptance are still pending; do not describe WhatsApp as an established working customer channel yet. Full settings/history/editing retain web handoffs. See `docs/WHATSAPP_CHANNEL.md` for exact scope and gaps.

## Current app addition — 25 October 2026
Builder-requested Creator Lounge extends the earlier V1 scope: product-to-model photos with scene and pose direction, generated or self-referenced reusable adult models, and short image-to-video clips with downloads. The navigation order is Discover, Try-on, Wardrobe, Creator Lounge. Personal stylist and Past chats are hidden for now; data and backend capabilities are preserved. This section describes the new implementation, not a production release claim; see TESTING_LEDGER.md.

## Guest try-on access — 26 October 2026
The existing preview page, reached from the homepage’s Try it on link, accepts a portrait plus a product link (or clothing image) and shows one successful preview without login. After that result, phone OTP is required for another try-on, original-image export/download and saving to Wardrobe → Saved looks. Keep the result through sign-in; do not require styling onboarding before these actions. The homepage itself retains its existing design and discovery search. See [guest access rules](docs/GUEST_ACCESS.md) for storage, failure retries and verification limits.
