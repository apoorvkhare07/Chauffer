import AffiliateLink,{AffiliateDisclosure} from './AffiliateLink.jsx';
import BrandIcon from '../brand/BrandIcon.jsx';
import React,{useEffect,useRef,useState} from 'react';
import {useMutation,useQuery} from 'convex/react';
import {ArrowUpRight,ArrowUp,Heart,Sparkles,X,MessageSquarePlus,History} from 'lucide-react';
import {api} from '../convex/_generated/api';
import ProductPreview from './ProductPreview';
import PersonalHome from './PersonalHome';
import FashionLoader from '../FashionLoader.jsx';
import ShoppingInput from './ShoppingInput';
import VoiceComposer from './VoiceComposer.jsx';
import PlanLimitNotice from './PlanLimitNotice.jsx';
import {refinementSuggestions as suggestions,cleanDiscoveryReply} from './discoveryView';
import {track} from '../analytics';

const price=option=>`${option.priceFrom?'From ':''}₹${option.price.toLocaleString('en-IN')}`;
const usefulReason=option=>option.reasons?.find(reason=>!(/within your preferred (?:spending|shopping) range/i.test(reason)||/^listed price fits your .* budget\.?$/i.test(reason)));

export default function LiveSearch({active=true,showHome=false,onExplore,onHome}){
 const post=useMutation(api.conversations.post),newChat=useMutation(api.conversations.newChat),cancel=useMutation(api.conversations.cancel),conversation=useQuery(api.conversations.current),plan=useQuery(api.planAccess.current),saveProduct=useMutation(api.savedProducts.save),savedProducts=useQuery(api.savedProducts.list);
 const storedMessages=conversation?.messages??[];
 const firstUserIndex=storedMessages.findIndex(m=>m.role==='user');
 const requirements=conversation?.requirements??{};
 const [draft,setDraft]=useState(()=>new URLSearchParams(window.location.search).get('q')?.trim()??''),[submitting,setSubmitting]=useState(false),[error,setError]=useState(''),[saving,setSaving]=useState(''),[notice,setNotice]=useState(''),[selected,setSelected]=useState(null),[optimistic,setOptimistic]=useState('');
 const messages=firstUserIndex>=0?storedMessages.slice(firstUserIndex):optimistic?[]:storedMessages;
 const input=useRef(null),busy=useRef(false),initialHandled=useRef(false),dialog=useRef(null),opener=useRef(null),submittedFrom=useRef(null);
 const pending=submitting||!conversation||conversation.pending;
 const latestResult=messages.findLast(m=>m.result),options=latestResult?.result.options??[];
 const initialText=new URLSearchParams(window.location.search).get('q')?.trim();
 const lastUser=messages.findLast(m=>m.role==='user');
 const lastAssistant=messages.findLast(m=>m.role==='assistant');
 const stagedText=optimistic||(initialText&&!initialHandled.current?initialText:'');
 const showStagedText=stagedText&&(optimistic?(lastUser?.id??null)===submittedFrom.current:lastUser?.text!==stagedText)?stagedText:'';
 const threadEnd=useRef(null);
 const isSaved=option=>savedProducts?.some(item=>item.option.url===option.url);
 useEffect(()=>{if(selected&&!dialog.current?.open)dialog.current?.showModal();},[selected]);
 useEffect(()=>{if(!active||showHome)closeProduct();},[active,showHome]);
 useEffect(()=>{
  const text=initialText;
  if(active&&!showHome&&conversation&&!pending&&text&&!initialHandled.current){initialHandled.current=true;send(text,undefined,undefined,true,true);}
 },[active,showHome,conversation,pending]);
 useEffect(()=>{if(active&&!showHome)requestAnimationFrame(()=>threadEnd.current?.scrollIntoView({behavior:'smooth',block:'end'}));},[active,showHome,messages.length,pending]);
 function closeProduct(){dialog.current?.close();setSelected(null);opener.current?.focus();}
 function assistantText(message){let text=message.text;if(message===latestResult&&conversation?.discoveryQuestion&&text.endsWith(conversation.discoveryQuestion.question))text=text.slice(0,-conversation.discoveryQuestion.question.length).trim();return cleanDiscoveryReply(text);}
 function openProduct(message,option,event){opener.current=event.currentTarget;setSelected({message,option});}
 async function send(text,rejectUrl,reference,newSearch=false,preserveForHandoff=false){
  text=text.trim();if(!text||busy.current||pending||!conversation)return;
  submittedFrom.current=messages.findLast(m=>m.role==='user')?.id??null;busy.current=true;setSubmitting(true);setError('');setNotice('');setDraft(preserveForHandoff?text:'');if(preserveForHandoff)window.setTimeout(()=>setDraft(''),680);setOptimistic(text);closeProduct();onExplore?.();
  try{await post({text,...(newSearch?{newSearch:true}:{}),...(rejectUrl?{rejectUrl}:{}),...(reference?{reference}:{})});track('conversation_message_accepted',{channel:'web'});
   const url=new URL(window.location.href);if(url.searchParams.has('q')){url.searchParams.delete('q');window.history.replaceState(null,'',url);}
  }catch(e){setDraft(text);const message=String(e.data??e.message??'');setError(message.includes('10 free conversations')||(message.includes('PLAN_LIMIT')&&message.includes('conversations'))?'conversation-limit':String(e.message).toLowerCase().includes('wait a minute')?'Please wait a minute before searching again.':"That request couldn't be sent. Please try again.");}
  finally{busy.current=false;setSubmitting(false);setOptimistic('');}
 }
 async function save(message,option){setSaving(option.url);setNotice('');try{await saveProduct({messageId:message.id,url:option.url});setNotice('Saved to your shortlist.');}catch(e){setNotice(String(e.message).includes('50 products')?'Your shortlist is full. Remove an item before saving another.':'Could not save this option. Please try again.');}finally{setSaving('');}}
 async function startNewChat(){if(pending||busy.current)return;setError('');setNotice('');setOptimistic('');setDraft('');setSelected(null);try{await newChat();const url=new URL(window.location.href);if(url.searchParams.has('q')){url.searchParams.delete('q');window.history.replaceState(null,'',url);}}catch(e){setError(String(e.message).includes('Wait for the current search')?'Wait for the current search to finish before starting a new chat.':'Could not start a new chat. Please try again.');}}
 function refine(text){if(text==='Something different')send('None of these');else if(text==='Lower budget'){setDraft('Show me options under ₹');input.current?.focus();}else send(conversation?.discoveryQuestion?.choices.find(c=>c.label===text)?.text??text);}
 const card=(message,option)=><article className="discovery-card" key={option.url}>
  <button className="discovery-card-main" onClick={event=>openProduct(message,option,event)} aria-label={`View details for ${option.title}`}>
   <ProductPreview option={option} linkedFallback={false}/>
   <div className="discovery-card-copy"><span className="discovery-store">{option.store}{option.brand?` · ${option.brand}`:''}</span><h2>{option.title}</h2><strong className="discovery-price">{price(option)}</strong><span className="discovery-attributes">{[option.colour,option.fabric].filter(Boolean).join(' · ')||'Explore this find'}</span></div>
  </button>
  <button className={`discovery-save ${isSaved(option)?'is-saved':''}`} aria-label={`${isSaved(option)?'Saved':'Save'} ${option.title}`} disabled={Boolean(saving)||savedProducts===undefined||isSaved(option)} onClick={()=>save(message,option)}><Heart size={19} fill={isSaved(option)?'currentColor':'none'}/></button>
  {message.handoff?.styling?.state==='ready'&&message.handoff.styling.matches.filter(m=>m.productId===option.url).map((m,i)=><p className="discovery-wardrobe-pair" key={i}><strong>Wear with {m.items.map(item=>item.name).join(', ')}</strong>{m.reason}</p>)}
  {usefulReason(option)&&<p className="discovery-reason"><Sparkles size={13}/>{usefulReason(option)}</p>}
  <div className="discovery-card-actions"><button disabled={pending||!conversation?.aiEnabled} onClick={()=>send('More like this product, keeping my budget and size.',undefined,{messageId:message.id,url:option.url})}><Sparkles size={14}/> More like this</button><AffiliateLink reference={{kind:'message',id:message.id,url:option.url}} source="search" href={option.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${option.title} on ${option.store}`}><ArrowUpRight size={18}/></AffiliateLink></div>
 </article>;
 if(showHome)return <div><PersonalHome onAsk={text=>send(text,undefined,undefined,true)} busy={pending}/>{error==='conversation-limit'?<PlanLimitNotice feature="conversations" plan={plan}/>:error&&<p role="alert">{error}</p>}</div>;
 return <section className="shopping-discovery" aria-label="Shopping conversation"><AffiliateDisclosure/>
  <header className="discovery-heading"><button className="discovery-back" onClick={startNewChat} disabled={pending}><MessageSquarePlus size={17}/> New chat</button><a href="#/history"><History size={16}/> Past chats</a></header>
  {notice&&<p className="discovery-notice" role="status">{notice} <a href="#/saved">View saved items</a></p>}
  <div className="discovery-thread" aria-label="Conversation messages">
   {messages.map(message=>{
    if(message.role==='user')return <div className="discovery-chat-user" key={message.id}><div className="discovery-user-message">{message.text}</div></div>;
    const isLatest=message===lastAssistant,isLatestResult=message===latestResult,reply=assistantText(message),messageOptions=message.result?.options??[],styling=message.handoff?.styling;
    return <React.Fragment key={message.id}>
     {message.result&&messageOptions.length>0&&<section className="discovery-result-set" aria-label={`${messageOptions.length} product recommendations`}>
      <div className="discovery-results-heading"><h2>{messageOptions.length} finds to explore</h2></div>
      {isLatestResult&&styling&&styling.state!=='not_requested'&&<aside className="discovery-wardrobe-note"><strong>From your wardrobe</strong><p>{styling.summary}</p>{styling.state==='needs_wardrobe'&&<a href="#/wardrobe">Open wardrobe</a>}{styling.limitations.map(t=><small key={t}>{t}</small>)}</aside>}
      <div className="discovery-grid" aria-label="Product recommendations">{messageOptions.map(option=>card(message,option))}</div>
     </section>}
     {message.result&&!messageOptions.length&&<div className="discovery-empty"><Sparkles size={26}/><h3>No verified matches this time.</h3><p>Try a different style, colour or budget. Your assistant can help find another direction.</p></div>}
     <div className="discovery-chat-assistant" aria-live={isLatest?'polite':undefined}><BrandIcon size={29}/><div>{reply&&<p>{reply}</p>}{isLatestResult&&conversation?.discoveryQuestion&&<p className="discovery-question">{conversation.discoveryQuestion.question}</p>}</div></div>
     {isLatest&&!pending&&<div className="discovery-refinements" aria-label="Choose a next step">{latestResult&&options.length>0&&conversation?.discoveryStatus!=='satisfied'&&<button type="button" onClick={()=>send('These work for me')}>These work for me</button>}{suggestions(requirements,conversation?.discoveryQuestion).slice(0,latestResult&&options.length>0&&conversation?.discoveryStatus!=='satisfied'?2:3).map(text=><button key={text} onClick={()=>refine(text)}>{text}</button>)}</div>}
    </React.Fragment>;
   })}
   {showStagedText&&<div className="discovery-chat-user"><div className="discovery-user-message">{showStagedText}</div></div>}
   {error==='conversation-limit'?<PlanLimitNotice feature="conversations" plan={plan}/>:error&&<p className="discovery-notice error" role="alert">{error}</p>}
   {pending&&<div className="discovery-agent-loading"><FashionLoader compact label="Finding pieces for you…"/>{conversation?.pending&&<button className="discovery-cancel" onClick={async()=>{try{await cancel();}catch{setError('Could not stop this search. Please try again.');}}}>Stop search</button>}</div>}
   <div ref={threadEnd} className="discovery-thread-end" aria-hidden="true"/>
  </div>
  <div className="discovery-composer-wrap"><form className="discovery-composer search-handoff-target" onSubmit={e=>{e.preventDefault();send(draft);}} aria-busy={pending}><ShoppingInput disabled={pending} onDraft={text=>{setDraft(text);input.current?.focus();}}/><label className="sr-only" htmlFor="shopping-refine">Refine your search</label><input id="shopping-refine" ref={input} value={draft} onChange={e=>setDraft(e.target.value)} placeholder={options.length?'A different colour? A little more casual?':'Tell me what you have in mind…'} maxLength={1000} autoComplete="off" disabled={pending}/><VoiceComposer value={draft} onText={setDraft} disabled={pending}/><button aria-label="Search or refine" disabled={pending||!draft.trim()}><ArrowUp size={21}/></button></form></div>
  <dialog ref={dialog} aria-label="Product details" className="discovery-dialog" onCancel={()=>setSelected(null)} onClick={event=>{if(event.target===dialog.current)closeProduct();}}>{selected&&<>
   <button className="discovery-dialog-close" aria-label="Close product details" onClick={closeProduct}><X size={22}/></button>
   <ProductPreview reference={{kind:'message',id:selected.message.id,url:selected.option.url}} source="search" option={selected.option}/><div className="discovery-dialog-copy"><span className="discovery-store">{selected.option.store}</span><h2>{selected.option.title}</h2><strong className="discovery-price">{price(selected.option)}</strong><p>{[selected.option.colour,selected.option.fabric].filter(Boolean).join(' · ')}</p>
   {!!selected.option.reasons?.length&&<div className="discovery-match"><h3>Why it’s in your edit</h3><ul>{selected.option.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul></div>}
   {!!selected.option.unknownPreferences?.length&&<p>Not confirmed by the store: {selected.option.unknownPreferences.join(', ')}.</p>}
   <p className="discovery-disclosure">Checked {new Date(selected.option.observedAt).toLocaleString('en-IN')}. {selected.option.priceFrom?'Starting price; variants may cost more. ':''}Confirm size, delivery, final price and returns on the store.</p>
   <AffiliateLink reference={{kind:'message',id:selected.message.id,url:selected.option.url}} source="search" className="discovery-merchant" href={selected.option.url} target="_blank" rel="noopener noreferrer">View on {selected.option.store} <ArrowUpRight size={18}/></AffiliateLink><div className="discovery-dialog-actions"><button disabled={Boolean(saving)||savedProducts===undefined||isSaved(selected.option)} onClick={()=>save(selected.message,selected.option)}><Heart size={16}/>{isSaved(selected.option)?'Saved':saving?'Saving…':'Save for later'}</button><button disabled={pending||!conversation?.aiEnabled} onClick={()=>send('More like this product, keeping my budget and size.',undefined,{messageId:selected.message.id,url:selected.option.url})}>More like this</button><button disabled={pending} onClick={()=>send(`Not this one: ${selected.option.title}`,selected.option.url)}>Not for me</button></div>{notice&&<p role="status">{notice}</p>}</div>
  </>}</dialog>
 </section>;
}
