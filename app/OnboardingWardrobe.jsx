import React,{useState} from 'react';
import {useQuery} from 'convex/react';
import {Check} from 'lucide-react';
import {api} from '../convex/_generated/api';
import WardrobeEditor from './WardrobeEditor';
import {clothingTags,wardrobeTitle} from '../shared/wardrobeTags';
export default function OnboardingWardrobe({onBusyChange}){
 const items=useQuery(api.wardrobe.list),[version,setVersion]=useState(0),[saved,setSaved]=useState(false);
 return <div className="onboard-wardrobe"><WardrobeEditor key={version} onBusyChange={onBusyChange} onSaved={()=>{setVersion(v=>v+1);setSaved(true);}}/>{saved&&<p role="status">Piece saved. Add another photo, or continue.</p>}{items?.some(i=>i.photoUrl)&&<div className="onboard-saved">{items.filter(i=>i.photoUrl).map(item=><figure key={item.id}><img src={item.photoUrl} alt={wardrobeTitle(item.details)}/><figcaption><Check size={12}/> {clothingTags(item.details).slice(0,2).join(' · ')}</figcaption></figure>)}</div>}</div>;
}
