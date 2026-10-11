import React from 'react';
export default function FeatureReadiness(){
 return <details className="shopping-library readiness-panel"><summary>What’s connected and what’s next</summary><p className="account-note">Live discovery, saved preferences and your shortlist work on the web. The steps below need store or account connections before they can work.</p><dl>
 <dt>Same-item price comparison</dt><dd>Comparison rules are prepared. Matching the manufacturer’s product code, exact size/colour, stock, shipping, seller and return conditions still needs store evidence.</dd>
 <dt>Offers</dt><dd>Calculation rules are prepared for minimum spend, caps, expiry, bank eligibility and cashback. Live offer terms and checkout confirmation are not connected. No discounts are applied.</dd>
 <dt>WhatsApp</dt><dd>Conversation and product-preview handling are prepared. Connecting the test number, checking real delivery and securely linking it to your web account remain pending.</dd>
 <dt>Buy with Chauffeur</dt><dd>Not connected. Merchant login → exact variant → cart → address → fresh total and returns → your approval → payment handoff → order confirmation all need a tested browser connection. No order is placed here.</dd>
 <dt>Order tracking and returns</dt><dd>Not connected. Requires verified order receipts and store access.</dd>
 <dt>Voice and photo requests</dt><dd>Not connected. Text requests work now.</dd>
 <dt>Email recovery and account removal</dt><dd>Recovery needs an approved email delivery connection. Complete account removal needs verified cleanup of chats, saved items, sign-in records and AI history. Both remain unavailable; signing out does not delete your account.</dd>
 </dl></details>;
}
