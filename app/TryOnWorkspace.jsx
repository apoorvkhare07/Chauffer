import React,{useState} from 'react';
import {Plus,LoaderCircle,Sparkles} from 'lucide-react';
import {PHOTO_ACCEPT,validatePhoto} from './photoUpload';
import usePhotoPreview from './usePhotoPreview';

export function PhotoTile({label,file,onChange,disabled=false}){
 const preview=usePhotoPreview(file),[error,setError]=useState('');
 function choose(next){if(!next||disabled)return;try{validatePhoto(next);onChange(next);setError('');}catch(e){setError(e.message);}}
 return <div className="studio-photo"><label className={`studio-photo-tile ${preview.url?'has-photo':''}`} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();choose(e.dataTransfer.files?.[0]);}}>
  {preview.url?<><img src={preview.url} alt={label}/><span className="studio-change">Change photo</span></>:<span className="studio-photo-empty"><Plus size={24}/><strong>Add photo</strong></span>}
  <input aria-label={label} type="file" accept={PHOTO_ACCEPT} disabled={disabled} onChange={e=>{choose(e.target.files?.[0]);e.target.value='';}}/>
 </label>{preview.pending&&<small role="status">Preparing photo…</small>}{(preview.error||error)&&<p className="account-error" role="alert">{preview.error||error}</p>}</div>;
}

export function TryOnPrivacy({consent,onChange,disabled=false,guest=false}){
 return <div className="studio-privacy"><label><input type="checkbox" checked={consent} disabled={disabled} onChange={e=>onChange(e.target.checked)}/><span>Use my photos for this try-on.</span></label><details><summary>Photo privacy & tips</summary><p>Use a clear photo with the area you want to change visible. Clothing and shoes are supported; jewellery and glasses aren’t yet.</p><p>Photos are sent for image processing. {guest?'Your preview is kept for 30 minutes. Sign in and save it to keep it.':'Your photos and previews stay in this session and aren’t added to your account. Refreshing clears them.'} A preview doesn’t verify size or fit.</p></details></div>;
}

export function TryOnCanvas({busy=false,children,photoUrl}){
 return <section className={`studio-canvas ${children?'has-result':''} ${busy?'is-working':''}`} aria-label="Try-on preview" aria-busy={busy}>
  {children||<div className="studio-empty-canvas">{photoUrl?<img className="studio-ready-photo" src={photoUrl} alt="Your photo ready for try-on"/>:<div className="studio-example" aria-label="Example try-on"><img src="/images/tryon-blue-blouse-before.webp" alt="Example: original outfit"/><span><Sparkles size={18}/></span><img src="/images/tryon-blue-blouse-after.webp" alt="Example: blue blouse tried on"/></div>}<div className="studio-canvas-caption"><strong>{photoUrl?'Ready for a new look':'See it on you'}</strong><span>{photoUrl?'Choose a piece, then try it on.':'Your photo + a piece you like'}</span>{!photoUrl&&<small>Example</small>}</div></div>}
  {busy&&<div className="studio-progress" role="status"><LoaderCircle size={28}/><strong>Creating your look…</strong><span>Keep this page open.</span></div>}
 </section>;
}
