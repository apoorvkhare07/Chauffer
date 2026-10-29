import React from 'react';
import {TrendingDown, Bell, Copy} from 'lucide-react';
import './future-features.css';
import CreatorStudio from './CreatorStudio.jsx';

export function PricingIntelligence(){
  return (
    <section className="fashion-future pricing-intelligence" id="pricing-intelligence" aria-labelledby="price-intelligence-title"><div className="cs-wrap future-feature-layout">
      <div className="future-feature-copy"><span className="future-feature-kicker">Coming soon · Pricing intelligence</span><h2 id="price-intelligence-title">Love the look.<br/>Like the price.</h2><p>Keep an eye on sales, compare stores, or find a similar piece for less. Your next favourite should feel good to buy, too.</p><ul><li><TrendingDown size={19}/><div><h3>Catch a price drop</h3><p>Sales across your favourite stores.</p></div></li><li><Bell size={19}/><div><h3>Know when to buy</h3><p>A little context before you check out.</p></div></li><li><Copy size={19}/><div><h3>Get the look for less</h3><p>Similar pieces. A smaller price tag.</p></div></li></ul><span className="future-feature-status">Coming soon</span></div>
      <figure className="price-insight-preview"><div className="future-preview-heading"><span>On your wishlist</span><span>Example</span></div><div className="price-saved-product"><img src="/images/hero-cobalt-knit.webp" alt="Cobalt striped knit, illustrative saved product" loading="lazy"/><div><span>Saved for later</span><h3>Cobalt striped knit</h3><strong>₹1,999</strong><small>Lowest price in this example</small></div></div><div className="price-chart-heading"><span>Worth keeping an eye on.</span><span>Price history</span></div><div className="price-chart" aria-hidden="true"><svg viewBox="0 0 480 115"><path className="chart-guide" d="M0 15H480M0 55H480M0 95H480"/><path className="chart-fill" d="M0 18L65 24L120 15L185 49L250 42L310 73L375 68L435 95L480 91V115H0Z"/><path className="chart-line" d="M0 18L65 24L120 15L185 49L250 42L310 73L375 68L435 95L480 91"/><circle cx="435" cy="95" r="5"/></svg><span>Earlier this month</span><span>Now</span></div><div className="price-store-list">{[['Store A','₹2,499'],['Store B','₹1,999'],['Store C','₹2,299']].map(([store,price],i)=><div key={store}><span>{store}</span><strong>{price}</strong>{i===1&&<small>Lowest in this example</small>}</div>)}</div><figcaption>Illustrative prices and trend, not live offers.</figcaption></figure>
    </div></section>
  );
}

export default function FutureFeatures(){
  return <CreatorStudio/>;
}
