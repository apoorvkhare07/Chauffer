# Affiliate redirects

Implemented 20 October 2026. No production settings or provider credentials were changed.

## Request flow

1. Web links and mobile merchant buttons request `affiliate.link` with a stored-product reference and a fixed source label.
2. The query checks signed-in ownership of the message, saved product, daily feed or comparison report. Guest results require the existing guest secret. The requested product must occur in that record. URLs and store names are checked against `storeConfig.ts`, including its exact host and product-path rules.
3. The server signs a 24-hour capability containing the verified product URL, store and source. It contains no owner ID, guest secret, chat text or body/style information. `/go` accepts exactly one `token` parameter, verifies its signature/expiry and validates the destination again. Arbitrary URL parameters and invalid tokens get HTTP 400.
4. The store rule selects Amazon tagging, Cuelinks or plain. A store with `deepLinkAllowed:false` always uses plain; The Souled Store is configured this way. Store rules do not affect search retrieval or product ranking.
5. The server writes `affiliateClicks`, then sends a 302 redirect with `Cache-Control: no-store` and `Referrer-Policy: no-referrer`. Logging failure falls back to the original URL rather than blocking shopping or sending an unrecorded affiliate click.

Signed URLs are bearer links: anyone with a valid link can open its already-authorized product until expiry. This does not reveal the original shopper's identity. Reload Chauffeur to obtain a fresh link after expiry. Native merchant opening permits only its own configured Convex deployment's `/go` path, plus existing trusted merchant URLs.

## Server settings

| Variable | Behaviour |
|---|---|
| `AFFILIATE_REDIRECT_SECRET` | Required for signing; use a high-entropy random secret of at least 32 characters, server-only. No default key. |
| `CONVEX_SITE_URL` | Convex's supplied HTTP-action origin; not a browser-provided redirect base. |
| `AMAZON_ASSOCIATE_TAG` | Optional Associates tag. Only Amazon uses it. Missing or invalid tags preserve the original product URL. |
| `CUELINKS_ENABLED` | Off unless exactly `true`. Amazon does not depend on this. |
| `CUELINKS_API_KEY` | Server-only key with `write:links`; used only when Cuelinks is enabled. |

Without signing setup, the owner-checked query returns the verified plain store URL. While the link query is loading, the UI also retains a trusted original product link. Rejected references are disabled. Those direct fallback clicks do not reach `/go` and cannot be recorded there. With signing configured but no affiliate credentials, `/go` records `plain` clicks normally. Removing the signing secret also invalidates existing signed links; disabling just a provider preserves plain redirects.

The commission disclosure appears beside shopping surfaces when signing and at least one provider are configured. The Amazon Associate disclosure is included when its tag is configured. No provider approval or commission eligibility is claimed by this implementation.

## Cuelinks verification

Checked the official [Convert URL API](https://developers.cuelinks.com/docs/reference/links/convert) and [access tiers](https://developers.cuelinks.com/#access) on 20 October 2026:

- POST `https://developers.cuelinks.com/pub_api/v3/links/convert`, `Authorization: Token <key>`, JSON body `{url, subid: source, shorten: false}`. This endpoint requires `write:links`.
- Consume `data.tracking_url` only when `data.affiliated === true` and `data.original_url` equals the requested product URL. Inactive/unapproved campaigns can still return a tracking URL; those fall back to plain.
- Starter advertises only `read:campaigns`. Publisher Plus advertises full read/write API access on revenue-share terms with **no platform fee**. Thus conversion is not included in the advertised read-only Starter scope, but the site does not describe it as requiring a fixed paid subscription. Confirm the account's granted scope and merchant permissions before enabling.
- Conversion uses a 2.5-second timeout, zero retries, a 32 KiB response cap and no HTTP-followed redirects. Only the documented `https://linksredirect.com/` long-link host is accepted, with the same embedded product URL and source sub-ID. Other tracking hosts fail closed to the original product URL.
- Cache by product URL **and source**, with a key fingerprint to invalidate conversions when account credentials change. Successful conversions last 24 hours; inactive campaigns 5 minutes; failures 1 minute. A 10-second cache lease prevents duplicate concurrent conversions. A click during conversion uses plain.

These are code/mocked-response checks, not a real Cuelinks account or live commission test. Per-store `deepLinkAllowed` rules must reflect the approved campaign's terms before that provider is enabled; a configured reader alone is not evidence of affiliate permission.

## Stored data and coverage

`affiliateClicks`: `createdAt`, `store`, `productUrl`, actual `linkType`, fixed `source`; optional `owner` and `campaign` columns reserved. This implementation leaves those optional columns empty. Indexes: `by_createdAt`, `by_store`. No IP, user-agent, referrer, contact information, chat text or photos are recorded. Conversion cache stores product/source, tracking URL, expiry/lease and a one-way credential fingerprint, never the API key.

Web: search cards/dialogs, guest results, saved products, wardrobe-review exit, comparison alternatives, historical results, daily picks and unavailable-photo links. Mobile: guest/search/saved/daily cards, saved comparison exit and wardrobe-review exit. Offer-terms, editorial and store-search fallback links remain plain.

## Validation

- Backend type check and production frontend build passed.
- Full root suite passed with `PLAN_LIMITS_ENABLED=true` in the **test process only**: 243 Vitest tests plus the existing Node tests. This enables six older allowance tests that still assume plan limits; no production environment change was made.
- New tests cover ownership/membership, guest secrets, tampering, expiry, host spoofing, plain/Amazon redirects, click fields, Cuelinks fields/scope fallback, response failures, cache expiry, source isolation, credential changes and concurrent reservations; web component tests check new tabs, preview fallback and disclosure.
- Mobile type check passed; 20 core tests and 18 UI tests passed, including redirect-host restrictions.
- Browser checked actual shared web components at 390px in an isolated local preview with mocked query responses. Verified `/go` hrefs, `target="_blank"`, `rel="noopener noreferrer"`, disclosure and no horizontal overflow. HTTP redirects/click writes were tested with the local Convex test harness. No deployed end-to-end or real-device affiliate purchase was performed.

## Commit scope

The affiliate commit excludes pre-existing uncommitted work. Mobile daily-pick and expanded saved-detail connections depend on those uncommitted screens and remain in the working tree. The shared merchant button and existing search/saved-card connections are committed. The isolated staged tree passed its frontend build, backend/mobile type checks and 232 Vitest tests plus Node tests; the full release tree passed 243 Vitest tests plus Node tests. Web/backend deployment uses the full current working tree; it does not publish a native app binary.
