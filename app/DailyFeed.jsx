import AffiliateLink,{AffiliateDisclosure} from './AffiliateLink.jsx';
import React,{useEffect,useRef,useState} from 'react';
import {useMutation,useQuery} from 'convex/react';
import {Sparkles,Pause,CalendarDays,ArrowRight,ArrowLeft,Heart,X,RotateCcw} from 'lucide-react';
import {api} from '../convex/_generated/api';
import ProductPreview from './ProductPreview.jsx';

export default function DailyFeed(){
 const data=useQuery(api.dailyFeed.current),setEnabled=useMutation(api.dailyFeed.setEnabled),save=useMutation(api.savedProducts.saveDaily),saved=useQuery(api.savedProducts.list);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[saving,setSaving]=useState(''),[index,setIndex]=useState(0),[dragX,setDragX]=useState(0);
 const start=useRef(null),feed=data?.feed,options=feed?.options?.slice(0,3)??[],active=options[index],savedActive=Boolean(active&&saved?.some(s=>s.option.url===active.url));
 useEffect(()=>{setIndex(0);setDragX(0);},[feed?.id]);
 async function toggle(enabled){setBusy(true);setError('');try{await setEnabled({enabled});}catch{setError('Could not update daily picks. Please try again.');}finally{setBusy(false);}}
 function pass(){setDragX(0);setIndex(current=>Math.min(options.length,current+1));}
 async function saveOption(option){if(savedActive){pass();return;}setSaving(option.url);setError('');try{await save({feedId:feed.id,url:option.url});pass();}catch{setError('Could not save this pick. Please try again.');}finally{setSaving('');}}
 function pointerDown(event){if(event.target.closest('button,a'))return;start.current=event.clientX;event.currentTarget.setPointerCapture?.(event.pointerId);}
 function pointerMove(event){if(start.current!==null)setDragX(Math.max(-150,Math.min(150,event.clientX-start.current)));}
 function pointerUp(){if(start.current===null)return;const dx=dragX;start.current=null;if(dx>72)saveOption(active);else if(dx< -72)pass();setDragX(0);}
 if(!data)return <section className="daily-feed daily-feed-home" aria-label="Daily style picks"><p>Preparing your style edit…</p></section>;
 const show=data.enabled&&!data.changed&&feed?.state==='ready'&&options.length>0;
 const complete=show&&index>=options.length;
 return <section className="daily-feed daily-feed-home daily-feed-agent" aria-labelledby="daily-feed-title"><AffiliateDisclosure/>
  <header className="daily-feed-header"><div><span className="daily-kicker"><Sparkles size={15}/> A FRESH EDIT, EACH DAY</span><h2 id="daily-feed-title">Picked for you</h2><p>{data.enabled?'A few finds, shaped around your style.':'A small, personal edit when you want it.'}</p></div><button className="chat-chip daily-toggle" type="button" disabled={busy||(!data.enabled&&!data.needReady)} onClick={()=>toggle(data.changed?true:!data.enabled)}>{data.changed?<><Sparkles size={14}/> Refresh edit</>:data.enabled?<><Pause size={14}/> Pause</>:<><CalendarDays size={14}/> {feed?'Resume':'Make my edit'}</>}</button></header>
  {!data.enabled&&<div className="daily-agent-empty"><div className="daily-agent-orbit"><Sparkles size={25}/></div><div><strong>Your daily edit is ready when you are</strong><span>Three pieces, chosen for your taste and fit.</span></div><button type="button" disabled={!data.needReady||busy} onClick={()=>toggle(true)}>{data.needReady?'Build my edit':'Finish style setup'} <ArrowRight size={16}/></button></div>}
  {!data.needReady&&<p className="daily-notice">Complete your style setup to get personal picks.</p>}
  {data.enabled&&data.changed&&<p className="daily-home-note">Your saved style changed. Refresh today’s edit to match.</p>}
  {data.enabled&&feed?.state==='building'&&<p role="status" className="daily-agent-status"><Sparkles size={16}/> Finding the right mix for today…</p>}
  {data.enabled&&!feed&&<p role="status" className="daily-agent-status"><Sparkles size={16}/> Your first edit is being prepared.</p>}
  {data.enabled&&!data.changed&&feed?.state==='failed'&&<p role="status">{feed.note}</p>}
  {data.enabled&&!data.changed&&feed?.state==='ready'&&!options.length&&<p className="daily-home-note">No verified picks were available today. We’ll try again tomorrow.</p>}
  {show&&<div className="daily-swipe-stage" aria-label="Swipe right to save, left to skip">
   {complete?<div className="daily-swipe-complete"><div><Sparkles size={23}/></div><h3>That’s today’s edit.</h3><p>Your picks are ready whenever you want another look.</p><button type="button" onClick={()=>setIndex(0)}><RotateCcw size={16}/> See them again</button></div>:<>
    <div className="daily-swipe-count">{String(index+1).padStart(2,'0')} <i/> {String(options.length).padStart(2,'0')}</div>
    <article className="daily-swipe-card" style={{'--swipe-x':`${dragX}px`}} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={()=>{start.current=null;setDragX(0);}} onMouseDown={pointerDown} onMouseMove={pointerMove} onMouseUp={pointerUp}>
     <div aria-hidden="true" className={`daily-swipe-stamp ${Math.abs(dragX)>8?'is-active':''} ${dragX>=0?'stamp-save':'stamp-skip'}`}>{dragX>=0?'SAVE':'PASS'}</div>
     <ProductPreview reference={{kind:'daily',id:feed.id,url:active.url}} source="daily" option={active}/><div className="daily-swipe-copy"><div><span className="daily-swipe-type">{active.category||active.store}</span><strong>{active.title}</strong><span className="daily-swipe-price">{active.priceFrom?'From ':''}₹{active.price.toLocaleString('en-IN')}</span></div><AffiliateLink reference={{kind:'daily',id:feed.id,url:active.url}} source="daily" href={active.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${active.title} on ${active.store}`}>View find <ArrowRight size={15}/></AffiliateLink></div>
    </article>
    <div className="daily-swipe-actions"><button type="button" className="daily-pass" aria-label="Skip this pick" disabled={Boolean(saving)} onClick={pass}><X size={22}/></button><span>Swipe to choose</span><button type="button" className="daily-like" aria-label={savedActive?'Already saved, skip to next':'Save this pick'} disabled={Boolean(saving)||saved===undefined} onClick={()=>saveOption(active)}>{saving===active.url?'…':savedActive?<ArrowRight size={21}/>:<Heart size={21}/>}</button></div>
   </>}
  </div>}
  {error&&<p role="alert" className="account-error">{error}</p>}
 </section>;
}
