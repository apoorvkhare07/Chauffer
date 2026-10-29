import AffiliateLink,{AffiliateDisclosure} from './AffiliateLink.jsx';
import React,{useEffect,useRef,useState} from 'react';
import {useMutation,useQuery} from 'convex/react';
import {ArrowUp,ArrowUpRight,Heart} from 'lucide-react';
import {api} from '../convex/_generated/api';
import ProductPreview from './ProductPreview';
import FashionLoader from '../FashionLoader';
import SignIn from './SignIn';
import GuestTryOn from './GuestTryOn.jsx';
import GuestWardrobe from './GuestWardrobe.jsx';
import './guest-search.css';
import {track,trackOnce} from '../analytics';
import {isExpiredGuestSearch} from './guestSearchState.js';
import VoiceComposer from './VoiceComposer.jsx';
const tokenKey='chauffeur-guest-search';
function guestToken(){try{let token=localStorage.getItem(tokenKey);if(!token){token=crypto.randomUUID()+crypto.randomUUID();localStorage.setItem(tokenKey,token);}return token;}catch{return crypto.randomUUID()+crypto.randomUUID();}}
function resetGuestToken(){try{localStorage.removeItem(tokenKey);}catch{}return guestToken();}
export default function GuestSearch(){
 const initial=new URLSearchParams(window.location.search).get('q')?.trim().slice(0,1000);
 const [visibleCount,setVisibleCount]=useState(12);
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const [token,setToken]=useState(guestToken),[draft,setDraft]=useState(initial??''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[login,setLogin]=useState(window.location.hash==='#/signin'),[view,setView]=useState(guestView());
 const current=useQuery(api.guestSearch.current,{token}),start=useMutation(api.guestSearch.start),retry=useMutation(api.guestSearch.retry),answerAudience=useMutation(api.guestSearch.answerAudience),auto=useRef(false),expiredRotated=useRef(false);
 useEffect(()=>setVisibleCount(12),[current?.createdAt,token]);
 function signIn(text,combineCurrent=true){if(view==='wardrobe')history.replaceState(null,'','#/wardrobe');if(view==='tryon')history.replaceState(null,'','#/guest-tryon');if(text){const url=new URL(location.href);url.searchParams.set('q',combineCurrent&&current?.text?`${current.text}\nRefine this request: ${text}`.slice(0,1000):text);history.replaceState(null,'',url);}setLogin(true);}
 async function send(text,preserveForHandoff=false){text=text.trim();if(!text||busy)return;if(current){signIn(text);return;}setBusy(true);setError('');if(preserveForHandoff)window.setTimeout(()=>setDraft(''),680);try{const created=await start({token,text});if(created)track('guest_search_accepted');if(!preserveForHandoff)setDraft('');}catch(e){setDraft(text);setError(typeof e?.data==='string'?e.data:'Could not start your search. Please try again.');}finally{setBusy(false);}}
 async function retrySearch(){if(busy)return;setBusy(true);setError('');try{await retry({token});}catch(e){setError(typeof e?.data==='string'?e.data:'Could not restart your search. Please try again.');}finally{setBusy(false);}}
 async function chooseAudience(audience){if(busy)return;setBusy(true);setError('');try{await answerAudience({token,audience});}catch(e){setError(typeof e?.data==='string'?e.data:'Could not continue this search. Please reload and try again.');}finally{setBusy(false);}}
 useEffect(()=>{if(current===undefined||login)return;if(isExpiredGuestSearch(current)){if(!expiredRotated.current){expiredRotated.current=true;auto.current=false;setToken(resetGuestToken());}return;}if(auto.current)return;auto.current=true;if(current){if(initial&&initial!==current.text)signIn(initial,false);}else if(initial)send(initial,true);},[current,login,initial,token]);
 useEffect(()=>{if(!current||!['ready','clarifying','failed'].includes(current.state))return;trackOnce(`guest_search_${current.state}`,String(current.createdAt),{state:current.state});},[current?.createdAt,current?.state]);
 useEffect(()=>{const change=()=>{if(location.hash==='#/signin')setLogin(true);else {setLogin(false);setView(guestView());}};addEventListener('hashchange',change);return()=>removeEventListener('hashchange',change);},[]);
 const pending=busy||(current?.state==='pending'&&now-(current.updatedAt??current.createdAt)<120000);
 return <main id="account-content" className="guest-shopping">
 {login?<section className="account-card guest-login"><button className="account-switch" onClick={()=>setLogin(false)}>← Back to your preview</button><SignIn/></section>:<>
 <nav className="guest-trial-nav" aria-label="Try Chauffeur"><a aria-current={view==='chat'?'page':undefined} href="#/discover">Discover</a><a aria-current={view==='tryon'?'page':undefined} href="#/guest-tryon">Try-on</a><a aria-current={view==='wardrobe'?'page':undefined} href="#/guest-wardrobe">Wardrobe</a></nav>
 {view==='tryon'?<GuestTryOn/>:view==='wardrobe'?<GuestWardrobe onSignIn={()=>signIn()}/>:<>
 <AffiliateDisclosure/><div className="discovery-intro"><h1>{current?'Your finds':'Discover'}</h1><p>{current?.text||'Find your next favourite.'}</p></div>
 {pending?<FashionLoader compact label="Looking for your next find…"/>:current&&<p className="guest-reply" role="status">{current.reply||'This search could not finish. Sign in to continue.'}</p>}
 {!!current?.result?.options?.length&&<div className="discovery-grid">{current.result.options.slice(0,visibleCount).map(option=><article className="discovery-card" key={option.url}><AffiliateLink reference={{kind:'guest',token,url:option.url}} source="guest-search" className="discovery-card-main" href={option.url} target="_blank" rel="noopener noreferrer"><ProductPreview option={option} linkedFallback={false}/><div className="discovery-card-copy"><span className="discovery-store">{option.store}</span><h2>{option.title}</h2><strong className="discovery-price">{option.priceFrom?'From ':''}₹{option.price.toLocaleString('en-IN')}</strong><span className="discovery-attributes">{[option.colour,option.fabric].filter(Boolean).join(' · ')}</span></div></AffiliateLink><button className="discovery-save" aria-label={`Sign in to save ${option.title}`} onClick={()=>signIn()}><Heart size={19}/></button><div className="discovery-card-actions"><button onClick={()=>signIn(`More like ${option.title}`)}>More like this</button><AffiliateLink reference={{kind:'guest',token,url:option.url}} source="guest-search" href={option.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${option.title} on ${option.store}`}><ArrowUpRight size={18}/></AffiliateLink></div></article>)}</div>}
 {current?.result?.options?.length>0&&<div className="guest-more-results"><p role="status">Showing {Math.min(visibleCount,current.result.options.length)} of {current.result.options.length} finds</p>{visibleCount<current.result.options.length&&<button className="button secondary" onClick={()=>setVisibleCount(count=>count+12)}>Show more</button>}</div>}
 {!pending&&(current?.canRetry||(current?.state==='pending'&&(current.attempts??1)<2))&&<button className="button primary guest-retry" onClick={retrySearch}>Try this search again</button>}
 {current?.result&&!current.result.options.length&&<div className="guest-store-links">{current.result.stores.map(store=><a href={store.searchUrl} key={store.store} target="_blank" rel="noopener noreferrer">Search directly on {store.store} <ArrowUpRight size={15}/></a>)}</div>}
 {current?.result&&<p className="discovery-disclosure">Live store results. Colours may be estimated from product photos. Check final prices and sizes on the store.</p>}
 {current?.state==='clarifying'&&<div className="guest-audience-choices" role="group" aria-label="Who are you shopping for?">{[['men','Men'],['women','Women'],['unisex','Unisex']].map(([value,label])=><button key={value} type="button" disabled={busy} onClick={()=>chooseAudience(value)}>{label}</button>)}</div>}
 {current&&current.state!=='clarifying'&&!pending&&<p className="account-note">Try a look next, or sign in to save your finds and build your wardrobe.</p>}
 {current?.state!=='clarifying'&&<form data-analytics="guest_search" className="guest-composer search-handoff-target" onSubmit={e=>{e.preventDefault();send(draft);}}><label className="sr-only" htmlFor="guest-message">Your shopping request</label><input id="guest-message" value={draft} onChange={e=>setDraft(e.target.value)} placeholder={current?'What would you like to change?':'Try “men’s linen shirts under ₹2,000”'} maxLength={1000} disabled={pending||current===undefined} required/><VoiceComposer value={draft} onText={setDraft} disabled={pending||current===undefined} guestToken={token} label="Speak your shopping request"/><button disabled={!draft.trim()||pending||current===undefined} aria-label={current?'Sign in to continue':'Search fashion'}><ArrowUp size={20}/></button></form>}
 {error&&<p role="alert" className="account-error">{error}</p>}
 </>}
 </>}
 </main>;
}
function guestView(){const route=window.location.hash.replace(/^#\//,'');return route==='try-on'||route==='guest-tryon'?'tryon':route==='wardrobe'||route==='guest-wardrobe'?'wardrobe':'chat';}
