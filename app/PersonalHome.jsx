import React,{useRef,useState} from 'react';
import {ArrowUp,ArrowUpRight,Compass,MessageCircle} from 'lucide-react';
import DiscoveryBrowse from './DiscoveryBrowse.jsx';
import {useTryOnBasket} from './TryOnBasket.jsx';
import ShoppingInput from './ShoppingInput.jsx';
import VoiceComposer from './VoiceComposer.jsx';
const starters=['Everyday sneakers under ₹5,000','A look for a weekend brunch','A blue shirt for work'];
export default function PersonalHome({onAsk,busy=false,hasConversation=false}){
 const [text,setText]=useState(''),input=useRef(null);
 const basket=useTryOnBasket();
 function tryOn(item){basket.add({kind:'catalog',id:item.id,url:item.option.url},true);}
 function draft(value){setText(value);input.current?.focus();}
 return <section className="personal-home discover-home" aria-labelledby="personal-home-title">
  <header className="workspace-heading"><div><h1 id="personal-home-title">Discover</h1><p>Find your next favourite.</p></div>{hasConversation&&<a className="chat-chip" href="#/search"><MessageCircle size={16}/> Continue your search</a>}</header>
  <div className="discover-search-card"><label className="discover-search-label" htmlFor="personal-request">What are you looking for?</label><form className="personal-search" onSubmit={e=>{e.preventDefault();if(text.trim())onAsk(text.trim());}}><ShoppingInput disabled={busy} onDraft={draft}/><input ref={input} id="personal-request" value={text} onChange={e=>setText(e.target.value)} maxLength={1000} placeholder="A piece, an occasion, or a whole new look…" disabled={busy}/><VoiceComposer value={text} onText={setText} disabled={busy} label="Talk to chauffer."/><button aria-label="Search fashion" disabled={busy||!text.trim()}><ArrowUp size={21}/></button></form><div className="discover-starters" aria-label="Ideas to get started">{starters.map(t=><button key={t} type="button" disabled={busy} onClick={()=>draft(t)}>{t}<ArrowUpRight size={14}/></button>)}</div></div>
  <DiscoveryBrowse onTryOn={tryOn}/>
 </section>;
}
