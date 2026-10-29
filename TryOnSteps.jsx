import React from 'react';
import {ArrowUpRight, Upload, Download, RefreshCw, Share2} from 'lucide-react';
import './tryon-steps.css';
const steps=[
  ['Add your photo','A clear photo of you. That’s all you need to start.'],
  ['Pick something to try','A product link, an image, or a piece from your wardrobe.'],
  ['See it on you','Your photo. Your pick. A new look to play with.'],
  ['Save, remix & share','Download your favourite. Try another. Send it to a friend.'],
];
function StepVisual({index}){return <div className={`tryon-mini-visual mini-visual-${index}`} aria-hidden="true">
  <span className="mini-step-number">{index+1}</span>
  {index===0&&<><img className="mini-person" src="/images/tryon-blue-blouse-before.webp" alt="" loading="lazy"/><span className="mini-step-icon"><Upload size={16}/></span></>}
  {index===1&&<><img className="mini-product" src="/images/tryon-blue-product.webp" alt="" loading="lazy"/><span className="mini-product-label">Your pick</span></>}
  {index===2&&<div className="mini-tryon"><img src="/images/tryon-blue-blouse-before.webp" alt="" loading="lazy"/><img src="/images/tryon-blue-blouse-after.webp" alt="" loading="lazy"/><i/></div>}
  {index===3&&<><img className="mini-person mini-result" src="/images/tryon-blue-blouse-after.webp" alt="" loading="lazy"/><div className="mini-actions"><Download size={13}/><RefreshCw size={13}/><Share2 size={13}/></div></>}
</div>}
export default function TryOnSteps(){return <div className="tryon-how" id="how-tryon-works" aria-labelledby="tryon-how-title"><div className="cs-wrap"><div className="tryon-how-heading"><h3 id="tryon-how-title">How does it work?</h3></div><ol className="tryon-simple-steps">{steps.map(([title,copy],index)=><li key={title}><StepVisual index={index}/><div><h4>{title}</h4><p>{copy}</p></div></li>)}</ol><div className="tryon-how-action"><a className="tryon-primary" href="/app/#/try-on" data-analytics="tryon_steps_start">Try it on <ArrowUpRight size={18}/></a></div></div></div>}
