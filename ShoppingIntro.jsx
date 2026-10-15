import React, { useEffect, useRef } from 'react';
import { ArrowUpRight, Sparkles, Search } from 'lucide-react';
import FashionHero from './FashionHero.jsx';
import BrandIcon from './brand/BrandIcon.jsx';
import './shopping-intro.css';

export default function ShoppingIntro({ liveLink }) {
  const root = useRef(null), source = useRef(null), search = useRef(null), dock = useRef(null);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame;
    const update = () => {
      frame = null;
      if (!source.current || !dock.current || !search.current) return;
      if (reduced.matches) { search.current.removeAttribute('style'); root.current.style.setProperty('--arrive', 1); return; }
      const from = source.current.getBoundingClientRect(), to = dock.current.getBoundingClientRect();
      const start = Math.max(0, from.top + window.scrollY - window.innerHeight * .62);
      const end = to.top + window.scrollY - window.innerHeight * .38;
      const progress = Math.max(0, Math.min(1, (window.scrollY - start) / Math.max(1, end - start)));
      const p = progress * progress * (3 - 2 * progress);
      search.current.style.transform = `translate(${(to.left - from.left) * p}px, ${(to.top - from.top) * p}px)`;
      search.current.style.width = `${from.width + (to.width - from.width) * p}px`;
      root.current.style.setProperty('--arrive', Math.max(0, Math.min(1, (progress - .4) / .6)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(root.current);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reduced.addEventListener('change', schedule);
    update();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); reduced.removeEventListener('change', schedule); };
  }, []);
  return <div className="shopping-intro" ref={root}>
    <FashionHero liveLink={liveLink} sourceRef={source} searchRef={search}/>
    <section className="shopping-list-story cs-wrap" id="shop-by-occasion" aria-labelledby="shopping-list-title">
      <div className="shopping-list-copy"><p className="cs-eyebrow"><Sparkles size={15}/> A little idea. A whole lot of possibilities.</p><h2 id="shopping-list-title">What’s on your<br/><em>shopping list?</em></h2><p>A weekend look. Shoes that go with everything. Something you haven’t found the words for yet.</p><p>Tell Chauffer what you have in mind. Explore clothes, shoes and finishing touches around your style, occasion and budget.</p><div className="shopping-list-actions">{[
        ['Find an outfit', 'Help me find an outfit for the office within my budget'],
        ['Style my wardrobe', 'Help me style the clothes I already own'],
        ['Shop for an occasion', 'Help me find a look for a celebration'],
        ['Review a purchase', 'How can I check a saved product against my wardrobe and budget?'],
        ['Start with a photo', 'How can I shop from a clothing photo?'],
      ].map(([label, prompt]) => <a key={label} href={liveLink(prompt)}>{label}<ArrowUpRight size={15}/></a>)}</div></div>
      <div className="shopping-style-board">
        <div className="style-board-label"><BrandIcon size={27} animated={false}/><span>From a thought to a look</span><span>01 / DISCOVER</span></div>
        <div className="shopping-search-dock" ref={dock}><span className="static-search-example"><Search size={18}/> A relaxed look for the weekend</span></div>
        <div className="style-board-brief"><Sparkles size={15}/><span>Relaxed fits. Easy layers. A little more you.</span></div>
        <div className="style-board-photos" aria-label="Fashion inspiration"><figure><img src="/images/mens-shirt.jpg" alt="Relaxed shirt for an everyday look" loading="lazy"/><figcaption>Easy layers</figcaption></figure><figure><img src="/images/white-floral-kurta.jpg" alt="Light floral kurta" loading="lazy"/><figcaption>A fresh perspective</figcaption></figure><figure><img src="/images/sneakers.jpg" alt="Casual sneakers" loading="lazy"/><figcaption>Everyday favourites</figcaption></figure></div>
        <div className="style-board-footer"><span>Your style</span><span>Your budget</span><span>Your next favourite</span></div>
      </div>
    </section>
  </div>;
}
