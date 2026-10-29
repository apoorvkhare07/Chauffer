import React from 'react';
import {ArrowRight,LockKeyhole} from 'lucide-react';

export default function GuestWardrobe({onSignIn}){
 return <section className="guest-wardrobe-preview" aria-labelledby="guest-wardrobe-title">
  <div className="guest-wardrobe-copy"><span className="discovery-eyebrow">YOUR WARDROBE, REIMAGINED</span><h1 id="guest-wardrobe-title">Your clothes.<br/>More ways to wear them.</h1><p>Keep your pieces in one place, find fresh combinations and save the looks you love.</p><button className="button primary" onClick={onSignIn}>Sign in to start your wardrobe <ArrowRight size={18}/></button><span className="guest-wardrobe-lock"><LockKeyhole size={14}/> Your wardrobe stays private.</span></div>
  <figure className="guest-wardrobe-graphic"><img src="/images/wardrobe-preview-collage.webp" alt="Wardrobe inspiration: twelve photos of everyday outfits, jeans, sneakers, shirts and accessories" width="1200" height="1200"/><figcaption>A few pieces. Plenty of possibilities.</figcaption></figure>
 </section>;
}
