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
    let frame = 0;
    const update = () => {
      frame = 0;
      const element = section.current;
      const travel = element.offsetHeight - element.firstElementChild.offsetHeight;
      const progress = Math.max(0, Math.min(1, -element.getBoundingClientRect().top / Math.max(1, travel)));
      const viewport = element.firstElementChild;
      const copy = element.querySelector('.finale-copy');
      const footer = element.querySelector('.cs-footer');
      const room = viewport.offsetHeight - footer.offsetHeight - 40 - copy.offsetTop - copy.offsetHeight;
      element.style.setProperty('--finale-copy-travel', `${Math.max(0, Math.min(viewport.offsetHeight * .16, room))}px`);
      element.style.setProperty('--finale-progress', String(progress));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const sizing = new ResizeObserver(schedule);
    sizing.observe(section.current.firstElementChild);
    sizing.observe(section.current.querySelector('.finale-copy'));
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => {
      observer.disconnect();
      sizing.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);
  return <div ref={section} className={`shopping-finale${entered ? ' has-entered' : ''}`}>
    <div className="finale-viewport"><div className="finale-gradient" aria-hidden="true"/>
    <section className="finale-content" aria-labelledby="finale-title">
      <div className="finale-art" aria-hidden="true"><FashionLoader decorative sustained paused={!entered} label=""/></div>
      <div className="finale-copy"><div className="finale-messages"><div className="finale-intro-message"><h2 id="finale-title">Your next favourite<br/>starts with <em>a conversation.</em></h2><p>Find your next favourite. Rediscover your wardrobe.<br/>Make fashion feel more like you.</p></div><h2 className="finale-next-message">Get the best of<br/><em>your wardrobe.</em></h2></div>
      <form data-analytics="landing_search" className="fashion-entry-search finale-search" onSubmit={event => { event.preventDefault(); if (text.trim()) window.location.href = liveLink(text.trim()); }}>
        <Search size={21} aria-hidden="true"/><label className="sr-only" htmlFor="finale-query">What would you like to shop for?</label><input id="finale-query" value={text} onChange={event => setText(event.target.value)} maxLength={1000} required placeholder="What do you have in mind?"/><button aria-label="Find with your shopping assistant" disabled={!text.trim()}><ArrowRight size={22}/></button>
      </form></div>
    </section>
    <SiteFooter/>
    </div>
  </div>;
}
