import React,{useEffect,useState} from 'react';
import {useConvexAuth,useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
import {Asterisk,MessageCircle,Shirt,Heart,Sparkles,ScanFace,Settings,History} from 'lucide-react';
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
const pages=[['chat','Chat',MessageCircle],['daily','Daily picks',Sparkles],['wardrobe','Wardrobe',Shirt],['saved','Saved items',Heart],['try-on','Try-on',ScanFace],['history','Past chats',History],['settings','Settings',Settings]];
function pageFromUrl(){const page=window.location.hash.replace('#/','');return pages.some(([id])=>id===page)||page==='setup'?page:'chat';}
function SignedIn(){
 const setup=useQuery(api.styling.get);
 const [page,setPage]=useState(pageFromUrl);
 useEffect(()=>{const change=()=>{setPage(pageFromUrl());window.scrollTo(0,0);};window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
 function go(next){window.location.hash=`/${next}`;setPage(next);}
 if(!setup)return <main id="account-content"><p role="status">Loading your account…</p></main>;
 const onboarding=setup.onboarding==='active'||page==='setup';
 if(onboarding)return <main id="account-content" className="setup-page"><p className="account-kicker">Welcome to your fashion assistant</p><Onboarding forceOpen onDone={()=>go('chat')} onWardrobe={()=>go('wardrobe')}/><p className="account-note">Photos and wardrobe setup are optional. You can return to these from Settings.</p></main>;
 return <div className="app-workspace"><nav className="app-menu" aria-label="Your assistant">{pages.map(([id,label,Icon])=><a href={`#/${id}`} key={id} aria-current={page===id?'page':undefined}><Icon size={19}/><span>{label}</span></a>)}</nav><main id="account-content" className="app-page" tabIndex={-1}>
 <div hidden={page!=='chat'}><LiveSearch/></div>
 {page==='daily'&&<DailyFeed/>}{page==='wardrobe'&&<Wardrobe/>}{page==='saved'&&<ShoppingLibrary/>}{page==='try-on'&&<VirtualTryOn/>}
 {page==='history'&&<section className="account-card"><h1>Past chats</h1><p className="account-note">Revisit previous searches. Your current conversation is in Chat.</p><ConversationHistory/></section>}
 {page==='settings'&&<><section className="account-card"><h1>Settings</h1><p className="account-note">Manage your style, account and privacy.</p><a className="chat-chip" href="#/setup">Edit styling setup</a><Preferences/></section><AccountSupport/><FeatureReadiness/></>}
 </main></div>;
}
export default function Account(){
 const {isLoading,isAuthenticated}=useConvexAuth();
 return <div className={`account-shell ${isAuthenticated?'signed-in-shell':''}`}><a className="skip-link" href="#account-content">Skip to content</a><header className="account-nav"><a href="/" className="brand" aria-label="Chauffeur home"><Asterisk aria-hidden="true"/><span>chauffeur</span><span className="brand-ai">AI</span></a><span className="account-note">Your Fashion AI assistant</span></header>{isLoading?<main id="account-content"><p role="status">Checking your sign-in…</p></main>:isAuthenticated?<SignedIn/>:<main id="account-content" className="account-layout"><section className="account-intro"><span className="account-kicker">Your Fashion AI assistant</span><h1>Let’s find your<br/>next outfit.</h1><p>Find a new look, style what you own, and keep your favourites together.</p><div className="account-art" role="img" aria-label="Printed kurta style inspiration"/><p className="account-note">Live fashion searches on Flipkart and Amazon. Clothing for women and men, shoes, accessories and styling for what you own.</p></section><section className="account-card" aria-label="Your account"><SignIn/></section></main>}</div>;
}
