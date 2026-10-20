import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Plus,ImagePlus,X} from 'lucide-react';
import {useAction} from 'convex/react';
import {api} from '../convex/_generated/api';
import {jpegPhoto,validatePhoto,PHOTO_ACCEPT,PHOTO_FORMATS} from './photoUpload.js';
export default function ShoppingInput({onDraft,disabled}){
 const read=useAction(api.shoppingInput.read),[file,setFile]=useState(null),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[result,setResult]=useState(null),[error,setError]=useState('');
 const disclosure=useRef(null),picker=useRef(null),dialog=useRef(null),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{function closeMenu(event){if(disclosure.current&&!disclosure.current.contains(event.target))disclosure.current.open=false;}document.addEventListener('pointerdown',closeMenu);return()=>document.removeEventListener('pointerdown',closeMenu);},[]);
 function close(){dialog.current?.close();disclosure.current?.querySelector('summary')?.focus();}
 function choose(event){const selected=event.target.files?.[0];event.target.value='';if(!selected)return;setConsent(false);setResult(null);setError('');try{validatePhoto(selected);setFile(selected);}catch(e){setFile(null);setError(e.message);}dialog.current?.showModal();}
 async function analyse(){setBusy(true);setError('');setResult(null);try{const base64=await jpegPhoto(file);const reply=await read({kind:'photo',base64,mime:'image/jpeg',consent});if(alive.current)setResult(reply);}catch(e){if(alive.current)setError((e.message?.includes('smaller')||e.message?.includes('HEIC'))?e.message:'Could not read this image. Try a clearer photo.');}finally{if(alive.current)setBusy(false);}}
 return <>
  <details ref={disclosure} className="shopping-input" onKeyDown={event=>{if(event.key==='Escape'){disclosure.current.open=false;disclosure.current.querySelector('summary')?.focus();}}}>
   <summary aria-label="Add image" title="Add image"><Plus size={22} aria-hidden="true"/></summary>
   <div className="shopping-image-menu"><button type="button" disabled={disabled||busy} onClick={()=>{disclosure.current.open=false;picker.current?.click();}}><ImagePlus size={19} aria-hidden="true"/>Upload image</button></div>
  </details>
  <input ref={picker} type="file" accept={PHOTO_ACCEPT} hidden aria-label="Upload image from computer" onChange={choose}/>
  {createPortal(<dialog ref={dialog} className="shopping-photo-dialog" aria-label="Review uploaded image" onCancel={event=>{if(busy)event.preventDefault();}} onClick={event=>{if(event.target===dialog.current&&!busy)close();}}>
   <header><h2>Shopping from your photo</h2><button type="button" aria-label="Close image" disabled={busy} onClick={close}><X size={20}/></button></header>
   {file&&<p className="shopping-photo-name">{file.name}</p>}
   <p className="account-note">{PHOTO_FORMATS} · up to 12 MB. We’ll turn your image into an editable request. Uploads are processed, then discarded.</p>
   {!result&&<><label className="shopping-photo-consent"><input type="checkbox" checked={consent} disabled={busy} onChange={event=>setConsent(event.target.checked)}/>I agree to have this image processed for my shopping request.</label><button className="shopping-photo-action" type="button" onClick={analyse} disabled={disabled||busy||!file||!consent}>{busy?'Reading your image…':'Create request draft'}</button></>}
   {error&&<p role="alert">{error}</p>}
   {result&&<><p>{result.text||'No clear request found.'}</p><ul className="account-note">{result.uncertainties.map((text,i)=><li key={i}>{text}</li>)}</ul><button className="shopping-photo-action" type="button" disabled={disabled||!result.text} onClick={()=>{close();onDraft(result.text);}}>Use this request</button></>}
  </dialog>,document.body)}
 </>;
}
