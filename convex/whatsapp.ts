import { internalMutation,internalQuery,internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { nextRequest,requirementsValidator } from './discoveryRules';
import { testRecipientAllowed } from './whatsappProtocol';
import { start } from '@convex-dev/workflow';
import type { Id } from './_generated/dataModel';

export const receive=internalMutation({args:{incoming:v.array(v.object({messageId:v.string(),phone:v.string(),text:v.string(),timestamp:v.number()})),statuses:v.array(v.object({messageId:v.string(),status:v.string()}))},returns:v.number(),handler:async(ctx,{incoming,statuses}):Promise<number>=>{
 let accepted=0;
 for(const message of incoming.slice(0,100)){
  if(!testRecipientAllowed(message.phone)||message.timestamp<Date.now()-86400000||message.timestamp>Date.now()+300000)continue;
  if(await ctx.db.query('waInbox').withIndex('by_message',q=>q.eq('messageId',message.messageId)).unique())continue;
  const recent=await ctx.db.query('waInbox').withIndex('by_phone',q=>q.eq('phone',message.phone).gte('_creationTime',Date.now()-60000)).take(11);if(recent.length>=10)continue;
  let conversation=await ctx.db.query('waConversations').withIndex('by_phone',q=>q.eq('phone',message.phone)).unique();
  if(conversation&&message.timestamp<conversation.lastInboundAt)continue;
  const plan=message.text==='[unsupported message]'?{requirements:conversation?.requirements??{},reply:'Please send your clothing request as a text message for this test.',search:false}:nextRequest(message.text,conversation?.requirements??{});
  let conversationId:Id<'waConversations'>;const revision=(conversation?.revision??0)+1;
  if(conversation){conversationId=conversation._id;await ctx.db.patch(conversationId,{requirements:plan.requirements,revision,lastInboundAt:message.timestamp});}
  else conversationId=await ctx.db.insert('waConversations',{phone:message.phone,requirements:plan.requirements,revision,lastInboundAt:message.timestamp});
  const id=await ctx.db.insert('waInbox',{messageId:message.messageId,phone:message.phone,timestamp:message.timestamp,conversationId,revision,...plan});
  await start(ctx,internal.discoveryWorkflow.respond,{id});accepted++;
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
export const claimSend=internalMutation({args:{id:v.id('waInbox'),phase:v.union(v.literal('reply'),v.literal('options'))},returns:v.union(v.null(),v.object({outboxId:v.id('waOutbox'),phone:v.string()})),handler:async(ctx,{id,phase}):Promise<{outboxId:Id<'waOutbox'>;phone:string}|null>=>{
 const row=await ctx.db.get(id);if(!row||!testRecipientAllowed(row.phone)||row.timestamp<Date.now()-86400000+60000)return null;
 const c=await ctx.db.get(row.conversationId);if(c?.revision!==row.revision)return null;
 const key=`${id}:${phase}`;if(await ctx.db.query('waOutbox').withIndex('by_key',q=>q.eq('key',key)).unique())return null;
 const outboxId=await ctx.db.insert('waOutbox',{key,inboxId:id,state:'sending'});return {outboxId,phone:row.phone};
}});
export const sendResult=internalMutation({args:{id:v.id('waOutbox'),state:v.union(v.literal('sent'),v.literal('failed'),v.literal('uncertain')),providerMessageId:v.optional(v.string()),reason:v.optional(v.string())},returns:v.null(),handler:async(ctx,{id,...result})=>{
 const row=await ctx.db.get(id);if(row?.state==='sending')await ctx.db.patch(id,result);return null;
}});
export const send=internalAction({args:{id:v.id('waInbox'),phase:v.union(v.literal('reply'),v.literal('options')),text:v.string()},returns:v.null(),handler:async(ctx,{id,phase,text}):Promise<null>=>{
 const token=process.env.WHATSAPP_TOKEN,phoneId=process.env.WHATSAPP_PHONE_ID;if(!token||!phoneId)throw new Error('WhatsApp configuration missing');
 const claim=await ctx.runMutation(internal.whatsapp.claimSend,{id,phase});if(!claim)return null;
 try{
  const response=await fetch(`https://graph.facebook.com/v25.0/${phoneId}/messages`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to:claim.phone,type:'text',text:{preview_url:false,body:text.slice(0,4000)}}),signal:AbortSignal.timeout(15000)});
  const data=await response.json();const providerMessageId=data.messages?.[0]?.id;
  if(response.ok&&typeof providerMessageId==='string')await ctx.runMutation(internal.whatsapp.sendResult,{id:claim.outboxId,state:'sent',providerMessageId});
  else await ctx.runMutation(internal.whatsapp.sendResult,{id:claim.outboxId,state:'failed',reason:`Meta rejected message: HTTP ${response.status}, code ${Number(data.error?.code)||0}.`});
 }catch{await ctx.runMutation(internal.whatsapp.sendResult,{id:claim.outboxId,state:'uncertain',reason:'Send result unknown; no automatic resend.'});}
 return null;
}});
