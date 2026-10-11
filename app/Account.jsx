import React from 'react';
import {useConvexAuth} from 'convex/react';
import {Asterisk} from 'lucide-react';
import Preferences from './Preferences.jsx';
import SignIn from './SignIn.jsx';
import LiveSearch from './LiveSearch.jsx';
import ShoppingLibrary from './ShoppingLibrary.jsx';
import ConversationHistory from './ConversationHistory.jsx';
import FeatureReadiness from './FeatureReadiness.jsx';
export default function Account() {
 const {isLoading,isAuthenticated} = useConvexAuth();
 return <div className="account-shell"><a className="skip-link" href="#account-content">Skip to account</a><header className="account-nav"><a href="/" className="brand" aria-label="Chauffeur home"><Asterisk aria-hidden="true"/><span>chauffeur</span><span className="brand-ai">AI</span></a><a href="/demo/">Try the sample demo</a></header><main id="account-content" className={isAuthenticated?"account-layout account-chat-layout":"account-layout"}>{!isAuthenticated&&<><section className="account-intro"><span className="account-kicker">Your shopping assistant</span><h1>Let’s find your<br/>next outfit.</h1><p>Sign in to chat with Chauffeur, search for clothes and keep your size and budget ready.</p><div className="account-art" role="img" aria-label="Printed kurta style inspiration"/><p className="account-note">Discover clothing on Flipkart and Amazon. Refine the picks in chat, then buy directly on the store.</p></section></>}<section className="account-card" aria-label="Your account">{isLoading ? <p role="status">Checking your sign-in…</p> : isAuthenticated ? <details className="account-preferences"><summary>Your saved preferences</summary><Preferences/></details> : <SignIn/>}</section>{isAuthenticated&&<><LiveSearch/><ShoppingLibrary/><ConversationHistory/><FeatureReadiness/></>}</main></div>;
}
