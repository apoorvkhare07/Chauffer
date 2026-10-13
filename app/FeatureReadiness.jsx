import React from 'react';
export default function FeatureReadiness(){
 return <details className="shopping-library readiness-panel"><summary>What’s connected and what’s next</summary><p className="account-note">Live discovery, saved preferences and your shortlist work on the web. The steps below need store or account connections before they can work.</p><dl>
 <dt>Same-item price comparison</dt><dd>Saved items can be checked against fresh pages and other-store candidates. Manufacturer identity matches are distinguished from alternatives; size-specific stock, shipping and delivered totals still need store evidence.</dd>
 <dt>Offers</dt><dd>Price checks collect readable advertised terms and separate cashback from immediate discounts. Full terms, expiry, account eligibility and checkout confirmation remain pending. No discounts are applied.</dd>
 <dt>WhatsApp</dt><dd>Conversation and product-preview handling are prepared. Connecting the test number, checking real delivery and securely linking it to your web account remain pending.</dd>
 <dt>Buy with Chauffeur</dt><dd>Not connected. Merchant login → exact variant → cart → address → fresh total and returns → your approval → payment handoff → order confirmation all need a tested browser connection. No order is placed here.</dd>
 <dt>Order tracking and returns</dt><dd>Not connected. Requires verified order receipts and store access.</dd>
 <dt>Personal styling and virtual try-on</dt><dd>Photo onboarding and editable proportion suggestions are live. The one-piece visual preview flow is built; a real generation test hit the image provider’s quota. AI previews are illustrations; size and fit are not verified.</dd>
 <dt>Voice and photo-based shopping search</dt><dd>Photo and voice inputs create editable shopping drafts in chat with consent. Similar-style search is available after you review/send the draft. Voice recording and recognition still need real-device tests.</dd>
 <dt>Email recovery and account removal</dt><dd>Shopping data downloads and sign-out on all devices are available. Recovery needs email delivery; complete removal needs verified cleanup of chats, images, sign-in records and AI history. Recovery and removal remain unavailable.</dd>
 </dl></details>;
}
