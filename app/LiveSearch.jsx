import React,{useEffect,useRef,useState} from 'react';
import {useAction} from 'convex/react';
import {Send,RotateCcw} from 'lucide-react';
import {api} from '../convex/_generated/api';
import {nextRequest} from '../convex/discoveryRules';

const welcome="Hi! I'm Chauffeur. Tell me what you're looking for and I'll check Flipkart and Amazon. A kurta, dress, top or saree?";
const suggestions=r=>!r.category?['Kurta','Dress','Top','Saree']:!r.budget?['Under ₹500','Under ₹1,000','Under ₹2,000']:!r.size&&r.category!=='saree'?['S','M','L','XL']:['Make it pink','Under ₹700','Pure cotton'];
export default function LiveSearch(){
 const search=useAction(api.liveDiscovery.webSearch);
 const [messages,setMessages]=useState([{role:'assistant',text:welcome}]);
 const [requirements,setRequirements]=useState({}),[draft,setDraft]=useState(''),[pending,setPending]=useState(false);
 const thread=useRef(null),input=useRef(null),busy=useRef(false);
 useEffect(()=>{if(!pending)input.current?.focus();const el=thread.current;if(el){const last=el.lastElementChild;el.scrollTop=messages.at(-1)?.result&&last?last.offsetTop-16:el.scrollHeight;}},[messages,pending]);
 async function send(text){
  text=text.trim();if(!text||busy.current)return;
  busy.current=true;setDraft('');
  const plan=nextRequest(text,requirements);setRequirements(plan.requirements);
  setMessages(current=>[...current,{role:'user',text},{role:'assistant',text:plan.reply}]);
  if(!plan.search){busy.current=false;input.current?.focus();return;}
  setPending(true);
  try{
   const result=await search({requirements:plan.requirements});
   setMessages(current=>[...current,{role:'assistant',text:result.options.length?`I found ${result.options.length} matching options. Open a product to take a closer look, or tell me what to change.`:result.failed?"I couldn't reach the stores just now. You can open their searches below or try again later.":"I couldn't verify a match this time. Try a different colour, fabric or budget.",result}]);
  }catch{setMessages(current=>[...current,{role:'assistant',text:"The search couldn't start. Wait a minute and tap Try again. If it keeps failing, sign out and back in.",retry:true}]);}
  finally{busy.current=false;setPending(false);input.current?.focus();}
 }
 function reset(){if(busy.current)return;setMessages([{role:'assistant',text:welcome}]);setRequirements({});setDraft('');input.current?.focus();}
 return <section className="shopping-chat" aria-labelledby="chat-title">
  <header className="chat-header"><div className="chat-avatar" aria-hidden="true">c</div><div><h1 id="chat-title">Chauffeur</h1><p>Your shopping conversation</p></div><button className="chat-reset" type="button" onClick={reset} disabled={pending} aria-label="Start a new chat"><RotateCcw size={16}/><span>Start again</span></button></header>
  <div className="chat-thread" ref={thread} role="log" aria-label="Shopping messages" aria-live="polite" aria-relevant="additions">
   <p className="chat-date">Today · Live discovery</p>
   {messages.map((message,i)=><div className={`chat-message chat-${message.role}`} key={i}><span className="chat-sender">{message.role==='user'?'You':'Chauffeur'}</span><p className="chat-text">{message.text}</p>
    {message.retry&&<button type="button" className="chat-chip" disabled={pending} onClick={()=>send('Try again')}>Try again</button>}
    {message.result&&<>
     <div className="chat-store-status">{message.result.stores.map(store=><p key={store.store}><strong>{store.store}</strong>: {store.status==='matched'?'live matches found':store.status==='unavailable'?'live access unavailable':'no verified matches'}{store.status!=='matched'&&<> · <a href={store.searchUrl} target="_blank" rel="noopener noreferrer">Open store search</a></>}</p>)}</div>
     <div className="chat-products">{message.result.options.map(option=><article className="chat-product" key={option.url}><span className="chat-store">{option.store}</span><h2>{option.title}</h2><p className="chat-price">{option.priceFrom?'From ':''}₹{option.price.toLocaleString('en-IN')}</p><p>{option.colour||'Colour not confirmed'} · {option.fabric||'Fabric not confirmed'}</p><p className="chat-product-note">{option.source==='listing'?'From the live store search; details and variants need checking.':'Product details checked.'} Checked {new Date(option.observedAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}.</p><a href={option.url} className="chat-product-link" target="_blank" rel="noopener noreferrer">View on {option.store}</a></article>)}</div>
     {message.result.options.length>0&&<p className="chat-disclosure">Requested size availability is not verified. “From” prices may vary by size or variant. Account, location, delivery and offers may change the total. Confirm details on the store; Chauffeur won't place orders.</p>}
    </>}
   </div>)}
   {pending&&<div className="chat-message chat-assistant chat-checking" role="status"><span className="chat-sender">Chauffeur</span><p>Checking Flipkart and Amazon… This can take a minute.</p></div>}
  </div>
  <div className="chat-suggestions" aria-label="Suggested replies">{suggestions(requirements).map(text=><button className="chat-chip" type="button" key={text} onClick={()=>send(text)} disabled={pending}>{text}</button>)}</div>
  <form className="chat-composer" onSubmit={e=>{e.preventDefault();send(draft);}} aria-busy={pending}><label className="sr-only" htmlFor="chat-message">Message Chauffeur</label><input id="chat-message" ref={input} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Try: blue cotton kurta, M, under ₹1,000" maxLength={1000} autoComplete="off" disabled={pending}/><button type="submit" className="chat-send" aria-label="Send message" disabled={pending||!draft.trim()}><Send size={20}/></button></form>
  <p className="chat-footer">Discovery only. Chat clears on reload. Type “reset” to start again.</p>
 </section>;
}
