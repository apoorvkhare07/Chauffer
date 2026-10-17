# AI evaluation results — 15 October 2026

Real Gemini calls through Chauffeur's actual Convex actions, isolated synthetic accounts. No private customer data or production account changes. Latest evidence combines the full agent runs with targeted corrections; it is not one untouched 72-call run.

| Agent | Scenarios | Passing repeats |
|---|---:|---:|
| discovery | 8 | 24/24 |
| wardrobe | 8 | 24/24 |
| stylist | 8 | 24/24 |

All 24 scenarios passed each of three repeats under the provisional model rubric after the fixes below. These are automated scores, not 100% shopper accuracy. Ten deliberately good/bad scorer checks also passed. Normal checks: 194 tests (190 backend + 4 website/demo), backend type check and production build passed. No deployment or new browser/real-phone acceptance is claimed.

## What improved

- Brand alternatives no longer silently select one before the shopper chooses, including Levi’s/Wrangler and model-supplied brand clarifications.
- A shoe size without a confirmed UK/US/EU system no longer stores a guessed system. Explicit reversed forms such as 8 US are normalised.
- Final search confirmations respect Hindi/Hinglish instead of replacing the generated reply with an English wrapper. Explicit Hindi language requests override an English saved default.
- Wardrobe receives a separate, bounded description of unavailable saved pieces. It can explain unavailable versus missing without using those items in outfits or telling the shopper to upload duplicates.
- Styling instructions apply exclusions to caveats and alternatives, qualify fabric-performance advice, and avoid unsupported market-average claims.
- Photo analysis checks framing before accepting a try-on photo. Generated previews receive the target garment description and instructions to retain other clothing, accessories and pose.

## Image results

Used real Pexels people and credited Unsplash garment references, with original photos retained locally. Sources and rerun commands are in [evals/README.md](../evals/README.md).

The cropped/obstructed photo is now rejected. Both positive try-on calls returned images. Visual inspection is **partial, not pass**: the kurta now preserves the original checked trousers instead of copying the reference outfit, but hands still move; the striped reference can still introduce a dark underlayer and guess unseen details. One person and two garments do not establish reliable try-on or fit. See [visual review](../tmp/evals/images-final/REVIEW.md), [striped preview](../tmp/evals/images-final/casual-preview.jpg) and [kurta preview](../tmp/evals/images-final/kurta-preview.jpg).

## Evaluation corrections and limits

The first wardrobe attempt failed because my test setup omitted the workflow component. Those 24 errors are excluded, not counted as model failures. An intermediate network/DNS interruption is also recorded separately. Early duration measurements used a frozen clock; later measurements use a real clock. No cost estimate is claimed.

Reading actual answers found scorer blind spots: a forbidden jacket in a caveat, unavailable versus missing inventory, skipped-question metadata, and the distinction between a replaced AI draft and the final displayed reply. The scorer was corrected and checked against ten authored examples; original scores remain in earlier run folders. This is Codex-authored calibration, not human-labelled evaluation accuracy. The stricter final-reply check exposed the Hindi application bug.

Remaining checks: shopper/fashion-expert grading, held-out prompts and longer refinement conversations, Hindi required/optional-question paths beyond this confirmation, more people/poses/categories in photo tests, and real phone uploads. A spot-check still found a cotton request narrowed to pure cotton and some broad comfort explanations; automated passes do not certify every nuance. Discovery tests cover planning/state/replies, not current merchant availability or shortlist relevance. Live weather remains disconnected. Real-world fit cannot be established from generated images.

## Evidence

[Readable 72-run summary](../tmp/evals/accepted/REPORT.md). Raw input/output, context, scoring excerpts and source snapshots remain under ignored tmp/evals; synthetic fixtures and reusable commands are in evals/. Production keys are not written to these files.

- discovery-scored: dad02b54d93981eb12c356d5fd1a4a477f90827d1030e5d08d9c8b87588c0529, rubric fashion-eval.v3
- hindi-final: b3506c4d02daa7942793f331138848577ce1e57d4896df5cbbeb2feb4581e976, rubric fashion-eval.v3
- reviewed: 7bbe382ae2efbeea1f5770533fffd467d537d0ffea0f8c0379fd290a48d62e18, rubric fashion-eval.v2
- availability-fix: c7b555f09f9842c44a6a139e9e4a28e82d500d3553090e57b51a4237a31ef961, rubric fashion-eval.v2

Next: review a small sample of successful and borderline answers together, then add those judgements as independent scoring examples.
