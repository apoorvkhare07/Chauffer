import React,{useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowUpRight,MessageCircle,Sparkles,Check} from 'lucide-react';
const steps=[
 {label:'A need is felt',title:'Something new. Something you.',body:'A Monday meeting. A weekend away. Start with the moment you’re dressing for.',note:'Your occasion is the starting point'},
 {label:'Tell your assistant',title:'A thought becomes a conversation.',body:'Say what you need, your budget and what feels like you. Refine it together.',note:'Web chat live · WhatsApp planned'},
 {label:'Discover',title:'Possibilities, brought together.',body:'Explore real store photos and listed prices. Tell your assistant what you like—and what to change.',note:'Live discovery on Flipkart and Amazon'},
 {label:'Compare & personalise',title:'Find the fit for your life.',body:'Review wardrobe pairings, refresh listed prices and read available offer terms before deciding.',note:'Final size, fees and offer eligibility need checking on the store'},
 {label:'Make it yours',title:'Your choice. Your final say.',body:'Today, open your favourite on the store and buy there. One-click buying with your assistant is our next chapter.',note:'Assisted checkout is planned'},
];
const photos=[['mens-shirt.jpg','An everyday shirt'],['white-floral-kurta.jpg','A floral outfit'],['sneakers.jpg','Everyday sneakers'],['leather-bag.jpg','A finishing touch']];
// Each real photo travels through the same five scenes: x, y, scale and tilt.
const poses=[
 [[-270,5,.95,-13],[-85,-30,1.05,5],[125,25,.9,-8],[290,-15,.85,12]],
 [[-315,10,.78,-12],[300,-20,.8,10],[-240,115,.6,8],[240,130,.6,-8]],
 [[-270,0,.88,0],[-90,0,.88,0],[90,0,.88,0],[270,0,.88,0]],
 [[-245,0,.95,-6],[-340,50,.55,-14],[-295,120,.5,10],[315,80,.6,12]],
 [[-115,-5,1.12,-7],[-300,65,.6,-15],[290,-10,.7,10],[290,120,.55,-8]],
];
function World({progress}){
 const from=Math.min(3,Math.floor(progress)),mix=Math.min(1,Math.max(0,progress-from)),ease=mix*mix*(3-2*mix);
 const visibility=i=>Math.max(0,1-Math.abs(progress-i)*2);
 return <div className="story-world"><div className="story-aura" aria-hidden="true"/>{photos.map(([src,label],i)=>{const pose=poses[from][i].map((v,j)=>v+(poses[from+1][i][j]-v)*ease);return <figure className={`story-photo story-photo-${i}`} key={src} style={{'--x':pose[0],'--y':pose[1],'--scale':pose[2],'--tilt':`${pose[3]}deg`}}><img src={`/images/${src}`} alt={label} loading="lazy"/><figcaption>{label}</figcaption></figure>;})}
 <div className="story-overlay story-chat" style={{opacity:visibility(1),transform:`translate(-50%,calc(-50% + ${(1-visibility(1))*25}px))`}} aria-hidden={progress<.75||progress>1.25}><div className="story-chat-head"><Sparkles size={18}/><span>chauffeur<small>Your fashion assistant</small></span></div><p className="story-bubble">An easy office look. Under ₹1,500.</p><p className="story-reply">Let’s find your kind of everyday. What colours do you reach for?</p><p className="story-bubble">Soft colours. Nothing too busy.</p><span className="story-demo-label">Example conversation</span></div>
 <div className="story-overlay story-refine" style={{opacity:visibility(2)}} aria-hidden={progress<1.75||progress>2.25}><Sparkles size={15}/> “More like this. A little less formal.”</div>
 <div className="story-overlay story-checks" style={{opacity:visibility(3)}} aria-hidden={progress<2.75||progress>3.25}><span className="story-card-kicker">Before you decide</span><h4>A little more considered.</h4><p><Check size={15}/>How it works with your wardrobe</p><p><Check size={15}/>Fresh listed prices</p><p><Check size={15}/>Readable offer terms</p><small>Review the final details on the store.</small></div>
 <div className="story-overlay story-choice" style={{opacity:visibility(4)}} aria-hidden={progress<3.75}><span className="story-card-kicker">The next chapter</span><h4>Love it?<br/>Make it yours.</h4><p>Discover here.<br/>Buy on the store.</p><span className="story-choice-badge"><ArrowUpRight size={15}/> Your final say</span></div>
 <span className="story-photo-note">Style inspiration · these photos are not live recommendations</span></div>;
}
export default function ShoppingJourney(){
 const track=useRef(null),[progress,setProgress]=useState(0),[staticMode,setStaticMode]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce), (max-height: 600px)');const sync=()=>setStaticMode(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[]);
 useEffect(()=>{if(staticMode)return;let frame=0;const update=()=>{frame=0;const el=track.current;if(!el)return;const rect=el.getBoundingClientRect(),distance=el.offsetHeight-window.innerHeight;const raw=Math.max(0,Math.min(4,-rect.top/Math.max(1,distance)*4));const whole=Math.floor(raw);setProgress(Math.min(4,whole+Math.max(0,Math.min(1,(raw-whole-.2)/.6))));};const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};update();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};},[staticMode]);
 const active=Math.min(4,Math.round(progress));
 return <section id="how-it-works" className={`shopping-story ${staticMode?'story-static':''}`} aria-label="How shopping with Chauffeur works"><div className="story-intro cs-wrap"><p className="cs-eyebrow">How shopping with Chauffeur works</p><h2>One thought.<br/><em>A world of possibilities.</em></h2><p>Your style, from the first thought to the final choice.</p><span><ArrowDown size={15}/> Scroll to see it come together</span></div>{staticMode?<div className="story-static-scenes">{steps.map((s,i)=><article key={s.label}><p className="cs-eyebrow">0{i+1} / {s.label}</p><World progress={i}/><h3>{s.title}</h3><p>{s.body}</p><small>{s.note}</small></article>)}</div>:<div className="story-track" ref={track}><div className="story-pinned" tabIndex={0} aria-label="Shopping story: scroll to explore"><div className="story-chapters" aria-label="Story progress">{steps.map((s,i)=><span key={s.label} aria-current={active===i?'step':undefined}><b>0{i+1}</b><span>{s.label}</span></span>)}</div><div className="story-title"><span className="cs-eyebrow">0{active+1} / 05</span><h3>{steps[active].title}</h3></div><World progress={progress}/><div className="story-explanation"><p>{steps[active].body}</p><small>{steps[active].note}</small></div><div className="story-progress" aria-hidden="true"><span style={{transform:`scaleX(${progress/4})`}}/></div></div></div>}<div className="story-end"><a className="cs-button" href="/app/">Start your conversation <MessageCircle size={16}/></a></div></section>;
}
