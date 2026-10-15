import BrandAssetsPreview from './brand/BrandAssetsPreview.jsx';
import Brand from './Brand.jsx';
import React, { useState } from 'react';
import { LoaderPreview } from './FashionLoader.jsx';
import ShoppingJourney from './ShoppingJourney.jsx';
import WardrobeSpiral from './WardrobeSpiral.jsx';
import FashionHero from './FashionHero.jsx';
import { Asterisk, ArrowUpRight, Plus, SlidersHorizontal, MessageCircle, ShoppingBag } from 'lucide-react';

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
  return <div className="chauffeur-site">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="cs-nav cs-wrap"><Brand/><nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#shop-by-occasion">Shopping ideas</a><a href="#the-details">Questions</a></nav><a className="cs-button cs-button-small" href="/app/">Chat to shop <MessageCircle size={16}/></a></header>
    <main id="main-content">
      <FashionHero liveLink={liveLink}/>
      <section className="cs-store-band"><div className="cs-wrap"><p>Your next find could be anywhere.</p><div className="cs-store-names"><span>Flipkart</span><span>amazon<span className="cs-amazon-line"/></span></div><p className="cs-store-note">Live discovery on Flipkart and Amazon. Buy directly on the store.</p></div></section>
      <section className="cs-shopping-ideas cs-wrap" id="shop-by-occasion"><div><p className="cs-eyebrow"><ShoppingBag size={15}/> Start with what you need</p><h2>What’s on your<br/><em>shopping list?</em></h2></div><div className="cs-shopping-links">{[
        ['Find an outfit','Help me find an outfit for the office within my budget'],
        ['Style my wardrobe','Help me style the clothes I already own'],
        ['Shop for an occasion','Help me find a look for a celebration'],
        ['Review a purchase','How can I check a saved product against my wardrobe and budget?'],
        ['Start with a photo','How can I shop from a clothing photo?'],
      ].map(([label,prompt])=><a key={label} href={liveLink(prompt)}>{label}<ArrowUpRight size={15}/></a>)}</div><p>Clothing, shoes and finishing touches for women and men. Tell us what you have in mind.</p></section>
      <ShoppingJourney/>
      <section className="cs-discovery" id="discovery"><div className="cs-wrap cs-discovery-inner"><div className="cs-discovery-copy"><p className="cs-eyebrow">Your style, in your own words</p><h2>Shop by talking.<br/><em>Find more of you.</em></h2><p>Start with your day, your style or a piece you own. Your assistant helps you explore—and listens when you change your mind.</p><div className="cs-scenario-tabs" role="group" aria-label="Conversation examples">{scenarios.map((s,i)=><button key={s.name} type="button" aria-pressed={selected===i} onClick={()=>setSelected(i)}>{s.name}</button>)}</div></div><div className="cs-conversation"><div className="cs-conversation-top"><Brand/><span>Example shopping chat</span></div><div className="cs-example-user"><span>You</span><p>{example.request}</p></div><div className="cs-example-assistant" aria-live="polite"><span><Asterisk size={15}/>Chauffeur</span><p>{example.reply}</p><div className="cs-tags">{example.tags.map(t=><span key={t}>{t}</span>)}</div></div><div className="cs-example-feedback"><SlidersHorizontal size={16}/><span>“Less formal. Something with a small print.”</span></div><p className="cs-example-caption">An example of the flow. Live results vary by request and store access.</p></div><a className="cs-button cs-discovery-cta" href={liveLink(example.request)}>Try this conversation <ArrowUpRight size={17}/></a></div></section>
      <WardrobeSpiral/>
      <section className="cs-status cs-wrap"><div><p className="cs-eyebrow">Built around your everyday</p><h2>Here for you today.<br/><em>More to come.</em></h2><p>One place for discovering fashion, styling your wardrobe and thinking through your next purchase.</p></div><div className="cs-status-list"><article><span className="cs-status-pill cs-status-live">Available now</span><h3>Shopping and styling on the web</h3><p>AI clothing discovery, product previews, saved preferences, wardrobe outfits and buying reviews. Photo and voice inputs help draft your request.</p></article><article><span className="cs-status-pill">In the plan</span><h3>More fashion. More ways to shop.</h3><p>Verified delivered-price comparisons, WhatsApp and assisted checkout remain in the plan.</p></article></div></section>
      <section className="cs-faq cs-wrap" id="the-details"><div><p className="cs-eyebrow">A few things to know</p><h2>Before you<br/><em>start shopping.</em></h2><p>Clear answers, from the first conversation.</p><a className="cs-text-link" href="/demo/">Try the shopping demo <ArrowUpRight size={17}/></a><small>The separate demo uses fictional products.</small></div><div>{[
        ['Can I actually buy something here?','Chauffeur helps you discover clothing and opens the product on the store. You choose the size, check the details and buy directly there. Chauffeur does not take payments or place orders.'],
        ['What fashion does Chauffeur cover?','Search clothing for women and men, footwear, bags, belts, watches and sunglasses on Flipkart and Amazon. Add what you own to your wardrobe for styling. Store access can vary; sizes, fit and checkout totals still need checking on the store.'],
        ['Which stores can I search?','We currently attempt live searches on Flipkart and Amazon. Store access can be intermittent; if a store cannot be reached, you’ll see its status and a direct search link. Meesho is not part of live discovery today.'],
        ['What if I don’t like the suggestions?','Tell the assistant what feels wrong—too busy, too plain, the wrong fit—or refer to a numbered option. It uses that feedback to refine the next search. You can also ask for more options.'],
        ['Are prices, sizes and offers confirmed?','Prices come from the store pages we can read and show when they were checked. Some are starting prices. Requested size availability, delivery fees, offer eligibility and final totals must be confirmed on the store. Saved-product checks can refresh listed prices and collect readable advertised offers. Exact delivered-price savings and checkout eligibility remain unverified.'],
        ['Can I use it on WhatsApp or by voice?','WhatsApp is planned; the live number is not connected yet. On the web you can upload a clothing photo or short voice note to create an editable shopping request. Review it before sending. Microphone recording depends on your browser.'],
        ['What happens to my preferences?','Your web chat and account preferences stay saved. Feedback applies to the current conversation; taste is saved for future chats when you ask to remember it. Ask to forget remembered preferences to clear taste, and edit size and budget in account settings. Shopping messages are processed by Gemini to understand your request.'],
        ['What does Chauffeur cost?','There is no paid checkout or subscription on this website. Subscription pricing has not been decided.'],
      ].map(([q,a])=><details key={q}><summary>{q}<Plus size={18}/></summary><p>{a}</p></details>)}</div></section>
      <section className="cs-closing cs-wrap"><Asterisk size={38}/><h2>Your next favourite<br/>starts with <em>a conversation.</em></h2><p>Find your next favourite. Rediscover your wardrobe. Make fashion feel more like you.</p><a className="cs-button" href="/app/">Chat to shop <MessageCircle size={18}/></a></section>
    </main><footer className="cs-footer cs-wrap"><Brand/><span>Your AI partner for fashion, shopping and styling.</span><div><a href="/app/">Shopping assistant</a><a href="/demo/">Sample demo</a><a href="#the-details">Product details</a></div></footer>
  </div>;
}
