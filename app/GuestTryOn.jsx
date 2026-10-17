import React,{useState} from 'react';
import {useAction,useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
import {ArrowRight,ImagePlus,Sparkles} from 'lucide-react';
import {jpegPhoto,PHOTO_ACCEPT,PHOTO_FORMATS} from './photoUpload';
import usePhotoPreview from './usePhotoPreview';

function PhotoField({label,file,setFile}){const preview=usePhotoPreview(file);return <label className="guest-photo-field"><span>{label}</span>{preview.url?<img src={preview.url} alt={label}/>:<span className="guest-photo-placeholder"><ImagePlus size={25}/> Choose photo</span>}<input type="file" accept={PHOTO_ACCEPT} onChange={e=>setFile(e.target.files?.[0]??null)}/>{preview.error&&<small role="alert">{preview.error}</small>}</label>;}
export default function GuestTryOn({token,onSignIn}){
 const trial=useQuery(api.guestTrials.current,{token}),run=useAction(api.guestTrialsAI.tryOn);const [portrait,setPortrait]=useState(null),[garment,setGarment]=useState(null),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e){e.preventDefault();if(!portrait||!garment||!consent||busy)return;if(trial?.tryOnUsed){onSignIn();return;}setBusy(true);setError('');try{await run({token,portraitJpeg:await jpegPhoto(portrait),garmentJpeg:await jpegPhoto(garment)});}catch(err){setError(err?.data||err?.message||'The preview could not be completed. Please try again.');}finally{setBusy(false);}}
 const used=trial?.tryOnUsed||trial?.tryOnState==='ready';
 return <section className="guest-trial-page" aria-labelledby="guest-tryon-title"><span className="discovery-eyebrow">TRY-ON PREVIEW</span><h1 id="guest-tryon-title">See a piece on you</h1><p>Upload a clear photo of yourself and one clothing item to make a visual preview.</p>
 {trial?.tryOnUrl?<div className="guest-trial-result"><img className="guest-tryon-result" src={trial.tryOnUrl} alt="Your visual clothing preview"/><p className="account-note">A visual preview only; it does not verify size or fit.</p></div>:trial?.tryOnState==='building'||busy?<div className="guest-trial-wait" role="status"><Sparkles size={22}/> Preparing your preview…</div>:null}
 {!used&&trial?.tryOnState!=='building'&&<form className="guest-trial-form" onSubmit={submit}><div className="guest-photo-pair"><PhotoField label="Your photo" file={portrait} setFile={setPortrait}/><PhotoField label="Clothing item" file={garment} setFile={setGarment}/></div><p className="account-note">Use a full-length photo in good light and a clear single-item clothing photo. {PHOTO_FORMATS}.</p><label className="photo-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> I agree to use both photos to create this preview. They are held temporarily and deleted within 30 minutes.</label><button className="button primary" disabled={busy||!portrait||!garment||!consent}>{busy?'Preparing…':'Create my preview'} <ArrowRight size={17}/></button></form>}
 {trial?.tryOnNote&&trial.tryOnState==='failed'&&<p role="status" className="account-feedback">{trial.tryOnNote}</p>}{error&&<p role="alert" className="account-feedback account-error">{error}</p>}
 {used&&<div className="guest-signup-prompt"><h2>Keep going with your style</h2><p>Sign in to save previews, add your wardrobe and get recommendations shaped around you.</p><button className="button primary" onClick={onSignIn}>Save my preferences <ArrowRight size={17}/></button></div>}
 </section>;
}
