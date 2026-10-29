import React, { useEffect, useRef } from 'react';
import FashionHero from './FashionHero.jsx';
import './shopping-intro.css';
import ShoppingFlow from './ShoppingFlow.jsx';

export default function ShoppingIntro({ liveLink, showJourney = false }) {
  const root = useRef(null), source = useRef(null), search = useRef(null), dock = useRef(null);
  useEffect(() => {
    if (!showJourney) {
      document.documentElement.classList.add('shopping-scroll-page');
      return () => document.documentElement.classList.remove('shopping-scroll-page');
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const phone = window.matchMedia('(max-width: 760px)');
    const page = document.documentElement;
    page.classList.add('shopping-scroll-page');
    // iOS can move/resize the visible viewport as its browser bars collapse.
    // Keep chapter sizing and sticky/snap offsets in that same coordinate space.
    const viewport = window.visualViewport;
    const syncViewport = () => {
      if (viewport && viewport.scale !== 1) return;
      // Opening the keyboard must not resize the story under the focused input.
      if (document.activeElement?.matches('input, textarea')) return;
      page.style.setProperty('--phone-screen-height', `${viewport?.height ?? window.innerHeight}px`);
      page.style.setProperty('--phone-screen-top', `${viewport?.offsetTop ?? 0}px`);
    };
    syncViewport();
    viewport?.addEventListener('resize', syncViewport);
    viewport?.addEventListener('scroll', syncViewport);
    window.addEventListener('resize', syncViewport);
    window.addEventListener('focusout', syncViewport);

    let frame = 0, geometry, rendered, previousTime = 0;
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
        boardTop: flowTop, stickyTop, boardBottom: flowTop + flow.offsetHeight - boardRect.height, fromX: from.left, fromY: from.top + window.scrollY,
        toX: boardRect.left + left + target.offsetLeft,
        insetY: (parseFloat(sceneStyle.top) || 0) + target.offsetTop,
        scale: (boardRect.width - left - right) / from.width,
        start: Math.max(0, from.top + window.scrollY - window.innerHeight * .65),
        end: flowTop - stickyTop,
      };
      // Fixed positioning avoids combining compositor scrolling with a delayed JS transform.
      if (!reduced.matches && !phone.matches) {
        Object.assign(search.current.style, { position: 'fixed', left: '0px', top: '0px', width: `${from.width}px` });
      }
      rendered = null;
      schedule();
    };
    const update = (time) => {
      frame = 0;
      if (!geometry || !search.current) return;
      if (reduced.matches || phone.matches) {
        for (const key of ['transform', 'position', 'left', 'top', 'width']) search.current.style.removeProperty(key);
        root.current.style.setProperty('--arrive', 1);
        rendered = null;
        return;
      }
      const g = geometry, scroll = window.scrollY;
      const raw = Math.max(0, Math.min(1, (scroll - g.start) / Math.max(1, g.end - g.start)));
      const p = raw * raw * (3 - 2 * raw);
      const boardY = Math.min(g.boardBottom, Math.max(g.boardTop, scroll + g.stickyTop)) - scroll;
      const desired = {
        x: g.fromX + (g.toX - g.fromX) * p,
        y: (g.fromY - scroll) * (1 - p) + (boardY + g.insetY) * p,
        scale: 1 + (g.scale - 1) * p,
        arrive: Math.max(0, Math.min(1, (raw - .35) / .65)),
      };
      const blend = 1 - Math.exp(-Math.min(64, time - previousTime || 16) / 55);
      previousTime = time;
      if (!rendered) rendered = { ...desired };
      let moving = false;
      for (const key of Object.keys(desired)) {
        rendered[key] += (desired[key] - rendered[key]) * blend;
        if (Math.abs(desired[key] - rendered[key]) > (key === 'x' || key === 'y' ? .05 : .0001)) moving = true;
        else rendered[key] = desired[key];
      }
      search.current.style.transform = `translate3d(${rendered.x}px, ${rendered.y}px, 0) scale(${rendered.scale})`;
      root.current.style.setProperty('--arrive', rendered.arrive);
      if (moving) schedule();
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
      viewport?.removeEventListener('resize', syncViewport);
      viewport?.removeEventListener('scroll', syncViewport);
      window.removeEventListener('resize', syncViewport);
      window.removeEventListener('focusout', syncViewport);
      page.style.removeProperty('--phone-screen-height');
      page.style.removeProperty('--phone-screen-top');

      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', measure);
      reduced.removeEventListener('change', measure);
    };
  }, [showJourney]);
  return <div className="shopping-intro" ref={root}>
    <FashionHero liveLink={liveLink} sourceRef={source} searchRef={search}/>
    {showJourney && <ShoppingFlow dock={dock} liveLink={liveLink} search={search}/>}
  </div>;
}
