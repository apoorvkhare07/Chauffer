# chauffer. mobile

Initial iOS/Android app, following [the mobile handoff](../docs/MOBILE_APP_HANDOFF.md). This is a React Native app with Expo Router, using the existing Convex backend. It is not a wrapper around the website.

**Current state:** screens, platform adapters and contract tests are implemented. An iOS development build is installed and running in the iPhone 18 Pro simulator; one local guest search returned six merchant options. iOS/Android JavaScript bundles compile. Authenticated journeys, physical phones and Android installation still need verification. Read [BUILD_STATUS.md](BUILD_STATUS.md) for evidence, remaining questions and release gates.

## Run locally

Use this feature checkout, not the web session's working directory:

```sh
cd /Users/apoorvkhare/build-sprint-app/chauffeur-mobile
npm ci
cd mobile
npm ci
cp -n .env.example .env
```

The first install supplies shared repository types; the second supplies Expo's independently pinned dependencies. `postinstall` applies the reviewed MSG91 patch in `patches/`.

In the ignored `mobile/.env`, set `EXPO_PUBLIC_APP_ENV=development` and `EXPO_PUBLIC_CONVEX_URL` to the **agreed non-production** Convex `.convex.cloud` address. The backend owner must already have deployed the integrated backend. Do not run a second Convex watcher from this checkout. Do not copy the website's `.env.local`.

```sh
npm run check:environment
npm start
```

The environment check only reads the public guest-state endpoint; it sends no SMS, search or photo. A development build must be installed before scanning the Metro QR code. Metro is Expo's local app-code server. Expo Go does not prove the native MSG91 integration.

Missing configuration shows a clear setup message and disables requests. Development and preview reject the known production backend. Every installation environment has a separate native identifier and secure token namespace. Local addresses require `EXPO_PUBLIC_ALLOW_LOCAL_BACKEND=true`; a real phone needs this Mac's reachable network address, not `127.0.0.1`.

## Existing local browser setup

This Mac now has an ignored development configuration pointing to `http://127.0.0.1:3210`, with explicit local-backend opt-in. The ignored `mobile/.env.local` sets `CHAUFFER_LOCAL_STATE_DIR` to the existing Chauffer local state directory. It contains a path, not copied provider keys.

From `mobile/`, run:

```sh
npm run dev:local
```

Open `http://localhost:8083`. The installed iOS development app can use the same URL in its development-server field. This starts the cached local Convex binary against its existing data/functions and Expo's preview, explicitly bound to IPv4 so the simulator can load its app code. It never deploys source or creates a database. Stop it with Ctrl+C. If that backend is already running with the expected name, the command reuses it.

SMS stays off locally: the builder confirmed MSG91 requires registered IPs. No test-code bypass is provided. A separate active MSG91 widget named `ChaufferIOS` is configured for mobile-number OTP, with SMS as the primary channel, India restriction and CAPTCHA disabled for the native app. The website widget remains unchanged. The native app uses `MSG91_MOBILE_WIDGET_ID` and `MSG91_MOBILE_WIDGET_TOKEN`; set those and the existing server-only `MSG91_AUTHKEY` on an approved non-production Convex deployment. Never put the widget token or auth key in Expo variables or source. The current local backend at `127.0.0.1` cannot use the registered-IP MSG91 setup; do not point the app at production to test. The backend owner must provide and integrate an approved development deployment before phone OTP can be tested. Guest discovery was exercised successfully; signed-in journeys need that configured server. The saved local backend also lacks newer stylist functions and visible-outfit confirmation; the backend owner must deploy an agreed integrated commit before connected testing of those features.

## Install a native development build

On a Mac with full Xcode, iOS Simulator and CocoaPods installed:

```sh
npm run ios
```

Xcode 27 calls its simulator window **Device Hub**. This app enables `ios.enableSceneSupport` through `expo-build-properties`, as required for an Expo 57 app built with Xcode 27. Keep this setting when regenerating native projects; without it the build compiles but iOS 27 stops it at launch. See [Expo's scene support guidance](https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md#staying-on-sdk-57-with-xcode-27).

With the Android SDK/JDK and an emulator or connected test device:

```sh
npm run android
```

For a connected iPhone, use `npx expo run:ios --device` after configuring local signing. These commands generate native projects and compile/install the app. `ios/` and `android/` are generated and ignored; change `app.config.ts` or a config plugin, not their generated files. After native config/dependency changes, regenerate and rebuild.

`eas.json` also defines development, iOS simulator, preview and production profiles for Expo's optional cloud build service. No EAS project, signing account, payment or build was created. Before using it, the builder must choose/link the Expo project and signing accounts, configure each profile's public backend address in its matching EAS environment, and confirm any costs/agreements. Example after that setup: `npx eas-cli@latest build --profile development --platform android`. Preview creates an internal Android APK; iOS distribution needs the appropriate Apple setup. A profile name alone does not establish a staging backend.

Production requires explicit `MOBILE_IOS_IDENTIFIER` and `MOBILE_ANDROID_IDENTIFIER`, the production environment label and URL. Do not build for public release until the handoff's privacy, account deletion, reporting and device checks are complete. Website deployment remains the web owner's `npm run deploy`; it does not build or update a native app.

## Screen preview and checks

```sh
npm run web -- --port 8083 --host localhost
```

Open `http://localhost:8083`. This renders the same screen code, but web token storage is memory-only. Browser phone verification uses the existing web widget, and browser photos use the existing JPEG/HEIC preparation helper. Native SDK, camera and secure-storage behavior still require an installed build. It is not a replacement website or production deployment.

For two browser layouts, start `npm run preview:phone` in another terminal and open `http://localhost:8084/phone-preview.html`. It displays the app at 320 and 390 pixels. The helper is outside app routes and is not bundled.

```sh
npm run typecheck
npm run lint
npm test
npm run check:dependencies
npx expo-doctor
npm run bundle
```

`bundle` exports iOS/Android Hermes bundles (compiled JavaScript) and a browser preview into ignored `dist/`. It does not create an APK/IPA or prove native modules work. `npx expo prebuild --no-install --platform all` checks native project generation without building or installing. CocoaPods is installed on this Mac and Doctor currently passes all 21 checks.

## Code map

| Location | Purpose |
| --- | --- |
| `src/app/(tabs)/` | Discover, Wardrobe, Saved, Settings |
| `src/app/sign-in.tsx`, `preferences.tsx` | Phone proof, required setup, optional body context |
| `src/app/wardrobe-edit.tsx`, `outfits.tsx` | Manual/photo clothing drafts, corrections, outfit suggestions |
| `src/app/history.tsx` | Read-only past chats |
| `src/app/stylist.tsx`, `styling-photo.tsx` | Personal advice/refinement, explicit shopping handoff, optional photo review and separate confirmations |
| `src/providers/Backend.tsx` | Convex Auth, protected screens, setup and connection states |
| `src/platform/` | SecureStore, MSG91, camera/JPEG preparation, merchant browser, no-op analytics |
| `src/core/` | Environment, input/media limits, result freshness and typed contracts |
| `src/components/` | Blue/Inter design, product cards, store coverage and errors |
| `tests/` | Invented fixtures and mocked component/contract tests, excluded from routes |
| `patches/` | Pinned SDK compatibility/privacy patch applied by npm |

The generated API is imported from `../convex/_generated/api`; types are derived from its actual functions. Clothing vocabulary comes from `../shared/wardrobeTags.ts`. Metro pins React, React Native and Convex to the mobile installation when resolving shared imports. No schema, agent, scraper, provider key or copied generated API lives in this client.

## Behavior to preserve

- Native MSG91 proof goes through `otp.beginWidget` → provider send → `otp.widgetSent` → provider verify → `otp.verifyWidget` → Convex Auth `msg91`. Provider success alone cannot sign in. Raw provider errors/tokens are not logged by the patched SDK.
- Native tokens use SecureStore with device-only unlocked access; web preview tokens use memory only. Sign-out clears pending local request/photo data. The guest capability is retained to preserve its one-preview quota. No local analytics payloads are sent.
- Website and phone share the same active conversation. Subscribe to existing state after reopening; never resend automatically. Explicit cancel/reset affects both devices. Choice buttons send the server's exact answer text. Only “These work for me” accepts a shortlist; saves/taps do not.
- Photos are optional. A system-picker selection or camera permission is separate from upload consent. Prepare JPEG locally, target a 1,000px longest edge, enforce 12MB source/700,000 decoded-byte/930,000 base64-character limits, and remove temporary cache copies. HEIC/orientation/metadata behavior still needs real-device verification.
- AI clothing tags remain drafts until the user corrects/confirms them. Manual entry stays available. Original photos remain separate from optional clean images. Stale outfit and pairing results are suppressed. No location permission, body score, fit guarantee or real virtual try-on.
- Open allowlisted HTTPS merchant links in the system browser. Show observed prices and stock/fit uncertainty. No checkout or price-intelligence flow was added.

## SDK patch and upgrades

`@msg91comm/sendotp-react-native` is pinned to 3.1.0. The patch fixes exported TypeScript style/endpoint declarations and the removed `StyleSheet.absoluteFillObject` reference, and removes SDK logs that included request URLs or raw errors. Those URLs can contain provider proof. It changes neither OTP verification nor server authorization. Review/rebase the patch and rerun native auth tests when upgrading; never drop it silently. `test-renderer` is pinned to 1.2.0 because the newer release requires a React reconciler beyond Expo 57's supported React version.

Icons are derived from the approved `public/brand/chauffer-icon.svg`; regenerate with `npm run generate:assets`. Inter is loaded from its licensed font package.

Official implementation references: [Expo 57](https://docs.expo.dev/versions/v57.0.0/), [ImagePicker](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/), [development builds](https://docs.expo.dev/develop/development-builds/introduction/), [Convex Auth setup](https://labs.convex.dev/auth/setup), [MSG91 native integration](https://msg91.com/help/sendotp/integrate-otp-widget-into-mobile-application). Installed package source/types were checked as well.
