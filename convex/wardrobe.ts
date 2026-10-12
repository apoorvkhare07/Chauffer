import type {Id} from './_generated/dataModel';
import {v} from 'convex/values';
import {query,mutation,internalQuery,internalMutation,type MutationCtx,type QueryCtx} from './_generated/server';
import {internal,components} from './_generated/api';
import {requireOwner} from './identity';
import {garmentValidator,outfitValidator,validateGarment,wardrobeKey,safeOutfits,type Garment,styleValidator,emptyStyle,photoAnalysisValidator} from './wardrobeRules';
import {emptyTaste,tasteValidator} from './taste';
import {createThread} from '@convex-dev/agent';
import {start} from '@convex-dev/workflow';
const itemValidator=v.object({id:v.id('wardrobeItems'),details:garmentValidator,available:v.boolean(),photoUrl:v.union(v.string(),v.null()),lastWornAt:v.optional(v.number()),analysis:v.optional(photoAnalysisValidator)});
export const list=query({args:{},returns:v.array(itemValidator),handler:async ctx=>{const owner=await requireOwner(ctx);const rows=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).order('desc').take(80);return Promise.all(rows.map(async r=>({id:r._id,details:r.details,available:r.available,...(r.analysis?{analysis:r.analysis}:{}),photoUrl:r.photoId?await ctx.storage.getUrl(r.photoId):null,...(r.lastWornAt?{lastWornAt:r.lastWornAt}:{})})));}});
async function createItem(ctx:MutationCtx,owner:string,details:Garment,photoId?:Id<'_storage'>){validateGarment(details);const rows=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).take(80);if(rows.length>=80)throw new Error('Your wardrobe holds 80 items. Remove one before adding another.');return ctx.db.insert('wardrobeItems',{owner,details,available:true,createdAt:Date.now(),...(photoId?{photoId}:{})});}
export const add=mutation({args:{details:garmentValidator},returns:v.id('wardrobeItems'),handler:async(ctx,{details})=>createItem(ctx,await requireOwner(ctx),details)});
export const createWithPhoto=internalMutation({args:{owner:v.string(),details:garmentValidator,photoId:v.id('_storage')},returns:v.id('wardrobeItems'),handler:async(ctx,args)=>createItem(ctx,args.owner,args.details,args.photoId)});
export const updateDetails=mutation({args:{id:v.id('wardrobeItems'),details:garmentValidator},returns:v.null(),handler:async(ctx,{id,details})=>{const owner=await requireOwner(ctx),item=await ctx.db.get(id);if(item?.owner!==owner)throw new Error('Choose your own wardrobe item.');validateGarment(details);await ctx.db.patch(id,{details});return null;}});
export const setAvailable=mutation({args:{id:v.id('wardrobeItems'),available:v.boolean()},returns:v.null(),handler:async(ctx,{id,available})=>{const owner=await requireOwner(ctx),item=await ctx.db.get(id);if(item?.owner!==owner)throw new Error('Choose your own wardrobe item.');await ctx.db.patch(id,{available});return null;}});
export const remove=mutation({args:{id:v.id('wardrobeItems')},returns:v.null(),handler:async(ctx,{id})=>{const owner=await requireOwner(ctx),item=await ctx.db.get(id);if(item?.owner!==owner)throw new Error('Choose your own wardrobe item.');if(item.photoId)await ctx.storage.delete(item.photoId);await ctx.db.delete(id);return null;}});
export const latest=query({args:{},returns:v.object({aiEnabled:v.boolean(),changed:v.boolean(),state:v.string(),note:v.string(),outfits:v.array(outfitValidator),id:v.optional(v.id('wardrobeOutfits')),wornIndex:v.optional(v.number())}),handler:async ctx=>{
 const owner=await requireOwner(ctx),run=await ctx.db.query('wardrobeOutfits').withIndex('by_owner',q=>q.eq('owner',owner)).order('desc').first();
 const rows=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).take(80),style=await styleDetails(ctx,owner),changed=Boolean(run&&(run.wardrobeKey!==wardrobeKey(rows)||(run.styleKey??JSON.stringify(emptyStyle))!==JSON.stringify(style)));
 return {aiEnabled:Boolean(process.env.GEMINI_API_KEY),changed,state:run?.state??'empty',note:run?.note??'',outfits:changed?[]:run?.outfits??[],...(run?{id:run._id}:{}),...(run?.wornIndex!==undefined?{wornIndex:run.wornIndex}:{})};
}});
export const request=mutation({args:{text:v.string()},returns:v.null(),handler:async(ctx,{text})=>{
 const owner=await requireOwner(ctx);text=text.trim();if(!text||text.length>700)throw new Error('Describe today in 1–700 characters.');if(!process.env.GEMINI_API_KEY)throw new Error('Outfit AI is not configured.');
 const rows=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).take(80);if(!rows.some(r=>r.available))throw new Error('Add available wardrobe items first.');
 const recent=await ctx.db.query('wardrobeOutfits').withIndex('by_owner',q=>q.eq('owner',owner).gte('_creationTime',Date.now()-60000)).take(4);if(recent.some(r=>r.state==='building')||recent.length>=3)throw new Error('Wait a minute before asking again.');
 const threadId=await createThread(ctx,components.agent,{userId:owner,title:'Wardrobe outfits'});
 const id=await ctx.db.insert('wardrobeOutfits',{owner,request:text,wardrobeKey:wardrobeKey(rows),styleKey:JSON.stringify(await styleDetails(ctx,owner)),threadId,state:'building',outfits:[],note:'Putting your clothes together.',createdAt:Date.now()});await start(ctx,internal.wardrobeWorkflow.generate,{id});return null;
}});
const planItem=v.object({_id:v.id('wardrobeItems'),details:garmentValidator,available:v.boolean(),lastWornAt:v.optional(v.number())});
export const plan=internalQuery({args:{id:v.id('wardrobeOutfits')},returns:v.union(v.null(),v.object({threadId:v.string(),request:v.string(),items:v.array(planItem),taste:tasteValidator,style:styleValidator})),handler:async(ctx,{id})=>{
 const run=await ctx.db.get(id);if(!run||run.state!=='building')return null;
 const rows=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',run.owner)).take(80);const style=await styleDetails(ctx,run.owner);if(wardrobeKey(rows)!==run.wardrobeKey||(run.styleKey??JSON.stringify(emptyStyle))!==JSON.stringify(style))return null;
 const profile=await ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner',run.owner)).unique();
 return {threadId:run.threadId,request:run.request,items:rows.filter(r=>r.available).map(r=>({_id:r._id,details:r.details,available:r.available,...(r.lastWornAt?{lastWornAt:r.lastWornAt}:{})})),taste:profile?.taste??emptyTaste,style};
}});
export const finish=internalMutation({args:{id:v.id('wardrobeOutfits'),outfits:v.array(outfitValidator),error:v.optional(v.string()),inputTokens:v.optional(v.number()),outputTokens:v.optional(v.number())},returns:v.null(),handler:async(ctx,args)=>{
 const run=await ctx.db.get(args.id);if(!run||run.state!=='building')return null;
 const rows=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',run.owner)).take(80);
 const changed=run.wardrobeKey!==wardrobeKey(rows)||(run.styleKey??JSON.stringify(emptyStyle))!==JSON.stringify(await styleDetails(ctx,run.owner));const outfits=changed||args.error?[]:safeOutfits(args.outfits,rows).map(o=>({...o,itemIds:o.itemIds as Id<'wardrobeItems'>[]}));
 await ctx.db.patch(run._id,{state:args.error?'failed':'ready',outfits,note:args.error?'Outfit suggestions could not finish. Please try again.':changed?'Your wardrobe changed. Ask for fresh outfits.':outfits.length?'Made from your available wardrobe items.':'Add a matching top and bottom, or a dress, so I can make a complete outfit.',completedAt:Date.now(),...(args.inputTokens!==undefined?{inputTokens:args.inputTokens}:{}),...(args.outputTokens!==undefined?{outputTokens:args.outputTokens}:{})});return null;
}});
export const wear=mutation({args:{id:v.id('wardrobeOutfits'),index:v.number()},returns:v.null(),handler:async(ctx,{id,index})=>{
 const owner=await requireOwner(ctx),run=await ctx.db.get(id);if(run?.owner!==owner||run.state!=='ready'||!Number.isInteger(index)||!run.outfits[index])throw new Error('Choose your own outfit.');
 const rows=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).take(80);if(wardrobeKey(rows)!==run.wardrobeKey||(run.styleKey??JSON.stringify(emptyStyle))!==JSON.stringify(await styleDetails(ctx,owner)))throw new Error('Your wardrobe changed. Ask for a fresh outfit.');
 const now=Date.now(),ids=run.outfits[index].itemIds;for(const itemId of ids)await ctx.db.patch(itemId,{lastWornAt:now});
 await ctx.db.patch(id,{wornIndex:index,wardrobeKey:wardrobeKey(rows.map(r=>ids.includes(r._id)?{...r,lastWornAt:now}:r))});return null;
}});

async function styleDetails(ctx:QueryCtx|MutationCtx,owner:string){return (await ctx.db.query('wardrobeStyles').withIndex('by_owner',q=>q.eq('owner',owner)).unique())?.details??emptyStyle;}
