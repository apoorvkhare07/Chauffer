import React from 'react';
import './store-universe.css';
const stores = [
 ['amazon','amazon',null], ['myntra','Myntra','myntra'], ['bonkers','Bonkers Corner','bonkers'],
 ['meesho','meesho',null], ['flipkart','Flipkart',null], ['souled','The Souled Store','souled'],
 ['ajio','AJIO',null], ['newme','NEWME',null], ['snitch','SNITCH',null], ['bewakoof','Bewakoof',null],
];
export default function StoreUniverse() {
 return <section className="store-universe" aria-labelledby="store-universe-title">
   <div className="store-universe-space" aria-hidden="true">{stores.map(([id,name,image],index)=><div className={`store-flight store-flight-${index%5}`} key={id} style={{'--delay':`${-index*3.2}s`,'--turn':`${index%2 ? 12 : -12}deg`}}><div className={`store-logo-tile store-logo-${id}`}>{image?<img src={`/images/stores/${image}.png`} alt=""/>:<span>{name}</span>}</div></div>)}</div>
   <div className="store-universe-copy"><p className="cs-eyebrow">A world of fashion</p><h2 id="store-universe-title">Your next find<br/>could be <em>anywhere.</em></h2><p>From everyday favourites to a whole new point of view.<br/>Your style has more than one address.</p></div>
   <div className="store-universe-note"><p><span/> Live discovery on Flipkart & Amazon</p><small>Other brands shown for inspiration. Direct search isn’t connected yet.</small></div>
   <p className="sr-only">Featured stores: Amazon, Flipkart, Meesho, AJIO, Myntra, Bonkers Corner, The Souled Store, NEWME, Snitch and Bewakoof.</p>
 </section>;
}
