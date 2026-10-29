# Guest access and the first try-on

Builder decision, 26 October 2026. The homepage keeps its existing design and search bar. Its Try it on link opens the existing guest preview page at `/app/#/try-on` (also `/app/#/guest-tryon`).

| Action | Guest | Phone OTP account |
| --- | --- | --- |
| Add a portrait and paste a supported product link, or upload a clothing photo | Yes, with processing consent | Yes |
| Generate and view the first successful try-on | Yes | Yes |
| Generate another look after success | Sign in | Yes |
| Download/export the original result | Sign in | Yes |
| Save the result in Wardrobe → Saved looks | Sign in | Yes |
| Save owned clothes, saved products, use the basket or Creator Lounge | Sign in | Yes |

Guest discovery shows up to 12 verified products initially, then 12 more per “Show more” click from the same stored search pool (up to 36 candidates). No additional store calls run for pagination; fewer verified matches remain an honest smaller result set. Wardrobe shows an illustrative preview and requires sign-in before adding or analysing clothes. Production sign-in remains MSG91 phone OTP; the separate development test login is not enabled in production.

## Flow

The guest form defaults to product link and uses the same bounded direct/Zyte product reader and Gemini renderer as signed-in try-on. Link-reading and generation failures keep the chosen inputs. Up to three deliberate failed attempts are allowed; after a successful result, another generation requires login. One request may run at a time.

The result stays visible with “Sign in to save, download and try more.” Download and Save to wardrobe open the existing phone sign-in form. Completing sign-in returns to that same preview; no styling questionnaire blocks downloading, saving or the next try-on. The next signed-in look uses the existing fitting room. Saved images are looks, not evidence that the user owns the referenced clothes.

## Server rules and storage

- A separate browser try-on token survives guest discovery resets and refreshes. Convex hashes it and enforces the successful-preview allowance in `guestTrials`. Expired media does not restore the allowance.
- This is a browser-level guest allowance, not verified human uniqueness. Clearing site storage or using another browser can create a different token. The existing cap on new guest preview records remains in place.
- The guest receives a compact preview image. The original output URL is returned only by an authenticated endpoint. A displayed image can still be copied or screenshotted; this is an application export gate, not copy protection.
- New guest generations do not store the portrait or garment input. Preview and original output expire within 30 minutes of the trial window. The existing delayed cleanup also removes older stored input media.
- Download/save binds the trial to one authenticated account. Another account cannot claim it or view it through the token. Saving is explicit, idempotent and keeps the output in Saved looks until removed. The account export includes saved-look metadata.
- Removing a saved look deletes its stored media and retains the spent guest allowance. Saved looks never enter wardrobe outfit reasoning as owned garments.

## Evidence

Backend tests cover consent, supported links, concurrent/second attempts, export/save authentication, account isolation, cleanup and saved-look retention. The real development H&M link test generated a preview using an existing illustrative portrait in about 20 seconds. Browser tests cover the guest preview page and a clearly labelled mocked result/login transition; actual MSG91 SMS delivery was not retested for this change. See TESTING_LEDGER.md for release status.

## Preview fixes — 26 October 2026 (development)

Try-on now asks for the portrait first, then a product link or clothing upload. The first Next button prepares the photo locally; generation and processing consent stay on the second step. Back/Change retain selected inputs. The native picker still requires a manual builder check because the browser extension's file-URL permission is off; a clearly labelled temporary test-photo harness checked both steps, source switching, consent and back navigation using repository illustrations.

Guest discovery now uses the shared fast HTTP extraction followed, when fewer than twelve verified results remain, by at most four automatic-extraction recovery calls for unreadable stores. Retrieval is bounded to 55 seconds. Known cotton/linen blend terms are retained together. Up to six candidate images with missing colour labels can receive one Gemini colour check (700 output tokens, no retries, 22-second image/model window); price and material remain listing facts. The existing safe-image reader and blue-pixel veto are shared with signed-in discovery. The page discloses colour estimates.

One deliberate retry is allowed for a failed/empty guest search, including older failed records. It keeps the request and constraints, consumes no new guest-session record and cannot repeat after the second attempt. Completion checks the attempt number so an earlier response cannot overwrite a retry. The wait timer uses the latest attempt start, including after the audience question. A retry does not grant another try-on.
