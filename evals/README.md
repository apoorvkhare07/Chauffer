# Fashion agent evaluations

Real Gemini calls through the application's existing Convex actions, with isolated in-memory accounts. No production accounts or private photos. These calls spend Gemini quota; they are deliberately separate from normal tests. No merchant/browser search calls occur here: discovery is evaluated through planning, state updates and its final reply, not live product retrieval.

Based on GrowthX [Eval 101](https://growthx.club/learn/build-sprint#/eval-101), [Define good](https://growthx.club/learn/build-sprint#/eval-define), and the improve/advanced chapters. Twenty-four synthetic cases, three repeats each, three scoring dimensions. A case passes only if every repeat passes requirements=3, evidence=3 and usefulness>=2, with no deterministic failure or scorer abstention.

## Run

- `npm run eval:ai` — 24 cases × 3; real generator plus a separate Gemini scoring call for each output.
- `EVAL_LABEL=my-check EVAL_CASES=d-two-brands,s-warm npm run eval:ai` — selected cases, still three repeats.
- `npm run eval:scorer` — ten deliberately good/bad examples checking the scorer, including warnings versus recommendations.
- `npm run eval:images:download` then `npm run eval:images` — a cropped/obstructed photo rejection plus two actual try-on calls with stock photography. Open the saved pictures; a successful API response is not a visual-quality pass.
- `EVAL_SOURCE=earlier-label EVAL_SUITE=rescore node evals/run.mjs` — score an existing discovery run with the current rubric without regenerating answers.
- `node evals/report.mjs tmp/evals/<label>` — readable Markdown summary beside the raw evidence.

The runner reads the development Gemini key without displaying it; an existing server-side shell key can override it. Never paste keys into files. Each agent run saves the cases, source snapshots, source hash, scores with excerpts, generated output and measured duration under ignored `tmp/evals/`. Test execution and quality success are separate: the runner exits nonzero for either failure. Completed agent labels cannot be overwritten. Normal unit tests remain offline/mocked.

## Limits

The rubric and ten scoring anchors were written by Codex, not labelled by shoppers or a fashion professional. Using the same model family for generation and scoring can share blind spots. Scores are provisional; review failures and a sample of passes yourself. Ten obvious anchors do not establish evaluator accuracy on subtle fashion judgements. No measured cost is claimed; durations cover generation/actions and exclude the scorer. Early baseline durations were invalid because the test clock was frozen; later runs use a real monotonic clock.

The suite covers languages, exclusions, ambiguous sizes/brands, missing body context, occasion mismatch, wardrobe availability, unknown weather/materials and malicious instructions. It does not prove all categories, body proportions, long conversations, real phone uploads, merchant freshness, or physical fit. Add anonymised user cases only with permission; never commit private chats/photos. Keep a held-out case set before future prompt tuning.

## Photo sources

Test-only real stock photographs; no customer/endorsement claim. [Pexels licence](https://www.pexels.com/license/).

- Ron Lach: [standing man, 8346219](https://www.pexels.com/photo/a-standing-man-in-white-shirt-and-denim-pants-8346219/) — deliberately cropped/obstructed negative example.
- Quốc Bảo: [woman standing, 2226848](https://www.pexels.com/photo/woman-standing-2226848/) — full-length outdoor person, angled pose and overlapping footwear.
- Garment references: existing `public/images/mens-shirt.jpg` (Brock Wegner) and `green-floral-kurta.jpg` (Shahenaz India), credited with original links in `public/images/CREDITS.md` under the Unsplash licence. The striped reference is partial; unseen construction cannot be verified.

Compare input person + garment + output for garment fidelity, unchanged other clothing/accessories, hands/pose/background and obvious image artifacts. Record partial/fail even when the request technically succeeds. Generated previews never verify actual size or fit.
