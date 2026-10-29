import TryOnTargetField from './TryOnTargetField';
import React,{useEffect,useRef,useState} from 'react';
import {useAction,useConvexAuth,useMutation,useQuery} from 'convex/react';
import {ImagePlus,Download,Heart,LockKeyhole} from 'lucide-react';
import {api} from '../convex/_generated/api';
import {startCreationAttempt,tryOnProperties,trackTryOnExport} from './creationAnalytics';
import {track,analyticsIdentity} from '../analytics';
import {jpegPhoto} from './photoUpload';
import usePhotoPreview from './usePhotoPreview';
import {guestTryOnToken} from './guestTryOnSession';
import SignIn from './SignIn';
import {exportMedia,mediaBlob,exportUserMessage} from './mediaExport';
import {PhotoTile,TryOnPrivacy,TryOnCanvas} from './TryOnWorkspace';
import {selectedEditProduct} from '../shared/productEdits';
import './guest-tryon.css';
export default function GuestTryOn({compact=false}){
 const [target,setTarget]=useState('auto');
 const [editProduct]=useState(()=>selectedEditProduct(window.location.search));
 const [token]=useState(guestTryOnToken),{isLoading,isAuthenticated}=useConvexAuth();
 const trial=useQuery(api.guestTrials.current,{token}),run=useAction(api.guestTrialsAI.tryOn),exportImage=useMutation(api.guestTryOn.exportImage),save=useMutation(api.guestTryOn.save);
 const [portrait,setPortrait]=useState(null),[garment,setGarment]=useState(null),[link,setLink]=useState(editProduct?.url??''),[mode,setMode]=useState('link'),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[login,setLogin]=useState(false),[saved,setSaved]=useState(false),[notice,setNotice]=useState('');
 const portraitPreview=usePhotoPreview(portrait);
 function changePortrait(file){setPortrait(file);setConsent(false);setError('');}

 const identity=useQuery(api.analytics.identity,isAuthenticated?{}:'skip');
 useEffect(()=>{if(!isLoading&&(!isAuthenticated||identity!==undefined))analyticsIdentity(isAuthenticated?identity:null);},[isLoading,isAuthenticated,identity]);
 const lock=useRef(false),resultRef=useRef(null);
 useEffect(()=>{if(isAuthenticated)setLogin(false);},[isAuthenticated]);
 const used=Boolean(trial?.tryOnUsed),waiting=busy||trial?.tryOnState==='building',url=trial?.tryOnUrl,lookSaved=saved||trial?.tryOnSaved;
 function gate(action){if(window.location.pathname.startsWith('/app'))history.replaceState(null,'','#/guest-tryon');setLogin(true);track('tryon_signin_prompted',{action});}
 async function submit(e){
  e.preventDefault();if(lock.current||!portrait||!consent||trial===undefined||waiting||!(mode==='link'?link.trim():garment))return;
  if(used){gate('another_tryon');return;}
  lock.current=true;setBusy(true);setError('');
  const attempt=startCreationAttempt('tryon',tryOnProperties(mode==='link'?'link':'upload',{url:link}));
  try{await run({token,target,portraitJpeg:await jpegPhoto(portrait),...(mode==='link'?{productUrl:link.trim()}:{garmentJpeg:await jpegPhoto(garment)}),consent:true});attempt.complete();}
  catch(e){attempt.fail(e);setError(typeof e?.data==='string'?e.data:'Could not create your preview. Please try again.');}
  finally{lock.current=false;setBusy(false);}
 }
 async function download(){
  if(!isAuthenticated){trackTryOnExport('download',{...tryOnProperties(mode==='link'?'link':'upload',{url:link}),is_guest:true,gated:true,completion_verifiable:false});gate('download');return;}if(lock.current)return;lock.current=true;setError('');
  try{await exportMedia({loadBlob:async()=>mediaBlob(await exportImage({token})),properties:{is_guest:false,...tryOnProperties(mode==='link'?'link':'upload',{url:link})}});}
  catch(e){setError(exportUserMessage(e));}finally{lock.current=false;}
 }
 async function saveLook(){
  if(!isAuthenticated){gate('save');return;}if(lock.current)return;lock.current=true;setError('');
  try{await save({token,consent:true});setSaved(true);setNotice('Saved to Wardrobe → Saved looks.');track('tryon_saved');}
  catch(e){setError(typeof e?.data==='string'?e.data:'Could not save this look. Please try again.');}finally{lock.current=false;}
 }
 return <section className={`tryon-studio guest-studio ${compact?'studio-compact':''}`} aria-label="Try on a look">
  {!compact&&<header className="workspace-heading"><div><h1>Try-on</h1><p>See a new piece on you.</p></div></header>}
  <form className={`studio-workspace ${(used&&!waiting)||isAuthenticated?'studio-complete':''}`} onSubmit={submit}>
   {!used&&!isAuthenticated&&<div className="studio-controls"><div className="studio-input-pair">
    <div className="studio-input"><h2>Your photo</h2><PhotoTile label="Your photo" file={portrait} onChange={changePortrait} disabled={waiting}/></div>
    <div className="studio-input"><div className="studio-input-heading"><h2>Your piece</h2><select aria-label="Product source" value={mode} disabled={waiting} onChange={e=>{setMode(e.target.value);setError('');}}><option value="link">Link</option><option value="upload">Upload</option></select></div>
     {mode==='upload'?<PhotoTile label="Product photo" file={garment} onChange={setGarment} disabled={waiting}/>:<div className="studio-link-product"><label className="sr-only" htmlFor="guest-product-link">Product link</label><input id="guest-product-link" type="url" value={link} disabled={waiting} onChange={e=>setLink(e.target.value)} placeholder="Paste product link" required maxLength={2000}/>{editProduct&&link===editProduct.url?<img src={editProduct.imageUrl} alt={editProduct.title}/>:<span className="studio-link-hint"><ImagePlus size={22}/>From your favourite store</span>}</div>}
    </div>
   </div><TryOnTargetField value={target} onChange={setTarget} disabled={waiting}/></div>}
   <TryOnCanvas busy={waiting} photoUrl={portraitPreview.url}>{url&&<div className="studio-result" ref={resultRef}><div className="studio-result-toolbar"><strong>Your new look</strong></div><img className="studio-result-image" src={url} alt="Your generated try-on preview" draggable="false"/><div className="studio-result-bottom"><button type="button" className="chat-chip" onClick={download}><Download size={17}/>{!isAuthenticated&&<LockKeyhole size={12}/>} Download</button><button type="button" className="chat-chip" onClick={saveLook} disabled={lookSaved}><Heart size={17}/>{!isAuthenticated&&<LockKeyhole size={12}/>} {lookSaved?'Saved':'Save look'}</button></div><small className="studio-result-note">AI preview · Check size and fit on the store.</small></div>}</TryOnCanvas>
   {!used&&!isAuthenticated&&<div className="studio-action-bar"><TryOnPrivacy consent={consent} onChange={setConsent} disabled={waiting} guest/><button className="studio-primary" type="submit" disabled={isLoading||trial===undefined||waiting||!portrait||!consent||!(mode==='link'?link.trim():garment)}>{waiting?'Creating…':'Try it on'}</button><small className="studio-guest-note">Your first look is on us. No sign-in needed.</small></div>}
  </form>
  {!waiting&&(used||isAuthenticated)&&!login&&<div className="studio-signin-prompt">{!isAuthenticated&&<p>{url?'Sign in to save, download and try more.':'Sign in to try another look.'}</p>}{isAuthenticated?<a className="studio-primary" href={`/app/${window.location.search}#/try-on`}>{url?'Try another look':'Open try-on'}</a>:<button className="studio-primary" onClick={()=>gate('continue')}>Sign in with phone</button>}</div>}
  {login&&!isAuthenticated&&<div className="first-tryon-login"><button className="studio-back" onClick={()=>setLogin(false)}>← Back to preview</button><SignIn/></div>}
  {error&&<p role="alert" className="account-error studio-feedback">{error}</p>}{notice&&<p role="status">{notice} <a href="/app/#/looks">Open wardrobe</a></p>}
  {!url&&trial?.tryOnState==='failed'&&!error&&<p role="alert">{trial.tryOnNote||'That preview didn’t finish. Please try again.'}</p>}
  {!lookSaved&&url&&<p className="studio-result-note">Save within 30 minutes to keep this look.</p>}
 </section>;
}
