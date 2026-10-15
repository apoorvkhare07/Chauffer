# Mobile foundation build status

Recorded 15 October 2026. App 0.1.0. This is implementation evidence, not native release acceptance.

## Branch and scope

- Worktree: `/Users/apoorvkhare/build-sprint-app/chauffeur-mobile`, branch `mobile-foundation`.
- Base: committed main `09f2726` (including original/clean-photo fixes); handoff documentation merged from `agent-mds` at `e81a3a1`.
- All implementation changes are under `mobile/`. The shared backend, generated contracts, website, root package/lock and other sessions' unfinished changes were not edited. No backend watcher, shared deployment, store registration, release signing-key generation or public release was performed.
- Expo 57.0.30, React Native 0.86.3, React 19.2.3, Convex 1.46.0, Convex Auth 0.0.94, MSG91 native SDK 3.1.0. Node 22.23.3 used for checks. The lock file is authoritative for transitive versions.

## Implemented

Four native tabs and navigation, approved blue/Inter identity and icons, protected screens and session restoration adapter, native phone sign-in sequence, guest request retention, required preference setup and optional manual body description. Discovery renders current requirements/questions, pending/cancel/error states, previous/current product cards, feedback, explicit acceptance, saved products, advisory fresh wardrobe pairings and store coverage. Past conversations are read-only.

Wardrobe has manual add/edit, availability, removal confirmation, original/clean image access, camera/library preparation, explicit sharing consent, AI draft correction and confirmation. Outfit requests use confirmed available inventory with optional time/date/setting and typed weather, and hide stale output. Settings includes preference editing, remembered-taste clearing and device sign-out. No fabricated products, production fixtures, checkout, voice, push, device location or new AI/backend service was added.

## Evidence

| Check | Result and limit |
| --- | --- |
| Mobile typecheck and lint | Passed |
| Clean install | `npm ci` passed and reapplied the pinned MSG91 patch successfully |
| Mobile core tests | 18 passed: environment rejection/isolation, exact choice text, old/current/satisfied result handling, request bounds/Hindi, server proof ordering/rejection/late cancellation, phone validation, photo bounds/sizing, trusted links |
| React Native component tests | 8 passed: submit-once/pending/cancel, failed-input retention/no automatic resend, save source IDs/no acceptance, photo consent/correction/confirmation, denied-camera recovery, wrong OTP/server proof failure, stale-outfit suppression, mocked SecureStore restore/isolation/removal |
| Expo dependency alignment | Passed |
| Expo Doctor | 21/21 before native generation; after generation 20/21, with only missing CocoaPods reported. This is a local native-tooling gap, not a waived device check |
| Platform bundles | Passed for iOS, Android and web. Hermes bundles about 3.3MB/3.6MB; browser bundle about 1.5MB. These are not installable native binaries |
| Native project generation | `expo prebuild --no-install --platform all` passed. Inspected generated iOS permission strings and Android blocked microphone/location/contact permissions. No native compile, Pods installation, emulator or device launch |
| Browser preview | Actual Expo screens opened in Chrome and Safari. Discover/Wardrobe/Saved/Settings navigation and disconnected states inspected. Safari helper used at 320/390px; tab-label clipping found and corrected. Configured authenticated browser journeys were not tested |
| Root regression checks | Existing `npm test` passed: 4 website/demo + 178 backend tests. Root build and backend typecheck passed. These verify existing code, not mobile native integration |
| Provider/device integrations | Not run: no real SMS, native provider proof, native session refresh, live search, remote save/reload, real image upload, merchant return or cross-device account isolation claim |

Tests use invented data and mock network/native boundaries. A SecureStore mock proves adapter wiring, not iOS Keychain or Android keystore behavior. Photo arithmetic tests do not prove HEIC conversion, EXIF orientation/metadata stripping or device memory use. Browser widths do not prove native keyboards, safe areas, Android back or slow mobile data.

## Environment mapping

| Build | Current mapping |
| --- | --- |
| Development (`in.chauffer.app.dev`) | No cloud development URL supplied. The audit checkout referenced local deployment `local:local-apoorv_khare-chauffeur` at `http://127.0.0.1:3210`; no listener/watcher was running during inspection. No main env file copied. Local use requires deliberate network setup |
| Preview (`in.chauffer.app.preview`) | No agreed staging deployment or EAS project configured |
| Production | Known live Convex origin `https://rare-chameleon-828.convex.cloud`; deliberately rejected by development/preview. Production seller identifiers remain unset. No production mobile requests sent |

Without configuration the app is inspectable but cannot sign in, search or upload. `npm run check:environment` is the read-only first connection check once the backend owner supplies the non-production URL. Do not resolve the missing environment by deploying from this worktree or pointing the test build at production.

## Gaps and decisions, collected together

| Item | What is needed | What can proceed without it |
| --- | --- | --- |
| Development backend | Backend owner supplies/restarts the agreed non-production deployment and confirms integrated functions/provider settings | All implemented screens, tests and bundles |
| First native installation | Test iPhone/Android access; full Xcode/CocoaPods or Android SDK/JDK locally, or configured Expo cloud build/signing | Browser layout and contract checks |
| MSG91 native compatibility | Confirm the existing widget has mobile integration enabled and its native proof works with existing `verifyWidget`; test correct/wrong/expired codes, resend and provider rejection on both OSes | No auth bypass or alternative provider required for screen work |
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

M0 implementation is built; simulator/device acceptance remains open. M1/M2 are implemented against current contracts, with real integration acceptance open. M3 run notes are provided; device rehearsal and installable build evidence remain open.

Next milestone: one installed phone connected to the agreed development backend, completing sign-in → discovery/refinement → save → corrected wardrobe photo.
