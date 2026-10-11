import React,{useState} from 'react';
export default function ProductPreview({option}){
 const [failed,setFailed]=useState(false);
 return <div className="chat-product-preview">{option.imageUrl&&!failed?<img src={option.imageUrl} alt={option.title} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<span>Preview unavailable<br/><a href={option.url} target="_blank" rel="noopener noreferrer">See photos on {option.store}</a></span>}</div>;
}
