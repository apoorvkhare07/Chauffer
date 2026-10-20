import React,{useRef,useState} from 'react';
import {ArrowUp,MessageCircle} from 'lucide-react';
import BrandIcon from '../brand/BrandIcon.jsx';
import DailyFeed from './DailyFeed.jsx';
import ShoppingInput from './ShoppingInput.jsx';
import VoiceComposer from './VoiceComposer.jsx';

export default function PersonalHome({onAsk,busy=false}){
 const [text,setText]=useState(''),input=useRef(null);
 return <section className="personal-home personal-home-agent" aria-labelledby="personal-home-title">
  <div className="personal-assistant-hero">
   <header className="personal-greeting">
    <BrandIcon className="personal-assistant-mark" size={60} animated/>
    <div className="personal-greeting-copy"><h1 id="personal-home-title">What can I help you find?</h1><p>Find a piece, plan a look, or ask for styling advice.</p></div>
   </header>
   <form className="personal-search" onSubmit={e=>{e.preventDefault();if(text.trim())onAsk(text.trim());}}><ShoppingInput disabled={busy} onDraft={draft=>{setText(draft);input.current?.focus();}}/><label className="sr-only" htmlFor="personal-request">Your request for chauffer</label><input ref={input} id="personal-request" value={text} onChange={e=>setText(e.target.value)} maxLength={1000} placeholder="Ask chauffer. about fashion…"/><VoiceComposer value={text} onText={setText} disabled={busy} label="Talk to chauffer."/><button aria-label="Send to chauffer." disabled={busy||!text.trim()}><ArrowUp size={21}/></button></form>
   <p className="personal-home-hint"><MessageCircle size={15}/> Type, add a photo with +, or tap the mic</p>
  </div>

  <DailyFeed/>
 </section>;
}
