import BrandIcon from '../brand/BrandIcon.jsx';
import React,{useEffect,useRef,useState} from 'react';
import {useMutation,useQuery} from 'convex/react';
import {ArrowLeft,ArrowUpRight,ArrowUp,Heart,Sparkles,X,SlidersHorizontal} from 'lucide-react';
import {api} from '../convex/_generated/api';
import ProductPreview from './ProductPreview';
import PersonalHome from './PersonalHome';
import ShoppingInput from './ShoppingInput';
import {refinementSuggestions as suggestions,currentTurnReplies} from './discoveryView';

const price=option=>`${option.priceFrom?'From ':''}₹${option.price.toLocaleString('en-IN')}`;

export default function LiveSearch({active=true,showHome=false,onExplore,onHome}){
 const post=useMutation(api.conversations.post),cancel=useMutation(api.conversations.cancel),conversation=useQuery(api.conversations.current),saveProduct=useMutation(api.savedProducts.save),savedProducts=useQuery(api.savedProducts.list);
 const messages=conversation?.messages??[],requirements=conversation?.requirements??{};
 const [draft,setDraft]=useState(''),[submitting,setSubmitting]=useState(false),[error,setError]=useState(''),[saving,setSaving]=useState(''),[notice,setNotice]=useState(''),[selected,setSelected]=useState(null),[optimistic,setOptimistic]=useState('');
 const input=useRef(null),busy=useRef(false),initialHandled=useRef(false),dialog=useRef(null),opener=useRef(null);
 const pending=submitting||!conversation||conversation.pending;
 const latestResult=messages.findLast(m=>m.result),options=latestResult?.result.options??[];
 const lastUser=messages.findLast(m=>m.role==='user');
 const firstUser=messages.find(m=>m.role==='user');
 const currentReplies=currentTurnReplies(messages);
 const previousPicks=Boolean(conversation?.discoveryStatus!=='satisfied'&&latestResult&&messages.indexOf(latestResult)<messages.findLastIndex(m=>m.role==='user'));
 const displayedReplies=currentReplies.map(m=>({...m,text:conversation?.discoveryQuestion&&m.text.endsWith(conversation.discoveryQuestion.question)?m.text.slice(0,-conversation.discoveryQuestion.question.length).trim():m.text})).filter(m=>m.text);
 const isSaved=option=>savedProducts?.some(item=>item.option.url===option.url);
 useEffect(()=>{if(selected&&!dialog.current?.open)dialog.current?.showModal();},[selected]);
 useEffect(()=>{if(!active||showHome)closeProduct();},[active,showHome]);
 useEffect(()=>{
  const text=new URLSearchParams(window.location.search).get('q')?.trim();
  if(active&&!showHome&&conversation&&!pending&&text&&!initialHandled.current){initialHandled.current=true;send(text,undefined,undefined,true);}
 },[active,showHome,conversation,pending]);
 function closeProduct(){dialog.current?.close();setSelected(null);opener.current?.focus();}
 function openProduct(message,option,event){opener.current=event.currentTarget;setSelected({message,option});}
 async function send(text,rejectUrl,reference,newSearch=false){
  text=text.trim();if(!text||busy.current||pending||!conversation)return;
  busy.current=true;setSubmitting(true);setError('');setNotice('');setDraft('');setOptimistic(text);closeProduct();onExplore?.();
  window.scrollTo({top:0,behavior:'instant'});
  try{await post({text,...(newSearch?{newSearch:true}:{}),...(rejectUrl?{rejectUrl}:{}),...(reference?{reference}:{})});
   const url=new URL(window.location.href);if(url.searchParams.has('q')){url.searchParams.delete('q');window.history.replaceState(null,'',url);}
  }catch(e){setDraft(text);setError(String(e.message).includes('wait a minute')?'Please wait a minute before searching again.':"That request couldn't be sent. Please try again.");}
  finally{busy.current=false;setSubmitting(false);setOptimistic('');}
 }
 async function save(message,option){setSaving(option.url);setNotice('');try{await saveProduct({messageId:message.id,url:option.url});setNotice('Saved to your shortlist.');}catch(e){setNotice(String(e.message).includes('50 products')?'Your shortlist is full. Remove an item before saving another.':'Could not save this option. Please try again.');}finally{setSaving('');}}
 function refine(text){if(text==='Something different')send('None of these');else if(text==='Lower budget'){setDraft('Show me options under ₹');input.current?.focus();}else send(conversation?.discoveryQuestion?.choices.find(c=>c.label===text)?.text??text);}
 const card=(message,option)=><article className="discovery-card" key={option.url}>
  <button className="discovery-card-main" onClick={event=>openProduct(message,option,event)} aria-label={`View details for ${option.title}`}>
   <ProductPreview option={option} linkedFallback={false}/>
   <div className="discovery-card-copy"><span className="discovery-store">{option.store}{option.brand?` · ${option.brand}`:''}</span><h2>{option.title}</h2><strong className="discovery-price">{price(option)}</strong><span className="discovery-attributes">{[option.colour,option.fabric].filter(Boolean).join(' · ')||'Explore this find'}</span></div>
  </button>
  <button className={`discovery-save ${isSaved(option)?'is-saved':''}`} aria-label={`${isSaved(option)?'Saved':'Save'} ${option.title}`} disabled={Boolean(saving)||savedProducts===undefined||isSaved(option)} onClick={()=>save(message,option)}><Heart size={19} fill={isSaved(option)?'currentColor':'none'}/></button>
  {option.reasons?.[0]&&<p className="discovery-reason"><Sparkles size={13}/>{option.reasons[0]}</p>}
  <div className="discovery-card-actions"><button disabled={pending||!conversation?.aiEnabled} onClick={()=>send('More like this product, keeping my budget and size.',undefined,{messageId:message.id,url:option.url})}><Sparkles size={14}/> More like this</button><a href={option.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${option.title} on ${option.store}`}><ArrowUpRight size={18}/></a></div>
 </article>;
 if(showHome)return <div><PersonalHome onAsk={text=>send(text,undefined,undefined,true)} busy={pending}/>{error&&<p role="alert">{error}</p>}</div>;
 return <section className="shopping-discovery" aria-labelledby="discovery-title">
  <header className="discovery-heading"><button className="discovery-back" onClick={onHome}><ArrowLeft size={17}/> For you</button><a href="#/saved"><Heart size={16}/> Your shortlist</a></header>
  <div className="discovery-intro"><span className="discovery-eyebrow">YOUR PERSONAL EDIT</span><h1 id="discovery-title">{requirements.category?`${requirements.category.charAt(0).toUpperCase()+requirements.category.slice(1)}, your way.`:'Let’s find your next favourite.'}</h1><p className="discovery-request">{firstUser?.text||optimistic||'Tell me what you’re looking for. We’ll find it together.'}</p><div className="discovery-filters">{[requirements.audience&&{men:'Men’s fashion',women:'Women’s fashion',unisex:'Unisex fashion'}[requirements.audience],requirements.budget&&`Up to ₹${requirements.budget.toLocaleString('en-IN')}`,requirements.size&&`Size ${requirements.size}`,requirements.brand&&requirements.brand!=='any'?requirements.brand:null,requirements.pricePreference==='lowest_price'?'Lowest prices first':null,requirements.occasion,requirements.style,requirements.fit,requirements.pattern,requirements.colour,requirements.fabric].filter(Boolean).map(tag=><span key={tag}>{tag}</span>)}</div></div>
  {(optimistic||lastUser?.text)&&<p className="discovery-latest-request"><strong>You</strong>{optimistic||lastUser.text}</p>}
  <div className="discovery-assistant" aria-live="polite"><BrandIcon size={29}/><div><strong>Your shopping assistant</strong>{displayedReplies.map(m=><p key={m.id}>{m.text}</p>)}{pending?<p>{!conversation?'Getting your search ready…':conversation.pendingPhase==='thinking'?'Working out what suits your request…':'Looking through supported fashion stores with these details…'}</p>:!currentReplies.length&&!conversation?.discoveryQuestion&&<p>Tell me your occasion, budget or a style you like. I’ll help narrow it down.</p>}{!pending&&conversation?.discoveryQuestion&&<p className="discovery-question">{conversation.discoveryQuestion.question}</p>}</div>{conversation?.pending&&<button onClick={async()=>{try{await cancel();}catch{setError('Could not stop this search. Please try again.');}}}>Stop</button>}</div>
  {error&&<p className="discovery-notice error" role="alert">{error}</p>}{notice&&<p className="discovery-notice" role="status">{notice} <a href="#/saved">View saved items</a></p>}
  <div className="discovery-refinements" aria-label="Refine your search"><SlidersHorizontal size={16}/>{suggestions(requirements,conversation?.discoveryQuestion).map(text=><button key={text} disabled={pending} onClick={()=>refine(text)}>{text}</button>)}</div>
  {pending&&!options.length?<div className="discovery-grid discovery-skeleton" aria-hidden="true">{[0,1,2,3].map(i=><div key={i}><div/><span/><span/></div>)}</div>:<>
   {!!latestResult&&<div className="discovery-results-heading"><h2>{options.length?previousPicks?'Previous picks':`${options.length} finds to explore`:'Let’s adjust the search'}</h2>{options.length>0&&!pending&&!previousPicks&&(conversation?.discoveryStatus==='satisfied'?<span>Shortlist confirmed</span>:<button type="button" onClick={()=>send('These work for me')}>These work for me</button>)}{pending&&<span>Updating your picks…</span>}{previousPicks&&!pending&&conversation?.discoveryQuestion&&<span>Answer above to update these</span>}</div>}
   {options.length>0&&<div className={`discovery-grid ${pending?'is-updating':''}`} aria-label="Product recommendations">{options.map(option=>card(latestResult,option))}</div>}
   {latestResult&&!options.length&&!pending&&<div className="discovery-empty"><Sparkles size={26}/><h3>No verified matches this time.</h3><p>Try a different style, colour or budget. Your assistant can help find another direction.</p></div>}
  </>}
  {latestResult&&<div className="discovery-store-note">{latestResult.result.stores.map(store=><span key={store.store}>{store.store}: {store.status==='matched'?'matches found':<a href={store.searchUrl} target="_blank" rel="noopener noreferrer">{store.status==='unavailable'?'temporarily unavailable':'no verified matches'} <ArrowUpRight size={12}/></a>}</span>)}</div>}
  {options.length>0&&<p className="discovery-disclosure">Store prices were observed during the search. Size availability, delivery and final offers need checking on the store.</p>}
  {messages.length>1&&<details className="discovery-history"><summary>Your requests & assistant notes</summary><div>{messages.map(m=><p key={m.id}><strong>{m.role==='user'?'You':'Chauffer'}</strong>{m.text}{m.result&&<small>{m.result.options.length} options in this search</small>}</p>)}</div></details>}
  <div className="discovery-composer-wrap"><ShoppingInput disabled={pending} onDraft={text=>{setDraft(text);input.current?.focus();}}/><form className="discovery-composer" onSubmit={e=>{e.preventDefault();send(draft);}} aria-busy={pending}><Sparkles size={19}/><label className="sr-only" htmlFor="shopping-refine">Refine your search</label><input id="shopping-refine" ref={input} value={draft} onChange={e=>setDraft(e.target.value)} placeholder={options.length?'A different colour? A little more casual?':'Tell me what you have in mind…'} maxLength={1000} autoComplete="off" disabled={pending}/><button aria-label="Search or refine" disabled={pending||!draft.trim()}><ArrowUp size={21}/></button></form></div>
  <dialog ref={dialog} aria-label="Product details" className="discovery-dialog" onCancel={()=>setSelected(null)} onClick={event=>{if(event.target===dialog.current)closeProduct();}}>{selected&&<>
   <button className="discovery-dialog-close" aria-label="Close product details" onClick={closeProduct}><X size={22}/></button>
   <ProductPreview option={selected.option}/><div className="discovery-dialog-copy"><span className="discovery-store">{selected.option.store}</span><h2>{selected.option.title}</h2><strong className="discovery-price">{price(selected.option)}</strong><p>{[selected.option.colour,selected.option.fabric].filter(Boolean).join(' · ')}</p>
   {!!selected.option.reasons?.length&&<div className="discovery-match"><h3>Why it’s in your edit</h3><ul>{selected.option.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul></div>}
   {!!selected.option.unknownPreferences?.length&&<p>Not confirmed by the store: {selected.option.unknownPreferences.join(', ')}.</p>}
   <p className="discovery-disclosure">Checked {new Date(selected.option.observedAt).toLocaleString('en-IN')}. {selected.option.priceFrom?'Starting price; variants may cost more. ':''}Confirm size, delivery, final price and returns on the store.</p>
   <a className="discovery-merchant" href={selected.option.url} target="_blank" rel="noopener noreferrer">View on {selected.option.store} <ArrowUpRight size={18}/></a><div className="discovery-dialog-actions"><button disabled={Boolean(saving)||savedProducts===undefined||isSaved(selected.option)} onClick={()=>save(selected.message,selected.option)}><Heart size={16}/>{isSaved(selected.option)?'Saved':saving?'Saving…':'Save for later'}</button><button disabled={pending||!conversation?.aiEnabled} onClick={()=>send('More like this product, keeping my budget and size.',undefined,{messageId:selected.message.id,url:selected.option.url})}>More like this</button><button disabled={pending} onClick={()=>send(`Not this one: ${selected.option.title}`,selected.option.url)}>Not for me</button></div>{notice&&<p role="status">{notice}</p>}</div>
  </>}</dialog>
 </section>;
}
