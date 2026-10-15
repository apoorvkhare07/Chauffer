import React,{useEffect,useRef,useState} from 'react';
import {useMutation,useQuery} from 'convex/react';
import {ArrowUp,ArrowUpRight,Heart} from 'lucide-react';
import {api} from '../convex/_generated/api';
import ProductPreview from './ProductPreview';
import FashionLoader from '../FashionLoader';
import SignIn from './SignIn';
import './guest-search.css';
const tokenKey='chauffeur-guest-search';
function guestToken(){try{let token=localStorage.getItem(tokenKey);if(!token){token=crypto.randomUUID()+crypto.randomUUID();localStorage.setItem(tokenKey,token);}return token;}catch{return crypto.randomUUID()+crypto.randomUUID();}}
export default function GuestSearch(){
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const [token]=useState(guestToken),[draft,setDraft]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[login,setLogin]=useState(window.location.hash==='#/signin');
 const current=useQuery(api.guestSearch.current,{token}),start=useMutation(api.guestSearch.start),auto=useRef(false);
 const initial=new URLSearchParams(window.location.search).get('q')?.trim().slice(0,1000);
 function signIn(text){if(text){const url=new URL(location.href);url.searchParams.set('q',current?.text?`${current.text}\nRefine this request: ${text}`.slice(0,1000):text);history.replaceState(null,'',url);}setLogin(true);}
 async function send(text){text=text.trim();if(!text||busy)return;if(current){signIn(text);return;}setBusy(true);setError('');try{await start({token,text});localStorage.setItem('chauffeur-guest-used','1');setDraft('');}catch(e){setError(typeof e?.data==='string'?e.data:'Could not start your search. Please try again.');}finally{setBusy(false);}}
 useEffect(()=>{if(current===undefined||auto.current||login)return;auto.current=true;if(current){if(initial&&initial!==current.text)signIn(initial);}else if(localStorage.getItem('chauffeur-guest-used'))signIn(initial);else if(initial)send(initial);},[current,login]);
 useEffect(()=>{const change=()=>{if(location.hash==='#/signin')setLogin(true);};addEventListener('hashchange',change);return()=>removeEventListener('hashchange',change);},[]);
 const pending=busy||(current?.state==='pending'&&now-current.createdAt<120000);
 return <main id="account-content" className="guest-shopping"><header className="guest-top"><a href="/">← Back to home</a><button onClick={()=>signIn()}>Sign in</button></header>
 {login?<section className="account-card guest-login"><button className="account-switch" onClick={()=>setLogin(false)}>← Back to your preview</button><SignIn/></section>:<>
 <div className="discovery-intro"><span className="discovery-eyebrow">YOUR FIRST FIND</span><h1>{current?'Your shopping preview.':'What’s on your mind?'}</h1><p>{current?.text||'Try one search. No account needed.'}</p></div>
 {pending?<FashionLoader compact label="Looking for your next find…"/>:current&&<p className="guest-reply" role="status">{current.reply||'This search could not finish. Sign in to continue.'}</p>}
 {!!current?.result?.options?.length&&<div className="discovery-grid">{current.result.options.map(option=><article className="discovery-card" key={option.url}><a className="discovery-card-main" href={option.url} target="_blank" rel="noopener noreferrer"><ProductPreview option={option} linkedFallback={false}/><div className="discovery-card-copy"><span className="discovery-store">{option.store}</span><h2>{option.title}</h2><strong className="discovery-price">{option.priceFrom?'From ':''}₹{option.price.toLocaleString('en-IN')}</strong><span className="discovery-attributes">{[option.colour,option.fabric].filter(Boolean).join(' · ')}</span></div></a><button className="discovery-save" aria-label={`Sign in to save ${option.title}`} onClick={()=>signIn()}><Heart size={19}/></button><div className="discovery-card-actions"><button onClick={()=>signIn(`More like ${option.title}`)}>More like this</button><a href={option.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${option.title} on ${option.store}`}><ArrowUpRight size={18}/></a></div></article>)}</div>}
 {current?.result&&!current.result.options.length&&<div className="guest-store-links">{current.result.stores.map(store=><a href={store.searchUrl} key={store.store} target="_blank" rel="noopener noreferrer">Search directly on {store.store} <ArrowUpRight size={15}/></a>)}</div>}
 {current?.result&&<p className="discovery-disclosure">Live store results. Prices, size availability, delivery and offers need checking on the store.</p>}
 {current&&!pending&&<p className="account-note">Sign in with your phone to keep chatting, save finds and use your wardrobe.</p>}
 <form className="guest-composer" onSubmit={e=>{e.preventDefault();send(draft);}}><label className="sr-only" htmlFor="guest-message">Your shopping request</label><input id="guest-message" value={draft} onChange={e=>setDraft(e.target.value)} placeholder={current?'What would you like to change?':'Try “men’s linen shirts under ₹2,000”'} maxLength={1000} disabled={pending||current===undefined} required/><button disabled={!draft.trim()||pending||current===undefined} aria-label={current?'Sign in to continue':'Search fashion'}><ArrowUp size={20}/></button></form>
 {error&&<p role="alert" className="account-error">{error}</p>}
 </>}
 </main>;
}
