import React, { useState } from 'react';
import { Asterisk, ShoppingBag, CreditCard, ScanFace, Tags, Heart, Pause, Play } from 'lucide-react';
import './fashion-loader.css';
function Hanger(props) { return <svg {...props} width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6a3 3 0 1 1 4 2.83V11l8 5a1.1 1.1 0 0 1-.6 2H3.6a1.1 1.1 0 0 1-.6-2l10-6"/></svg>; }
const symbols = [ShoppingBag, CreditCard, Hanger, ScanFace, Tags, Heart];
export default function FashionLoader({ label = 'Getting things ready…', compact = false, paused = false }) {
  return <div className={`fashion-loader${compact?' fashion-loader-compact':''}${paused?' fashion-loader-paused':''}`} role="status" aria-live="polite">
    <div className="fashion-loader-stage" aria-hidden="true"><div className="fashion-loader-orbit">
      {symbols.map((Icon,index)=>{const angle=(-90+index*60)*Math.PI/180;return <div key={index} className="fashion-loader-node" style={{'--x':`${Math.cos(angle)*102}px`,'--y':`${Math.sin(angle)*102}px`,'--delay':`${index*.11}s`}}><div className="fashion-loader-upright"><div className="fashion-loader-tile"><Icon size={27}/></div></div></div>;})}
    </div><div className="fashion-loader-core"><Asterisk size={68} strokeWidth={1.6}/></div></div>
    <p className="fashion-loader-label">{label}</p>
  </div>;
}
export function LoaderPreview() {
  const [paused,setPaused]=useState(false);
  return <main className="loader-preview"><a className="loader-preview-brand" href="/">chauffer<span>.</span></a><div className="loader-preview-main"><p className="loader-preview-kicker">A little motion. A world of fashion.</p><FashionLoader paused={paused} label="Your fashion assistant is getting ready…"/><button className="loader-preview-toggle" onClick={()=>setPaused(!paused)}>{paused?<Play size={15}/>:<Pause size={15}/>} {paused?'Play animation':'Pause animation'}</button><p className="loader-preview-note">Shopping · Payments · Wardrobe · Try-on · Offers · Favourites</p><small>Animation preview — symbols represent the product vision, not completed actions.</small></div><a className="loader-preview-back" href="/">Back to the website ↗</a></main>;
}
