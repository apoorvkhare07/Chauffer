import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Heart, Search, Sparkles } from 'lucide-react';
import BrandIcon from './brand/BrandIcon.jsx';
import './shopping-flow.css';
const steps = [
  ['Your idea', 'What’s on your', 'shopping list?', 'A weekend look. Shoes that go with everything. Something you haven’t found the words for yet. Tell Chauffer about your occasion, style and budget—in your own words.', 'Start with a thought', 'Help me find a relaxed weekend outfit within my budget'],
  ['Your options', 'Less searching.', 'More possibilities.', 'Your assistant looks across Flipkart and Amazon for clothing, shoes and finishing touches. Explore the photos and readable product details together, then open anything that catches your eye.', 'Explore your options', 'Help me discover clothes and shoes for the weekend'],
  ['Your taste', 'A little less this.', 'A lot more you.', 'Too formal? Not your colour? Say it as it comes to you. Your feedback guides the next search, so the conversation moves closer to what you actually want.', 'Find your kind of style', 'Help me find something casual, with clean lines and no bold prints'],
  ['Your decision', 'A good find.', 'An even better fit.', 'See how a saved piece could work with your wardrobe. Refresh its listed price and review readable offer terms before deciding. Final delivery costs, sizes and offer eligibility still need checking on the store.', 'Think through a purchase', 'How can I check a saved product against my wardrobe and budget?'],
  ['Your final say', 'Found the one?', 'Make it yours.', 'Open your chosen product on the store, confirm the details and complete your purchase there. Our next chapter: review the final total and approve checkout in one click.', 'Start shopping', 'Help me find my next favourite outfit'],
];
const photos = [
  ['story-men-polo.jpg','Olive cotton polo'],['story-men-chinos.jpg','Sand cotton chinos'],['story-men-loafers.jpg','Brown leather loafers'],
  ['story-women-kurta.jpg','Terracotta block-print kurta'],['story-women-trousers.jpg','Indigo wide-leg trousers'],['story-women-sandals.jpg','Tan flat sandals'],
];
function Photo({ index, className = '' }) { return <figure className={className}><img src={`/images/${photos[index][0]}`} alt={photos[index][1]} loading="lazy"/><figcaption>{photos[index][1]}</figcaption></figure>; }
function JourneyBoard({ active, dock, className = "" }) {
  return <div className={`flow-visual ${className}`} data-step={active}>
      <div className="flow-board-heading"><BrandIcon size={27} animated={false}/><span className="flow-board-title">From a thought to your next favourite</span><span className="flow-board-phone-title">Style preview</span><b>0{active+1} / 05</b></div>
      <div className={`flow-scene flow-need ${active===0?'is-active':''}`} aria-hidden={active!==0}>
        <div className="shopping-search-dock" ref={dock}><span className="static-search-example"><Search size={18}/> A relaxed look for the weekend</span></div>
        <div className="style-board-brief"><Sparkles size={15}/> Your occasion. Your style. Your budget.</div>
        <div className="style-board-photos"><Photo index={0}/><Photo index={1}/><Photo index={2}/></div>
        <div className="style-board-footer"><span>Just ask, in your own words</span></div>
      </div>
      <div className={`flow-scene flow-discover ${active===1?'is-active':''}`} aria-hidden={active!==1}><div className="flow-photo-grid">{[3,4,5].map((photoIndex,i)=><div key={photoIndex} style={{'--i':i,'--column':i,'--row':0}}><Photo index={photoIndex}/></div>)}</div><span className="flow-caption"><Sparkles size={14}/> Many possibilities. One conversation.</span></div>
      <div className={`flow-scene flow-refine ${active===2?'is-active':''}`} aria-hidden={active!==2}><div className="flow-swipe-deck"><Photo index={3} className="swipe-back"/><Photo index={4} className="swipe-away"/><Photo index={5} className="swipe-keep"/><span className="flow-heart"><Heart size={22}/></span></div><div className="flow-feedback">“Less formal. More like this.”</div><div className="flow-response"><Sparkles size={15}/> Got it. Let’s refine your search.</div></div>
      <div className={`flow-scene flow-review ${active===3?'is-active':''}`} aria-hidden={active!==3}><div className="flow-review-card"><div className="flow-review-top"><img src="/images/story-women-kurta.jpg" alt="Terracotta block-print kurta"/><div><span>BEFORE YOU BUY</span><h3>Does it work for you?</h3><p>Your shortlist, with a little perspective.</p></div></div><div className="flow-check"><Check size={16}/><div><b>Style it with what you own</b><span>Explore wardrobe pairings</span></div></div><div className="flow-check"><Check size={16}/><div><b>Refresh the listed price</b><span>See when it was last checked</span></div></div><div className="flow-check"><Check size={16}/><div><b>Read the offer details</b><span>Check conditions and eligibility</span></div></div><small>Exact delivered-price comparison is still planned.</small></div></div>
      <div className={`flow-scene flow-buy ${active===4?'is-active':''}`} aria-hidden={active!==4}><div className="flow-buy-card"><Photo index={2}/><div><span className="flow-small-label">YOUR CHOICE. YOUR FINAL SAY.</span><h3>The one for you.</h3><p>Confirm size, delivery and the final total on the store.</p><span className="flow-store-button">Continue to store <ArrowUpRight size={16}/></span></div></div><div className="flow-next"><Sparkles size={17}/><div><b>Next: one-click checkout</b><span>Planned · always with your approval</span></div></div></div>
      <div className="flow-progress" aria-label={`Step ${active+1} of 5`}>{steps.map((_,i)=><span key={i} className={i===active?'current':''}/>)}</div><span className="flow-example-label">Illustrated shopping journey</span>
    </div>;
}
export default function ShoppingFlow({ dock, liveLink, search }) {
  const flow = useRef(null), rows = useRef([]), [active, setActive] = useState(0);
  useEffect(() => {
    const phone = window.matchMedia('(max-width: 760px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame, stride = 1, panelHeight = 1, measuredWidth = 0, stickyTop = 20;
    const measure = () => {
      if (phone.matches && !reduced.matches) {
        panelHeight = Math.max(...rows.current.map(el => el?.offsetHeight || 0));
        if (measuredWidth !== window.innerWidth) {
          stride = Math.max(500, window.innerHeight * .85);
          measuredWidth = window.innerWidth;
        }
        stickyTop = (window.innerHeight - panelHeight) / 2;
        flow.current.style.setProperty('--journey-top', `${stickyTop}px`);
        flow.current.style.setProperty('--journey-height', `${panelHeight}px`);
        flow.current.style.setProperty('--journey-travel', `${stride * (steps.length - 1)}px`);
      }
      schedule();
    };
    const update = () => {
      frame = null;
      if (phone.matches) {
        if (search.current) search.current.style.visibility = 'visible';
        const raw = Math.max(0, Math.min(steps.length - 1, (stickyTop - flow.current.getBoundingClientRect().top) / stride));
        const base = Math.floor(raw), fraction = raw - base;
        // Hold each complete panel for reading, then move picture and copy together.
        const t = Math.max(0, Math.min(1, (fraction - .35) / .65));
        const progress = base + t * t * (3 - 2 * t);
        const next = Math.round(progress);
        rows.current.forEach((el, i) => {
          if (!el) return;
          el.style.transform = reduced.matches ? '' : `translateY(${(i - progress) * (panelHeight + 40) + (panelHeight - el.offsetHeight) / 2}px)`;
          el.inert = !reduced.matches && i !== next;
          if (!reduced.matches && Math.abs(i - progress) > 1) el.style.visibility = 'hidden';
          else el.style.removeProperty('visibility');
        });
        setActive(next);
        return;
      }
      let next = 0;
      rows.current.forEach((el, i) => {
        if (!el) return;
        el.style.removeProperty('transform'); el.style.removeProperty('visibility'); el.inert = false;
        if (el.getBoundingClientRect().top < window.innerHeight * .25) next = i;
      });
      setActive(next);
      if (search.current) search.current.style.visibility = next === 0 ? 'visible' : 'hidden';
    };
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    const observer = new ResizeObserver(measure);
    rows.current.forEach(el => el && observer.observe(el));
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    reduced.addEventListener('change', measure);
    measure();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', measure);
      reduced.removeEventListener('change', measure);
    };
  }, [search]);
  return <section className="shopping-flow cs-wrap" id="shop-by-occasion" ref={flow} aria-label="Your shopping journey">
    <JourneyBoard active={active} dock={dock} className="flow-desktop-board"/>
    <div className="flow-copy">{steps.map(([label,title,em,body,cta,prompt],i)=><article key={label} ref={el=>rows.current[i]=el} className={`flow-copy-step ${active===i?'current':''}`}><JourneyBoard active={i} className="flow-phone-board"/><p className="cs-eyebrow">0{i+1} / {label}</p><h2>{title}<br/><em>{em}</em></h2><p>{body}</p>{i===4&&<span className="flow-plan-note">Buy on the store today · one-click buying planned</span>}<a className="flow-cta" href={liveLink(prompt)}>{cta}<ArrowUpRight size={17}/></a></article>)}</div>
  </section>;
}
