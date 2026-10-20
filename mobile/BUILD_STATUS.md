# Mobile foundation build status

Recorded 15 October 2026. App 0.1.0. This is implementation evidence, not native release acceptance.

## Branch and scope

- Worktree: `/Users/apoorvkhare/build-sprint-app/chauffeur-mobile`, branch `mobile-foundation`.
- Base: original main `09f2726` plus handoff `e81a3a1`; current mobile branch merged committed main `0ba004d` through merge `d6020ed`. No unfinished main files were copied.
- All implementation changes are under `mobile/`. The shared backend, generated contracts, website, root package/lock and other sessions' unfinished changes were not edited. No backend watcher, shared deployment, store registration, release signing-key generation or public release was performed.
- Expo 57.0.30, React Native 0.86.3, React 19.2.3, Convex 1.46.0, Convex Auth 0.0.94, MSG91 native SDK 3.1.0. Node 22.23.3 used for checks. The lock file is authoritative for transitive versions.

## Implemented

Four native tabs and navigation, approved blue/Inter identity and icons, protected screens and session restoration adapter, native phone sign-in sequence, guest request retention, required preference setup and optional manual body description. Discovery renders current requirements/questions, pending/cancel/error states, previous/current product cards, feedback, explicit acceptance, saved products, advisory fresh wardrobe pairings and store coverage. Past conversations are read-only.

Wardrobe has manual add/edit, availability, removal confirmation, original/clean image access, camera/library preparation, explicit sharing consent, AI draft correction and confirmation. Outfit requests use confirmed available inventory with optional time/date/setting and typed weather, and hide stale output. Settings includes preference editing, remembered-taste clearing and device sign-out. No fabricated products, production fixtures, checkout, voice, push, device location or new AI/backend service was added.

Personal stylist now includes event context, optional preference review, detailed sections/palette/concept looks, curated editorial references, focused refinements, stale-result suppression and an explicit server-validated shopping handoff. Optional styling photos have local selection, separate upload consent, editable body/visible-outfit notes confirmed separately against the current photo ID, explicit retry and removal confirmation. Browser adapters reuse the existing web OTP and image helpers. No authentication bypass or new shared endpoint was added.

## Evidence

| Check | Result and limit |
| --- | --- |
| Mobile typecheck and lint | Passed |
| Clean install | `npm ci` passed and reapplied the pinned MSG91 patch successfully |
| Mobile core tests | 18 passed: environment rejection/isolation, exact choice text, old/current/satisfied result handling, request bounds/Hindi, server proof ordering/rejection/late cancellation, phone validation, photo bounds/sizing, trusted links |
| Component and browser adapter tests | 17 passed (14 native components + 3 browser adapters): submit-once/pending/cancel, failed-input retention/no automatic resend, save source IDs/no acceptance, photo consent/correction/confirmation, denied-camera recovery, wrong OTP/server proof failure, stale-outfit suppression, mocked SecureStore restore/isolation/removal; stylist refinements/stale suppression/explicit shopping handoff; styling-photo consent/separate confirmations/current photo ID/retry/removal; browser CAPTCHA ordering/remount and local picker cancellation/preview cleanup. Layout boundaries reject raw text, including empty strings |
| Expo dependency alignment | Passed |
| Expo Doctor | 21/21 passed after installing CocoaPods 1.17.0 and enabling Expo 57 scene support |
| Platform bundles | Passed for iOS, Android and web. Hermes bundles about 3.4MB/3.7MB; browser entry about 1.5MB plus a lazily loaded 3.2MB HEIC converter. These are not installable native binaries |
| Native build and installation | Xcode 27.0 (27A266a), CocoaPods 1.17.0 and iOS 27.0 runtime (24A434). Clean iOS prebuild, Pods installation and simulator compile passed; 0 errors, 1 Expo dev-launcher build-script dependency warning. Installed `in.chauffer.app.dev` on iPhone 18 Pro in Device Hub. Android native compile remains untested |
| iOS simulator rehearsal | App launched against existing local Convex. Checked Discover, Settings environment, private Wardrobe gate and phone-entry screen. Fixed iOS 27 startup using scene support, localhost IPv4 binding, and keyboard coverage using native scroll-view keyboard insets. Focused search text and phone field were visible above the software keyboard; tapping outside dismissed it. Submitted one guest request, “Mens blue jeans under 3000”; observed pending state and six priced merchant options. No SMS sent |
| Browser preview | Actual Expo screens opened in Chrome and Safari. Discover/Wardrobe/Saved/Settings navigation and disconnected states inspected. Safari helper used at 320/390px; tab-label clipping found and corrected. One real local guest search returned six merchant options with prices and store coverage. Latest Safari refresh verified Discover, the disabled/unconfigured SMS state and private stylist/photo entry without the text-node overlay. Authenticated browser journeys were not tested |
| Root regression checks | Existing `npm test` passed: 4 website/demo + 186 backend tests. Root build and backend typecheck passed. These verify existing code, not mobile native integration |
| Provider/device integrations | Not run: no real SMS, native provider proof, native session refresh, authenticated search, remote save/reload, real image upload, merchant return or cross-device account isolation claim |

Tests use invented data and mock network/native boundaries. A SecureStore mock proves adapter wiring, not iOS Keychain or Android keystore behavior. Photo arithmetic tests do not prove HEIC conversion, EXIF orientation/metadata stripping or device memory use. Browser widths do not prove native keyboards, safe areas, Android back or slow mobile data.

## Environment mapping

| Build | Current mapping |
| --- | --- |
| Development (`in.chauffer.app.dev`) | Local development now uses existing `local-apoorv_khare-chauffeur` at `http://127.0.0.1:3210`, explicitly enabled in ignored mobile env files. Existing cached binary/data started without a watcher or function deployment. Read-only connection check passed. No main env file or private provider keys copied |
| Preview (`in.chauffer.app.preview`) | No agreed staging deployment or EAS project configured |
| Production | Known live Convex origin `https://rare-chameleon-828.convex.cloud`; deliberately rejected by development/preview. Production seller identifiers remain unset. No production mobile requests sent |

The local configuration supports guest discovery. SMS is deliberately off because the builder confirmed MSG91 needs registered IPs. The saved local functions predate the stylist and visible-outfit confirmation APIs. `npm run check:environment` is the read-only first connection check once the backend owner supplies the non-production URL. Do not resolve the missing environment by deploying from this worktree or pointing the test build at production.

## Gaps and decisions, collected together

| Item | What is needed | What can proceed without it |
| --- | --- | --- |
| Development backend | Backend owner provides an approved development deployment with the integrated stylist/photo functions and a separate MSG91 mobile widget configured as described in `README.md`; existing local guest server works for guest discovery | All implemented screens and unauthenticated flows |
| Physical-device installation | iOS simulator build and launch are verified. Physical iPhone signing/account setup and Android SDK/JDK or configured Expo cloud build remain needed | Continue simulator and browser development |
| MSG91 native compatibility | Separate `ChaufferIOS` widget is active for mobile-number OTP, with SMS primary, India restriction and CAPTCHA disabled; website widget is unchanged. `dev/main` has the mobile widget ID/token and existing server-only `MSG91_AUTHKEY`; reconcile and deploy the mobile OTP change with the current backend schema, then test correct/wrong/expired codes, resend and provider rejection on an iPhone | `dev/main` lacks `otp.beginMobileWidget`; a clean targeted deploy was rejected because stored records use fields missing from committed main (`category`, `updatedAt`). Local backend uses loopback, which is not an approved MSG91 source IP. No production testing, test-code bypass or alternative provider |
| Native photo behavior | Real HEIC/JPEG/rotated/oversized files and denied-camera tests; verify payload bounds, metadata removal, upload/confirmation, cache cleanup and original-photo access | Manual clothing and mocked confirmation tests |
| Launch identity/accounts | Builder chooses seller/legal identity, final identifiers, developer account enrollment and any build costs | Development identifiers already distinct |
| Shared release features | Comprehensive account/file/auth deletion and AI-content reporting are still missing. Backend owner defines contracts before native implementation | Settings explains current limits; no false deletion/report control |
| Dependency advisories | Latest clean-install audit reported 66 dependency findings (15 moderate, 51 high, 0 critical), including inherited Metro/Expo/Jest chains. Compatible `npm audit fix` applied; remaining findings need compatible upstream updates/reachability review before public release. Do not force Expo/React downgrades or mismatched SDK upgrades | Local foundation development and tests |

The advisory count includes dependent packages, not 66 separately demonstrated exploitable app paths. Reported roots included braces, decode-uri-component, node-forge, sprintf-js and uuid. Neither blanket safety nor a completed security review is claimed.

No shared API changes are proposed for the foundation. If native MSG91 proof proves incompatible, report the actual redacted response shape to the backend owner and agree an additive authenticated adapter with tests. Do not weaken server verification.

## First connected rehearsal

1. Backend owner supplies the development origin and integrated commit. Set mobile public config; pass `npm run check:environment`. Verify Settings shows the intended environment.
2. Install a development build. Use a designated test phone/account. Test wrong/expired OTP and correct sign-in; complete required setup; force-close/reopen; sign out and use a second test account.
3. Submit one bounded request. Double tap once to check the lock. Choose a server question option, cancel a turn, refine, accept deliberately, save and reload. Open a merchant and return. Repeat with lost connection/background return; no duplicate paid request should be sent.
4. Add an invented garment manually, then a test clothing photo with explicit consent. Correct a wrong reading, confirm, edit, mark unavailable and check outfit freshness. Verify denial, cancel, oversized input, real HEIC/orientation and draft cache cleanup.
5. Open the same test account on web and phone. Verify one shared current chat and shared cancel/reset, while a second account sees none of the first account's records.
6. Repeat the end-to-end flow on both physical iPhone and Android, recording OS/model/build/backend commit and observed outcomes. Then resolve launch blockers before beta/store submission.

M0 implementation and an installable iOS simulator build are verified, including a connected guest search. M1/M2 are implemented against current contracts, with authenticated integration acceptance open. M3 run notes are provided; physical-device and Android rehearsals remain open.

Next milestone: connect the installed app to an approved-IP development backend containing the integrated functions, then complete sign-in → discovery/refinement → save → corrected wardrobe photo on a physical phone.


## iOS affiliate follow-up — 21 October 2026

Working checkout: `/Users/apoorvkhare/build-sprint-app/chauffeur`. Preserve the other uncommitted work; no new commit or App Store submission was made in this follow-up.

- Existing local daily-pick, search, guest and saved-card links use the shared merchant button with stored-product references. Added other-store comparison cards with `comparison` references and `price-comparison` source. The wardrobe-review store button now appears beside the completed, current review instead of the general price-tools heading.
- Settings now respects the shared `PRO_VISIBLE` switch, hiding the old plan card and pricing link while preserving their implementation.
- Added native merchant-button tests for signed URLs, plain setup/loading fallback, rejected references, unknown/other-deployment hosts, disclosure, and the browser promise completing. Added a saved-screen integration test proving comparison and wardrobe-review references and source labels. These use invented fixtures and mocked boundaries.
- Checks passed: mobile TypeScript, lint, 20 core tests, 24 component/adapter tests and iOS JavaScript/Hermes export. This export is not an installable release IPA.
- Updated only the development Convex deployment `mellow-spaniel-636` using `npx convex dev --once`; it previously lacked the affiliate functions. No production settings or deployment changed in this follow-up. Provider/signing setup remains disabled; live simulator openings used plain merchant fallback.
- Simulator: existing native Expo 57 development app on iPhone 17 / iOS 27 loaded the current checkout from port 8085 (IPv4 localhost binding). Existing development sign-in restored. Search product opened an actual Tata CLiQ product page in the native browser sheet. Settings showed no Pro/plan card. Saved-product and expanded price/wardrobe controls rendered, with review correctly disabled for an empty wardrobe.
- The simulator control tool did not expose the merchant sheet's close button and coordinate actions failed. The simulator was restarted without clearing its data; sign-in and saved items restored. Normal browser dismissal/return is not claimed as simulator-verified. No SMS, new search, photo upload, purchase, or real-phone verification was performed. The test account had no comparison report or wardrobe review, so those output paths are covered by component tests, not a connected simulator result.

### Public release remains blocked

The builder confirmed Apple Developer enrollment has not started. EAS CLI reports not logged in, and App Store Connect requires sign-in. No developer agreement, membership payment, signing credential, cloud build, or store submission was initiated.

Before submission:

1. Builder completes [Apple Developer enrollment](https://developer.apple.com/programs/enroll/) and chooses individual versus organization seller identity; Apple explains the seller-name consequences on that page.
2. Sign in to Expo, link the intended project, configure production public backend address, and confirm the registered bundle identifier and signing account. Use the existing Convex backend; EAS is only the native build/submission service.
3. Implement and verify account deletion across account data, stored photos and authentication. The current backend lacks this; Apple [requires in-app deletion for apps with account creation](https://developer.apple.com/app-store/review/guidelines/#account-sign-in).
4. Complete truthful privacy/support materials, AI-sharing consent/release checks and the project's planned content-reporting flow. Verify SMS, merchant return, photos and account deletion on a real iPhone before calling the release tested.
5. Produce a signed production build, upload to TestFlight, complete listing/privacy/reviewer-access details, then submit for Apple's review. [EAS submission](https://docs.expo.dev/submit/ios/) uploads a build; it does not itself make the app publicly available.
