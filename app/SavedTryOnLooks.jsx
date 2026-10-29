import React,{useState} from 'react';
import {useQuery,useMutation} from 'convex/react';
import {api} from '../convex/_generated/api';
import {Download,Trash2} from 'lucide-react';
import {exportMedia,mediaBlob,exportUserMessage} from './mediaExport';
import './guest-tryon.css';
export default function SavedTryOnLooks(){
 const looks=useQuery(api.guestTryOn.saved),remove=useMutation(api.guestTryOn.remove),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function download(look){if(!look.url)return;setError('');try{await exportMedia({loadBlob:()=>mediaBlob(look.url),filename:'chauffer-look',properties:{product_id:look.id,is_guest:false}});}catch(e){setError(exportUserMessage(e));}}
 async function removeLook(id){if(!window.confirm('Delete this saved look permanently? Download a copy first if you want to keep it.'))return;setBusy(true);setError('');try{await remove({id});}catch{setError('Could not delete this look. Please try again.');}finally{setBusy(false);}}
 return <section aria-label="Saved try-on looks"><h2>Saved looks</h2>{error&&<p role="alert">{error}</p>}{looks===undefined?<p role="status">Loading your looks…</p>:!looks.length?<p>No saved looks yet. Save your first try-on to see it here.</p>:<div className="saved-looks-grid">{looks.map(look=><article className="saved-look" key={look.id}>{look.url&&<img src={look.url} alt={look.title}/>}<h3>{look.title}</h3><div><button className="chat-chip" onClick={()=>download(look)} disabled={!look.url}><Download size={15}/> Download</button><button className="chat-chip" disabled={busy} onClick={()=>removeLook(look.id)} aria-label={`Delete ${look.title}`}><Trash2 size={15}/></button></div></article>)}</div>}</section>;
}
