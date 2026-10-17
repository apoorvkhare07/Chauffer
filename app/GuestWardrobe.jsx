import React,{useState} from 'react';
import {useAction,useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
import {ArrowRight,ImagePlus,Sparkles} from 'lucide-react';
import {jpegPhoto,PHOTO_ACCEPT,PHOTO_FORMATS} from './photoUpload';
import usePhotoPreview from './usePhotoPreview';
import {clothingTags,wardrobeTitle} from '../shared/wardrobeTags';

export default function GuestWardrobe({token,onSignIn}){
 const trial=useQuery(api.guestTrials.current,{token}),analyse=useAction(api.guestTrialsAI.wardrobe);const [file,setFile]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[confirmed,setConfirmed]=useState(false);const preview=usePhotoPreview(file);const analysis=trial?.wardrobeAnalysis,used=trial?.wardrobeUsed;
 async function submit(e){e.preventDefault();if(!file||busy)return;if(used){onSignIn();return;}setBusy(true);setError('');setConfirmed(false);try{await analyse({token,jpegBase64:await jpegPhoto(file)});}catch(err){setError(err?.data||err?.message||'This clothing photo could not be read. Please try again.');}finally{setBusy(false);}}
 return <section className="guest-trial-page" aria-labelledby="guest-wardrobe-title"><span className="discovery-eyebrow">WARDROBE PREVIEW</span><h1 id="guest-wardrobe-title">Add a piece you own</h1><p>We’ll read its visible details and show you the tags to review.</p>
 {!analysis&&!used&&trial?.wardrobeState!=='building'&&<form className="guest-trial-form" onSubmit={submit}><label className="guest-photo-field guest-photo-single"><span>One clothing item</span>{preview.url?<img src={preview.url} alt="Selected clothing item"/>:<span className="guest-photo-placeholder"><ImagePlus size={25}/> Choose a clothing photo</span>}<input type="file" accept={PHOTO_ACCEPT} onChange={e=>setFile(e.target.files?.[0]??null)}/>{preview.error&&<small role="alert">{preview.error}</small>}</label><p className="account-note">Use a clear photo of one item. {PHOTO_FORMATS}. The image and its tags are temporary and deleted within 30 minutes.</p><button className="button primary" disabled={!file||busy}>{busy?'Reading your clothing…':'Read this piece'} <Sparkles size={17}/></button></form>}
 {(busy||trial?.wardrobeState==='building')&&<p className="guest-trial-wait" role="status">Reading visible clothing details…</p>}{error&&<p role="alert" className="account-feedback account-error">{error}</p>}
 {analysis&&<div className="guest-wardrobe-result"><div><h2>{wardrobeTitle(analysis.details)}</h2><div className="wardrobe-tag-list">{clothingTags(analysis.details).map((tag,i)=><span key={`${tag}-${i}`}>{tag}</span>)}</div></div>{analysis.uncertainties?.length>0&&<p className="account-note">Check the label for details the photo can’t confirm, such as exact size, brand or material.</p>}<button className={`button ${confirmed?'secondary':'primary'}`} onClick={()=>setConfirmed(true)}>{confirmed?'Tags confirmed':'Confirm these tags'}</button>
 {confirmed&&<div className="guest-signup-prompt"><h2>Save it to your wardrobe</h2><p>Sign in to keep this piece, add more clothes and get outfit ideas from what you own.</p><button className="button primary" onClick={onSignIn}>Save my preferences <ArrowRight size={17}/></button></div>}</div>}
 {used&&!analysis&&<div className="guest-signup-prompt"><h2>Your wardrobe preview is complete</h2><p>Sign in to save your clothes and get outfit ideas from them.</p><button className="button primary" onClick={onSignIn}>Continue with my wardrobe <ArrowRight size={17}/></button></div>}
 </section>;
}
