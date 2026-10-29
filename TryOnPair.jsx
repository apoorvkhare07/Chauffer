import React from 'react';
import './tryon-pair.css';
/** Each image contains two matched photos; crop in layout, without stretching the person. */
export default function TryOnPair({name,after=false,className='',alt=''}){
 return <span className={`tryon-pair-photo ${after?'is-after':''} ${className}`}><img src={`/images/tryon-${name}-pair.webp`} alt={alt} loading="lazy"/></span>;
}
