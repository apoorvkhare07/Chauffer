import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import FashionLoader from './FashionLoader.jsx';
import { SiteFooter } from './SiteChrome.jsx';
import './shopping-finale.css';

export default function ShoppingFinale({ liveLink }) {
  const section = useRef(null);
  const [entered, setEntered] = useState(false);
  const [text, setText] = useState('');
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setEntered(true); observer.disconnect(); }
    }, { threshold: 0.18 });
    observer.observe(section.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={section} className={`shopping-finale${entered ? ' has-entered' : ''}`}>
    <section className="finale-content" aria-labelledby="finale-title">
      <div className="finale-art" aria-hidden="true"><FashionLoader decorative sustained paused={!entered} label=""/></div>
      <div className="finale-copy"><h2 id="finale-title">Your next favourite<br/>starts with <em>a conversation.</em></h2><p>Find your next favourite. Rediscover your wardrobe.<br/>Make fashion feel more like you.</p>
      <form data-analytics="landing_search" className="fashion-entry-search finale-search" onSubmit={event => { event.preventDefault(); if (text.trim()) window.location.href = liveLink(text.trim()); }}>
        <Search size={21} aria-hidden="true"/><label className="sr-only" htmlFor="finale-query">What would you like to shop for?</label><input id="finale-query" value={text} onChange={event => setText(event.target.value)} maxLength={1000} required placeholder="What do you have in mind?"/><button aria-label="Find with your shopping assistant" disabled={!text.trim()}><ArrowRight size={22}/></button>
      </form></div>
    </section>
    <SiteFooter/>
  </div>;
}
