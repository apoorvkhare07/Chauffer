import React,{useState} from 'react';
import {useMutation,useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
export default function ProductOutcome({messageId,url}){
 const settings=useQuery(api.shopperMemory.list,{}),record=useMutation(api.shopperMemory.recordOutcome);
 const [kind,setKind]=useState('liked'),[recipient,setRecipient]=useState('self'),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 if(!settings?.available)return null;
 return <details><summary>Tell Chauffeur what happened</summary><form className="account-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setStatus('');try{await record({messageId,url,kind,recipient,note});setStatus('Recorded as your feedback. This does not add an item to your wardrobe.');}catch{setStatus('Could not save feedback. Please retry.');}finally{setBusy(false);}}}><label className="account-field">Outcome<select value={kind} onChange={e=>setKind(e.target.value)}><option value="liked">I like it</option><option value="disliked">It did not work for me</option><option value="bought">I bought it</option><option value="returned">I returned it</option></select></label><label className="account-field">Who was it for?<select value={recipient} onChange={e=>setRecipient(e.target.value)}><option value="self">Me</option><option value="other">Someone else</option></select></label><label className="account-field">What should we know? (optional)<input value={note} onChange={e=>setNote(e.target.value)} maxLength={240}/></label><button disabled={busy}>{busy?'Saving…':'Save feedback'}</button>{status&&<p role="status">{status}</p>}</form></details>;
}
