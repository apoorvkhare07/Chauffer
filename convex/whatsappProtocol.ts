export async function validSignature(body:string,signature:string|null,secret:string):Promise<boolean>{
 if(!signature||!/^sha256=[a-f0-9]{64}$/.test(signature)||!secret)return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const bytes=Uint8Array.from(signature.slice(7).match(/../g)!,x=>parseInt(x,16));
 return crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(body));
}
export type Incoming={messageId:string;phone:string;text:string;timestamp:number};
export function parsePayload(payload:unknown,phoneId:string):{incoming:Incoming[];statuses:{messageId:string;status:string}[]}{
 const incoming:Incoming[]=[],statuses:{messageId:string;status:string}[]=[];
 const p=payload as any;if(p?.object!=='whatsapp_business_account'||!Array.isArray(p.entry))return {incoming,statuses};
 for(const entry of p.entry.slice(0,20))for(const change of (Array.isArray(entry.changes)?entry.changes:[]).slice(0,20)){
  const value=change?.value;if(change.field!=='messages'||value?.metadata?.phone_number_id!==phoneId)continue;
  for(const m of (Array.isArray(value.messages)?value.messages:[]).slice(0,50)){
   if(typeof m.id!=='string'||m.id.length>300||typeof m.from!=='string'||!/^\d{8,15}$/.test(m.from))continue;
   const timestamp=Number(m.timestamp)*1000;if(!Number.isFinite(timestamp))continue;
   const text=m.type==='text'&&typeof m.text?.body==='string'?m.text.body.slice(0,1000):'[unsupported message]';
   incoming.push({messageId:m.id,phone:m.from,text,timestamp});
  }
  for(const s of (Array.isArray(value.statuses)?value.statuses:[]).slice(0,50))if(typeof s.id==='string'&&['sent','delivered','read','failed'].includes(s.status))statuses.push({messageId:s.id,status:s.status});
 }
 return {incoming:incoming.slice(0,100),statuses:statuses.slice(0,100)};
}
export function testRecipientAllowed(phone:string):boolean{return (process.env.WHATSAPP_TEST_RECIPIENTS??'').split(',').map(x=>x.trim().replace(/^\+/, '')).includes(phone);}
