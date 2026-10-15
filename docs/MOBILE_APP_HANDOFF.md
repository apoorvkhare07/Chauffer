# Chauffeur mobile app: readiness audit and build handoff

Audited: 15 October 2026. Audience: the agent building the iOS/Android app in a separate session, and the agent maintaining the web/shared backend.

Status: planning and source audit only. No mobile project, native build, staging deployment, store enrollment or device test has been created by this audit. The builder approved preparing this handoff and having another session build the mobile foundation in parallel. That is not permission to purchase services, accept store agreements or publish a public mobile release.

## Start here: instruction for the mobile session

> Read this document, the repository AGENTS.md, PRODUCT.md, DESIGN.md, brand/README.md, docs/AGENT_HANDOFF.md and docs/WARDROBE_AGENT_HANDOFF.md. Build the React Native + Expo foundation under mobile/ in your own worktree and branch. Keep Convex as the only database, backend, authentication and storage system; keep the existing website on Convex static hosting. Start with navigation, platform adapters and a real development-backend connection, then prove phone sign-in, one discovery search and wardrobe photo submission. Keep existing backend contracts and the web app working. Do not duplicate the agents, scrapers or database in the mobile client. Do not deploy the shared backend from this worktree or touch another session's unfinished files. Read the milestones and verification gates below; report precisely what ran on simulators and actual devices. If credentials or hardware prevent a check, keep building independent parts and report that specific gap. Do not describe fixtures or Expo Go previews as a verified native integration.

## 1. Product and build decision

Use React Native with Expo and TypeScript for a shared iOS/Android frontend. Use Expo Router for native navigation. Use real development builds for integrations; Expo Go can help with an initial screen sketch but is not the acceptance environment.

Keep the existing Vite website and separate fictional demo intact. Do not turn the website into an embedded browser wrapper or rebuild the marketing website in React Native. No need to move the whole repository into a new workspace system during the foundation work.

V1 has three capabilities: conversational discovery, optional personal styling, and smart wardrobe suggestions. Shopping finishes at merchant destinations. Checkout, price intelligence, reliable WhatsApp/voice channels, real virtual try-on and automatic wardrobe-gap/daily-feed ranking remain outside the mobile V1 cut. Preserve existing experiments on web without exposing them as completed mobile features.

Visual baseline is the current blue/Inter identity, approved bag icon, image-first product cards and simple controls. Brand spelling on the approved logo is `chauffer.`; do not silently rename it. Read current DESIGN.md rather than historical Renaissance/serif trials. Body/photo styling is optional, editable and uncertain; never introduce body scores or fit guarantees.

## 2. Audit evidence and branch baseline

- This audit began from discovery commit `d3f16ed` and fast-forwarded the clean audit worktree to committed main `1db0243`, which includes the shared wardrobe-context integration. No unfinished main-checkout files were copied or changed.
- Source inspected: app bootstrap/navigation, phone sign-in/widget, guest preview, photo conversion, discovery UI helpers, public Convex functions, authentication, account support, wardrobe photo pipeline, shared context and agent handoff documents.
- The prior discovery release recorded 172 passing checks and a production Chrome wardrobe-pairing journey. Those are historical web/backend results, not mobile test evidence. The newer wardrobe integration has its own evidence in TESTING_LEDGER.md. No app tests were rerun for this documentation-only audit.
- Other sessions are actively changing wardrobe/image work. At the start of the mobile session, inspect the latest committed main and working tree again; commit IDs here are an audit baseline, not instructions to discard later fixes.
- Some older README/AGENTS passages describe earlier login/demo/agent states. Current code, PRODUCT.md and the two current agent handoff documents resolve those implementation details. Authentication currently uses MSG91 phone verification with Convex Auth, not the old password-only example.

## 3. Reuse map

| Area | Current source | Mobile action |
| --- | --- | --- |
| Database/authentication/ownership | convex/schema.ts, auth.ts, identity.ts | Reuse the backend. Owner comes from verified authentication, never a client-supplied ID. |
| Conversation/merchant discovery | conversations.ts, conversationCore.ts, discoveryWorkflow.ts, liveDiscovery.ts, ranking.ts | Reuse public conversation functions. Keep model calls, store access, Browserless, ranking and budgets on Convex. |
| Agent contracts | discoveryHandoff.ts, wardrobeHandoff.ts, wardrobeContext.ts; docs/AGENT_HANDOFF.md, docs/WARDROBE_AGENT_HANDOFF.md | Consume versioned results; do not build a second agent harness. Internal functions are not mobile endpoints. |
| Saved products | savedProducts.ts | Reuse owner-bound list/save/remove. Save the actual message ID and product URL, not client-invented product data. |
| Wardrobe, confirmed tags, outfits | wardrobe.ts, wardrobeMetadata.ts, wardrobeContext.ts | Reuse public functions and freshness rules. Clothing guesses remain editable drafts until confirmed. |
| Profile/onboarding | profiles.ts, styling.ts, wardrobeMetadata.ts | Rebuild screens against existing fields; do not add new mandatory onboarding fields. |
| Clothing vocabulary | shared/wardrobeTags.ts | Suitable for direct reuse after Metro/type checks. Avoid maintaining another clothing/category dictionary. |
| Discovery view helpers | app/discoveryView.js, convex/fashionRules.ts | Pure logic is a reuse candidate. Check dependency imports before sharing; extract into shared/ only as a coordinated small change. |
| Web screens | app/*.jsx and CSS | Rebuild using native views, lists, inputs and navigation. JSX, HTML forms and CSS are not portable native screens. |
| App entry/navigation | app/main.jsx, Account.jsx | New native provider bootstrap, safe areas, tabs/stacks and keyboard handling. No react-dom or hash routing. |
| Phone verification | SignIn.jsx, otpWidget.js, convex/otp.ts, auth.ts | Browser widget must be replaced/adapted with a supported native integration; preserve server verification and account identity. |
| Photos | photoUpload.js, usePhotoPreview.js | New native camera/library, orientation, resizing/JPEG conversion and temporary-file cleanup. No browser canvas/Image/FileReader dependency. |
| Media, exports, dialogs | ShoppingInput.jsx, AccountSupport.jsx and related web controls | Native adapters for files, share/download, consent and confirmation. Voice is deferred from foundation. |
| Analytics | analytics.js, convex/analytics.ts | Web PostHog client is browser-only. Start with a no-op native adapter; add native instrumentation deliberately with the same privacy/event rules. Never send chat text, phone numbers, photos, wardrobe payloads or freshness keys. |
| Brand | brand/README.md, public/brand/, public/fonts/ | Reuse licensed assets and approved colours; adapt SVG/font loading for native. Respect reduced motion and Hindi text. |

Do not import Node-only actions, schema modules, server helpers or secret-bearing code into the mobile bundle. Import generated public API references from convex/_generated/api and generated types as type-only imports. Verify Metro resolves the parent repository files and one compatible React installation. Do not copy generated API files into a second manually maintained set.

## 4. Exact integration boundaries to preserve

### Phone sign-in is the first integration risk

The current browser flow loads a script, renders CAPTCHA in the DOM and uses window.sendOtp/verifyOtp. Those are unavailable in native views.

Existing backend sequence to inspect and preserve:

1. `otp.beginWidget({phone})` reserves a server challenge and returns public provider configuration.
2. Provider send/verification produces the request ID/access token; `otp.widgetSent({id,requestId})` records the sent attempt.
3. `otp.verifyWidget({id,token})` verifies provider proof on the server and returns a short-lived single-use secret.
4. `signIn('msg91', {challenge,secret})` consumes that proof through Convex Auth and resolves the same verified-phone account.

Do not mark a phone verified because the native SDK displays success. Never add a universal test OTP, hardcoded user, authentication bypass or client-side owner switch. Native SDK access-token format and anti-abuse/CAPTCHA support must be proven against these functions. If an additive backend adapter is necessary, specify its request/response and tests to the backend owner before changing shared authentication. Do not rerun auth initialization or replace the provider.

Store native authentication tokens with the SecureStore adapter documented by Convex Auth; verify restoration, refresh and sign-out on both platforms. Do not put tokens in plain persistent storage. Website and phone use separate device sessions belonging to the same account, not copied browser credentials.

### Discovery, chat scope and concurrency

- `conversations.current({})` is the reactive current state: requirements, pending state/phase, discovery goal/question and messages with optional result/handoff.
- `conversations.post({text,newSearch?,rejectUrl?,reference?})` starts or refines a turn. Text is bounded to 1,000 characters. Reference is `{messageId,url}` from this conversation.
- `conversations.cancel({})` invalidates the active turn; `conversations.history({session?})` reads bounded past sessions.
- Render selectable question choices from the returned discoveryQuestion, use their explicit answer text, preserve editable input, and do not invent selected preferences. Render old rows without a handoff gracefully.
- Submit once and subscribe to progress. On reconnect/background return, read state before retrying. Do not repeat a paid search just because a local timer expired or the app reopened.
- Important existing constraint: current conversation identity is `web:${owner}`. A native client calling these APIs will share that same active chat with web. The name is historical; do not rename it or create another backend namespace in the mobile session. Searches, reset and cancellation can affect the other device; honor pending state and server rejection. Independent simultaneous conversations are a later coordinated backend feature.
- Only explicit shortlist acceptance sets satisfied. Saves/taps are not success. Pairings are advisory; stale wardrobe/style results must not keep showing old matches. Merchant source, observed price, unknown size stock/fit and unavailable stores stay honest.

### Guest entry and onboarding

`guestSearch.start({token,text})` and `guestSearch.current({token})` provide one guest preview. Native secure random token generation/persistence replaces localStorage; do not put the guest capability in analytics. Quota is per capability/browser equivalent, not per verified human; do not claim reinstall-proof identity enforcement.

Retain the shopper's request through sign-in and setup. Current required setup is name, age, gender choice and preferred styles; photos and wardrobe are optional. Use styling.get/saveSetup/markOnboarding and existing preference validators rather than a divergent native profile schema. Do not migrate guest results into a signed-in account by bypassing source/owner checks.

### Wardrobe/photos/styling

- `wardrobe.list/add/updateDetails/setAvailable/remove/latest/request/wear` are public owner-bound functions. Read their current argument types; newer outfit requests accept optional event time zone/date/period/setting. `wardrobeContext.get` supplies saved confirmed context; location/weather is optional and must work when unavailable.
- Current clothing-photo analysis accepts `wardrobePhoto.analyse({jpegBase64})`, returning `{id,analysis}`. The reviewed draft is saved with `wardrobeMetadata.confirm({id,details})`.
- Manual photo-backed entry also exists: `wardrobePhoto.add({details,jpegBase64})`. Do not implement a direct-storage upload protocol and assume these endpoints accept it.
- Existing server image limit: valid JPEG bytes, at most 700,000 decoded bytes and 930,000 base64 characters. The web accepts source photos up to 12 MB and converts them before submission, targeting longest side 1,000px. Native code must orient/resize/compress before using the existing API, including real iPhone HEIC input. Strip unnecessary metadata and clean temporary files. A library selection URI is not itself a JPEG payload.
- Show explicit AI/photo sharing information and consent before analysis; preserve correction, manual entry and uncertain/unknown attributes. Permission to access the photo library does not equal consent to send a photo to Gemini.
- Wardrobe image cleaning is separate from original photos; respect returned state and preserve original access. Its provider quota/fidelity is not verified by this audit. Do not make generated imagery necessary for the base wardrobe flow.
- No new location permission in foundation. Allow typed weather in the request. Any later device-location integration must preserve optional consent and not place coordinates in telemetry.

### Saved products and merchant links

Use `savedProducts.list/save/remove`; save requires `{messageId,url}` and remove requires the saved record ID. Open trusted merchant destinations with native link handling/system browser; verify return-to-app. A store may open its own installed app, but do not promise this for every URL. Do not embed merchant checkout, collect payment credentials or describe a link opening as an order.

## 5. Parallel work: shared backend first, screens in parallel

We are not adopting a permanent “finish web, then port everything” sequence. Establish one shared behavior/contract, then implement the two interfaces independently. Web can often be the fastest place to try a new conversation idea; phone-specific behavior should be developed on phones from the start.

| Owner/session | Owns | Avoids |
| --- | --- | --- |
| Web/backend session | Shared Convex functions/schema, agents, store retrieval, ownership/consent/quotas, API changes, web UI and backend deployment | Native screens/build configuration |
| Mobile session | mobile/ frontend, navigation, secure local session adapter, native media/link adapters, mobile tests/builds and setup notes | Changing shared auth/schema/handoffs or production backend independently |
| Joint release work | Contract changes, account deletion, cross-device behavior, environment mapping, store submission and review | Publishing from an unfinished checkout or changing both clients' required fields without coordination |

For every feature: backend owner describes arguments, output, states/errors, privacy scope and compatibility; mobile can build against clearly labelled fixtures while that contract is implemented; both clients connect to the real staging backend before declaring the feature complete. Fixtures live in test/dev-only code and are excluded from production paths.

Prefer additive optional fields and preserve old callers. Installed apps can remain on an older version while the website updates immediately. Versioned agent packets alone do not version every public API; any breaking argument/return change needs a separate migration/release plan. Keep a brief API change note and list the tested client/build versions.

Only the backend owner runs the shared deployment/watch process. Two Convex watchers from different checkouts targeting one deployment can overwrite each other's functions. One local watcher already existed during the previous work; inspect processes before starting another. Shared development deploys must come from an agreed integrated commit.

## 6. Repository and worktree layout

Same GitHub repository, separate worktree/branch for the mobile session. Proposed paths:

- Audit checkout: /Users/apoorvkhare/build-sprint-app/worktree2
- Main web checkout: /Users/apoorvkhare/build-sprint-app/chauffeur
- New mobile checkout: /Users/apoorvkhare/build-sprint-app/chauffeur-mobile
- Inside that mobile checkout: mobile/ holds the new frontend; convex/ and shared/ remain the same repository sources.

From a clean repository, inspect `git status`, `git worktree list` and the newest committed main, then create a new `mobile-foundation` branch/worktree if those names/paths are free. Use the latest integrated main containing this handoff; if it is only on agent-mds, merge that documentation commit into the chosen committed base first. Never reset the dirty main checkout, copy its uncommitted files or duplicate the full app as an unrelated Git repository.

Use mobile/package.json and its own lock file initially. Do not convert root package.json to workspaces or change web dependency versions as part of scaffolding. Choose an Expo-supported React/React Native combination when building; the website's current React version is not a native compatibility guarantee. Use Expo's dependency checks/install commands inside mobile/. Configure Metro for shared repository imports using the selected Expo version's current documentation; verify rather than assume nested-package resolution works.

Do not auto-push mobile work to main, deploy the backend or submit stores during foundation work. Push the feature branch and provide exact integration instructions. Do not touch the sibling Saathi app or unrelated exports/scripts in the main checkout.

## 7. Environments and secrets

These are proposed mappings, not existing configured environments. Creating/mapping them is part of the coordinated setup; don't assume an unused Convex deployment is available.

| Environment | Mobile build | Convex/data | Provider use |
| --- | --- | --- | --- |
| Development | Named Chauffer Dev; simulator or installed development client | Agreed non-production development deployment; invented users/wardrobes | Mocked integration tests; deliberate bounded real Gemini/store/SMS checks |
| Staging | Named Chauffer Preview; private device/TestFlight/Play testing | Separate approved non-production deployment with seeded disposable data | Real integrations with known quotas; no copied private production photos/chats |
| Production | Store app with final identity | Existing live Convex production backend; same real users as web | Production secrets only on Convex; release gate required |

- Public mobile config includes `EXPO_PUBLIC_CONVEX_URL` and an explicit environment label. It is bundled into the app. Never include Gemini, Browserless, MSG91 server keys, Convex deploy/admin keys, JWT private keys or store-signing secrets in EXPO_PUBLIC variables or Git.
- Configure EAS build profiles and environment variables explicitly; a preview build profile does not prove it points at staging. Fail clearly when the backend URL is missing; do not fall back to production.
- Dev/preview/prod have separate native identifiers and secure-storage namespaces so installations and accounts don't overwrite each other locally. Final production identifiers and seller identity require builder input before store registration.
- Do not copy .env.local from the main checkout. Obtain approved deployment addresses and server-side secret configuration through the existing setup process without printing values. Public provider widget config should be fetched through existing backend functions.
- The website's `VITE_CONVEX_URL` is not automatically available to Expo. Native uses its own configuration.
- A phone's 127.0.0.1 is the phone, not this Mac. Prefer the agreed cloud development Convex backend for real-device checks; a local backend requires deliberate reachable-network configuration. Metro's connection is separate from Convex's connection.
- Provider test and production credentials may share an account/bill; verify actual isolation. Do not claim hard global spending limits exist just because per-user throttles exist. No new paid service or notification backend is authorized by this document.

## 8. Mobile foundation milestones and acceptance

### M0 — Safe baseline and skeleton

Record base commit, branch, changed files, selected Expo/native versions and environment URL classification (not secret values). Build native tabs/stacks for Discover, Wardrobe, Saved and Settings; include readable loading/error/empty states. Keep the current blue/Inter identity. Provide mobile/.env.example with public placeholders and setup instructions. Root web scripts/lock file stay intact.

Acceptance: native project type checks, Expo dependency checks pass, both platform bundles compile, at least simulator/emulator navigation works. If a platform/device cannot run, state that gap; bundle compilation is not runtime proof.

### M1 — Real account and one connected search

Prove the native MSG91 verification path, Convex Auth SecureStore session, onboarding and discovery subscriptions. Implement question choices, current requirements, cancel, merchant product cards and saved products. Restore state after closing/reopening the app without automatically resubmitting. Preserve the guest request into login.

Acceptance: real device sign-in where available, successful authenticated search, relevant choice-based refinement, save/reload, sign-out, wrong/expired OTP, denied/failed provider flow and another-account isolation. SMS delivery and platform compatibility must be recorded separately. Do not use the builder's private wardrobe as a write/delete fixture.

### M2 — Wardrobe and styling adapter proof

Build list/manual add/edit/availability; native photo preparation, consent, analysis draft correction and confirmation. Consume existing wardrobe outfit/context and discovery pairing output; honor stale/changed states and optional styling/body input. No native model calls or second retrieval loop.

Acceptance: an invented item persists for the test owner, unavailable pieces are excluded, a real device photo reaches the existing JPEG API within limits, invalid/oversized/rotated input and denied library permission have usable recovery, no image is uploaded without the intended user action/consent. Test “find a new piece for my wardrobe” using confirmed test items.

### M3 — Rehearsal and hand-back

Produce reproducible development build instructions and preview configuration, record what ran, and provide a short video/screenshots if possible. Document API gaps for the backend owner, device/platform coverage and remaining store launch blockers. No public store submission yet.

Acceptance: one full discovery → refinement → save → wardrobe/styling loop on a real iPhone and Android before declaring both platforms verified. Continue work without falsely marking missing hardware/provider checks complete.

## 9. Test matrix and release protection

| Check | Required evidence |
| --- | --- |
| Shared backend | Root npm test, npm run typecheck:backend and npm run build for any shared code changes; existing web flows still work |
| Native logic/UI | Meaningful tests for question choice handling, auth restoration, media limits and pending/error/stale states; native type and Expo checks |
| Native integration | iOS Simulator + Android Emulator and actual device evidence, each named separately |
| Network/lifecycle | Slow/lost connection, background/resume, double send, cancel then late completion, expired auth; no automatic duplicate search or upload |
| Cross-device/account | Same account web/mobile observes one chat; search/reset/cancel behavior is honest. Another account cannot see data. Sign-out clears private local state and pending draft media |
| Phone interaction | Keyboard, scrolling lists, Android back, safe areas, small screens, large text, Hindi/Hinglish, permission denial and merchant return |
| Privacy | No private fixtures in Git; no body photos/phone/chat in logs/analytics; consent visible; no secret in bundled public configuration |
| Upgrade | Older supported mobile build still works after additive backend changes; test old messages lacking new optional fields |
| Beta | Preview points to staging; TestFlight/Play installation, release build startup and reviewer access work without a developer laptop |

Use a development client for native integrations, not just Expo Go. For later beta testing, TestFlight external builds may need review; Google's new-personal-account production access currently requires at least 12 opted-in testers for 14 continuous days, then an application for production access. Account/type rules and SDK submission requirements must be rechecked at actual release time.

Web deployment remains `npm run deploy` to Convex static hosting, by the backend/web release owner. That does not produce an iOS/Android app. Mobile build and submission are separate; installed builds do not update when Git is pushed. Optional over-the-air updates must stay compatible with the installed native runtime and store policy; do not use them to assume native-module changes need no new build.

## 10. Public launch blockers and owner decisions

| Item | Audit finding | Required before launch |
| --- | --- | --- |
| Native phone auth | Browser widget cannot be reused as-is; native integration not tested | Prove compatible SDK/provider proof and real delivery without weakening security |
| Account deletion | AccountSupport explicitly says complete deletion is unavailable; current backend offers partial export and sign-out-everywhere | Backend owner builds comprehensive deletion with file/auth/AI-history cleanup, plus in-app flow and required public request page |
| AI disclosures/reporting | Existing photo consent is a starting point; native implementation and launch-wide coverage not audited | Review privacy/data declarations, Gemini sharing consent, retention, and an in-app AI-content reporting path |
| Reviewer access | Real phone OTP is the normal login; no reviewer flow verified | Legitimate fully functional review access, documented without a universal production auth bypass |
| Developer accounts | Enrollment/payment not checked or performed | Builder chooses individual/company, legal seller identity, final app name/identifiers, signs agreements and pays fees |
| Store listing | No native listing created | Accurate screenshots, icon, support/privacy/deletion URLs, age/content ratings, data/permission/export declarations and signing credentials |
| Merchant content | Browser access does not establish permitted reuse | Check merchant terms/authorization and content rights; don't describe attempts as partnerships |
| Payments | Checkout after V1; subscription pricing undecided | No payment service in foundation. Reassess physical goods vs digital subscription billing when defined |
| Push/location/weather | Optional, not needed for foundation | No automatic new permissions/services. Weather backend exists but live availability/configuration not verified here; native location/push require separate scope/service decisions |
| Image generation | Prior real calls hit quota; newer image work is in another session | Original-photo wardrobe remains usable; do not claim mobile try-on/clean-image fidelity is validated |
| Cost/reliability | Per-user limits are not verified global provider budgets; some merchants remain blocked | Backend owner establishes release cost controls, monitoring and honest fallback states |

Current published registration fees: Apple US$99/year (or local equivalent) and Google Play US$25 once. Expo offers limited free build capacity; provider usage/SMS/Convex/build costs remain separate. This handoff does not purchase accounts or set a spending budget.

## 11. Official references checked

Checked 15 October 2026; recheck relevant SDK versions, fees and policies before implementation/submission. References are documentation, not permission to replace the fixed stack or initialize a second backend.

- [Convex Auth setup, including native SecureStore provider adapter](https://github.com/get-convex/convex-auth/blob/main/docs/pages/setup.mdx)
- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo environment variables](https://docs.expo.dev/eas/environment-variables/)
- [Expo production builds](https://docs.expo.dev/deploy/build-project/)
- [Expo build plans](https://docs.expo.dev/billing/plans/)
- [MSG91 native integration](https://msg91.com/help/sendotp/integrate-otp-widget-into-mobile-application)
- [Apple enrollment](https://developer.apple.com/help/account/membership/program-enrollment/)
- [Apple program fee](https://developer.apple.com/programs/)
- [Apple review guidelines: privacy, AI sharing, reviewer access and third-party content](https://developer.apple.com/app-store/review/guidelines/)
- [Apple account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- [TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)
- [Google Play registration](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en)
- [Google Play personal-account testing](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- [Google account deletion](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)
- [Google AI-content reporting policy](https://support.google.com/googleplay/android-developer/answer/13985936?hl=en)

## 12. What the mobile session must return

1. Branch/base commit, precise changed files and reproducible setup/run/build commands.
2. Environment-to-backend mapping with public addresses only; proof the test app is not silently using production.
3. Working native foundation and real integration evidence, distinguishing simulator, physical device and fixture tests.
4. Any proposed shared API changes as explicit additive contracts for the backend owner, not an independent backend fork.
5. Known blockers, account/service/hardware needs, privacy/review gaps and one next milestone.

The first task is the native foundation and integration proof. Do not wait for every future web feature, and do not expand into checkout, a new agent system, a backend migration or public release.
