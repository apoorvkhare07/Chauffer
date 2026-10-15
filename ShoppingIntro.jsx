import React, { useEffect, useRef } from 'react';
import FashionHero from './FashionHero.jsx';
import './shopping-intro.css';
import ShoppingFlow from './ShoppingFlow.jsx';

export default function ShoppingIntro({ liveLink }) {
  const root = useRef(null), source = useRef(null), search = useRef(null), dock = useRef(null);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame;
    const update = () => {
      frame = null;
      if (!source.current || !dock.current || !search.current) return;
      if (reduced.matches) { search.current.style.removeProperty('transform'); search.current.style.removeProperty('width'); root.current.style.setProperty('--arrive', 1); return; }
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
    <ShoppingFlow dock={dock} liveLink={liveLink} search={search}/>
  </div>;
}
