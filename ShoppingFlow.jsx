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
const photos = [['mens-shirt.jpg','Easy layers'],['white-floral-kurta.jpg','Fresh florals'],['sneakers.jpg','Everyday sneakers'],['leather-bag.jpg','Finishing touches'],['office-kurta.jpg','Office favourites'],['green-floral-kurta.jpg','A little colour']];
function Photo({ index, className = '' }) { return <figure className={className}><img src={`/images/${photos[index][0]}`} alt={photos[index][1]} loading="lazy"/><figcaption>{photos[index][1]}</figcaption></figure>; }
export default function ShoppingFlow({ dock, liveLink, search }) {
  const flow = useRef(null), rows = useRef([]), [active, setActive] = useState(0);
  useEffect(() => {
    let frame;
    const update = () => { frame = null; const marker = window.innerHeight * .25; let next = 0; rows.current.forEach((el, i) => { if (el && el.getBoundingClientRect().top < marker) next = i; }); setActive(next); if(search.current) search.current.style.visibility = next === 0 ? 'visible' : 'hidden'; };
    const schedule = () => { if(!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive:true }); window.addEventListener('resize', schedule); update();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll',schedule); window.removeEventListener('resize',schedule); };
  }, [search]);
  return <section className="shopping-flow cs-wrap" id="shop-by-occasion" ref={flow} aria-label="Your shopping journey">
    <div className="flow-visual" data-step={active}>
      <div className="flow-board-heading"><BrandIcon size={27} animated={false}/><span>From a thought to your next favourite</span><b>0{active+1} / 05</b></div>
      <div className={`flow-scene flow-need ${active===0?'is-active':''}`} aria-hidden={active!==0}>
        <div className="shopping-search-dock" ref={dock}><span className="static-search-example"><Search size={18}/> A relaxed look for the weekend</span></div>
        <div className="style-board-brief"><Sparkles size={15}/> Your occasion. Your style. Your budget.</div>
        <div className="style-board-photos"><Photo index={0}/><Photo index={1}/><Photo index={2}/></div>
        <div className="style-board-footer"><span>Just ask, in your own words</span></div>
      </div>
      <div className={`flow-scene flow-discover ${active===1?'is-active':''}`} aria-hidden={active!==1}><div className="flow-photo-grid">{photos.map((_,i)=><div key={i} style={{'--i':i,'--column':i%3,'--row':Math.floor(i/3)}}><Photo index={i}/></div>)}</div><span className="flow-caption"><Sparkles size={14}/> Many possibilities. One conversation.</span></div>
      <div className={`flow-scene flow-refine ${active===2?'is-active':''}`} aria-hidden={active!==2}><div className="flow-swipe-deck"><Photo index={1} className="swipe-back"/><Photo index={4} className="swipe-away"/><Photo index={0} className="swipe-keep"/><span className="flow-heart"><Heart size={22}/></span></div><div className="flow-feedback">“Less formal. More like this.”</div><div className="flow-response"><Sparkles size={15}/> Got it. Let’s refine your search.</div></div>
      <div className={`flow-scene flow-review ${active===3?'is-active':''}`} aria-hidden={active!==3}><div className="flow-review-card"><div className="flow-review-top"><img src="/images/mens-shirt.jpg" alt="Shirt being considered"/><div><span>BEFORE YOU BUY</span><h3>Does it work for you?</h3><p>Your shortlist, with a little perspective.</p></div></div><div className="flow-check"><Check size={16}/><div><b>Style it with what you own</b><span>Explore wardrobe pairings</span></div></div><div className="flow-check"><Check size={16}/><div><b>Refresh the listed price</b><span>See when it was last checked</span></div></div><div className="flow-check"><Check size={16}/><div><b>Read the offer details</b><span>Check conditions and eligibility</span></div></div><small>Exact delivered-price comparison is still planned.</small></div></div>
      <div className={`flow-scene flow-buy ${active===4?'is-active':''}`} aria-hidden={active!==4}><div className="flow-buy-card"><Photo index={0}/><div><span className="flow-small-label">YOUR CHOICE. YOUR FINAL SAY.</span><h3>The one for you.</h3><p>Confirm size, delivery and the final total on the store.</p><span className="flow-store-button">Continue to store <ArrowUpRight size={16}/></span></div></div><div className="flow-next"><Sparkles size={17}/><div><b>Next: one-click checkout</b><span>Planned · always with your approval</span></div></div></div>
      <div className="flow-progress" aria-label={`Step ${active+1} of 5`}>{steps.map((_,i)=><span key={i} className={i===active?'current':''}/>)}</div><span className="flow-example-label">Illustrated shopping journey</span>
    </div>
    <div className="flow-copy">{steps.map(([label,title,em,body,cta,prompt],i)=><article key={label} ref={el=>rows.current[i]=el} className={`flow-copy-step ${active===i?'current':''}`}><p className="cs-eyebrow">0{i+1} / {label}</p><h2>{title}<br/><em>{em}</em></h2><p>{body}</p>{i===4&&<span className="flow-plan-note">Buy on the store today · one-click buying planned</span>}<a className="flow-cta" href={liveLink(prompt)}>{cta}<ArrowUpRight size={17}/></a></article>)}</div>
  </section>;
}
