# Analytics: PostHog and Convex

Use PostHog for website traffic and interface activity: page views, sessions, and button clicks. These events describe what a browser attempted; a click or form submission is not proof that Chauffeur accepted or completed the action.

Use Convex as the source of truth for product usage. Guest discovery is stored in `guestSearches`, not `conversations` or `messages`. Signed-in chat is stored in `conversations` and `messages`. Guest search text and results are cleared after 24 hours, while the small record remains so the one-search guest limit cannot be reset by refreshing.

The web app also sends server-confirmed PostHog events after a successful Convex request: `guest_search_accepted`, `guest_search_ready` (or `guest_search_clarifying` / `guest_search_failed`), and `conversation_message_accepted`. These are the events to compare with Convex rows, rather than `button_clicked` or `form_submitted`. Browser analytics can still be blocked, so Convex remains authoritative when counts differ.

## Try-on and Creator Lounge

All events below use the existing client `track()` → PostHog `capture()` helper, also used by `button_clicked`. Events describe transitions for an actual user attempt, never a render or every query update.

| Event | When | Properties |
| --- | --- | --- |
| `tryon_started` | A valid, consented generation starts, including photo preparation | `source`, `store` for product links |
| `tryon_completed` | Generation returns successfully, or a scheduled saved-photo request becomes ready | `duration_ms`, `source`, `store` |
| `tryon_failed` | Preparation/request/generation fails, or a started attempt is cancelled | `reason`, `source`, `store` |
| `tryon_exported` | Export is tapped (including a gated guest tap) | `kind`, `source_page`, `product_id`, `is_guest`, `in_app_browser`, `export_method`, `completion_verifiable` |
| `tryon_export_downloaded` | Supported browser file writer closes successfully | Same export context |
| `tryon_export_failed` | File loading, save permission or writing fails, including cancellation | Same export context, `reason`, safe `error_message` |
| `tryon_remixed` | Another generation starts when the workspace has a successful preview, including retained saved-photo previews | `source`, `store` |
| `tryon_basket_added` | Add request succeeds | `entry_point: "discover"` or `"chat"` |
| `tryon_basket_removed` | Remove request succeeds | — |
| `tryon_basket_opened` | Closed basket opens | `item_count` |
| `creator_started`, `creator_completed`, `creator_failed` | Creator generation starts/resolves/rejects | `kind: "photo" / "video" / "model"`, `input_source`; photo also has `model_source`; completion adds `duration_ms`, failure adds `reason` |
| `creator_exported` | Generated content download is handed to the browser | `kind: "download" / "video"`, `creation_kind` |
| `creator_model_saved`, `creator_model_removed` | Save/remove request succeeds | — |
| `creator_model_used` | A photo generation starts with a saved model | — |

Sources mean the **garment** source: `upload`, `wardrobe`, or `product_link`. Discovery, chat, saved shopping products and basket pieces use `product_link`; personal photo uploads do not change that source. Store names come from the merchant allowlist, with `other` for an unrecognised merchant. URLs, product titles, filenames, prompts and raw errors are not sent. Failures use bounded reason codes such as `timeout`, `billing_exhausted`, `network_error` and `generation_failed`.

Each attempt has at most one completion/failure. Retries start fresh attempts. A basket has one attempt per started piece; queued pieces skipped by Stop do not become generations. Duration uses a monotonic clock and includes photo preparation and the service wait. Saved-photo attempts stay observed while moving between app tabs; historical ready records and repeated query updates do not generate events. Closing/reloading the browser can lose pending outcomes, so these are not billing records.

`tryon_exported` supports `download`, `share` and `video` in its helper. The current try-on UI only has download: there is no share action or try-on-to-video transfer yet, so no synthetic share/video export is emitted. Creator video downloads are counted separately. A browser download handoff does not prove the file was saved to disk.

## Attribution and production traffic (27 October 2026)

Read campaign parameters before React renders on every HTML entry point, including `/edits/*`. Retain only `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` and existing `utm_id`; strip control characters and cap each value at 200 characters. The first **tagged** visit is saved without overwrite in localStorage and a first-party cookie. Old empty records no longer block later tagged arrivals. Current campaign tags persist separately; a later explicit campaign replaces current values, while first-touch values stay unchanged.

Register first touch with `register_once` as `initial_utm_*`, and current values with `register` as `utm_*`. The outgoing filter also attaches both to every SDK event, including identify. Identify/login/signup set first-touch person properties through `$set_once`: existing `utm_*` and `$initial_utm_*` are preserved, plus `initial_utm_*`. Raw URLs, referrers, search text and private file names remain excluded. `$current_url` intentionally has no query string; use the explicit UTM properties to inspect attribution.

Same-origin navigation carries current UTMs and the internal flag. Edit-page try-on links include them directly in their href; login uses the app hash and retains the page query. Merchant links are never decorated. Cookies recover from blocked/cleared localStorage; links carry attribution when both stores are unavailable. If all storage is cleared and a visitor returns without tags, old attribution cannot be reconstructed.

PostHog initializes **only** on exact hostname `chauffer.studio`. Localhost, `www`, Vercel previews and other hosts send no SDK events. Visit any production page with `?internal=1` once to persist `is_internal=true` on subsequent events in that browser. It does not automatically exclude traffic from reports: filter out `is_internal=true` in PostHog. Logging out preserves the flag and campaign registration.

New account creation records a pending signup marker. After authenticated identification on the production frontend, `analytics.completeSignup` attaches the sanitized browser context and schedules the existing server `signup_completed` event once. Owner checks and the production Convex deployment check apply; previews do not send signup events. Returning accounts are not backfilled. This delays signup tracking until the production client connects, so a failed connection can delay the event until the next visit. Existing event names and the signup deduplication key are unchanged.

### Root cause checked

The public edit routes and canonical redirects preserved the test query. Edit-page initialization already preceded React rendering. The missing fields came from absent event-level UTM registration, the legacy empty first-visit record, and internal links that dropped query parameters. The server signup event also had no browser campaign context. A query-free `$current_url` alone was not evidence of a redirect removing tags.

### Export evidence and limits

Try-on start/completion/export now include `source_page`, `product_id`, `is_guest` and `in_app_browser`. Known edit products use the post slug and product ID; other link products use a merchant ID when available, otherwise `unknown`. Uploaded file names are never sent. Attempt context is retained through completion/failure so switching products does not relabel an in-flight result.

The user approved confirmed-save support on 27 October. On supported desktop browsers, export opens a save dialog and emits `tryon_export_downloaded` only after writing and closing the file successfully. Cancelled dialogs and failed writes emit `tryon_export_failed`, never success. Other browsers retain their existing blob/download-link behavior and emit only `tryon_exported` with `completion_verifiable:false`; an anchor click cannot confirm a disk save. A slow file fetch can outlast the browser's temporary click permission and produce a blocked-save failure; retry remains explicit.

Instagram/Facebook download behavior and Creator Lounge video downloads are unchanged. Try-on has no share or video export UI, so no synthetic share/video success events are added. Actual Instagram iOS/Android video saving remains untested: this session has desktop Chrome, not those app/device combinations. Before a workaround, test a generated video on each device and record whether it saves, opens, or fails. If blocked, evaluate file sharing via Web Share on supported devices, or an explicit “Open in browser” prompt. Neither is shipped here, and share resolution means a share handoff, not proof of a disk save.

Local automated tests use a mock SDK and never send production analytics. Desktop browser verification used a labelled simulated login/generation and a real save dialog for a test image; the saved file and attributed success event were checked. A real OTP journey, real generated-video downloads in Instagram, and production PostHog ingestion still need verification after an announced release.

For a business-usage snapshot from the production database, run:

```sh
npm run usage:prod
```

It reports the last 7 and 30 days without printing message text or customer details. It reads up to the 10,000 most recently created records per table. For infrastructure activity such as backend function calls, database reads/writes and storage, open the production deployment's **Usage** view in the Convex dashboard. Convex does not count passive website visits; use PostHog for those.

Guest preview access update, 26 October 2026: link-based guest generation uses `source: "product_link"` and the normal store property. `tryon_signin_prompted` records a bounded action (`download`, `save`, `continue`, `another_tryon`) when opening the login gate. `tryon_saved` fires only after the authenticated save succeeds. Gated download clicks now retain the export-attempt event with `gated:true` and `completion_verifiable:false`; no save-completion event is emitted until a confirmed authenticated save.

## Files changed for the 27 October attribution/export task

- `analytics.js`, `analyticsAttribution.js`: campaign capture, registration, safe properties, hostname guard, link fallback and internal flag.
- `edits/main.jsx`: tagged try-on link hrefs.
- `app/Account.jsx`: authenticated signup context handoff.
- `app/creationAnalytics.js`: attempt/product/browser/guest context.
- `app/mediaExport.js`: confirmed save and failure events.
- `app/GuestTryOn.jsx`, `app/VirtualTryOn.jsx`, `app/TryOnBasket.jsx`, `app/SavedTryOnLooks.jsx`: connect export actions to the shared helper.
- `app/try-on-basket.css`: preserve download-button styling.
- `convex/auth.ts`, `convex/schema.ts`, `convex/analytics.ts`: pending signup marker and attributed production-only delivery.
- `app/analyticsAttribution.test.jsx`, `app/creationAnalytics.test.jsx`, `app/mediaExport.test.jsx`, `convex/analytics.test.ts`: regression coverage.
- `docs/ANALYTICS.md`, `TESTING_LEDGER.md`: behavior, cause, checks and remaining limits.

The checkout already contains unrelated uncommitted work. This list covers this task only; no commit, push or production deploy was performed.

## 27 October follow-up — Instagram Download Preview failure (local only)

The builder reported a silent Download Preview failure on chauffer.studio inside Instagram. The deployed bundle was inspected: it still uses a base64 data-URL anchor with a download attribute, with no error/completion feedback. It does not contain the pending save-dialog implementation. This supports a failure in the embedded-browser download path; actual device restrictions have not been independently reproduced.

Prepared, not deployed: embedded-browser exports now test file-sharing support and invoke native file sharing when available. A resolved share emits `tryon_export_downloaded` with `completion_type:share_handoff` and `export_method:web_share`; that is not proof of a saved photo. Unsupported sharing and cancellation emit failures; the preview displays a message, with long-press guidance and a warning that an unsaved preview will not transfer to another browser. File-write success has `completion_type:file_saved`. Download click `kind` is preserved.

Generated image data is decoded to a Blob synchronously, preserving the tap needed for native sharing. The Download Preview button disables during export and displays failures next to the result. Ordinary browser fallback appends a temporary download link to the document and retains its file URL for 60 seconds. Guest result and saved-look network downloads still depend on browser permission lasting through the file request.

Checks: 399 Vitest tests plus 5 Node tests passed; build passed. A local, labelled harness verified unsupported/success paths with simulated Instagram capabilities; normal Chrome downloaded a real 146,040-byte test image into Downloads. The automation download observer timed out, but filesystem inspection confirmed the completed file. These checks do not prove Instagram iOS/Android behavior. No production deploy or real-phone video test.

Additional changes in this follow-up: `app/mediaExport.js`, `app/mediaExport.test.jsx`, `app/VirtualTryOn.jsx`, `app/GuestTryOn.jsx`, `app/TryOnBasket.jsx`, `app/SavedTryOnLooks.jsx`, this document and `TESTING_LEDGER.md`.

### Release status

The builder subsequently requested deployment of everything to production. On 27 October 2026, the attribution, export outcomes and Instagram fallback changes above were published to chauffer.studio and the production Convex backend. The earlier “local only / not deployed” entries describe the checks before that authorization. Real Instagram device verification remains pending; see TESTING_LEDGER.md for deployment evidence.
