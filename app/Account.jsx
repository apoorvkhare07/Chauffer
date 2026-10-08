import React from 'react';
import {useConvexAuth} from 'convex/react';
import {Asterisk} from 'lucide-react';
import Preferences from './Preferences.jsx';
import SignIn from './SignIn.jsx';
import LiveSearch from './LiveSearch.jsx';
export default function Account() {
 const {isLoading,isAuthenticated} = useConvexAuth();
 return <div className="account-shell"><a className="skip-link" href="#account-content">Skip to account</a><header className="account-nav"><a href="/" className="brand" aria-label="Chauffeur home"><Asterisk aria-hidden="true"/><span>chauffeur</span><span className="brand-ai">AI</span></a><a href="/demo/">Try the sample demo</a></header><main id="account-content" className="account-layout"><section className="account-intro"><span className="account-kicker">Your Chauffeur account</span><h1>A little more<br/>your style.</h1><p>Keep your size, language and shopping budget ready for your next visit.</p><div className="account-art" role="img" aria-label="Painterly fashion brand artwork"/><p className="account-note">Sign in to test live Flipkart discovery below. Purchases are not connected; the separate demo uses fictional products.</p></section><section className="account-card" aria-label="Your account">{isLoading ? <p role="status">Checking your sign-in…</p> : isAuthenticated ? <Preferences/> : <SignIn/>}</section>{isAuthenticated&&<LiveSearch/>}</main></div>;
}
