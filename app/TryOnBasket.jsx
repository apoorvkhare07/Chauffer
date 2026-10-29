import TryOnTargetField from './TryOnTargetField';
import {exportMedia,mediaBlob,exportUserMessage} from './mediaExport';
import {track} from '../analytics';
import {startCreationAttempt,tryOnProperties} from './creationAnalytics';
import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {useAction,useMutation,useQuery} from 'convex/react';
import {ShoppingBag,Plus,Check,X,ArrowUpRight,ImagePlus,Sparkles,Trash2,Download,LoaderCircle} from 'lucide-react';
import {api} from '../convex/_generated/api';
import {TRY_ON_BASKET_LIMIT} from '../convex/quickTryOnRules';
import {jpegPhoto,PHOTO_ACCEPT,validatePhoto} from './photoUpload';
import usePhotoPreview from './usePhotoPreview';
import AffiliateLink from './AffiliateLink.jsx';
import {runTryOnQueue} from './tryOnBasketQueue';
import './try-on-basket.css';

const BasketContext=createContext(null);
export const useTryOnBasket=()=>useContext(BasketContext);
const money=option=>`${option.priceFrom?'From ':''}₹${option.price.toLocaleString('en-IN')}`;
const message=error=>typeof error?.data==='string'?error.data:error?.message||'Something went wrong. Please try again.';

export function TryOnBasketProvider({children,showLauncher=false}){
 const session=useQuery(api.tryOnBasket.session);
 const items=useQuery(api.tryOnBasket.list),addItem=useMutation(api.tryOnBasket.add),removeItem=useMutation(api.tryOnBasket.remove);
 const [open,setOpen]=useState(false),[selected,setSelected]=useState(null),[pending,setPending]=useState(new Set()),[notice,setNotice]=useState(''),[error,setError]=useState(''),[progress,setProgress]=useState('');
 const adding=useRef(new Set()),sessionRef=useRef(session);
 useEffect(()=>{if(session===undefined)return;const previous=sessionRef.current;sessionRef.current=session;if(previous!==undefined&&previous!==session){setOpen(false);setSelected(null);setNotice('');setError('');setProgress('');}},[session]);
 const wasOpen=useRef(false);
 useEffect(()=>{if(open&&!wasOpen.current)track('tryon_basket_opened',{item_count:items?.length??0});wasOpen.current=open;},[open,items?.length]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3500);return()=>clearTimeout(timer);},[notice]);
 async function add(source,show=false){
  if(adding.current.has(source.url))return;
  const startedIn=sessionRef.current;
  adding.current.add(source.url);setPending(new Set(adding.current));setError('');
  try{const id=await addItem({source});track('tryon_basket_added',{entry_point:source.kind==='catalog'?'discover':'chat'});if(startedIn!==sessionRef.current)return;setSelected(id);setNotice('Added to your try-on basket.');if(show)setOpen(true);return id;}
  catch(e){if(startedIn===sessionRef.current)setError(message(e));}
  finally{adding.current.delete(source.url);setPending(new Set(adding.current));}
 }
 async function remove(id){try{await removeItem({id});track('tryon_basket_removed');setError('');}catch(e){setError(message(e));}}
 function show(id){if(id)setSelected(id);setOpen(true);setError('');}
 const value={items:items??[],ready:items!==undefined&&session!==undefined,add,show,pending,contains:url=>items?.some(i=>i.option.url===url)};
 return <BasketContext.Provider value={value}>{children}
  {((showLauncher&&items?.length>0)||error)&&<div className="try-basket-dock">{error&&<div className="try-basket-toast" role="alert">{error}<button aria-label="Dismiss basket error" onClick={()=>setError('')}><X size={14}/></button></div>}{showLauncher&&notice&&<span className="try-basket-added" role="status">{notice}</span>}{showLauncher&&items?.length>0&&<button className="try-basket-launch" onClick={()=>show()} aria-label={`Open try-on basket, ${items.length} pieces`}><ShoppingBag size={19}/><span>{progress||'Try-on basket'}</span><strong>{items.length}</strong></button>}</div>}
  <BasketPanel key={session??'loading'} items={items??[]} open={open} onClose={()=>setOpen(false)} selected={selected} onSelect={setSelected} onRemove={remove} onProgress={setProgress} error={error}/>
 </BasketContext.Provider>;
}
export function AddToTryOn({source,title,className=''}){
 const basket=useTryOnBasket();if(!basket)return null;
 const item=basket.items.find(i=>i.option.url===source.url),pending=basket.pending.has(source.url);
 return <button type="button" className={`add-to-tryon ${item?'is-added':''} ${className}`} disabled={!basket.ready||pending} aria-label={item?`View ${title} in try-on basket`:`Add ${title} to try-on basket`} onClick={()=>item?basket.show(item._id):basket.add(source)}>{pending?<LoaderCircle size={15} className="basket-spin"/>:item?<Check size={15}/>:<Plus size={15}/>}<span>{pending?'Adding…':item?'In try-on basket':'Add to try-on'}</span></button>;
}

function BasketPanel({items,open,onClose,selected,onSelect,onRemove,onProgress,error:outsideError}){
 const [targets,setTargets]=useState({});
 const generate=useAction(api.quickTryOnAI.generate),dialog=useRef(null),fileInput=useRef(null),activePick=useRef(null);
 const [photo,setPhoto]=useState(null),[consent,setConsent]=useState(false),[results,setResults]=useState({}),[errors,setErrors]=useState({}),[busy,setBusy]=useState(false),[running,setRunning]=useState(null),[queued,setQueued]=useState([]),[stopping,setStopping]=useState(false),[error,setError]=useState(''),[before,setBefore]=useState(false),[compare,setCompare]=useState(false);
 const preview=usePhotoPreview(photo),mounted=useRef(true),version=useRef(0),stop=useRef(false),locked=useRef(false),prepared=useRef(new WeakMap()),latestItems=useRef(items);
 latestItems.current=items;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;stop.current=true;version.current++;};},[]);
 useEffect(()=>{const el=dialog.current;if(open&&!el.open)el.showModal();else if(!open&&el.open)el.close();},[open]);
 useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;};},[open]);
 const item=items.find(i=>i._id===selected)??items[0],result=item&&results[item._id];
 useEffect(()=>{if(open)activePick.current?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});},[open,item?._id]);
 const remaining=items.filter(i=>!results[i._id]),completed=items.filter(i=>results[i._id]);
 useEffect(()=>{const ids=new Set(items.map(i=>i._id));setResults(old=>Object.fromEntries(Object.entries(old).filter(([id])=>ids.has(id))));},[items]);
 function choosePhoto(file){if(locked.current)return;try{if(file)validatePhoto(file);version.current++;setPhoto(file);setConsent(false);setResults({});setErrors({});setError('');setBefore(false);setCompare(false);}catch(e){setError(message(e));}if(fileInput.current)fileInput.current.value='';}
 function prepare(file){if(!prepared.current.has(file))prepared.current.set(file,jpegPhoto(file).catch(e=>{prepared.current.delete(file);throw e;}));return prepared.current.get(file);}
 async function run(ids){
  if(!photo||!consent||locked.current||!ids.length)return;
  locked.current=true;stop.current=false;setBusy(true);setStopping(false);setError('');setQueued(ids);setCompare(false);setBefore(false);const rev=version.current;
  const attempts=new Map(),first=items.find(i=>i._id===ids[0]);
  const start=i=>startCreationAttempt('tryon',tryOnProperties('link',i.option),{remixed:completed.length>0});
  if(first)attempts.set(first._id,start(first));
  try{
   const portraitJpeg=await prepare(photo);let done=0;
   await runTryOnQueue({ids,shouldStop:()=>stop.current||!mounted.current||rev!==version.current,
    run:async id=>{const pick=latestItems.current.find(i=>i._id===id);if(!pick)return null;const attempt=attempts.get(id)??start(pick);attempts.set(id,attempt);try{const value=await generate({portraitJpeg,garment:{kind:'basket',id},consent:true,target:targets[id]??'auto'});attempt.complete();return value;}catch(e){attempt.fail(e);throw e;}},
    onStart:id=>{setRunning(id);setErrors(old=>({...old,[id]:''}));onProgress(`Trying ${++done} of ${ids.length}`);},
    onReady:(id,value)=>{if(mounted.current&&version.current===rev&&latestItems.current.some(i=>i._id===id)){setResults(old=>({...old,[id]:{image:`data:${value.mime};base64,${value.base64}`}}));if(done===1)onSelect(id);}},
    onError:(id,e)=>{if(mounted.current&&version.current===rev)setErrors(old=>({...old,[id]:message(e)}));}
   });
  }catch(e){attempts.get(ids[0])?.fail(e);if(mounted.current&&rev===version.current)setError(message(e));}
  finally{for(const attempt of attempts.values())attempt.fail({name:'AbortError'});locked.current=false;if(mounted.current){setBusy(false);setRunning(null);setQueued([]);setStopping(false);onProgress('');}}
 }
 function pick(id){onSelect(id);setBefore(false);setCompare(false);}
 return <dialog ref={dialog} className="try-basket-panel" aria-labelledby="try-basket-title" onCancel={e=>{e.preventDefault();onClose();}}>
  <header className="try-basket-header"><div><h2 id="try-basket-title">Your try-on basket <small>{items.length}/{TRY_ON_BASKET_LIMIT}</small></h2></div><button className="try-basket-close" aria-label="Keep browsing" onClick={onClose}><X size={21}/></button></header>
  {!items.length?<div className="try-basket-empty"><ShoppingBag size={42}/><h3>Try a few favourites.</h3><p>Add pieces from Discover or chat, then try them with one photo.</p><button className="basket-primary" onClick={onClose}>Keep browsing</button></div>:<>
  <div className="try-basket-body"><aside className="try-basket-picks"><div className="try-basket-picks-heading"><h3>Your picks</h3><button onClick={onClose}><Plus size={14}/> Add more</button></div><div className="try-basket-items" role="group" aria-label="Pieces in your try-on basket">{items.map(i=><div className={`try-basket-item ${item?._id===i._id?'is-selected':''}`} key={i._id}><button ref={item?._id===i._id?activePick:null} className="try-basket-pick" aria-label={`Preview ${i.option.title}`} aria-pressed={item?._id===i._id} onClick={()=>pick(i._id)}><img referrerPolicy="no-referrer" src={results[i._id]?.image||i.option.imageUrl} alt=""/><span><strong>{i.option.title}</strong><small>{money(i.option)}</small><em className={errors[i._id]?'has-error':''}>{running===i._id?'Trying it on…':results[i._id]?'Preview ready':errors[i._id]?'Try again':busy&&queued.includes(i._id)?'Up next':i.option.brand||i.option.store}</em></span></button><button className="try-basket-remove" disabled={busy} aria-label={`Remove ${i.option.title} from try-on basket`} onClick={()=>onRemove(i._id)}><X size={15}/></button></div>)}</div><details className="basket-help"><summary>About your basket</summary><p>Separate from saved pieces. A new chat or search clears this basket. Photos and previews clear on refresh.</p></details></aside>
  <section className="try-basket-stage" aria-label="Try-on workspace">
   {!photo?<div className="try-basket-upload" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();choosePhoto(e.dataTransfer.files?.[0]);}}><ImagePlus size={38}/><h3>One photo. Try every pick.</h3><p>Add your photo once. Try each piece.</p><label className="basket-primary" htmlFor="basket-portrait">Choose your photo</label><small>or drop it here</small></div>:<>
    <div className="try-basket-viewbar"><div className="try-basket-view-tabs" role="group" aria-label="Compare try-on views"><button aria-pressed={!compare&&!before} onClick={()=>{setCompare(false);setBefore(false);}}>Try-on</button><button aria-pressed={!compare&&before} onClick={()=>{setCompare(false);setBefore(true);}}>Original</button>{completed.length>1&&<button aria-pressed={compare} onClick={()=>setCompare(true)}>Compare {completed.length}</button>}</div><button className="try-basket-change" disabled={busy} onClick={()=>fileInput.current?.click()}>Change photo</button></div>
    {compare?<div className="try-basket-compare" aria-label="Compare your looks">{completed.map(i=><button key={i._id} onClick={()=>pick(i._id)} aria-label={`View try-on for ${i.option.title}`}><img src={results[i._id].image} alt={`Try-on of ${i.option.title}`}/><strong>{i.option.title}</strong><span>{money(i.option)}</span></button>)}</div>:<div className="try-basket-visual">{(result&&!before)||preview.url?<img src={result&&!before?result.image:preview.url} alt={result&&!before?`Try-on of ${item.option.title}`:'Your original photo'}/>:<p role="status">Preparing your photo…</p>}{!result&&!before&&<div className="try-basket-visual-label">{running===item?._id?<><LoaderCircle className="basket-spin" size={15}/> Creating this look…</>:<>Your photo · choose Try below</>}</div>}</div>}
    {preview.error&&<p className="try-basket-error" role="alert">{preview.error}</p>}
    {item&&!compare&&<div className="try-basket-product"><div><span>{item.option.brand||item.option.store}</span><h3>{item.option.title}</h3><strong>{money(item.option)}</strong></div><AffiliateLink reference={{kind:'basket',id:item._id}} source="basket" href={item.option.url} className="try-basket-shop">View on {item.option.store} <ArrowUpRight size={15}/></AffiliateLink></div>}
    {item&&!compare&&<TryOnTargetField value={targets[item._id]??'auto'} disabled={busy} onChange={value=>{setTargets(old=>({...old,[item._id]:value}));setResults(old=>{const next={...old};delete next[item._id];return next;});}}/>}{result&&!compare&&<div className="try-basket-result-note"><small>AI preview · check the size and final price on the store.</small><button type="button" onClick={async()=>{try{await exportMedia({loadBlob:()=>mediaBlob(result.image),properties:{...tryOnProperties('link',item.option),is_guest:false}});}catch(e){setError(exportUserMessage(e));}}}><Download size={14}/> Download</button></div>}
   </>}
   <input ref={fileInput} id="basket-portrait" className="sr-only" type="file" accept={PHOTO_ACCEPT} disabled={busy} onChange={e=>choosePhoto(e.target.files?.[0])}/>
   {(error||outsideError||item&&errors[item._id])&&<p className="try-basket-error" role="alert">{error||outsideError||errors[item._id]}</p>}
  </section></div>
  <footer className="try-basket-footer"><div className="try-basket-consent">{photo&&!consent?<label><input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/> Use my photo to make these try-on previews.</label>:<span>{busy?'You can keep browsing while your previews finish.':completed.length?`${completed.length} ${completed.length===1?'look':'looks'} ready. Compare, then pick your favourite.`:'Add your photo to get started.'}</span>}<small>Photos go to image processing and stay off your profile and wardrobe.</small></div><div className="try-basket-footer-actions">{busy?<button className="basket-secondary" disabled={stopping} onClick={()=>{stop.current=true;setStopping(true);}}>{stopping?'Stopping after this…':'Stop after this'}</button>:<>{photo&&<button className="basket-secondary" onClick={()=>choosePhoto(null)} aria-label="Clear photo and previews"><Trash2 size={15}/><span>Clear photo</span></button>}{item&&remaining.length>1&&<button className="basket-secondary" disabled={!photo||!consent||preview.pending||Boolean(preview.error)} onClick={()=>run([item._id])}>{results[item._id]?'Retry this look':'Try this piece'}</button>}<button className="basket-primary" disabled={!photo||!consent||preview.pending||Boolean(preview.error)} onClick={()=>run(remaining.length?remaining.map(i=>i._id):[item._id])}><Sparkles size={16}/>{remaining.length>1?`Try ${remaining.length} pieces`:remaining.length===1?(remaining[0]._id===item?._id?'Try this piece':'Try remaining piece'):'Retry this look'}</button></>}</div>{busy&&<p role="status" className="try-basket-progress"><LoaderCircle size={14} className="basket-spin"/> {running?`Creating ${items.find(i=>i._id===running)?.option.title??'your look'}…`:'Preparing your photo…'}</p>}</footer>
  </>}
 </dialog>;
}
