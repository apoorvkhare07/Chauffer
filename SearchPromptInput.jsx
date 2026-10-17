import React,{useEffect,useState} from 'react';

const examples=[
 'Blue denim jeans under ₹3,000',
 'White sneakers under ₹5,000',
 'Men’s relaxed-fit shirts under ₹2,000',
 'An everyday bag under ₹2,500',
 'A kurta for a festive evening',
];

export default function SearchPromptInput({id,value,onChange,onFocus,onBlur,...props}){
 const [focused,setFocused]=useState(false);
 const [prompt,setPrompt]=useState('');
 useEffect(()=>{
  if(value||focused)return;
  let exampleIndex=0,character=0,deleting=false,timer;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(reduced){setPrompt(examples[0]);return;}
  const tick=()=>{
   const example=examples[exampleIndex];
   if(!deleting){character=Math.min(character+1,example.length);setPrompt(example.slice(0,character));if(character===example.length){deleting=true;timer=window.setTimeout(tick,1250);return;}timer=window.setTimeout(tick,46);return;}
   character=Math.max(0,character-1);setPrompt(example.slice(0,character));if(character===0){deleting=false;exampleIndex=(exampleIndex+1)%examples.length;timer=window.setTimeout(tick,240);return;}timer=window.setTimeout(tick,24);
  };
  setPrompt('');timer=window.setTimeout(tick,350);
  return()=>window.clearTimeout(timer);
 },[value,focused]);
 const focus=event=>{setFocused(true);onFocus?.(event);};
 const blur=event=>{setFocused(false);onBlur?.(event);};
 return <span className="search-prompt-field">
  {!value&&!focused&&<span className="search-prompt" aria-hidden="true">{prompt}<i/></span>}
  <input id={id} value={value} onChange={onChange} onFocus={focus} onBlur={blur} placeholder=" " {...props}/>
 </span>;
}
