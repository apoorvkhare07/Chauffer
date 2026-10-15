import React,{useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowUpRight,MessageCircle,Sparkles,Check,CalendarDays} from 'lucide-react';
const steps=[
 {label:'A need is felt',title:'A new day. Something to wear.',body:'Monday meetings. A dinner invitation. Or just that feeling: your wardrobe could use something more you.',note:'Start with your day'},
 {label:'Tell your assistant',title:'Send a thought. Start a conversation.',body:'“A fresh office look. ₹1,500 tak.” Your occasion, budget and dislikes belong in the same conversation.',note:'Web chat live · WhatsApp planned'},
 {label:'Discover your options',title:'Less searching. More possibilities.',body:'Explore store photos, listed prices and the reasons behind each suggestion. Say what feels right—or what doesn’t.',note:'Live discovery on the web'},
 {label:'Find your best fit',title:'Your taste. A clearer choice.',body:'Recommendations adapt to your feedback. Review wardrobe pairings, fresh listed prices and readable offer terms before deciding.',note:'Exact checkout savings and offer eligibility still need verification'},
 {label:'Buy with one click',title:'One last look. One clear approval.',body:'Our goal: review your size, address and final total, then approve a purchase in one click. Today, buying happens on the store.',note:'One-click buying planned'},
];
const photos=[['mens-shirt.jpg','An everyday shirt'],['white-floral-kurta.jpg','A floral outfit'],['sneakers.jpg','Everyday sneakers'],['leather-bag.jpg','A finishing touch']];
// Each real photo travels through the same five scenes: x, y, scale and tilt.
const poses=[
 [[-30,100,.72,-12],[140,85,.8,10],[125,25,.6,-8],[290,-15,.6,12]],
 [[-315,10,.78,-12],[300,-20,.8,10],[-240,115,.6,8],[240,130,.6,-8]],
 [[-270,0,.88,0],[-90,0,.88,0],[90,0,.88,0],[270,0,.88,0]],
 [[-245,0,.95,-6],[-340,50,.55,-14],[-295,120,.5,10],[315,80,.6,12]],
 [[-115,-5,1.12,-7],[-300,65,.6,-15],[290,-10,.7,10],[290,120,.55,-8]],
];
function World({progress,travel=progress}){
 const from=Math.min(3,Math.floor(progress)),mix=Math.min(1,Math.max(0,progress-from)),ease=mix*mix*(3-2*mix);
 const visibility=i=>Math.max(0,1-Math.abs(progress-i)*2);
 return <div className="story-world" style={{'--parallax':`${Math.max(-.16,Math.min(.16,travel-progress))*80}px`}}><div className="story-aura" aria-hidden="true"/><div className="story-depth-ring" aria-hidden="true"/>{photos.map(([src,label],i)=>{const pose=poses[from][i].map((v,j)=>v+(poses[from+1][i][j]-v)*ease);return <figure className={`story-photo story-photo-${i}`} key={src} style={{'--x':pose[0],'--y':pose[1]+Math.max(-.16,Math.min(.16,travel-progress))*(i%2?55:-75),'--scale':pose[2],'--tilt':`${pose[3]}deg`,opacity:i>1?Math.min(1,progress):1}}><img src={`/images/${src}`} alt={label} loading="lazy"/><figcaption>{label}</figcaption></figure>;})}
 <div className="story-overlay story-need" style={{opacity:visibility(0)}} aria-hidden={progress>.25}><div className="story-calendar"><CalendarDays size={22}/><span>MONDAY</span><strong>09</strong><p>First day.<br/>Fresh start.</p></div><div className="story-thought"><Sparkles size={20}/><p>Something comfortable.<br/>Something like me.</p></div></div>
 <div className="story-overlay story-chat" style={{opacity:visibility(1),transform:`translate(-50%,calc(-50% + ${(1-visibility(1))*25}px))`}} aria-hidden={progress<.75||progress>1.25}><div className="story-chat-head"><Sparkles size={18}/><span>chauffeur<small>Your fashion assistant</small></span></div><p className="story-bubble">Hi! Help me find an office look. Size M, ₹1,500 tak.</p><p className="story-reply">Got it. Anything you’d like me to avoid?</p><p className="story-bubble">Clean lines. Nothing too busy.</p><span className="story-demo-label">Example conversation</span></div>
 <div className="story-overlay story-refine" style={{opacity:visibility(2)}} aria-hidden={progress<1.75||progress>2.25}><Sparkles size={15}/> “More like this. A little less formal.”</div>
 <div className="story-overlay story-checks" style={{opacity:visibility(3)}} aria-hidden={progress<2.75||progress>3.25}><span className="story-card-kicker">Before you decide</span><h4>The one that feels right.</h4><p><Check size={15}/>How it works with your wardrobe</p><div className="story-price-example"><span>Example store A</span><strong>₹1,299</strong></div><div className="story-price-example"><span>Example store B</span><strong>₹1,149</strong></div><small>Fictional comparison. Check size, fees and offer eligibility on the store.</small></div>
 <div className="story-overlay story-choice" style={{opacity:visibility(4)}} aria-hidden={progress<3.75}><span className="story-card-kicker">The next chapter</span><h4>One last look.</h4><div className="story-final-review"><p><span>Your choice</span>Your outfit &amp; size</p><p><span>Deliver to</span>Your saved address</p><p><span>Before approval</span>Confirm the final total</p></div><span className="story-choice-badge"><ArrowUpRight size={15}/> Your final say</span></div>
 <span className="story-photo-note">Style inspiration · these photos are not live recommendations</span></div>;
}
export default function ShoppingJourney(){
 const track=useRef(null),[travel,setTravel]=useState(0),[staticMode,setStaticMode]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce), (max-height: 600px)');const sync=()=>setStaticMode(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[]);
 useEffect(()=>{if(staticMode)return;let frame=0,snapTimer;
 const update=()=>{frame=0;const el=track.current;if(!el)return;const distance=el.offsetHeight-window.innerHeight;setTravel(Math.max(0,Math.min(4,-el.getBoundingClientRect().top/Math.max(1,distance)*4)));};
 const settle=()=>{const el=track.current;if(!el)return;const distance=el.offsetHeight-window.innerHeight,top=el.getBoundingClientRect().top,raw=-top/Math.max(1,distance)*4;if(raw<=.12||raw>=3.88)return;const target=window.scrollY+top+Math.round(raw)*distance/4;if(Math.abs(window.scrollY-target)>2)window.scrollTo({top:target,behavior:'instant'});};
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);clearTimeout(snapTimer);snapTimer=setTimeout(settle,130);};
 update();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',update);return()=>{cancelAnimationFrame(frame);clearTimeout(snapTimer);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',update);};},[staticMode]);
 const progress=Math.round(travel);
 const active=Math.min(4,Math.round(progress));
 return <section id="how-it-works" className={`shopping-story ${staticMode?'story-static':''}`} aria-label="How shopping with Chauffeur works"><div className="story-intro cs-wrap"><p className="cs-eyebrow">How shopping with Chauffeur works</p><h2>From “I need an outfit”<br/><em>to your next favourite.</em></h2><p>Discovery is live on the web. Here’s how the full experience comes together.</p><span><ArrowDown size={15}/> Scroll to see it come together</span></div>{staticMode?<div className="story-static-scenes">{steps.map((s,i)=><article key={s.label}><p className="cs-eyebrow">0{i+1} / {s.label}</p><World progress={i}/><h3>{s.title}</h3><p>{s.body}</p><small>{s.note}</small></article>)}</div>:<div className="story-track" ref={track}><div className="story-pinned" tabIndex={0} aria-label="Shopping story: scroll to explore"><div className="story-chapters" aria-label="Story progress">{steps.map((s,i)=><span key={s.label} aria-current={active===i?'step':undefined}><b>0{i+1}</b><span>{s.label}</span></span>)}</div><div className="story-title"><span className="cs-eyebrow">0{active+1} / 05</span><h3>{steps[active].title}</h3></div><World progress={progress} travel={travel}/><div className="story-explanation"><p>{steps[active].body}</p><small>{steps[active].note}</small></div><div className="story-progress" aria-hidden="true"><span style={{transform:`scaleX(${progress/4})`}}/></div></div></div>}<div className="story-end"><a className="cs-button" href="/app/">Start your conversation <MessageCircle size={16}/></a></div></section>;
}
