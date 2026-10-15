import React, { useEffect, useRef } from 'react';
import FashionHero from './FashionHero.jsx';
import './shopping-intro.css';
import ShoppingFlow from './ShoppingFlow.jsx';

export default function ShoppingIntro({ liveLink }) {
  const root = useRef(null), source = useRef(null), search = useRef(null), dock = useRef(null);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const page = document.documentElement;
    page.classList.add('shopping-scroll-page');
    let frame = 0, geometry;
    const measure = () => {
      const origin = source.current, target = dock.current;
      if (!origin || !target) return;
      const board = target.closest('.flow-visual');
      const scene = target.closest('.flow-scene');
      const flow = board.closest('.shopping-flow');
      const from = origin.getBoundingClientRect();
      const boardRect = board.getBoundingClientRect();
      const sceneStyle = getComputedStyle(scene);
      const left = parseFloat(sceneStyle.left) || 0;
      const right = parseFloat(sceneStyle.right) || 0;
      const flowTop = flow.getBoundingClientRect().top + window.scrollY;
      const stickyTop = parseFloat(getComputedStyle(board).top) || 0;
      geometry = {
        board, fromX: from.left, fromY: from.top + window.scrollY,
        toX: boardRect.left + left + target.offsetLeft,
        insetY: (parseFloat(sceneStyle.top) || 0) + target.offsetTop,
        scale: (boardRect.width - left - right) / from.width,
        start: Math.max(0, from.top + window.scrollY - window.innerHeight * .65),
        end: flowTop - stickyTop,
      };
      schedule();
    };
    const update = () => {
      frame = 0;
      if (!geometry || !search.current) return;
      if (reduced.matches) {
        search.current.style.removeProperty('transform');
        root.current.style.setProperty('--arrive', 1);
        return;
      }
      const g = geometry;
      const raw = Math.max(0, Math.min(1, (window.scrollY - g.start) / Math.max(1, g.end - g.start)));
      const p = raw * raw * (3 - 2 * raw);
      const targetY = g.board.getBoundingClientRect().top + window.scrollY + g.insetY;
      // Transform only: no changing widths or measuring the animated search/scene.
      search.current.style.transform = `translate3d(${(g.toX - g.fromX) * p}px, ${(targetY - g.fromY) * p}px, 0) scale(${1 + (g.scale - 1) * p})`;
      root.current.style.setProperty('--arrive', Math.max(0, Math.min(1, (raw - .35) / .65)));
    };
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    const observer = new ResizeObserver(measure);
    observer.observe(source.current);
    observer.observe(dock.current.closest('.flow-visual'));
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    reduced.addEventListener('change', measure);
    measure();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); page.classList.remove('shopping-scroll-page');
      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', measure);
      reduced.removeEventListener('change', measure);
    };
  }, []);
  return <div className="shopping-intro" ref={root}>
    <FashionHero liveLink={liveLink} sourceRef={source} searchRef={search}/>
    <ShoppingFlow dock={dock} liveLink={liveLink} search={search}/>
  </div>;
}
