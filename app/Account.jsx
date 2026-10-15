import {analyticsIdentity} from '../analytics';
import GuestSearch from './GuestSearch.jsx';
import Brand from '../Brand.jsx';
import React,{useEffect,useState} from 'react';
import {useConvexAuth,useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
import {Asterisk,MessageCircle,Shirt,Heart,Sparkles,ScanFace,Settings,History,MoreHorizontal,ArrowUpRight,House} from 'lucide-react';
import FashionLoader from '../FashionLoader.jsx';
import Preferences from './Preferences.jsx';
import LiveSearch from './LiveSearch.jsx';
import Onboarding from './Onboarding.jsx';
import Stylist from './Stylist.jsx';
import VirtualTryOn from './VirtualTryOn.jsx';
import Wardrobe from './Wardrobe.jsx';
import DailyFeed from './DailyFeed.jsx';
import ShoppingLibrary from './ShoppingLibrary.jsx';
import ConversationHistory from './ConversationHistory.jsx';
import FeatureReadiness from './FeatureReadiness.jsx';
import AccountSupport from './AccountSupport.jsx';
const pages=[['home','For you',House],['daily','Daily picks',Sparkles],['wardrobe','Wardrobe',Shirt],['saved','Saved items',Heart],['stylist','Stylist',Sparkles],['try-on','Try-on',ScanFace],['history','Past chats',History],['settings','Settings',Settings]];
function pageFromUrl(){const raw=window.location.hash.replace('#/','');const page=raw==='chat'?'search':raw;return pages.some(([id])=>id===page)||page==='search'||page==='setup'||page==='more'?page:new URLSearchParams(window.location.search).has('q')?'search':'home';}
function SignedIn({setup}){
 const [page,setPage]=useState(pageFromUrl);
 useEffect(()=>{const change=()=>{setPage(pageFromUrl());window.scrollTo(0,0);};window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
 function go(next){if(next==='chat')next='search';window.location.hash=`/${next}`;setPage(next);}
 const onboarding=!setup.requiredComplete||setup.onboarding==='active'||page==='setup';
 if(onboarding)return <main id="account-content" className="setup-page"><p className="account-kicker">Welcome to your fashion assistant</p><Onboarding forceOpen onDone={()=>go(new URLSearchParams(window.location.search).get('q')?.trim()?'chat':'home')} onWardrobe={()=>go('wardrobe')}/><p className="account-note">Photos and wardrobe setup are optional. You can return to these from Settings.</p></main>;
 return <div className={`app-workspace ${page==='search'?'shopping-workspace':''}`}><nav className="app-menu" aria-label="Your assistant">{pages.map(([id,label,Icon])=><a data-analytics={`navigate_${id}`} href={`#/${id}`} key={id} aria-current={(page===id||(id==='home'&&page==='search'))?'page':undefined}><Icon size={19}/><span>{label}</span></a>)}</nav><nav className="phone-menu" aria-label="Main navigation">{[...pages.filter(([id])=>['home','wardrobe','saved'].includes(id)),['more','More',MoreHorizontal]].map(([id,label,Icon])=><a data-analytics={`navigate_${id}`} href={`#/${id}`} key={id} aria-current={(page===id||(id==='home'&&page==='search')||(id==='more'&&['daily','stylist','try-on','history','settings'].includes(page)))?'page':undefined}><Icon size={21}/><span>{label}</span></a>)}</nav><main id="account-content" className="app-page" tabIndex={-1}>
 <div hidden={!['home','search'].includes(page)}><LiveSearch active={['home','search'].includes(page)} showHome={page==='home'} onExplore={()=>go('search')} onHome={()=>go('home')}/></div>
 {page==='more'&&<section className="account-card more-page"><h1>Your assistant</h1><p className="account-note">Your style tools and account, in one place.</p>{pages.filter(([id])=>['daily','stylist','try-on','history','settings'].includes(id)).map(([id,label,Icon])=><a data-analytics={`navigate_${id}`} href={`#/${id}`} key={id}><Icon size={22}/><span>{label}</span><ArrowUpRight size={18}/></a>)}</section>}
 {page==='daily' &&<DailyFeed/>}{page==='wardrobe'&&<Wardrobe/>}{page==='saved'&&<ShoppingLibrary/>}{page==='try-on'&&<VirtualTryOn/>}{page==='stylist'&&<Stylist/>}
 {page==='history'&&<section className="account-card"><h1>Past chats</h1><p className="account-note">Revisit previous searches. Continue your current search from For you.</p><ConversationHistory/></section>}
 {page==='settings'&&<><section className="account-card"><h1>Settings</h1><p className="account-note">Manage your style, account and privacy.</p><a className="chat-chip" href="#/setup">Edit styling setup</a><Preferences/></section><AccountSupport/><FeatureReadiness/></>}
 </main></div>;
}
export default function Account(){
 const {isLoading,isAuthenticated}=useConvexAuth();
 const setup=useQuery(api.styling.get,isAuthenticated?{}:"skip");
 const analyticsUser=useQuery(api.analytics.identity,isAuthenticated?{}:'skip');
 useEffect(()=>{if(!isLoading&&(!isAuthenticated||analyticsUser!==undefined))analyticsIdentity(isAuthenticated?analyticsUser:null);},[isLoading,isAuthenticated,analyticsUser]);
 const preparing=isLoading||(isAuthenticated&&setup===undefined);
 useEffect(()=>{const viewport=window.visualViewport;const update=()=>{document.documentElement.style.setProperty('--app-height',`${viewport?.height??window.innerHeight}px`);document.documentElement.classList.toggle('keyboard-open',Boolean(viewport&&window.innerHeight-viewport.height>120));};update();viewport?.addEventListener('resize',update);window.addEventListener('resize',update);return()=>{viewport?.removeEventListener('resize',update);window.removeEventListener('resize',update);document.documentElement.style.removeProperty('--app-height');document.documentElement.classList.remove('keyboard-open');};},[]);
 return <div className={`account-shell ${isAuthenticated?'signed-in-shell':''}`}><a className="skip-link" href="#account-content">Skip to content</a><header className="account-nav"><Brand/><span className="account-note">Your Fashion AI assistant</span></header>{preparing?<main id="account-content"><FashionLoader label="Getting your assistant ready…"/></main>:isAuthenticated?<SignedIn setup={setup}/>:<GuestSearch/>}</div>;
}
