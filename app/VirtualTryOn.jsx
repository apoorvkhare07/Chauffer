import TryOnTargetField from './TryOnTargetField';
import {PhotoTile,TryOnPrivacy,TryOnCanvas} from './TryOnWorkspace';
import {exportMedia,mediaBlob,exportUserMessage} from './mediaExport';
import {selectedEditProduct} from '../shared/productEdits';
import {startCreationAttempt,tryOnProperties} from './creationAnalytics';
import React,{useEffect,useRef,useState,lazy,Suspense} from 'react';
import {useAction,useQuery} from 'convex/react';
import {ImagePlus,Sparkles,Download,RotateCcw,ArrowLeft} from 'lucide-react';
import {api} from '../convex/_generated/api';
import {jpegPhoto} from './photoUpload';
import usePhotoPreview from './usePhotoPreview';
import './quick-tryon.css';
const SavedPhotoTryOn=lazy(()=>import('./SavedPhotoTryOn'));
export default function VirtualTryOn({discoveryProduct=null,discoveryProducts=[],onChooseProduct,onBack}){
 const [downloadError,setDownloadError]=useState(''),[downloading,setDownloading]=useState(false);
 const downloadLock=useRef(false);
 const [target,setTarget]=useState('auto');
 const [editProduct]=useState(()=>selectedEditProduct(window.location.search));
 const wardrobe=useQuery(api.wardrobe.list),saved=useQuery(api.savedProducts.list),generate=useAction(api.quickTryOnAI.generate),importProduct=useAction(api.quickTryOnAI.importProduct);
 const [portrait,setPortrait]=useState(null),[product,setProduct]=useState(null),[mode,setMode]=useState(discoveryProduct?'discovery':editProduct?'link':'upload'),[choice,setChoice]=useState(''),[link,setLink]=useState(editProduct?.url??''),[linked,setLinked]=useState(editProduct?{title:editProduct.title,imageUrl:editProduct.imageUrl}:null),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[importing,setImporting]=useState(false),[error,setError]=useState(''),[results,setResults]=useState([]),[active,setActive]=useState(0),[before,setBefore]=useState(false),[savedFlow,setSavedFlow]=useState(false),[inputKey,setInputKey]=useState(0);
 const portraitPreview=usePhotoPreview(portrait);
 const revision=useRef(0),mounted=useRef(true),prepared=useRef(new WeakMap());
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;revision.current++;};},[]);
 useEffect(()=>{if(discoveryProduct){setMode('discovery');setError('');}},[discoveryProduct]);
 const options=[...(wardrobe??[]).filter(i=>i.photoUrl).map(i=>({key:`wardrobe:${i.id}`,source:{kind:'wardrobe',id:i.id},title:i.details.name,image:i.photoUrl})),...(saved??[]).filter(i=>i.option.imageUrl).map(i=>({key:`saved:${i._id}`,source:{kind:'saved',id:i._id},title:i.option.title,image:i.option.imageUrl,store:i.option.store,url:i.option.url}))];
 const catalogPick=discoveryProduct?.source?.kind==='catalog';
 const selected=options.find(o=>o.key===choice),current=results[active];
 const ready=portrait&&(mode==='upload'?product:mode==='wardrobe'?selected:mode==='discovery'?discoveryProduct:linked);

 function changePhoto(file){revision.current++;setPortrait(file);setResults([]);setActive(0);setBefore(false);setConsent(false);setError('');}
 function prepare(file){if(!prepared.current.has(file))prepared.current.set(file,jpegPhoto(file).catch(e=>{prepared.current.delete(file);throw e;}));return prepared.current.get(file);}
 async function loadLink(){if(importing||busy)return;setImporting(true);setError('');const rev=revision.current;try{const item=await importProduct({url:link.trim()});if(mounted.current&&rev===revision.current)setLinked(item);}catch(e){if(mounted.current)setError(e.data||'Could not read this link. Upload the product image instead.');}finally{if(mounted.current)setImporting(false);}}
 async function submit(e){e.preventDefault();if(!ready||!consent||busy||importing)return;setBusy(true);setError('');setDownloadError('');const rev=revision.current;
 const metrics=mode==='upload'?tryOnProperties('upload'):mode==='wardrobe'?tryOnProperties(selected.source.kind,selected):mode==='discovery'?tryOnProperties('link',discoveryProduct):tryOnProperties('link',{url:link});
 const attempt=startCreationAttempt('tryon',metrics,{remixed:results.length>0});
 try{const [portraitJpeg,productJpeg]=await Promise.all([prepare(portrait),mode==='upload'?prepare(product):Promise.resolve(null)]);const garment=mode==='upload'?{kind:'upload',jpeg:productJpeg}:mode==='wardrobe'?selected.source:mode==='discovery'?discoveryProduct.source:{kind:'link',...linked};const result=await generate({portraitJpeg,garment,consent,target});attempt.complete();if(!mounted.current||rev!==revision.current)return;setResults(old=>[{image:`data:${result.mime};base64,${result.base64}`,original:`data:image/jpeg;base64,${portraitJpeg}`,title:mode==='upload'?product.name:result.title,analytics:attempt.properties,target:result.target},...old].slice(0,5));setActive(0);setBefore(false);
 }catch(e){attempt.fail(e);if(mounted.current&&rev===revision.current)setError(e.data||e.message||'Could not create this preview. Your photos are still here.');}finally{if(mounted.current&&rev===revision.current)setBusy(false);}}
 function reset(){revision.current++;setDownloadError('');setBefore(false);setActive(0);setTarget('auto');setPortrait(null);setProduct(null);setLinked(null);setLink('');setChoice('');setResults([]);setConsent(false);setError('');setInputKey(k=>k+1);}
 return <section className="tryon-studio" aria-labelledby="quick-tryon-title">
 <header className="workspace-heading"><div><h1 id="quick-tryon-title">Try-on</h1><p>See a new piece on you.</p></div>{(portrait||product||link||choice||results.length>0)&&<button type="button" className="chat-chip" disabled={busy||importing} onClick={reset}><RotateCcw size={15}/> Start over</button>}</header>
 {onBack&&<button type="button" className="studio-back" disabled={busy||importing} onClick={onBack}><ArrowLeft size={15}/> Back to results</button>}
 <form className="studio-workspace" onSubmit={submit}>
  <div className="studio-controls">
   <div className="studio-input-pair">
    <div className="studio-input"><h2>Your photo</h2><PhotoTile key={`person-${inputKey}`} label="Your photo" file={portrait} onChange={changePhoto} disabled={busy||importing}/></div>
    <div className="studio-input"><div className="studio-input-heading"><h2>Your piece</h2><select aria-label="Product source" value={mode} disabled={busy||importing} onChange={e=>{setMode(e.target.value);setError('');}}>{[...(discoveryProduct?[['discovery',catalogPick?'Discover':'Results']]:[]),['upload','Upload'],['link','Link'],['wardrobe','Wardrobe']].map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></div>
     {mode==='upload'?<PhotoTile key={`item-${inputKey}`} label="Product photo" file={product} onChange={file=>{setProduct(file);setError('');}} disabled={busy||importing}/>:mode==='link'?<div className="studio-link-product"><label className="sr-only" htmlFor="tryon-product-link">Product link</label><input id="tryon-product-link" type="url" placeholder="Paste product link" value={link} disabled={busy||importing} onChange={e=>{setLink(e.target.value);setLinked(null);setError('');}}/><button type="button" disabled={!link.trim()||busy||importing} onClick={loadLink}>{importing?'Reading…':linked?'Reload':'Get product'}</button>{linked&&<img src={linked.imageUrl} alt={linked.title} referrerPolicy="no-referrer"/>}{!linked&&<span className="studio-link-hint">From your favourite store</span>}</div>:<div className="studio-selected-product"><select aria-label="Choose a piece" value={mode==='discovery'?discoveryProduct?.url??'':choice} disabled={busy||importing} onChange={e=>mode==='discovery'?onChooseProduct?.(discoveryProducts.find(p=>p.url===e.target.value)):setChoice(e.target.value)}>{mode==='wardrobe'&&<option value="">Choose a piece</option>}{(mode==='discovery'?discoveryProducts:options).map(p=><option key={p.url??p.key} value={mode==='discovery'?p.url:p.key}>{p.title}</option>)}</select>{(mode==='discovery'?discoveryProduct:selected)?<img src={mode==='discovery'?discoveryProduct.imageUrl:selected.image} alt={mode==='discovery'?discoveryProduct.title:selected.title} referrerPolicy="no-referrer"/>:<span className="studio-link-hint"><ImagePlus size={22}/>{options.length?'Pick from your saved pieces':'No pieces yet. Try an upload.'}</span>}</div>}
    </div>
   </div>
   {mode==='link'&&linked&&<p className="studio-product-title">{linked.title}</p>}
   <TryOnTargetField value={target} onChange={setTarget} disabled={busy||importing}/>{error&&<p role="alert" className="account-error studio-feedback">{error}</p>}
  </div>
  <TryOnCanvas busy={busy} photoUrl={portraitPreview.url}>
   {current&&<div className="studio-result"><div className="studio-result-toolbar"><span>{current.target||'Your look'}</span><div className="studio-compare" role="group" aria-label="Compare your photo"><button type="button" aria-pressed={before} onClick={()=>setBefore(true)}>Before</button><button type="button" aria-pressed={!before} onClick={()=>setBefore(false)}>After</button></div></div><img className="studio-result-image" src={before?current.original:current.image} alt={before?'Your original photo':'Generated try-on preview'}/><div className="studio-result-bottom">{results.length>1&&<div className="studio-history" aria-label="Previews from this session">{results.map((r,i)=><button type="button" key={i} aria-label={`View preview ${results.length-i}`} aria-pressed={active===i} onClick={()=>{setActive(i);setBefore(false);}}><img src={r.image} alt=""/></button>)}</div>}<button type="button" className="chat-chip" disabled={downloading||busy} onClick={async()=>{if(downloadLock.current)return;downloadLock.current=true;setDownloading(true);setDownloadError('');try{await exportMedia({loadBlob:()=>mediaBlob(current.image),properties:{...current.analytics,is_guest:false}});}catch(e){setDownloadError(exportUserMessage(e));}finally{downloadLock.current=false;setDownloading(false);}}}><Download size={16}/> {downloading?'Opening…':'Download preview'}</button></div><small className="studio-result-note">AI preview · Check size and fit on the store.</small>{downloadError&&<p role="alert" className="account-error">{downloadError}</p>}</div>}
  </TryOnCanvas>
  <div className="studio-action-bar"><TryOnPrivacy consent={consent} onChange={setConsent} disabled={busy||importing}/><button className="studio-primary" type="submit" disabled={!ready||!consent||busy||importing}><Sparkles size={17}/>{busy?'Creating…':results.length?'Try another piece':'Try it on'}</button></div>
 </form>
 <details className="studio-saved" onToggle={e=>setSavedFlow(e.currentTarget.open)}><summary>Saved photo previews</summary>{savedFlow&&<Suspense fallback={<p>Loading…</p>}><SavedPhotoTryOn/></Suspense>}</details>
 </section>;
}
