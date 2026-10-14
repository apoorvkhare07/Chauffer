import React from 'react';
import {useConvexAuth} from 'convex/react';
import {Asterisk} from 'lucide-react';
import Preferences from './Preferences.jsx';
import SignIn from './SignIn.jsx';
import LiveSearch from './LiveSearch.jsx';
import Onboarding from './Onboarding.jsx';
import VirtualTryOn from './VirtualTryOn.jsx';
import Wardrobe from './Wardrobe.jsx';
import DailyFeed from './DailyFeed.jsx';
import ShoppingLibrary from './ShoppingLibrary.jsx';
import ConversationHistory from './ConversationHistory.jsx';
import FeatureReadiness from './FeatureReadiness.jsx';
import AccountSupport from './AccountSupport.jsx';
export default function Account() {
 const {isLoading,isAuthenticated} = useConvexAuth();
 return <div className="account-shell"><a className="skip-link" href="#account-content">Skip to account</a><header className="account-nav"><a href="/" className="brand" aria-label="Chauffeur home"><Asterisk aria-hidden="true"/><span>chauffeur</span><span className="brand-ai">AI</span></a><a href="/demo/">Try the sample demo</a></header><main id="account-content" className={isAuthenticated?"account-layout account-chat-layout":"account-layout"}>{!isAuthenticated&&<><section className="account-intro"><span className="account-kicker">Your Fashion AI assistant</span><h1>Let’s find your<br/>next outfit.</h1><p>Sign in to discover clothing, style your wardrobe and review your next fashion purchase.</p><div className="account-art" role="img" aria-label="Printed kurta style inspiration"/><p className="account-note">Live fashion searches on Flipkart and Amazon. Clothing for women and men, shoes, accessories and styling for what you own.</p></section></>}<section className="account-card" aria-label="Your account">{isLoading ? <p role="status">Checking your sign-in…</p> : isAuthenticated ? <details className="account-preferences"><summary>Your saved preferences</summary><Preferences/></details> : <SignIn/>}</section>{isAuthenticated&&<><Onboarding/><LiveSearch/><DailyFeed/><Wardrobe/><VirtualTryOn/><ShoppingLibrary/><ConversationHistory/><AccountSupport/><FeatureReadiness/></>}</main></div>;
}
