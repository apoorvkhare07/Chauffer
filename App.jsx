import { PRO_VISIBLE } from './shared/features.js';
import StoreUniverse from './StoreUniverse.jsx';
import ShoppingFinale from './ShoppingFinale.jsx';
import BrandAssetsPreview from './brand/BrandAssetsPreview.jsx';
import Brand from './Brand.jsx';
import InfoPages from './InfoPages.jsx';
import { SiteHeader } from './SiteChrome.jsx';
import React, { useState } from 'react';
import { LoaderPreview } from './FashionLoader.jsx';
import WardrobeSpiral from './WardrobeSpiral.jsx';
import FutureFeatures from './FutureFeatures.jsx';
import ShoppingIntro from './ShoppingIntro.jsx';
import TryOnShowcase from './TryOnShowcase.jsx';
import { Asterisk, ArrowUpRight, Plus, SlidersHorizontal, MessageCircle, ShoppingBag } from 'lucide-react';
import Pricing from './Pricing.jsx';

const scenarios = [
  { name: 'Find my next look', request: 'Help me find an understated outfit for the office, under ₹1,500. I like clean lines and easy fits.', reply: 'Let’s start with your occasion, usual size and budget. We can explore options, then refine the colours and details together.', tags: ['Office style', 'Your budget', 'Your fit'], art: 0 },
  { name: 'Style what I own', request: 'I have a white shirt and dark trousers. Help me put together a relaxed weekend look.', reply: 'Add those pieces to your wardrobe and tell me about your day. The wardrobe stylist can suggest combinations from your available clothes.', tags: ['Your wardrobe', 'Outfit ideas', 'Buy less, wear more'], art: 2 },
  { name: 'Make a smarter choice', request: 'Before I buy this, does it work with my wardrobe? What should I check about the price and offers?', reply: 'Save the product to your shortlist. Check possible wardrobe pairings, refresh the listed price and review any readable offer terms before buying on the store.', tags: ['Wardrobe pairings', 'Price checks', 'Offer terms'], art: 3 },
];
const liveLink = text => text ? `/app/?q=${encodeURIComponent(text)}` : '/app/';

export default function App() {
  const [selected,setSelected]=useState(0);
  const example=scenarios[selected];
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'brand') return <BrandAssetsPreview/>;
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'loader') return <LoaderPreview/>;
  const page = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : '';
  if (page === 'pricing') {
    if (!PRO_VISIBLE) { window.location.replace('/'); return null; }
    return <Pricing/>;
  }
  if (page === 'faq' || page === 'roadmap') return <InfoPages page={page}/>;
  return <div className="chauffeur-site homepage-polished">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <SiteHeader primaryTryOn/>
    <main id="main-content">
      <ShoppingIntro liveLink={liveLink}/>
      <TryOnShowcase/>
      <WardrobeSpiral/>
      <FutureFeatures/>
      <StoreUniverse/>
      {/* Conversation example hidden for now. */}
      {false && (<section className="cs-discovery" id="discovery"><div className="cs-wrap cs-discovery-inner"><div className="cs-discovery-copy"><p className="cs-eyebrow">Your style, in your own words</p><h2>Shop by talking.<br/><em>Find more of you.</em></h2><p>Start with your day, your style or a piece you own. Your assistant helps you explore—and listens when you change your mind.</p><div className="cs-scenario-tabs" role="group" aria-label="Conversation examples">{scenarios.map((s,i)=><button key={s.name} type="button" aria-pressed={selected===i} onClick={()=>setSelected(i)}>{s.name}</button>)}</div></div><div className="cs-conversation"><div className="cs-conversation-top"><Brand/><span>Example shopping chat</span></div><div className="cs-example-user"><span>You</span><p>{example.request}</p></div><div className="cs-example-assistant" aria-live="polite"><span><Asterisk size={15}/>Chauffeur</span><p>{example.reply}</p><div className="cs-tags">{example.tags.map(t=><span key={t}>{t}</span>)}</div></div><div className="cs-example-feedback"><SlidersHorizontal size={16}/><span>“Less formal. Something with a small print.”</span></div><p className="cs-example-caption">An example of the flow. Live results vary by request and store access.</p></div><a className="cs-button cs-discovery-cta" href={liveLink(example.request)}>Try this conversation <ArrowUpRight size={17}/></a></div></section>)}
    </main><ShoppingFinale liveLink={liveLink}/>
  </div>;
}
