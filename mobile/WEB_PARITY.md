# Web app parity on mobile

Checked 17 October 2026 against the signed-in web app at `/app/` and the shared Convex functions used by each screen. This is an implementation audit, not a claim that every live integration has been exercised on a phone.

## Mobile coverage

The mobile app now has native screens or flows for:

- Phone sign-in, required profile setup, preferences and body context.
- Guest discovery and its one-time clothing-photo and try-on previews.
- Signed-in discovery, follow-up questions, feedback, shortlist acceptance, saved products, daily picks, and request drafts from a typed request, clothing photo, recorded voice or selected audio file.
- Personal stylist, optional styling-photo review, wardrobe suggestions, saved conversations and explicit shopping handoff.
- Wardrobe add/edit/availability/removal, photo analysis and clean display photos; outfit suggestions from confirmed wardrobe items, with optional city weather.
- Saved-product detail, price checks/history, cross-store alternatives, offer evidence, comparisons, wardrobe purchase review, merchant links and removal.
- Settings, plan summary, preference/taste controls, partial account-data export, sign-out on this device and sign-out everywhere.
- Visual try-on for existing wardrobe/product photos, with consent and its limitations stated.

These flows use existing Convex functions and the existing merchant/AI behavior. A screen being present does not establish that a provider, store reader, or production function currently succeeds.

## Known differences and checks still needed

- The app accepts a city for outfit weather; it does not ask for device location. The web can use device location when available.
- Plan comparison opens the web pricing page. Paid upgrades are not connected on either path. Account deletion and AI-content reporting are also not available through the current shared backend.
- Public marketing pages and the fictional `/demo/` are separate web journeys, not native-app features.
- The latest iPhone simulator build installed and launched on the development backend. This is not a physical iPhone test. SMS, production usage, remote account sync, audio recording, file picking and photo upload still need real-device checks.
- Android JavaScript bundles and UI tests pass, but this Mac has no Android SDK/emulator; Android native build and device behavior remain unverified.
- Production app identifiers, Apple/Google signing, store listing/privacy materials, and internal TestFlight/Play testing setup are release work, not parity proof.

## Verification performed

- Mobile TypeScript, lint, 18 core tests and 17 component/adapter tests pass.
- Expo dependency alignment, Expo Doctor (21/21), and web/iOS/Android JavaScript bundles pass. The iOS simulator build installed and rendered the signed-in Discover screen with daily picks.
- The environment check was read-only against development. No production request, SMS, search, or photo/audio upload was sent during these checks.
