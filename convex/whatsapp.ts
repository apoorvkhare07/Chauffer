import {messagePayload,waButton} from './whatsappUi';
import { internalMutation,internalQuery,internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { getConversation,beginTurn } from './conversationCore';
import { requirementsValidator } from './discoveryRules';
import { testRecipientAllowed } from './whatsappProtocol';
import { start } from '@convex-dev/workflow';
import type { Id } from './_generated/dataModel';
import {allowedImageUrl,optionValidator} from './discoveryRules';
const phaseValidator=v.union(v.literal('reply'),v.literal('options'),v.literal('product_1'),v.literal('product_2'),v.literal('product_3'),v.literal('product_4'),v.literal('product_5'),v.literal('product_6'));

export const receive=internalMutation({args:{incoming:v.array(v.object({messageId:v.string(),phone:v.string(),text:v.string(),timestamp:v.number()})),statuses:v.array(v.object({messageId:v.string(),status:v.string()}))},returns:v.number(),handler:async(ctx,{incoming,statuses}):Promise<number>=>{
 let accepted=0;
 for(const message of incoming.slice(0,100)){
  if(!testRecipientAllowed(message.phone)||message.timestamp<Date.now()-86400000||message.timestamp>Date.now()+300000)continue;
  if(await ctx.db.query('waInbox').withIndex('by_message',q=>q.eq('messageId',message.messageId)).unique())continue;
  const recent=await ctx.db.query('waInbox').withIndex('by_phone',q=>q.eq('phone',message.phone).gte('_creationTime',Date.now()-60000)).take(11);if(recent.length>=10)continue;
  let conversation=await ctx.db.query('waConversations').withIndex('by_phone',q=>q.eq('phone',message.phone)).unique();
  if(conversation&&message.timestamp<conversation.lastInboundAt)continue;
  const shared=await getConversation(ctx,`wa:${message.phone}`,conversation?.requirements??{});
  const turn=await beginTurn(ctx,shared,message.text,{},undefined,true);
  const plan={requirements:turn.requirements,reply:turn.reply,search:turn.search};
  let conversationId:Id<'waConversations'>;const revision=(conversation?.revision??0)+1;
  if(conversation){conversationId=conversation._id;await ctx.db.patch(conversationId,{conversationId:turn.conversationId,requirements:plan.requirements,revision,lastInboundAt:message.timestamp});}
  else conversationId=await ctx.db.insert('waConversations',{conversationId:turn.conversationId,phone:message.phone,requirements:plan.requirements,revision,lastInboundAt:message.timestamp});
  const id=await ctx.db.insert('waInbox',{messageId:message.messageId,phone:message.phone,timestamp:message.timestamp,conversationId,revision,...plan});
  await start(ctx,internal.discoveryWorkflow.respond,{conversationId:turn.conversationId,revision:turn.revision,inboxId:id});accepted++;
 }
 const rank:Record<string,number>={sent:1,delivered:2,read:3};
 for(const s of statuses.slice(0,100)){
  const row=await ctx.db.query('waOutbox').withIndex('by_provider',q=>q.eq('providerMessageId',s.messageId)).unique();if(!row)continue;
  if(s.status==='failed'&&row.state!=='delivered'&&row.state!=='read')await ctx.db.patch(row._id,{state:'failed',reason:'Meta reported delivery failure.'});
  else if((rank[s.status]??0)>(rank[row.state]??0))await ctx.db.patch(row._id,{state:s.status as 'sent'|'delivered'|'read'});
 }
 return accepted;
}});
export const plan=internalQuery({args:{id:v.id('waInbox')},returns:v.union(v.null(),v.object({reply:v.string(),search:v.boolean(),requirements:requirementsValidator})),handler:async(ctx,{id})=>{
 const row=await ctx.db.get(id);if(!row)return null;const c=await ctx.db.get(row.conversationId);if(c?.revision!==row.revision)return null;
 return {reply:row.reply,search:row.search,requirements:row.requirements};
}});
export const claimSend=internalMutation({args:{id:v.id('waInbox'),phase:phaseValidator},returns:v.union(v.null(),v.object({outboxId:v.id('waOutbox'),phone:v.string()})),handler:async(ctx,{id,phase}):Promise<{outboxId:Id<'waOutbox'>;phone:string}|null>=>{
 const row=await ctx.db.get(id);if(!row||!testRecipientAllowed(row.phone)||row.timestamp<Date.now()-86400000+60000)return null;
 const c=await ctx.db.get(row.conversationId);if(c?.revision!==row.revision)return null;
 if(row.sharedRevision!==undefined&&c.conversationId){const shared=await ctx.db.get(c.conversationId);if(shared?.revision!==row.sharedRevision)return null;}
 const key=`${id}:${phase}`;if(await ctx.db.query('waOutbox').withIndex('by_key',q=>q.eq('key',key)).unique())return null;
 const outboxId=await ctx.db.insert('waOutbox',{key,inboxId:id,state:'sending'});return {outboxId,phone:row.phone};
}});
export const sendResult=internalMutation({args:{id:v.id('waOutbox'),state:v.union(v.literal('sent'),v.literal('failed'),v.literal('uncertain')),providerMessageId:v.optional(v.string()),reason:v.optional(v.string())},returns:v.null(),handler:async(ctx,{id,...result})=>{
 const row=await ctx.db.get(id);if(row?.state==='sending')await ctx.db.patch(id,result);return null;
}});
export const send=internalAction({args:{id:v.id('waInbox'),phase:phaseValidator,text:v.string(),buttons:v.optional(v.array(waButton)),scheduled:v.optional(v.boolean()),imageStorageId:v.optional(v.id('_storage')),imageUrl:v.optional(v.string())},returns:v.null(),handler:async(ctx,{id,phase,text,imageUrl,buttons,imageStorageId,scheduled}):Promise<null>=>{
 if(!scheduled){const delay=await ctx.runMutation(internal.whatsappChannel.reserveSend,{id});if(delay===null)return null;if(delay>0){await ctx.scheduler.runAfter(delay,internal.whatsapp.send,{id,phase,text,...(imageUrl?{imageUrl}:{}),...(imageStorageId?{imageStorageId}:{}),...(buttons?{buttons}:{}),scheduled:true});return null;}}
 const token=process.env.WHATSAPP_TOKEN,phoneId=process.env.WHATSAPP_PHONE_ID;if(!token||!phoneId)throw new Error('WhatsApp configuration missing');
 if(imageUrl&&!allowedImageUrl(imageUrl))throw new Error('Untrusted product photo.');
 if(imageStorageId){const url=await ctx.runQuery(internal.whatsappChannel.ownedOutput,{id,storageId:imageStorageId});if(!url)return null;imageUrl=url;}
 if(phase==='options'){const clean=await ctx.runQuery(internal.whatsappChannel.discoveryReply,{id});if(clean)text=clean;}
 const claim=await ctx.runMutation(internal.whatsapp.claimSend,{id,phase});if(!claim)return null;
 try{
  const content=messagePayload(claim.phone,text,buttons,imageUrl);
  const response=await fetch(`https://graph.facebook.com/v25.0/${phoneId}/messages`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(content),signal:AbortSignal.timeout(15000)});
  const data=await response.json();const providerMessageId=data.messages?.[0]?.id;
  if(response.ok&&typeof providerMessageId==='string')await ctx.runMutation(internal.whatsapp.sendResult,{id:claim.outboxId,state:'sent',providerMessageId});
  else await ctx.runMutation(internal.whatsapp.sendResult,{id:claim.outboxId,state:'failed',reason:`Meta rejected message: HTTP ${response.status}, code ${Number(data.error?.code)||0}.`});
 }catch{await ctx.runMutation(internal.whatsapp.sendResult,{id:claim.outboxId,state:'uncertain',reason:'Send result unknown; no automatic resend.'});}
 return null;
}});
export const productPreviews=internalQuery({args:{id:v.id('waInbox')},returns:v.array(optionValidator),handler:async(ctx,{id})=>{
 const inbox=await ctx.db.get(id);if(!inbox)return [];
 const wa=await ctx.db.get(inbox.conversationId);if(!wa?.conversationId||wa.revision!==inbox.revision)return [];
 const c=await ctx.db.get(wa.conversationId);if(!c||c.pending)return [];
 const rows=await ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',c._id).eq('session',c.session)).order('desc').take(1);
 return rows[0]?.result?.options.slice(0,6)??[];
}});
export const sendPreviews=internalAction({args:{id:v.id('waInbox')},returns:v.null(),handler:async(ctx,{id}):Promise<null>=>{
 const products=await ctx.runQuery(internal.whatsapp.productPreviews,{id});
 for(let i=0;i<products.length;i++){
  const o=products[i];if(!o.imageUrl||!allowedImageUrl(o.imageUrl))continue;
  await ctx.runAction(internal.whatsapp.send,{id,phase:`product_${i+1}` as 'product_1'|'product_2'|'product_3'|'product_4'|'product_5'|'product_6',imageUrl:o.imageUrl,text:`Option ${i+1} · ${o.store}\n${o.title.slice(0,160)}\n${o.priceFrom?'From ':''}₹${o.price.toLocaleString('en-IN')}\n${o.url}\nSize and checkout total need checking. Reply “more like number ${i+1}” or tell me what to change.`});
 }
 return null;
}});
