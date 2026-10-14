import React,{useEffect,useState} from 'react';
import {useConvexAuth,useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
import {Asterisk,MessageCircle,Shirt,Heart,Sparkles,ScanFace,Settings,History,MoreHorizontal,ArrowUpRight,House} from 'lucide-react';
import PersonalHome from './PersonalHome.jsx';
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
const pages=[['home','For you',House],['chat','Chat',MessageCircle],['daily','Daily picks',Sparkles],['wardrobe','Wardrobe',Shirt],['saved','Saved items',Heart],['try-on','Try-on',ScanFace],['history','Past chats',History],['settings','Settings',Settings]];
function pageFromUrl(){const page=window.location.hash.replace('#/','');return pages.some(([id])=>id===page)||page==='setup'||page==='more'?page:new URLSearchParams(window.location.search).has('q')?'chat':'home';}
function SignedIn(){
 const setup=useQuery(api.styling.get);
 const [page,setPage]=useState(pageFromUrl);
 const [request,setRequest]=useState(null);
 function ask(text){setRequest({text,id:Date.now()});go('chat');}
 useEffect(()=>{const change=()=>{setPage(pageFromUrl());window.scrollTo(0,0);};window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
 function go(next){window.location.hash=`/${next}`;setPage(next);}
 if(!setup)return <main id="account-content"><p role="status">Loading your account…</p></main>;
 const onboarding=setup.onboarding==='active'||page==='setup';
 if(onboarding)return <main id="account-content" className="setup-page"><p className="account-kicker">Welcome to your fashion assistant</p><Onboarding forceOpen onDone={()=>go(new URLSearchParams(window.location.search).get('q')?.trim()?'chat':'home')} onWardrobe={()=>go('wardrobe')}/><p className="account-note">Photos and wardrobe setup are optional. You can return to these from Settings.</p></main>;
 return <div className={`app-workspace ${page==='chat'?'chat-workspace':''}`}><nav className="app-menu" aria-label="Your assistant">{pages.map(([id,label,Icon])=><a href={`#/${id}`} key={id} aria-current={page===id?'page':undefined}><Icon size={19}/><span>{label}</span></a>)}</nav><nav className="phone-menu" aria-label="Main navigation">{[...pages.filter(([id])=>['home','chat','wardrobe','saved'].includes(id)),['more','More',MoreHorizontal]].map(([id,label,Icon])=><a href={`#/${id}`} key={id} aria-current={(page===id||(id==='more'&&['daily','try-on','history','settings'].includes(page)))?'page':undefined}><Icon size={21}/><span>{label}</span></a>)}</nav><main id="account-content" className="app-page" tabIndex={-1}>
 <div hidden={page!=='chat'}><LiveSearch active={page==='chat'} incomingRequest={request}/></div>
 {page==='home'&&<PersonalHome onAsk={ask}/>}
 {page==='more'&&<section className="account-card more-page"><h1>Your assistant</h1><p className="account-note">Your style tools and account, in one place.</p>{pages.filter(([id])=>['daily','try-on','history','settings'].includes(id)).map(([id,label,Icon])=><a href={`#/${id}`} key={id}><Icon size={22}/><span>{label}</span><ArrowUpRight size={18}/></a>)}</section>}
 {page==='daily' &&<DailyFeed/>}{page==='wardrobe'&&<Wardrobe/>}{page==='saved'&&<ShoppingLibrary/>}{page==='try-on'&&<VirtualTryOn/>}
 {page==='history'&&<section className="account-card"><h1>Past chats</h1><p className="account-note">Revisit previous searches. Your current conversation is in Chat.</p><ConversationHistory/></section>}
 {page==='settings'&&<><section className="account-card"><h1>Settings</h1><p className="account-note">Manage your style, account and privacy.</p><a className="chat-chip" href="#/setup">Edit styling setup</a><Preferences/></section><AccountSupport/><FeatureReadiness/></>}
 </main></div>;
}
export default function Account(){
 const {isLoading,isAuthenticated}=useConvexAuth();
 useEffect(()=>{const viewport=window.visualViewport;const update=()=>{document.documentElement.style.setProperty('--app-height',`${viewport?.height??window.innerHeight}px`);document.documentElement.classList.toggle('keyboard-open',Boolean(viewport&&window.innerHeight-viewport.height>120));};update();viewport?.addEventListener('resize',update);window.addEventListener('resize',update);return()=>{viewport?.removeEventListener('resize',update);window.removeEventListener('resize',update);document.documentElement.style.removeProperty('--app-height');document.documentElement.classList.remove('keyboard-open');};},[]);
 return <div className={`account-shell ${isAuthenticated?'signed-in-shell':''}`}><a className="skip-link" href="#account-content">Skip to content</a><header className="account-nav"><a href="/" className="brand" aria-label="Chauffeur home"><Asterisk aria-hidden="true"/><span>chauffeur</span><span className="brand-ai">AI</span></a><span className="account-note">Your Fashion AI assistant</span></header>{isLoading?<main id="account-content"><p role="status">Checking your sign-in…</p></main>:isAuthenticated?<SignedIn/>:<main id="account-content" className="account-layout"><section className="account-intro"><span className="account-kicker">Your Fashion AI assistant</span><h1>Let’s find your<br/>next outfit.</h1><p>Find a new look, style what you own, and keep your favourites together.</p><div className="account-art" role="img" aria-label="Printed kurta style inspiration"/><p className="account-note">Live fashion searches on Flipkart and Amazon. Clothing for women and men, shoes, accessories and styling for what you own.</p></section><section className="account-card" aria-label="Your account"><SignIn/></section></main>}</div>;
}
