import React from 'react';
import './store-universe.css';
const stores = [
 ['amazon','amazon',null], ['myntra','Myntra','myntra'], ['bonkers','Bonkers Corner','bonkers'],
 ['meesho','meesho',null], ['flipkart','Flipkart',null], ['souled','The Souled Store','souled'],
 ['ajio','AJIO',null], ['newme','NEWME',null], ['snitch','SNITCH',null], ['bewakoof','Bewakoof',null],
];
export default function StoreUniverse() {
 return <section className="store-universe" aria-labelledby="store-universe-title">
   <div className="store-universe-space" aria-hidden="true">{Array.from({length:5},(_,column)=>{
     const columnStores = Array.from({length:stores.length},(_,row)=>stores[(column*2+row*3)%stores.length]);
     return <div className={`store-column store-column-${column}`} key={column} style={{'--duration':`${64+column*4}s`,'--delay':`${-[7,19,3,14,25][column]}s`}}><div className="store-column-track">{[...columnStores,...columnStores].map(([id,name,image],index)=><div className="store-slot" key={`${id}-${index}`}><div className={`store-logo-tile store-logo-${id}`}>{image?<img src={`/images/stores/${image}.png`} alt=""/>:<span>{name}</span>}</div></div>)}</div></div>;
   })}</div>
   <div className="store-universe-copy"><p className="cs-eyebrow">A world of fashion</p><h2 id="store-universe-title">Your next find<br/>could be <em>anywhere.</em></h2><p>From everyday favourites to a whole new point of view.<br/>Your style has more than one address.</p></div>
   <p className="sr-only">Featured stores: Amazon, Flipkart, Meesho, AJIO, Myntra, Bonkers Corner, The Souled Store, NEWME, Snitch and Bewakoof.</p>
 </section>;
}
