import React from 'react';
import {ArrowLeft,ArrowRight,Check,LockKeyhole,Sparkles} from 'lucide-react';
import Brand from './Brand.jsx';
import './pricing.css';

const free=['3 pieces in your wardrobe','10 shopping conversations each month','3 personal stylist sessions each month','Discovery, saved items and try-on tools'];
const pro=['Unlimited wardrobe pieces','Unlimited shopping conversations','Unlimited stylist sessions','Full access to Chauffeur features'];
function PlanCard({title,price,period,description,features,featured,cta}){return <article className={`pricing-card${featured?' pricing-card-pro':''}`}>
 <div className="pricing-card-top"><div><span className="pricing-plan-label">{title}</span><h2>{price}<small>{period}</small></h2></div>{featured&&<span className="pricing-recommended"><Sparkles size={14}/> More room to explore</span>}</div>
 <p className="pricing-description">{description}</p><ul>{features.map(item=><li key={item}><Check size={17}/>{item}</li>)}</ul>
 <a className={featured?'pricing-cta pricing-cta-pro':'pricing-cta'} href={cta.href}>{cta.label}<ArrowRight size={17}/></a>
 {featured?<p className="pricing-payment-note"><LockKeyhole size={14}/> Payments are not connected yet. Pro activation will be available here later.</p>:<p className="pricing-payment-note pricing-payment-note-placeholder" aria-hidden="true">Payments will be available later.</p>}
 </article>}
export default function Pricing(){return <main className="pricing-page">
 <header className="pricing-nav"><a href="/"><Brand/></a><a href="/app/" className="pricing-back"><ArrowLeft size={16}/> Back to Chauffeur</a></header>
 <section className="pricing-intro"><span className="pricing-eyebrow">Simple plans, more personal style</span><h1>Find your plan.<br/><em>Keep finding your style.</em></h1><p>Start with the essentials, then make more room for your wardrobe, conversations and personal styling.</p></section>
 <section className="pricing-grid" aria-label="Chauffeur plans">
  <PlanCard title="Free" price="₹0" period=" / always" description="A thoughtful way to get started." features={free} cta={{href:'/app/',label:'Start for free'}}/>
  <PlanCard title="Pro" price="₹99" period=" / month" description="More ways to shop and style with Chauffeur." features={pro} featured cta={{href:'/app/',label:'Pro · coming soon'}}/>
 </section>
 <p className="pricing-footnote">No payment is taken today. Your account starts on Free by default.</p>
 <footer className="pricing-footer"><Brand/><span>Fashion, shopping and styling in one place.</span><a href="/faq/">Questions?</a></footer>
 </main>}
