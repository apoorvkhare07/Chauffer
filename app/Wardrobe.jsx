import SavedTryOnLooks from './SavedTryOnLooks';
import React,{useState,useEffect,useRef} from 'react';
import {useMutation,useQuery} from 'convex/react';
import {ArrowRight,Check,Plus,Shirt,Sparkles,Trash2,PenLine,Heart,CalendarDays} from 'lucide-react';
import FashionLoader from '../FashionLoader.jsx';
import WardrobeStyle from './WardrobeStyle';
import WardrobeIntelligence from './WardrobeIntelligence';
import WardrobeEditor from './WardrobeEditor';
import ShoppingLibrary from './ShoppingLibrary.jsx';
import PlanLimitNotice from './PlanLimitNotice.jsx';
import {clothingTags,wardrobeTitle} from '../shared/wardrobeTags';
import {api} from '../convex/_generated/api';

export default function Wardrobe({initialView='clothes'}){
 const editor=useRef(null);
 const [view,setView]=useState(initialView),[editing,setEditing]=useState(null),[adding,setAdding]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[limitReached,setLimitReached]=useState(false);
 const items=useQuery(api.wardrobe.list),plan=useQuery(api.planAccess.current),available=useMutation(api.wardrobe.setAvailable),remove=useMutation(api.wardrobe.remove),clean=useMutation(api.wardrobeImages.request);
 useEffect(()=>setView(initialView),[initialView]);
 const readyCount=items?.filter(item=>item.available).length??0;
 function openAdd(){setView('clothes');setEditing(null);setNotice('');if(plan?.limits?.wardrobeItems!=null&&(plan.usage.wardrobeItems??0)>=plan.limits.wardrobeItems){setAdding(false);setLimitReached(true);return;}setLimitReached(false);setAdding(true);requestAnimationFrame(()=>editor.current?.scrollIntoView({behavior:'smooth',block:'start'}));}
 useEffect(()=>{if(editing)editor.current?.scrollIntoView({behavior:'smooth',block:'start'});},[editing]);
 async function act(fn){setBusy(true);setError('');try{await fn();}catch(e){const message=String(e.data??e.message??'');if(message.includes('free wardrobe includes 3 pieces')||message.includes('PLAN_LIMIT'))setLimitReached(true);else setError(message.includes('Three clean-photo attempts')?'Three clean-photo attempts per piece today. Try again tomorrow.':message.includes('Wait a minute')?'Please wait a minute before asking again.':'Could not finish that request. Please try again.');}finally{setBusy(false);}}
 function removeItem(item){if(window.confirm(`Remove ${wardrobeTitle(item.details)} and its photo from your wardrobe? This cannot be undone.`))act(()=>remove({id:item.id}));}
 return <section className="wardrobe shopping-library wardrobe-agent" aria-labelledby="wardrobe-title">
  <header className="workspace-heading"><div><h1 id="wardrobe-title">Wardrobe</h1><p>Your clothes and looks, together.</p><div className="closet-counts"><span>{items===undefined?'…':items.length} {items?.length===1?'piece':'pieces'}</span><span>{items===undefined?'…':readyCount} ready to wear</span></div></div><button type="button" className="button primary wardrobe-add-main" disabled={busy} data-analytics="wardrobe_add" onClick={openAdd}><Plus size={18}/> Add a piece</button></header>

  <div className="wardrobe-agent-tabs" role="group" aria-label="Wardrobe views"><button type="button" aria-pressed={view==='clothes'} onClick={()=>setView('clothes')}><Shirt size={17}/> My clothes <span>{items?.length??0}</span></button><button type="button" aria-pressed={view==='outfits'} onClick={()=>setView('outfits')}><Sparkles size={17}/> Outfit ideas</button><button type="button" aria-pressed={view==='saved'} onClick={()=>setView('saved')}><Heart size={17}/> Saved finds</button><button type="button" aria-pressed={view==='looks'} onClick={()=>setView('looks')}><Sparkles size={17}/> Saved looks</button></div>

  <div hidden={view!=='clothes'}>
   <div ref={editor} className="wardrobe-edit-slot">{limitReached&&<PlanLimitNotice feature="wardrobe" plan={plan} onDismiss={()=>setLimitReached(false)}/>} {(adding||editing)&&<WardrobeEditor key={editing?.id||'add'} item={editing} onBusyChange={setBusy} onPlanLimit={()=>setLimitReached(true)} onCancel={()=>{setAdding(false);setEditing(null);}} onSaved={()=>{setAdding(false);setEditing(null);setNotice('Piece saved. Preparing its clean display photo…');}}/>}</div>
   {error&&<p role="alert" className="account-feedback account-error">{error}</p>}{notice&&<p role="status" className="account-feedback">{notice}</p>}
   {!items?<div className="wardrobe-loading" role="status"><FashionLoader compact label="Opening your closet…"/></div>:!items.length?(adding?null:<div className="wardrobe-empty-agent"><div className="wardrobe-empty-art"><span><Shirt size={42}/></span><i/><b/></div><div><h2>Start with a favourite.</h2><p>Add a photo. We’ll help organise the details.</p><button type="button" className="button primary" disabled={busy} onClick={openAdd}><Plus size={17}/> Add your first piece</button></div></div>):<div className="wardrobe-grid wardrobe-gallery">{items.map(item=>{
    const title=wardrobeTitle(item.details),tags=clothingTags(item.details);
    return <article className={`wardrobe-piece wardrobe-tile ${item.available?'':'wardrobe-unavailable'}`} key={item.id}>
     <div className="wardrobe-tile-image">{item.cleanPhotoUrl?<img className="wardrobe-piece-photo wardrobe-clean-photo" src={item.cleanPhotoUrl} alt={title} loading="lazy"/>:<div className="wardrobe-no-photo" role="status"><Shirt size={32}/><span>{item.cleanPhotoState==='building'?'Preparing photo…':'Display photo pending'}</span></div>}<span className={`wardrobe-ready-badge ${item.available?'is-ready':''}`}>{item.available?<><Check size={12}/> Ready</>:'Not available'}</span><div className="wardrobe-tile-title"><small>{tags[0]||'WARDROBE PIECE'}</small><h3>{title}</h3></div></div>
     <div className="wardrobe-tile-info"><div className="wardrobe-tag-list" aria-label="Clothing details">{tags.slice(1,5).map((tag,i)=><span key={`${tag}-${i}`}>{tag}</span>)}</div>{item.lastWornAt&&<p className="account-note">Worn {new Date(item.lastWornAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p>}
      <div className="wardrobe-tile-actions"><label className="wardrobe-available"><input type="checkbox" checked={item.available} disabled={busy} onChange={e=>act(()=>available({id:item.id,available:e.target.checked}))}/>{item.available?'Ready to wear':'Mark ready'}</label><button type="button" aria-label={`Edit ${title}`} title="Edit details" disabled={busy} onClick={()=>{setEditing(item);setAdding(false);}}><PenLine size={16}/></button><button type="button" aria-label={`Remove ${title}`} title="Remove piece" disabled={busy} onClick={()=>removeItem(item)}><Trash2 size={16}/></button></div>
      {item.photoUrl&&<><details className="wardrobe-original"><summary>Photo & tags</summary>{item.cleanPhotoState==='failed'&&<p className="account-note">Clean display unavailable. Your original is saved.</p>}{item.cleanPhotoState!=='building'&&!item.cleanPhotoUrl&&<button className="chat-chip" disabled={busy} onClick={()=>act(()=>clean({id:item.id}))}>{item.cleanPhotoState==='failed'?'Retry display photo':'Create display photo'}</button>}<img src={item.photoUrl} alt={`Original photo: ${title}`} loading="lazy"/></details></>}
     </div>
    </article>;
   })}</div>}
  </div>
  {view==='saved'&&<ShoppingLibrary embedded/>}{view==='looks'&&<SavedTryOnLooks/>}
  <div hidden={view!=='outfits'}><WardrobeIntelligence items={items}/><WardrobeStyle/></div>

 </section>;
}
