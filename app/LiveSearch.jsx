import React,{useEffect,useRef,useState} from 'react';
import {useMutation,useQuery} from 'convex/react';
import {Send,RotateCcw} from 'lucide-react';
import {api} from '../convex/_generated/api';

const welcome="Hi! I'm Chauffeur. Tell me what you're looking for and I'll check Flipkart and Amazon. A kurta, dress, top or saree?";
const suggestions=r=>!r.category?['Kurta','Dress','Top','Saree']:!r.budget?['Under ₹500','Under ₹1,000','Under ₹2,000']:!r.size&&r.category!=='saree'?['S','M','L','XL']:['Make it pink','Under ₹700','Pure cotton'];
export default function LiveSearch(){
 const post=useMutation(api.conversations.post),conversation=useQuery(api.conversations.current);
 const messages=conversation?.messages??[{id:'welcome',role:'assistant',text:welcome}],requirements=conversation?.requirements??{};
 const [draft,setDraft]=useState(''),[submitting,setSubmitting]=useState(false),[error,setError]=useState('');
 const pending=submitting||conversation?.pending;
 const thread=useRef(null),input=useRef(null),busy=useRef(false);
 useEffect(()=>{if(!pending)input.current?.focus();const el=thread.current;if(el){const last=el.lastElementChild;el.scrollTop=messages.at(-1)?.result&&last?last.offsetTop-16:el.scrollHeight;}},[conversation,pending]);
 async function send(text,rejectUrl){
  text=text.trim();if(!text||busy.current||pending||!conversation)return;
  busy.current=true;setSubmitting(true);setError('');setDraft('');
  try{await post({text,...(rejectUrl?{rejectUrl}:{})});}catch(e){setDraft(text);setError(String(e.message).includes('wait a minute')?'Please wait a minute before searching again.':"That message couldn't be sent. Please try again.");}
  finally{busy.current=false;setSubmitting(false);}
 }
 function reset(){send('reset');}
 return <section className="shopping-chat" aria-labelledby="chat-title">
  <header className="chat-header"><div className="chat-avatar" aria-hidden="true">c</div><div><h1 id="chat-title">Chauffeur</h1><p>{conversation?.aiEnabled?'Gemini AI · Your shopping conversation':'Basic chat · AI not connected yet'}</p></div><button className="chat-reset" type="button" onClick={reset} disabled={pending} aria-label="Start a new chat"><RotateCcw size={16}/><span>Start again</span></button></header>
  <div className="chat-thread" ref={thread} role="log" aria-label="Shopping messages" aria-live="polite" aria-relevant="additions">
   <p className="chat-date">Saved conversation · Live discovery</p>
   {messages.map(message=><div className={`chat-message chat-${message.role}`} key={message.id}><span className="chat-sender">{message.role==='user'?'You':'Chauffeur'}</span><p className="chat-text">{message.text}</p>
    {message.result&&<>
     <div className="chat-store-status">{message.result.stores.map(store=><p key={store.store}><strong>{store.store}</strong>: {store.status==='matched'?'live matches found':store.status==='unavailable'?'live access unavailable':'no verified matches'}{store.status!=='matched'&&<> · <a href={store.searchUrl} target="_blank" rel="noopener noreferrer">Open store search</a></>}</p>)}</div>
     <div className="chat-products">{message.result.options.map((option,optionIndex)=><article className="chat-product" key={option.url}><ProductPreview option={option}/><span className="chat-store">Option {optionIndex+1} · {option.store}</span><h2>{option.title}</h2><p className="chat-price">{option.priceFrom?'From ':''}₹{option.price.toLocaleString('en-IN')}</p><p>{option.colour||'Colour not confirmed'} · {option.fabric||'Fabric not confirmed'}</p>{option.reasons?.length>0&&<div className="chat-reasons"><strong>Why this option</strong><ul>{option.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul></div>}{option.unknownPreferences?.length>0&&<p className="chat-product-note">Not confirmed in store details: {option.unknownPreferences.join(', ')}.</p>}<p className="chat-product-note">{option.source==='listing'?'From the live store search; details and variants need checking.':'Product details checked.'} Checked {new Date(option.observedAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}.</p><a href={option.url} className="chat-product-link" target="_blank" rel="noopener noreferrer">View on {option.store}</a><button className="chat-chip chat-dislike" type="button" disabled={pending} onClick={()=>send(`Not this one: ${option.title}`,option.url)}>Not for me</button></article>)}</div>
     {message.result.options.length>0&&<p className="chat-disclosure">Requested size availability is not verified. “From” prices may vary by size or variant. Account, location, delivery and offers may change the total. Confirm details on the store; Chauffeur won't place orders.</p>}
    </>}
   </div>)}
   {error&&<p className="chat-error" role="alert">{error}</p>}
   {pending&&<div className="chat-message chat-assistant chat-checking" role="status"><span className="chat-sender">Chauffeur</span><p>{conversation?.pending?(conversation.pendingPhase==='thinking'?'Understanding your request…':'Checking Flipkart and Amazon… This can take a minute.'):'Saving your message…'}</p></div>}
  </div>
  <div className="chat-suggestions" aria-label="Suggested replies">{(messages.some(m=>m.result?.options.length)?['Show more options','None of these',...suggestions(requirements)]:suggestions(requirements)).map(text=><button className="chat-chip" type="button" key={text} onClick={()=>send(text)} disabled={pending}>{text}</button>)}</div>
  <form className="chat-composer" onSubmit={e=>{e.preventDefault();send(draft);}} aria-busy={pending}><label className="sr-only" htmlFor="chat-message">Message Chauffeur</label><input id="chat-message" ref={input} value={draft} onChange={e=>setDraft(e.target.value)} placeholder={conversation?.aiEnabled?'Try: something understated for office, under ₹1,500':'Try: blue cotton kurta, M, under ₹1,000'} maxLength={1000} autoComplete="off" disabled={pending}/><button type="submit" className="chat-send" aria-label="Send message" disabled={pending||!draft.trim()}><Send size={20}/></button></form>
  <p className="chat-footer">Discovery only. Your chat is saved. Start again opens a fresh conversation.</p>
 </section>;
}

function ProductPreview({option}){
 const [failed,setFailed]=useState(false);
 return <div className="chat-product-preview">{option.imageUrl&&!failed?<img src={option.imageUrl} alt={option.title} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<span>Preview unavailable<br/><a href={option.url} target="_blank" rel="noopener noreferrer">See photos on {option.store}</a></span>}</div>;
}
