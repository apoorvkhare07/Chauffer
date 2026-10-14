import React, { useEffect, useRef, useState } from 'react';
import { Asterisk, Check, MessageCircle, Pause, Play, ScanLine, Search, SlidersHorizontal, Sparkles, ArrowUpRight } from 'lucide-react';

const options = [
  { photo:'mens-shirt', position:'50% 75%', name:'Everyday menswear', query:'Help me style a striped shirt with clothes I own', soft:true },
  { photo:'office-kurta', name:'Prints with personality', query:'Soft pink floral kurtas under ₹1500, size M', soft:false },
  { photo:'sneakers', position:'50% 100%', name:'The right pair', query:'How can I add shoes to my wardrobe for outfit ideas?', soft:true },
  { photo:'leather-bag', position:'50% 65%', name:'Finishing touches', query:'How can I style accessories with my wardrobe?', soft:true },
  { photo:'white-floral-kurta', name:'Easy everyday style', query:'White kurtas with small prints under ₹1500, size M', soft:true },
  { photo:'patterned-kurta', name:'Expressive colour', query:'Colourful printed kurtas under ₹1500, size M', soft:false },
];
const stages = [
  {label:'Understand', title:'I’m getting to know your style.', detail:'Your wardrobe. Your occasion. Your budget.', icon:MessageCircle},
  {label:'Search', title:'I’ll do the searching for you.', detail:'Exploring styles and shopping possibilities.', icon:Search},
  {label:'Match', title:'Let’s find what feels like you.', detail:'Clothes, shoes and the finishing touches.', icon:ScanLine},
  {label:'Shortlist', title:'Your options, picked around you.', detail:'Explore a style, or tell me what to change.', icon:Sparkles},
];
export default function AssistantShoppingBanner(){
  const root=useRef(null),[stage,setStage]=useState(1),[paused,setPaused]=useState(false),[visible,setVisible]=useState(true),[soft,setSoft]=useState(false),[reduced,setReduced]=useState(false);
  useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>{setReduced(media.matches);if(media.matches)setStage(3);};update();media.addEventListener('change',update);const observer=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting),{threshold:.15});observer.observe(root.current);const visibility=()=>setVisible(!document.hidden&&root.current.getBoundingClientRect().bottom>0);document.addEventListener('visibilitychange',visibility);return()=>{media.removeEventListener('change',update);observer.disconnect();document.removeEventListener('visibilitychange',visibility);};},[]);
  useEffect(()=>{if(paused||reduced||!visible)return;const timer=setTimeout(()=>setStage(current=>(current+1)%4),stage===3?5500:3200);return()=>clearTimeout(timer);},[stage,paused,reduced,visible]);
  const status=stages[stage],Icon=status.icon;
  const feedback=()=>{setSoft(value=>!value);setStage(3);setPaused(true);};
  return <div ref={root} className={`asb-banner asb-stage-${stage} ${paused||reduced?'asb-paused':''}`} aria-label="Animated example of an AI assistant shopping for you">
    <div className="asb-top"><span><Asterisk size={18}/>Chauffeur <b>AI</b></span><button type="button" onClick={()=>setPaused(!paused)} aria-label={paused?'Play shopping animation':'Pause shopping animation'} disabled={reduced}>{paused||reduced?<Play size={14}/>:<Pause size={14}/>}</button></div>
    <div className="asb-request"><MessageCircle size={16}/><p>“Help me find a look that feels like me.”</p></div>
    <div className="asb-assistant"><div className="asb-core"><Asterisk size={29}/><span/><span/></div><div className="asb-assistant-copy" aria-live={paused?'polite':'off'}><span>Your personal AI shopper</span><h2>{soft&&stage===3?'Less busy. More your style.':status.title}</h2><p>{soft&&stage===3?'I’ve highlighted the lighter, smaller prints.':status.detail}</p></div><Icon className="asb-task-icon" size={19}/></div>
    <div className="asb-store-flow"><span><Search size={12}/>Flipkart</span><i/><span>Amazon</span><small>{stage===3?'A shortlist shaped by your request':'Browsing for you'}</small></div>
    <div className="asb-options">{options.map((option,i)=>{const chosen=stage===3&&(soft?option.soft:[0,1,3].includes(i));return <a key={option.photo} className={`asb-option ${chosen?'asb-picked':''} ${stage===3&&!chosen?'asb-alternative':''}`} style={{'--scan-delay':`${i*.4}s`}} href={`/app/?q=${encodeURIComponent(option.query)}`}><div className="asb-photo"><img src={`/images/${option.photo}.jpg`} style={option.position?{objectPosition:option.position}:undefined} alt={option.name+' fashion inspiration'} width={1000} height={1500} decoding="async"/><span className="asb-scanner" aria-hidden="true"/>{chosen&&<span className="asb-pick-label"><Check size={11}/>A style to explore</span>}<span className="asb-open"><ArrowUpRight size={13}/></span></div><span className="asb-product-name">{option.name}</span></a>;})}</div>
    <div className="asb-bottom"><div className="asb-timeline" aria-label="Preview shopping stages">{stages.map((item,i)=><button key={item.label} type="button" onClick={()=>{setStage(i);setPaused(true);}} aria-current={stage===i?'step':undefined}>{item.label}</button>)}</div><button className="asb-feedback" type="button" aria-pressed={soft} onClick={feedback}><SlidersHorizontal size={13}/>{soft?'Show a mix again':'Try “less busy”'}<Sparkles size={12}/></button></div>
    <p className="asb-caption">Fashion inspiration for women and men. Live clothing discovery; wider store categories coming next.</p>
  </div>;
}
