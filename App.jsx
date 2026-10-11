import React, { useState } from 'react';
import ShoppingJourney from './ShoppingJourney.jsx';
import { Asterisk, ArrowUpRight, ArrowRight, Plus, Check, SlidersHorizontal, MessageCircle, ShoppingBag } from 'lucide-react';

const scenarios = [
  { name: 'For the office', request: 'Office ke liye simple kurta chahiye. Size M, ₹1,500 tak. Heavy embroidery nahi.', reply: 'A simple office kurta, size M, within ₹1,500. I’ll prioritise understated details and check what the store listings actually tell us.', tags: ['Office wear', 'Under ₹1,500', 'Size M'], art: 0 },
  { name: 'For a celebration', request: 'A festive saree under ₹3,000. Something colourful, but no sequins.', reply: 'A colourful festive saree within ₹3,000. I’ll look for options and skip listings that mention sequins. Details that aren’t confirmed will stay clearly marked.', tags: ['Festive saree', 'Under ₹3,000', 'Avoid sequins'], art: 2 },
  { name: 'For every day', request: 'A relaxed cotton top under ₹1,000, size L. Small prints instead of big florals.', reply: 'A relaxed cotton top, size L, within ₹1,000. I’ll use your print preferences to rank the options, without changing the budget.', tags: ['Cotton top', 'Under ₹1,000', 'Size L'], art: 3 },
];
const liveLink = text => text ? `/app/?q=${encodeURIComponent(text)}` : '/app/';
function Brand() { return <a className="cs-brand" href="/" aria-label="Chauffeur home"><Asterisk aria-hidden="true" size={26}/><span>chauffeur</span><small>AI</small></a>; }
const editorialPhotos = {
  0: {src: '/images/office-kurta.jpg', alt: 'Pink floral kurta photographed in a neutral studio'},
  1: {src: '/images/patterned-kurta.jpg', alt: 'Close-up of a colourful printed cotton kurta'},
  4: {src: '/images/everyday-kurta.jpg', alt: 'Printed kurta and dupatta photographed outdoors'},
};
function Artwork({index=0,className=''}) { const photo=editorialPhotos[index] || editorialPhotos[0]; return <img className={`cs-art ${className}`} src={photo.src} alt={photo.alt} width={1400} height={2100} loading={index===4?'lazy':'eager'} decoding="async"/>; }
export default function App() {
  const [selected,setSelected]=useState(0),[request,setRequest]=useState('');
  const example=scenarios[selected];
  return <div className="chauffeur-site">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="cs-nav cs-wrap"><Brand/><nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#shop-by-occasion">Shopping ideas</a><a href="#the-details">Questions</a></nav><a className="cs-button cs-button-small" href="/app/">Chat to shop <MessageCircle size={16}/></a></header>
    <main id="main-content">
      <section className="cs-hero cs-wrap">
        <div className="cs-hero-copy"><p className="cs-release"><span/>Your AI shopping assistant</p><h1>Tell us what you need.<br/>We’ll find the clothes.</h1><p className="cs-intro">Shopping for work, a wedding, or every day? Tell Chauffeur your budget and what you like. Get clothing options from Flipkart and Amazon, then chat to refine your picks.</p>
          <form className="cs-search" onSubmit={e=>{e.preventDefault();window.location.href=liveLink(request.trim());}}><label htmlFor="hero-query" className="sr-only">Describe what you’re looking for</label><MessageCircle size={20} aria-hidden="true"/><input id="hero-query" placeholder="What are you shopping for?" value={request} onChange={e=>setRequest(e.target.value)} maxLength={1000} required/><button aria-label="Find clothes with your assistant"><ArrowRight size={20}/></button></form>
          <div className="cs-prompts" aria-label="Shopping ideas">{scenarios.map(s=><a href={liveLink(s.request)} key={s.name}>{s.name}<ArrowUpRight size={13}/></a>)}</div><p className="cs-signin-note">Chat in English, हिंदी or Hinglish. Sign in to see live results.</p>
        </div>
        <div className="cs-shopping-preview">
          <div className="cs-preview-header"><span><Asterisk size={21}/>Chauffeur</span><small>Shopping preview</small></div>
          <div className="cs-preview-request"><MessageCircle size={17}/><p>“A printed kurta for work. Under ₹1,500, size M.”</p></div>
          <div className="cs-preview-reply"><span>From your request to a shortlist.</span><p>Browse the photos. Tell us what you like. We’ll refine the search.</p></div>
          <div className="cs-preview-products">{[
            [0,'Soft floral prints','Show me soft floral kurtas under ₹1500, size M'],
            [1,'Bolder patterns','Show me colourful printed kurtas under ₹1500, size M'],
            [4,'Everyday cotton','Show me cotton kurtas under ₹1500, size M'],
          ].map(([index,label,prompt])=><a className="cs-preview-product" href={liveLink(prompt)} key={label}><div><Artwork index={index}/><span className="cs-product-detail"><ShoppingBag size={13}/>Explore this style</span></div><strong>{label}</strong><span>Ask Chauffeur <ArrowUpRight size={13}/></span></a>)}</div>
          <div className="cs-preview-refine"><SlidersHorizontal size={15}/><span>“Less busy. A softer colour.”</span><span className="cs-preview-refine-dot"/></div>
          <p className="cs-preview-caption">Style inspiration, not live products. Chat to find current listings.</p>
        </div>
      </section>
      <section className="cs-store-band"><div className="cs-wrap"><p>Find clothing across<br/><strong>Flipkart and Amazon.</strong></p><div className="cs-store-names"><span>Flipkart</span><span>amazon<span className="cs-amazon-line"/></span></div><p className="cs-store-note">Live searches, with links to the stores.<br/>Availability and final prices need checking.</p></div></section>
      <section className="cs-shopping-ideas cs-wrap" id="shop-by-occasion"><div><ShoppingBag size={20}/><h2>What’s on your shopping list?</h2></div><div className="cs-shopping-links">{[
        ['Office kurtas','Office kurtas under ₹1500, size M, no heavy embroidery'],
        ['Everyday tops','Relaxed cotton tops under ₹1000, size L'],
        ['Wedding guest sarees','A colourful wedding guest saree under ₹3000, no sequins'],
        ['Weekend dresses','A casual weekend dress under ₹2000, size M'],
        ['Something under ₹1,000','Show me everyday kurtas under ₹1000, size M'],
      ].map(([label,prompt])=><a key={label} href={liveLink(prompt)}>{label}<ArrowUpRight size={15}/></a>)}</div><p>Pick an idea to start a chat, or describe something completely different.</p></section>
      <ShoppingJourney/>
      <section className="cs-discovery" id="discovery"><div className="cs-wrap cs-discovery-inner"><div className="cs-discovery-copy"><h2>Shop by talking.<br/>Find more of<br/>what you like.</h2><p>Start with an outfit, an occasion or a budget. Your assistant searches for clothes, explains the picks, and adapts when you say “too plain”, “not my fit” or “show me more”.</p><div className="cs-scenario-tabs" role="group" aria-label="Conversation examples">{scenarios.map((s,i)=><button key={s.name} type="button" aria-pressed={selected===i} onClick={()=>setSelected(i)}>{s.name}</button>)}</div><a className="cs-text-link" href={liveLink(example.request)}>Try this request <ArrowUpRight size={17}/></a></div><div className="cs-conversation"><div className="cs-conversation-top"><Brand/><span>Example shopping chat</span></div><div className="cs-example-user"><span>You</span><p>{example.request}</p></div><div className="cs-example-assistant" aria-live="polite"><span><Asterisk size={15}/>Chauffeur</span><p>{example.reply}</p><div className="cs-tags">{example.tags.map(t=><span key={t}>{t}</span>)}</div></div><div className="cs-example-feedback"><SlidersHorizontal size={16}/><span>“Less formal. Something with a small print.”</span></div><p className="cs-example-caption">An example of the flow. Live results vary by request and store access.</p></div></div></section>
      <section className="cs-memory cs-wrap"><div className="cs-memory-art"><Artwork index={4}/><span>A wardrobe<br/>that feels like you.</span></div><div className="cs-memory-copy"><h2>Your size. Your budget.<br/>Your kind of clothes.</h2><p>Keep your usual size and budget ready for next time. When you ask Chauffeur to remember your taste, it saves those preferences to your account.</p><ul><li><Check size={17}/>Feedback guides the current conversation.</li><li><Check size={17}/>“Remember my preferences” saves your taste.</li><li><Check size={17}/>“Forget my remembered preferences” clears your taste.</li></ul><p className="cs-memory-note">Your saved size and budget can be changed in account settings.</p><a className="cs-text-link" href="/app/">Make it your own <ArrowUpRight size={17}/></a></div></section>
      <section className="cs-status cs-wrap"><div><h2>Shop with us today.<br/>See what’s next.</h2><p>We’re building towards a personal shopping assistant that can stay with you beyond discovery.</p></div><div className="cs-status-list"><article><span className="cs-status-pill cs-status-live">Available now</span><h3>Personal discovery on the web</h3><p>AI conversation, Flipkart and Amazon searches, product previews, feedback and saved preferences.</p></article><article><span className="cs-status-pill">In the plan</span><h3>Comparison, offers and more ways to chat</h3><p>Exact-product price comparison, verified offer checks, WhatsApp and voice. Checkout, order tracking and return reminders are also planned.</p></article></div></section>
      <section className="cs-faq cs-wrap" id="the-details"><div><h2>Before you<br/>start shopping.</h2><p>Clear answers, from the first conversation.</p><a className="cs-text-link" href="/demo/">Try the shopping demo <ArrowUpRight size={17}/></a><small>The separate demo uses fictional products.</small></div><div>{[
        ['Can I actually buy something here?','Chauffeur helps you discover clothing and opens the product on the store. You choose the size, check the details and buy directly there. Chauffeur does not take payments or place orders.'],
        ['Which stores can I search?','We currently attempt live searches on Flipkart and Amazon. Store access can be intermittent; if a store cannot be reached, you’ll see its status and a direct search link. Meesho is not part of live discovery today.'],
        ['What if I don’t like the suggestions?','Tell the assistant what feels wrong—too busy, too plain, the wrong fit—or refer to a numbered option. It uses that feedback to refine the next search. You can also ask for more options.'],
        ['Are prices, sizes and offers confirmed?','Prices come from the store pages we can read and show when they were checked. Some are starting prices. Requested size availability, delivery fees, offer eligibility and final totals must be confirmed on the store. Exact-product price comparison and offer checks are not built yet.'],
        ['Can I use it on WhatsApp or by voice?','The shopping flow is built to support WhatsApp, but the live number is not connected yet. Voice is planned. The web chat is the available way to try discovery now.'],
        ['What happens to my preferences?','Your web chat and account preferences stay saved. Feedback applies to the current conversation; taste is saved for future chats when you ask to remember it. Ask to forget remembered preferences to clear taste, and edit size and budget in account settings. Shopping messages are processed by Gemini to understand your request.'],
        ['What does Chauffeur cost?','There is no paid checkout or subscription on this website. Subscription pricing has not been decided.'],
      ].map(([q,a])=><details key={q}><summary>{q}<Plus size={18}/></summary><p>{a}</p></details>)}</div></section>
      <section className="cs-closing cs-wrap"><Asterisk size={38}/><h2>Your next outfit starts with a chat.</h2><p>Tell us what you’re shopping for. Get a shortlist you can shape.</p><a className="cs-button" href="/app/">Chat to shop <MessageCircle size={18}/></a></section>
    </main><footer className="cs-footer cs-wrap"><Brand/><span>Your personal clothing shopping assistant.</span><div><a href="/app/">Shopping assistant</a><a href="/demo/">Sample demo</a><a href="#the-details">Product details</a></div></footer>
  </div>;
}
