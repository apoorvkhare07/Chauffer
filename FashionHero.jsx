import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import SearchPromptInput from './SearchPromptInput.jsx';
import './fashion-hero.css';

const products = [
  ['hero-cherry-bag.webp', 'Cherry shoulder bag'],
  ['hero-cobalt-knit.webp', 'Cobalt striped knit polo'],
  ['home-ivory-kurta.jpg', 'Ivory chikankari kurta'],
  ['wardrobe-ballet-flats.jpg', 'Tan ballet flats'],
  ['wardrobe-slate-overshirt.jpg', 'Slate overshirt'],
  ['home-sage-kurta.jpg', 'Sage block-print kurta'],
  ['wardrobe-watch.jpg', 'Leather-strap watch'],
  ['hero-silver-sneakers.webp', 'Silver retro trainers'],
  ['hero-barrel-denim.webp', 'Charcoal barrel jeans'],
  ['story-women-trousers.jpg', 'Indigo wide-leg trousers'],
  ['wardrobe-canvas-tote.jpg', 'Canvas everyday tote'],
  ['home-indigo-shirt.jpg', 'Printed cotton shirt'],
  ['wardrobe-tan-crossbody.jpg', 'Tan crossbody bag'],
  ['story-men-loafers.jpg', 'Brown leather loafers'],
];

export default function FashionHero({ liveLink, searchRef, sourceRef }) {
  const [text, setText] = useState('');
  const [visible, setVisible] = useState(true);
  const cards = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(cards.current);
    return () => observer.disconnect();
  }, []);
  return <section className="fashion-scene public-fashion-hero hero-reel-layout" aria-labelledby="fashion-title">
    <div className="hero-reel-heading">
      <p className="hero-kicker"><Sparkles size={17}/> Your Fashion AI assistant</p>
      <h1 id="fashion-title">More options.<br/>More <em>you.</em></h1>
    </div>
    <div ref={cards} className={`hero-product-reel hero-product-flight ${!visible ? 'is-paused' : ''}`} aria-hidden="true">
      <div className="hero-flight-stage">
        {[-1, 1].map((side, lane) => <div className="hero-flight-lane" key={side} style={{ '--side': side }}>
          {products.slice(lane * 7, lane * 7 + 7).map(([file, label], i) => <figure className="hero-flight-card" key={file} style={{ '--flight-delay': `${-i * 3 - 1.5}s` }}>
            <img src={`/images/${file}`} alt="" title={label}/>
          </figure>)}
        </div>)}
      </div>
    </div>
    <div className="hero-reel-entry">
      <div ref={sourceRef} className="fashion-search-origin">
        <form data-analytics="hero_search" ref={searchRef} className="fashion-entry-search search-handoff-source" onSubmit={event => { event.preventDefault(); if (text.trim()) window.location.href = liveLink(text.trim()); }}>
          <Search size={21} aria-hidden="true"/>
          <label className="sr-only" htmlFor="hero-query">Describe what you’re looking for</label>
          <SearchPromptInput id="hero-query" value={text} onChange={event => setText(event.target.value)} maxLength={1000} required/>
          <button aria-label="Continue to your shopping assistant" disabled={!text.trim()}><ArrowRight size={22}/></button>
        </form>
      </div>
      <p className="hero-description">Your next find. A fresh way to wear what you own.<br/>An AI assistant that shops around your style.</p>
    </div>
  </section>;
}
