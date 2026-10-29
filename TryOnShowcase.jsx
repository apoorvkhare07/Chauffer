import React, {useEffect, useRef, useState} from 'react';
import TryOnPair from './TryOnPair.jsx';
import TryOnSteps from './TryOnSteps.jsx';
import './tryon-showcase.css';

const looks = [
  {id:'dress', garment:'Emerald wrap dress', pair:true},
  {id:'linen', garment:'Linen shirt', pair:true},
  {id:'jeans', garment:'Wide-leg jeans', pair:true},
  {id:'jacket', garment:'Rust overshirt', pair:true},
  {id:'blue-blouse', garment:'Cobalt blouse', product:'tryon-blue-product.webp'},
  {id:'printed-kurta', garment:'Printed kurta'},
];
const photo=(look,state)=>`/images/tryon-${look.id}-${state}.webp`;

function PortraitTrack({after=false}) {
  return <div className="tryon-portrait-track" aria-hidden="true">
    {[0,1].map(copy=><div className="tryon-portrait-group" key={copy}>
      {looks.map(look=><div className="tryon-portrait" key={look.id}>
        {look.pair?<TryOnPair name={look.id} after={after}/>:<img className="tryon-portrait-photo" src={photo(look,after?'after':'before')} alt="" width="561" height="467"/>}
        {!after&&look.pair&&<span className="tryon-piece-label">{look.garment}</span>}
        {!after&&!look.pair&&<div className={`tryon-garment-thumb ${look.product?'':'is-detail'}`}><img src={look.product?`/images/${look.product}`:photo(look,'after')} alt="" width="120" height="150"/></div>}
      </div>)}
    </div>)}
  </div>;
}

export default function TryOnShowcase() {
  const stage=useRef(null),offset=useRef(null);
  const [visible,setVisible]=useState(false);
  const [reduced,setReduced]=useState(true),[pageVisible,setPageVisible]=useState(true);
  const running=visible&&pageVisible&&!reduced;
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync=()=>setReduced(media.matches),visibility=()=>setPageVisible(!document.hidden);
    sync();visibility();media.addEventListener('change',sync);document.addEventListener('visibilitychange',visibility);
    const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.1});observer.observe(stage.current);
    return()=>{observer.disconnect();media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  useEffect(()=>{
    if(!running)return;
    let frame,last=0;
    const tick=now=>{
      const width=stage.current.querySelector('.tryon-portrait-group').getBoundingClientRect().width;
      offset.current=((offset.current??width)-(last?Math.min(now-last,50):0)*.045+width)%width;last=now;
      stage.current.style.setProperty('--offset',`${-offset.current}px`);
      frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  },[running]);
  return <section className="tryon-directions tryon-lookbook" id="shop-by-occasion" aria-labelledby="tryon-lookbook-title">
    <div className="cs-wrap tryon-section-heading">
      <span className="tryon-kicker">Your own fitting room</span>
      <h2 id="tryon-lookbook-title">Don't Guess It, <span>Just Try It On.</span></h2>
    </div>
    <div className="tryon-carousel" ref={stage} data-running={running} role="img" aria-label="Moving try-on examples. Women and men with different builds try dresses, jeans, shirts and layers. Photos on the left become outfit examples as they pass the centre divider.">
      <div className="tryon-carousel-mask">
        <div className="tryon-carousel-layer"><PortraitTrack/></div>
        <div className="tryon-carousel-layer tryon-after-layer"><PortraitTrack after/></div>
      </div>
      <div className="tryon-carousel-divider" aria-hidden="true"/>
    </div>
    <div className="cs-wrap tryon-carousel-footer">
      <p>Your photo <span>→</span> Your next look</p>
    </div>
    <TryOnSteps/>
  </section>;
}
