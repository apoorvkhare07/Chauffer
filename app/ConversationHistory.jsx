import React,{useState} from 'react';
import {useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
export default function ConversationHistory(){
 const [session,setSession]=useState(null),data=useQuery(api.conversations.history,session===null?{}:{session});
 return <details className="shopping-library"><summary>Previous shopping chats</summary><p className="account-note">Read-only history. Shows up to 20 recent chats within the latest 300 messages; each chat shows its latest 80 messages.</p>{!data?<p>Loading history…</p>:!data.sessions.length?<p>No earlier chats yet.</p>:<><div className="history-choices">{data.sessions.map(s=><button key={s.session} type="button" aria-pressed={session===s.session} onClick={()=>setSession(s.session)}>{s.preview} <small>{new Date(s.createdAt).toLocaleDateString('en-IN')}</small></button>)}</div>{session!==null&&<div className="history-thread" aria-label="Previous conversation">{data.messages.map(m=><article key={m.id}><strong>{m.role==='user'?'You':'Chauffeur'}</strong><p>{m.text}</p>{m.result?.options.map(o=><a key={o.url} href={o.url} target="_blank" rel="noopener noreferrer">{o.title} — observed ₹{o.price.toLocaleString('en-IN')}</a>)}</article>)}</div>}</> }</details>;
}
