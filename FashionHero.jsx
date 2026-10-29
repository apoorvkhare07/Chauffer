import React, {useEffect, useRef, useState} from 'react';
import {ArrowRight, Search, Sparkles, Shirt, Video, UserRound, Images} from 'lucide-react';
import './fashion-hero.css';
import TryOnPair from './TryOnPair.jsx';

function HeroMotion({visible}) {
  const video=useRef(null);
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync=()=>{if(!video.current)return;if(visible&&!media.matches&&!document.hidden)video.current.play().catch(()=>{});else video.current.pause();};
    sync();media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
    return()=>{media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);};
  },[visible]);
  return <video ref={video} src="/videos/creator-motion.mp4" poster="/images/creator-motion-poster.webp" muted loop playsInline preload="none"/>;
}
function FeatureCards({visible}) {
  return <div className={`hero-feature-floats hero-latest-features ${visible?'':'is-paused'}`} aria-hidden="true">
    <div className="hero-feature-card feature-discovery"><img src="/images/hero-cobalt-knit.webp" alt=""/><span>Find your next favourite</span></div>
    <div className="hero-feature-card feature-chat feature-product-model"><div className="hero-editorial-photo"><img src="/images/creator-editorial-shoot.webp" alt=""/><img className="hero-product-inset" src="/images/tryon-blue-product.webp" alt=""/></div><span>Product to model</span></div>
    <div className="hero-feature-card feature-wardrobe"><div className="feature-card-label"><Shirt size={14}/> Your wardrobe</div><div className="feature-closet-pieces"><img src="/images/wardrobe-slate-overshirt.jpg" alt=""/><img src="/images/wardrobe-sand-trousers.jpg" alt=""/><img src="/images/wardrobe-white-sneakers.jpg" alt=""/></div><span>More ways to wear it</span></div>
    <div className="hero-feature-card feature-tryon"><div className="feature-tryon-photo"><TryOnPair name="jeans"/><TryOnPair name="jeans" after/></div><span><Sparkles size={12}/> Virtual try-on</span></div>
    <div className="hero-feature-card feature-bag feature-video"><div className="hero-video-frame"><HeroMotion visible={visible}/></div><span><Video size={12}/> Photo to video</span></div>
    <div className="hero-feature-card feature-calendar feature-model"><img src="/images/creator-editorial-avatar.webp" alt=""/><span>Your own model</span></div>
  </div>;
}
export default function FashionHero({liveLink,searchRef,sourceRef}) {
  const [text,setText]=useState(''),[visible,setVisible]=useState(true);
  const scene=useRef(null);
  useEffect(()=>{
    const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting));observer.observe(scene.current);
    return()=>observer.disconnect();
  },[]);
  return <section ref={scene} className="fashion-scene public-fashion-hero hero-feature-layout" aria-labelledby="fashion-title">
    <FeatureCards visible={visible}/>
    <div className="hero-feature-content">
      <h1 id="fashion-title">Your personal assistant for <span>everything fashion.</span></h1>
      <div ref={sourceRef} className="fashion-search-origin">
        <form data-analytics="hero_search" ref={searchRef} className="fashion-entry-search search-handoff-source" onSubmit={event=>{event.preventDefault();if(text.trim())window.location.href=liveLink(text.trim());}}>
          <Search size={21} aria-hidden="true"/>
          <label className="sr-only" htmlFor="hero-query">Describe what you’re looking for</label>
          <input id="hero-query" value={text} onChange={event=>setText(event.target.value)} placeholder="Find your next look" maxLength={1000} required/>
          <button aria-label="Continue to your shopping assistant" disabled={!text.trim()}><ArrowRight size={22}/></button>
        </form>
      </div>
      <ul className="hero-feature-tags" aria-label="Fashion assistant features">
        <li><a href="#shop-by-occasion"><span className="hero-tag-photo"><img src="/images/tryon-blue-blouse-after.webp" alt=""/></span>Virtual try-on</a></li>
        <li><a href="/app/#/search"><span className="hero-tag-photo"><img src="/images/hero-cherry-bag.webp" alt=""/></span>Discover & style</a></li>
        <li><a href="#your-wardrobe"><span className="hero-tag-photo"><img src="/images/wardrobe-slate-overshirt.jpg" alt=""/></span>Wardrobe</a></li>
        <li><a href="#creator-photos"><span className="hero-tag-icon"><Images size={16}/></span>Product to model</a></li>
        <li><a href="#creator-video"><span className="hero-tag-icon"><Video size={16}/></span>Photo to video</a></li>
        <li><a href="#creator-model"><span className="hero-tag-icon"><UserRound size={16}/></span>Your own model</a></li>
      </ul>
    </div>
  </section>;
}
