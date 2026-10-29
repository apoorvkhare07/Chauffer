import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ArrowUpRight, CalendarDays, Shirt, Bookmark, Check} from 'lucide-react';
import './wardrobe-edit.css';

const pieces = [
  ['wardrobe-slate-overshirt.jpg','The easy overshirt'],['wardrobe-sand-trousers.jpg','Linen trousers'],
  ['wardrobe-white-sneakers.jpg','Everyday sneakers'],['wardrobe-indigo-blouse.jpg','A little print'],
  ['wardrobe-tan-crossbody.jpg','Your go-to bag'],['wardrobe-brown-loafers.jpg','Weekend loafers'],
];
const views = [
  {label:'Your pieces',title:['You have more to wear','than you think.'],intro:'Bring your favourites together. Find a new combination without buying a thing.',icon:Shirt,copy:'See your clothes together. Find a fresh way to wear them.'},
  {label:'Your calendar',title:['Good outfits.','Ahead of time.'],intro:'Remember what you wore and line up your next look. One less thing to think about.',icon:CalendarDays,copy:'What you wore. What’s next. A plan for every day.'},
  {label:'Your wishlist',title:['Love it?','Make room for it.'],intro:'Keep your favourite finds together. Plan the next purchase around your month.',icon:Bookmark,copy:'Keep your favourite finds in sight—and your budget in mind.'},
];
function Closet(){return <div className="closet-preview"><div className="wardrobe-preview-top"><strong>A little outfit inspiration</strong><span>From your wardrobe</span></div><div className="closet-pieces">{pieces.map(([src,name])=><div key={src}><img src={`/images/${src}`} alt={name} loading="lazy" width="180" height="160"/><span>{name}</span></div>)}</div><div className="closet-outfit"><span className="closet-check"><Check size={18}/></span><div><strong>Friday? Already sorted.</strong><p>Overshirt + linen trousers + your favourite sneakers.</p></div></div></div>}
function Calendar(){const filled=[3,5,8,11,13,15,18,20,22,24,26,28,30];return <div className="calendar-preview"><div className="wardrobe-preview-top"><strong>October <span>2026</span></strong><span>A month of good outfits</span></div><div className="outfit-month" aria-label="Illustrative October outfit calendar">{['S','M','T','W','T','F','S'].map((d,i)=><span className="month-weekday" key={`w${i}`}>{d}</span>)}{Array.from({length:35},(_,i)=>{const d=i-3;return <div key={i} className={`outfit-date ${d===23?'today':''} ${d>23?'planned':''} ${[26,28,30].includes(d)?'buy-day':''}`}><span>{d>0?d:''}</span>{filled.includes(d)&&<img src={`/images/${({26:"hero-cobalt-knit.webp",28:"hero-cherry-bag.webp",30:"wardrobe-ballet-flats.jpg"})[d]||pieces[d%6][0]}`} alt={`${d} October: ${[26,28,30].includes(d)?'saved purchase':d>23?'planned outfit':'worn outfit'}`} loading="lazy"/>}</div>})}</div><div className="month-legend"><span><i/> Worn</span><span><i/> Planned</span><span><i/> To buy</span></div></div>}
function Wishlist(){return <div className="wishlist-preview"><div className="wardrobe-preview-top"><strong>A little room for something new</strong><span>October budget</span></div><div className="wishlist-budget"><span>₹6,500 <small>of ₹10,000 planned</small></span><div><i/></div><p>₹3,500 left to play with</p></div><div className="wishlist-items">{[['hero-cobalt-knit.webp','That blue knit','26 Oct','₹2,500'],['hero-cherry-bag.webp','A bag for everywhere','28 Oct','₹2,800'],['wardrobe-ballet-flats.jpg','The everyday pair','30 Oct','₹1,200']].map(([src,label,date,price])=><div key={src}><img src={`/images/${src}`} alt="" loading="lazy"/><div><strong>{label}</strong><span>Saved for {date}</span></div><strong>{price}</strong></div>)}</div></div>}
export default function WardrobeSpiral(){
 const [active,setActive]=useState(0),[departing,setDeparting]=useState(null),[reduced,setReduced]=useState(true);
 const section=useRef(null),stage=useRef(null),activeRef=useRef(0),transition=useRef(null);
 const order=[active,(active+1)%3,(active+2)%3];
 const show=useCallback(index=>{
  const previous=activeRef.current;if(index===previous)return;
  clearTimeout(transition.current);activeRef.current=index;setActive(index);
  setDeparting(!reduced&&index===previous+1?previous:null);
  transition.current=setTimeout(()=>setDeparting(null),720);
 },[reduced]);
 useEffect(()=>()=>clearTimeout(transition.current),[]);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const motion=()=>setReduced(media.matches);motion();media.addEventListener('change',motion);
  return()=>media.removeEventListener('change',motion);
 },[]);
 useEffect(()=>{
  let frame=0;
  const update=()=>{
   frame=0;
   const rect=section.current.getBoundingClientRect();
   const travel=Math.max(1,rect.height-stage.current.offsetHeight);
   const progress=Math.max(0,Math.min(1,-rect.top/travel));
   const index=Math.min(2,Math.floor(progress*3));
   show(index);
   section.current.style.setProperty('--wardrobe-progress',`${Math.min(1,progress*3-index)*100}%`);
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  const observer=new ResizeObserver(schedule);observer.observe(section.current);observer.observe(stage.current);
  update();return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
 },[show]);
 function select(index){
  const rect=section.current.getBoundingClientRect();
  const travel=rect.height-stage.current.offsetHeight;
  window.scrollTo({top:window.scrollY+rect.top+travel*(index+.15)/3,behavior:reduced?'instant':'smooth'});
 }
 return <section ref={section} className="wardrobe-edit wardrobe-tour wardrobe-scroll-tour" id="your-wardrobe" aria-labelledby="wardrobe-title">
 <div ref={stage} className="wardrobe-sticky-stage"><div className="cs-wrap wardrobe-edit-layout">
  <div className="wardrobe-edit-copy"><span className="section-label">Your wardrobe, together</span><div className="wardrobe-changing-copy" key={active}><h2 id="wardrobe-title">{views[active].title[0]}<br/>{views[active].title[1]}</h2><p>{views[active].intro}</p></div>
   <div className="wardrobe-view-choices" role="group" aria-label="Explore wardrobe features">{views.map(({label,icon:Icon,copy},i)=><button type="button" aria-pressed={active===i} aria-controls="wardrobe-preview-panel" onClick={()=>select(i)} key={label}><span className="wardrobe-choice-icon"><Icon size={21}/></span><span className="wardrobe-choice-copy"><strong>{label}</strong><span>{copy}</span></span><ArrowUpRight className="wardrobe-choice-arrow" size={19}/><span className="wardrobe-choice-progress" aria-hidden="true"/></button>)}</div>
   <a className="tryon-primary wardrobe-primary" href="/app/#/wardrobe">Open your wardrobe <ArrowUpRight size={17}/></a>
  </div>
  <div className="wardrobe-demo">
   <div className="wardrobe-tour-toolbar"><span><i aria-hidden="true"/>{active+1} / 3 <strong>{views[active].label}</strong></span></div>
   <div id="wardrobe-preview-panel" className="wardrobe-card-stack" role="region" aria-label={views[active].label}>
    {views.map((view,index)=><div key={view.label} className={`wardrobe-preview-panel wardrobe-stack-card wardrobe-scene-${index} ${departing===index?'is-departing':''}`} data-rank={order.indexOf(index)} aria-hidden={index!==active} inert={index!==active} style={{'--card-rank':order.indexOf(index)}}>{index===0?<Closet/>:index===1?<Calendar/>:<Wishlist/>}</div>)}
   </div>
   <div className="wardrobe-tour-footer"><span className="wardrobe-stack-hint"><span>Scroll to explore</span><span>Scroll to explore</span></span><span>{active===0?'Your clothes. A few new possibilities.':active===1?'Your week, with one less thing to think about.':'A little room for the things you love.'}</span></div>
  </div>
 </div></div>
 </section>;
}
