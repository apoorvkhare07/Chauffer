import React,{useState} from 'react';
import {useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
import {ArrowRight,ArrowUpRight,Sparkles,Shirt,Heart,Search,Compass,BriefcaseBusiness,PartyPopper,Sun} from 'lucide-react';
import FashionLoader from '../FashionLoader.jsx';
import DailyFeed from './DailyFeed.jsx';

export default function PersonalHome({onAsk,busy=false}){
 const conversation=useQuery(api.conversations.current),wardrobe=useQuery(api.wardrobe.list),saved=useQuery(api.savedProducts.list);
 const [text,setText]=useState('');
 const pieces=(wardrobe??[]).filter(item=>item.available).slice(0,3);
 const quickIdeas=[
  {label:'Office outfit',prompt:'Help me put together an outfit for a day at the office.',Icon:BriefcaseBusiness},
  {label:'Wedding guest',prompt:'Help me find an outfit for a wedding as a guest.',Icon:PartyPopper},
  {label:'Weekend plans',prompt:'Suggest an outfit for my weekend plans.',Icon:Sun},
 ];
 return <section className="personal-home personal-home-agent" aria-labelledby="personal-home-title">
  <div className="personal-welcome">
   <header className="personal-greeting">
    <div className="personal-agent-mark" aria-hidden="true"><FashionLoader decorative sustained label=""/></div>
    <div className="personal-greeting-copy"><span className="personal-kicker"><Sparkles size={15}/> YOUR STYLE ASSISTANT</span><h1 id="personal-home-title">What are you looking for today?</h1></div>
   </header>
   <form className="personal-search" onSubmit={e=>{e.preventDefault();if(text.trim())onAsk(text.trim());}}><Search size={20} aria-hidden="true"/><label className="sr-only" htmlFor="personal-request">What are you looking for?</label><input id="personal-request" value={text} onChange={e=>setText(e.target.value)} maxLength={1000} placeholder="A look, a piece, an occasion…"/><button aria-label="Find my options" disabled={busy||!text.trim()}><ArrowRight size={21}/></button></form>
   <div className="personal-prompts" aria-label="Try a common occasion">{quickIdeas.map(({label,prompt,Icon})=><button className="personal-idea-card" key={label} disabled={busy} onClick={()=>onAsk(prompt)}><span className="personal-idea-icon"><Icon size={18}/></span><strong>{label}</strong><ArrowUpRight className="personal-idea-arrow" size={15}/></button>)}</div>
  </div>

  <DailyFeed/>

  {conversation?.requirements?.category&&<a className="personal-resume-strip" href="#/chat"><span className="personal-resume-icon"><Compass size={18}/></span><span><small>YOUR LAST SEARCH</small><strong>Continue exploring {conversation.requirements.category}</strong></span><ArrowRight size={19}/></a>}

  <section className="personal-closet-card" aria-label="Your wardrobe">
   <a href="#/wardrobe" className="personal-closet-link">
    <div className="personal-closet-art" aria-hidden="true">{pieces.length?pieces.map((item,i)=><span className={`personal-closet-photo closet-photo-${i}`} key={item.id}>{item.cleanPhotoUrl?<img src={item.cleanPhotoUrl} alt=""/>:<Shirt size={22}/>}</span>):<span className="personal-closet-empty"><Shirt size={25}/></span>}</div>
    <span className="personal-closet-copy"><small>YOUR CLOSET</small><strong>{wardrobe?.length?`${wardrobe.length} pieces, new combinations`:'Start with one piece you love'}</strong><span>{wardrobe?.length?'Ask your stylist what to wear today.':'Add a photo. Your assistant will organise it.'}</span></span>
    <span className="personal-closet-action">{wardrobe?.length?'Style it':'Add clothes'} <ArrowUpRight size={16}/></span>
   </a>
   <div className="personal-saved-shortcut"><Heart size={15}/><span>{saved?.length??0} saved finds</span><a href="#/saved">Open shortlist <ArrowRight size={14}/></a></div>
  </section>
 </section>;
}
