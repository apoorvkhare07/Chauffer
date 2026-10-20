import AffiliateLink,{AffiliateDisclosure} from './AffiliateLink.jsx';
import React,{useState} from 'react';
import {useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
import BrandIcon from '../brand/BrandIcon.jsx';
import {cleanDiscoveryReply} from './discoveryView';
export default function ConversationHistory(){
 const [session,setSession]=useState(null),data=useQuery(api.conversations.history,session===null?{}:{session});
 return <section className="conversation-history"><AffiliateDisclosure/><p className="account-note">Your recent conversations. Select one to read it.</p>{!data?<p>Loading history…</p>:!data.sessions.length?<p>No earlier chats yet.</p>:<><div className="history-choices">{data.sessions.map(s=><button key={s.session} type="button" aria-pressed={session===s.session} onClick={()=>setSession(s.session)}>{s.preview} <small>{new Date(s.createdAt).toLocaleDateString('en-IN')}</small></button>)}</div>{session!==null&&<div className="history-thread" aria-label="Previous conversation">{data.messages.map(m=><article className={`history-message-${m.role}`} key={m.id}>{m.role==='assistant'&&<BrandIcon size={25}/>}<div className="history-message-content"><p>{m.role==='assistant'?cleanDiscoveryReply(m.text):m.text}</p>{m.result?.options.map(o=><AffiliateLink reference={{kind:'message',id:m.id,url:o.url}} source="history" key={o.url} href={o.url} target="_blank" rel="noopener noreferrer">{o.title} — observed ₹{o.price.toLocaleString('en-IN')}</AffiliateLink>)}</div></article>)}</div>}</> }</section>;
}
