import {v} from 'convex/values';
import {getAuthUserId} from '@convex-dev/auth/server';
import {query,mutation,type QueryCtx,type MutationCtx} from './_generated/server';
import {memoryItemValidator,memoryRelevant,settingsValidator,recipientValidator,architectureEnabled} from './recommendationRules';
async function ownerId(ctx:QueryCtx|MutationCtx){const owner=await getAuthUserId(ctx);if(!owner)throw new Error('Please sign in.');return owner;}
export async function memorySettings(ctx:Pick<QueryCtx,'db'>,owner:string){return await ctx.db.query('memorySettings').withIndex('by_owner',q=>q.eq('owner',owner)).unique();}
export async function relevantMemory(ctx:Pick<QueryCtx,'db'>,owner:string,recipient:string,category?:string){
 const settings=await memorySettings(ctx,owner);if(settings?.enabled===false)return [];
 const rows=await ctx.db.query('shopperMemories').withIndex('by_owner_active',q=>q.eq('owner',owner).eq('active',true)).order('desc').take(100);
 const profile=recipient==='self'?await ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner',owner)).unique():null;
 const saved=profile?.taste?[profile.taste.prefer.length?'Prefers '+profile.taste.prefer.join(', '):'',profile.taste.avoid.length?'Avoid '+profile.taste.avoid.join(', '):''].filter(Boolean).map((text,i)=>({id:`saved-style:${i}`,text:text.slice(0,240),category:'all',recipient:'self' as const,kind:'confirmed' as const,source:'Saved style preferences; editable in Preferences',updatedAt:profile.updatedAt})):[];
 return [...saved,...rows.filter(m=>memoryRelevant(m,recipient,category)).sort((a,b)=>Number(b.kind==='confirmed')-Number(a.kind==='confirmed')||b.updatedAt-a.updatedAt).slice(0,12).map(m=>({id:String(m._id),text:m.text,category:m.category,recipient:m.recipient,kind:m.kind,source:m.source,updatedAt:m.updatedAt}))].slice(0,12);
}
export async function bumpMemory(ctx:MutationCtx,owner:string){const s=await memorySettings(ctx,owner);if(s)await ctx.db.patch(s._id,{revision:s.revision+1});else await ctx.db.insert('memorySettings',{owner,enabled:true,revision:1});}
export const list=query({args:{},returns:v.object({available:v.boolean(),settings:settingsValidator,items:v.array(memoryItemValidator)}),handler:async ctx=>{
 const owner=await ownerId(ctx),s=await memorySettings(ctx,owner);
 const rows=await ctx.db.query('shopperMemories').withIndex('by_owner_active',q=>q.eq('owner',owner).eq('active',true)).order('desc').take(100);
 return {available:architectureEnabled(owner),settings:{enabled:s?.enabled??true,revision:s?.revision??0},items:rows.map(m=>({id:String(m._id),text:m.text,category:m.category,recipient:m.recipient,kind:m.kind,source:m.source,updatedAt:m.updatedAt}))};
}});
export const setEnabled=mutation({args:{enabled:v.boolean()},returns:v.null(),handler:async(ctx,{enabled})=>{const owner=await ownerId(ctx),s=await memorySettings(ctx,owner);if(s)await ctx.db.patch(s._id,{enabled,revision:s.revision+1});else await ctx.db.insert('memorySettings',{owner,enabled,revision:1});return null;}});
export const edit=mutation({args:{id:v.optional(v.id('shopperMemories')),text:v.string(),category:v.string()},returns:v.null(),handler:async(ctx,{id,text,category})=>{
 const owner=await ownerId(ctx);text=text.trim();category=category.trim();if(!text||text.length>240||!category||category.length>40)throw new Error('Use a short preference and category.');
 if(id){const row=await ctx.db.get(id);if(!row||row.owner!==owner)throw new Error('Memory unavailable.');await ctx.db.patch(id,{text,category,kind:'confirmed',source:'Edited in memory settings',updatedAt:Date.now()});}
 else{const rows=await ctx.db.query('shopperMemories').withIndex('by_owner_active',q=>q.eq('owner',owner).eq('active',true)).take(100);if(rows.length>=100)throw new Error('Remove an old memory before adding another.');await ctx.db.insert('shopperMemories',{owner,text,category,recipient:'self',kind:'confirmed',source:'Added in memory settings',createdAt:Date.now(),updatedAt:Date.now(),active:true});}
 await bumpMemory(ctx,owner);return null;
}});
export const remove=mutation({args:{id:v.id('shopperMemories')},returns:v.null(),handler:async(ctx,{id})=>{const owner=await ownerId(ctx),row=await ctx.db.get(id);if(!row||row.owner!==owner)throw new Error('Memory unavailable.');await ctx.db.delete(id);await bumpMemory(ctx,owner);return null;}});
export const recordOutcome=mutation({args:{messageId:v.id('messages'),url:v.string(),recipient:recipientValidator,kind:v.union(v.literal('saved'),v.literal('bought'),v.literal('returned'),v.literal('liked'),v.literal('disliked')),note:v.string()},returns:v.null(),handler:async(ctx,args)=>{
 const owner=await ownerId(ctx),m=await ctx.db.get(args.messageId),c=m?await ctx.db.get(m.conversationId):null;
 if(!m||c?.key!==`web:${owner}`||!m.result?.options.some(o=>o.url===args.url))throw new Error('Choose one of your recommended products.');
 if(args.note.length>240)throw new Error('Keep the note under 240 characters.');
 const recent=await ctx.db.query('shoppingOutcomes').withIndex('by_owner',q=>q.eq('owner',owner)).order('desc').take(30);
 if(recent.filter(r=>r.createdAt>Date.now()-60000).length>=10)throw new Error('Please wait before adding more feedback.');
 await ctx.db.insert('shoppingOutcomes',{owner,...args,createdAt:Date.now()});
 const settings=await memorySettings(ctx,owner);
 if(settings?.enabled!==false&&args.recipient==='self'){
  const item=m.result!.options.find(o=>o.url===args.url)!;
  const rows=await ctx.db.query('shopperMemories').withIndex('by_owner_active',q=>q.eq('owner',owner).eq('active',true)).take(100);
  if(rows.length<100){await ctx.db.insert('shopperMemories',{owner,text:`User reported ${args.kind}: ${item.title.slice(0,100)}. ${args.note}`.slice(0,240),category:m.handoff?.requirements.category??'unknown',recipient:'self',kind:'episode',source:'Product feedback; not merchant-verified',sourceMessageId:m._id,createdAt:Date.now(),updatedAt:Date.now(),active:true});await bumpMemory(ctx,owner);}
 }
 return null;
}});
