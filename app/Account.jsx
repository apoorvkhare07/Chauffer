import { PRO_VISIBLE } from '../shared/features.js';
import {analyticsIdentity} from '../analytics';
import GuestSearch from './GuestSearch.jsx';
import Brand from '../Brand.jsx';
import PageBoundary from './PageBoundary.jsx';
import React,{useEffect,useState} from 'react';
import {useConvexAuth,useMutation,useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
import {Asterisk,MessageCircle,Shirt,Heart,Sparkles,ScanFace,Settings,History,MoreHorizontal,ArrowUpRight,House} from 'lucide-react';
import FashionLoader from '../FashionLoader.jsx';
import Preferences from './Preferences.jsx';
import LiveSearch from './LiveSearch.jsx';
import Onboarding from './Onboarding.jsx';
import Stylist from './Stylist.jsx';
import VirtualTryOn from './VirtualTryOn.jsx';
import Wardrobe from './Wardrobe.jsx';
import ShoppingLibrary from './ShoppingLibrary.jsx';
import ConversationHistory from './ConversationHistory.jsx';
import AccountSupport from './AccountSupport.jsx';
import ProCheckout from './ProCheckout.jsx';
import {CreditCard} from 'lucide-react';
const pages=[['home','For you',House],['stylist','Stylist',Sparkles],['wardrobe','Wardrobe',Shirt],['try-on','Try-on',ScanFace],['saved','Saved items',Heart],['history','Past chats',History],['settings','Settings',Settings]];
function pageFromUrl(){const raw=window.location.hash.replace('#/','');const page=raw==='chat'?'search':raw==='daily'?'home':raw==='signin'?'settings':raw;return pages.some(([id])=>id===page)||page==='search'||page==='setup'||page==='more'?page:new URLSearchParams(window.location.search).has('q')?'search':'home';}
function ProRenewalNotice({plan}){
 const [now,setNow]=useState(Date.now);
 useEffect(()=>{const end=plan?.lastProEndsAt;if(!end||end<=Date.now())return;const timer=setTimeout(()=>setNow(Date.now()),end-Date.now()+20);return()=>clearTimeout(timer);},[plan?.lastProEndsAt]);
 if(!plan?.lastProEndsAt||plan.lastProEndsAt>now)return null;
 const ended=new Date(plan.lastProEndsAt).toLocaleDateString('en-IN',{day:'numeric',month:'long'});
 return <aside className="plan-limit-banner pro-renewal-banner" role="status"><div><strong>Your Pro access ended {ended}</strong><span>Renew manually for another 30 days of unlimited access.</span></div><a href="#/settings">Renew Pro · ₹99 <ArrowUpRight size={15}/></a></aside>;
}
function SignedIn({setup,plan}){
 const [page,setPage]=useState(pageFromUrl);
 useEffect(()=>{const change=()=>{setPage(pageFromUrl());window.scrollTo(0,0);};window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
 function go(next){if(next==='chat')next='search';window.location.hash=`/${next}`;setPage(next);}
 const onboarding=!setup.requiredComplete||setup.onboarding==='active'||page==='setup';
 if(onboarding)return <main id="account-content" className="setup-page"><Onboarding forceOpen onDone={()=>go(new URLSearchParams(window.location.search).get('q')?.trim()?'chat':'home')} onWardrobe={()=>go('wardrobe')}/></main>;
 return <div className={`app-workspace ${page==='search'?'shopping-workspace':''}`}><nav className="app-menu" aria-label="Your assistant">{pages.map(([id,label,Icon])=><a data-analytics={`navigate_${id}`} href={`#/${id}`} key={id} aria-current={(page===id||(id==='home'&&page==='search'))?'page':undefined}><Icon size={19}/><span>{label}</span></a>)}</nav><nav className="phone-menu" aria-label="Main navigation">{[...pages.filter(([id])=>['home','stylist','wardrobe'].includes(id)),['more','More',MoreHorizontal]].map(([id,label,Icon])=><a data-analytics={`navigate_${id}`} href={`#/${id}`} key={id} aria-current={(page===id||(id==='home'&&page==='search')||(id==='more'&&['daily','try-on','saved','history','settings'].includes(page)))?'page':undefined}><Icon size={21}/><span>{label}</span></a>)}</nav><main id="account-content" className="app-page" tabIndex={-1}><PageBoundary page={page}>
 {PRO_VISIBLE&&['home','search'].includes(page)&&<ProRenewalNotice plan={plan}/>}
 <div hidden={!['home','search'].includes(page)}><LiveSearch active={['home','search'].includes(page)} showHome={page==='home'} onExplore={()=>go('search')} onHome={()=>go('home')}/></div>
 {page==='more'&&<section className="account-card more-page"><h1>Your assistant</h1><p className="account-note">Styling tools and account settings.</p>{pages.filter(([id])=>['try-on','saved','history','settings'].includes(id)).map(([id,label,Icon])=><a data-analytics={`navigate_${id}`} href={`#/${id}`} key={id}><Icon size={22}/><span>{label}</span><ArrowUpRight size={18}/></a>)}</section>}
 {page==='wardrobe'&&<Wardrobe/>}{page==='saved'&&<ShoppingLibrary/>}{page==='try-on'&&<VirtualTryOn/>}{page==='stylist'&&<Stylist/>}
 {page==='history'&&<section className="account-card"><h1>Past chats</h1><p className="account-note">Revisit previous searches. Continue your current search from For you.</p><ConversationHistory/></section>}
 {page==='settings'&&<><section className="account-card"><h1>Settings</h1><p className="account-note">Manage your style, account and privacy.</p><a className="chat-chip" href="#/setup">Edit styling setup</a><Preferences/></section>{PRO_VISIBLE&&<section className="account-card plan-summary"><span className="daily-kicker"><CreditCard size={16}/> Your plan</span><h2>{plan?.plan==='pro'?'Chauffer Pro':'Free plan'}</h2><p>{plan?.plan==='pro'?'Unlimited access to Chauffeur features.':`${Math.max(0,3-(plan?.usage.wardrobeItems??0))} wardrobe additions · ${Math.max(0,10-(plan?.usage.conversations??0))} conversations · ${Math.max(0,3-(plan?.usage.stylistSessions??0))} stylist sessions left this month.`}</p>{plan?.plan==='pro'&&plan.periodEndsAt&&<p className="account-note">Pro access until {new Date(plan.periodEndsAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}. Renew manually to keep Pro.</p>}{plan?.plan==='free'&&plan.lastProEndsAt&&plan.lastProEndsAt<=Date.now()&&<p className="account-note">Your last Pro period has ended. Renew for another 30 days whenever you’re ready.</p>}<ProCheckout plan={plan}/><a className="chat-chip" href="/pricing/index.html">Compare plans <ArrowUpRight size={16}/></a></section>}<AccountSupport/></>}
 </PageBoundary></main></div>;
}
export default function Account(){
 const {isLoading,isAuthenticated}=useConvexAuth();
 const setup=useQuery(api.styling.get,isAuthenticated?{}:"skip");
 const plan=useQuery(api.planAccess.current,isAuthenticated?{}:'skip');
 const ensurePlan=useMutation(api.planAccess.ensureDefault);
 useEffect(()=>{if(isAuthenticated)ensurePlan({}).catch(()=>{});},[isAuthenticated,ensurePlan]);
 const analyticsUser=useQuery(api.analytics.identity,isAuthenticated?{}:'skip');
 useEffect(()=>{if(!isLoading&&(!isAuthenticated||analyticsUser!==undefined))analyticsIdentity(isAuthenticated?analyticsUser:null);},[isLoading,isAuthenticated,analyticsUser]);
 const preparing=isLoading||(isAuthenticated&&(setup===undefined||plan===undefined));
 useEffect(()=>{const viewport=window.visualViewport;const update=()=>{document.documentElement.style.setProperty('--app-height',`${viewport?.height??window.innerHeight}px`);document.documentElement.classList.toggle('keyboard-open',Boolean(viewport&&window.innerHeight-viewport.height>120));};update();viewport?.addEventListener('resize',update);window.addEventListener('resize',update);return()=>{viewport?.removeEventListener('resize',update);window.removeEventListener('resize',update);document.documentElement.style.removeProperty('--app-height');document.documentElement.classList.remove('keyboard-open');};},[]);
 return <div className={`account-shell ${isAuthenticated?'signed-in-shell':''}`}><a className="skip-link" href="#account-content">Skip to content</a><header className="account-nav"><Brand/><span className="account-note">Your Fashion AI assistant</span></header>{preparing?<main id="account-content"><FashionLoader label="Getting your assistant ready…"/></main>:isAuthenticated?<SignedIn setup={setup} plan={plan}/>:<GuestSearch/>}</div>;
}
