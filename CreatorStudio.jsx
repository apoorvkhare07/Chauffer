import React, {useEffect, useRef, useState} from 'react';
import {Video, Image, UserRound, Play, Pause, Shirt, Check, Heart, MessageCircle, Send, Bookmark} from 'lucide-react';
import './creator-studio.css';

function MotionPreview(){
  const video=useRef(null),frame=useRef(null),wantsPlay=useRef(true);
  const [playing,setPlaying]=useState(false),[failed,setFailed]=useState(false);
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    let inView=false;
    wantsPlay.current=!media.matches;
    const sync=()=>{if(!video.current)return;if(inView&&!document.hidden&&wantsPlay.current)video.current.play().catch(()=>setPlaying(false));else video.current.pause();};
    const motion=()=>{wantsPlay.current=!media.matches;sync();};
    const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;sync();},{threshold:.25});
    observer.observe(frame.current);document.addEventListener('visibilitychange',sync);media.addEventListener('change',motion);
    return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync);media.removeEventListener('change',motion);};
  },[]);
  const toggle=()=>{const el=video.current;if(!el)return;if(el.paused){wantsPlay.current=true;el.play().catch(()=>setFailed(true));}else{wantsPlay.current=false;el.pause();}};
  return <div className="studio-motion" ref={frame}><video ref={video} src="/videos/creator-motion.mp4" poster="/images/creator-motion-poster.webp" muted loop playsInline preload="none" onPlay={()=>{setPlaying(true);setFailed(false);}} onPause={()=>setPlaying(false)} onError={()=>setFailed(true)} aria-label="Sample fashion video: a model walks through a stone colonnade in a neutral outfit"/><div className="studio-video-top"><span>Motion inspiration</span><span>5 sec</span></div><button className="studio-video-toggle" type="button" onClick={toggle} aria-label={playing?'Pause sample video':'Play sample video'}>{playing?<Pause size={17}/>:<Play size={17} fill="currentColor"/>}</button>{failed&&<p className="studio-video-error">The clip couldn’t load. <a href="/videos/creator-motion.mp4">Open the video</a></p>}</div>;
}
function SocialContent(){return <div className="creator-social-previews" aria-label="Social content for fashion brands and influencers">
 <figure className="creator-social-post"><div className="creator-node-label"><Image size={14}/><span>Brand post</span><span>03</span></div><div className="creator-social-frame"><div className="creator-social-account"><span className="creator-social-avatar">b.</span><span>Your fashion brand<small>A new collection, a new story.</small></span><span className="creator-social-more" aria-hidden="true">···</span></div><img src="/images/creator-motion-poster.webp" alt="Example fashion campaign post featuring the trench coat look" loading="lazy" width="1280" height="720"/><div className="creator-social-actions" aria-hidden="true"><Heart size={15}/><MessageCircle size={15}/><Send size={15}/><Bookmark size={15}/></div><p>The look behind your next launch.</p></div><figcaption>Brand campaigns & product posts</figcaption></figure>
 <figure className="creator-social-reel"><div className="creator-node-label"><Video size={14}/><span>Influencer reel</span><span>04</span></div><div className="creator-reel-frame"><MotionPreview/><div className="creator-reel-top"><Video size={13}/><span>Your next reel</span></div><div className="creator-reel-caption"><span>@your.style</span><strong>One look.<br/>Your story.</strong></div><div className="creator-reel-actions" aria-hidden="true"><Heart size={17}/><MessageCircle size={17}/><Send size={17}/></div></div><figcaption>Influencer reels & stories</figcaption></figure>
 </div>;}
export default function CreatorStudio(){
 const canvas=useRef(null),[visible,setVisible]=useState(false);
 const [connections,setConnections]=useState({width:1,height:1,paths:[],origins:[]});
 useEffect(()=>{
  const el=canvas.current;
  const media=['.creator-product-media','.creator-model-media','.creator-social-frame','.creator-reel-frame'].map(selector=>el.querySelector(selector));
  const measure=()=>{
   const bounds=el.getBoundingClientRect();
   const [product,model,post,reel]=media.map(node=>{const r=node.getBoundingClientRect();return {left:r.left-bounds.left,right:r.right-bounds.left,top:r.top-bounds.top,bottom:r.bottom-bounds.top,cx:r.left-bounds.left+r.width/2,cy:r.top-bounds.top+r.height/2};});
   const curve=(a,b)=>`M${a.x} ${a.y} C${(a.x+b.x)/2} ${a.y} ${(a.x+b.x)/2} ${b.y} ${b.x} ${b.y}`;
   const source={x:product.right,y:product.cy},middle={x:model.right,y:model.cy};
   let paths=[curve(source,{x:model.left,y:model.cy})],origins=[source];
   if(window.matchMedia('(max-width:760px)').matches){
    const start={x:model.cx,y:model.bottom},rail=bounds.width-6;
    paths.push(...[post,reel].map(target=>`M${start.x} ${start.y} C${start.x} ${start.y+26} ${rail} ${start.y+26} ${rail} ${start.y+52} L${rail} ${target.cy-22} Q${rail} ${target.cy} ${rail-22} ${target.cy} L${target.right} ${target.cy}`));
    origins.push(start);
   }else{paths.push(...[post,reel].map(target=>curve(middle,{x:target.left,y:target.cy})));origins.push(middle);}
   setConnections({width:bounds.width,height:bounds.height,paths,origins});
  };
  const observer=new ResizeObserver(measure);observer.observe(el);media.forEach(node=>observer.observe(node));measure();
  return()=>observer.disconnect();
 },[]);
 useEffect(()=>{let inView=false;const sync=()=>setVisible(inView&&!document.hidden);const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;sync();},{threshold:.15});observer.observe(canvas.current);document.addEventListener('visibilitychange',sync);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync);};},[]);
 return <section className="creator-studio creator-flow" id="for-creators" aria-labelledby="creator-feature-title">
  <span className="creator-section-anchor" id="creator-photos" aria-hidden="true"/><span className="creator-section-anchor" id="creator-model" aria-hidden="true"/><span className="creator-section-anchor" id="creator-video" aria-hidden="true"/>
  <div className="cs-wrap creator-flow-wrap">
   <header className="creator-flow-heading"><div><span className="section-label">For fashion brands & influencers</span><h2 id="creator-feature-title">More content.<br/>Less production.</h2></div><div className="creator-flow-intro"><p>One product. Your model.<br/>Posts and reels for your next launch.</p><div className="creator-platforms" aria-label="Content for Instagram and Facebook"><span><i className="creator-instagram" aria-hidden="true"/>Instagram</span><span><i className="creator-facebook" aria-hidden="true">f</i>Facebook</span></div></div></header>
   <div className="creator-canvas" ref={canvas} data-visible={visible} aria-label="A product becomes a model photo, then a brand post and an influencer reel">
    <svg className="creator-connections" viewBox={`0 0 ${connections.width} ${connections.height}`} preserveAspectRatio="none" aria-hidden="true">
     {connections.paths.map((d,index)=><g key={index}><path className="creator-wire" d={d}/><path className="creator-signal" pathLength="1" d={d}/></g>)}
     {connections.origins.map((point,index)=><circle key={index} cx={point.x} cy={point.y} r="3"/>)}
    </svg>
    <article className="creator-node creator-product-node">
     <div className="creator-node-label"><Shirt size={14}/><span>Your product</span><span>01</span></div>
     <div className="creator-node-media creator-product-media"><img src="/images/creator-trench-product.webp" alt="A taupe trench coat on a clean studio background" loading="lazy" width="680" height="907"/></div>
     <div className="creator-node-copy"><h3>Direct your shoot.</h3><p>Bring a product photo. Pick the pose, light and background.</p></div>
    </article>
    <article className="creator-node creator-model-node">
     <div className="creator-node-label"><Image size={14}/><span>Your model</span><span>02</span></div>
     <div className="creator-node-media creator-model-media"><img src="/images/creator-motion-poster.webp" alt="Model wearing a taupe trench coat in a sunlit stone colonnade" loading="lazy" width="1280" height="720"/><span className="creator-model-badge"><UserRound size={13}/> Create & reuse <Check size={11}/></span></div>
     <div className="creator-node-copy"><h3>A familiar face. Every time.</h3><p>Create yourself or a brand model. Reuse them for every new look.</p></div>
    </article>
    <SocialContent/>
   </div>
   <p className="studio-provenance"><a href="https://www.pexels.com/video/fashionable-model-walking-in-style-7681897/" target="_blank" rel="noopener noreferrer">Photo & video reference · Mikhail Nilov / Pexels</a></p>
  </div>
 </section>;
}
