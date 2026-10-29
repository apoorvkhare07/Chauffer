import {v,ConvexError} from 'convex/values';
import {query,mutation,internalQuery,internalMutation} from './_generated/server';
import {internal} from './_generated/api';
import {requireOwner} from './identity';
import {creatorInput,creatorKind,DRAFT_LIFETIME} from './creatorRules';
const draftView=v.object({id:v.id('creatorDrafts'),kind:creatorKind,state:v.union(v.literal('building'),v.literal('ready'),v.literal('failed')),url:v.union(v.string(),v.null()),mime:v.union(v.string(),v.null()),note:v.string(),expiresAt:v.number()});
export const drafts=query({args:{},returns:v.array(draftView),handler:async ctx=>{
 const owner=await requireOwner(ctx),rows=await ctx.db.query('creatorDrafts').withIndex('by_owner',q=>q.eq('owner',owner)).order('desc').take(20);
 return Promise.all(rows.filter(r=>r.expiresAt>Date.now()).map(async r=>({id:r._id,kind:r.kind,state:r.state==='building'&&r.busyUntil<Date.now()?'failed' as const:r.state,url:r.outputId?await ctx.storage.getUrl(r.outputId):null,mime:r.mime??null,note:r.state==='building'&&r.busyUntil<Date.now()?'This request took too long. Please try again.':r.note,expiresAt:r.expiresAt})));
}});
export const models=query({args:{},returns:v.array(v.object({id:v.id('creatorModels'),name:v.string(),url:v.union(v.string(),v.null())})),handler:async ctx=>{
 const owner=await requireOwner(ctx),rows=await ctx.db.query('creatorModels').withIndex('by_owner',q=>q.eq('owner',owner)).order('desc').take(12);
 return Promise.all(rows.map(async r=>({id:r._id,name:r.name,url:await ctx.storage.getUrl(r.photoId)})));
}});
export const claim=internalMutation({args:{kind:creatorKind,consent:v.boolean()},returns:v.id('creatorDrafts'),handler:async(ctx,{kind,consent})=>{
 const owner=await requireOwner(ctx);if(!consent)throw new ConvexError('Agree to send these images to Google for generation.');
 const active=await ctx.db.query('creatorDrafts').withIndex('by_owner_busy',q=>q.eq('owner',owner).gt('busyUntil',Date.now())).first();
 if(active)throw new ConvexError('Your current creation is still being made.');
 const recent=await ctx.db.query('creatorDrafts').withIndex('by_owner',q=>q.eq('owner',owner).gt('_creationTime',Date.now()-60_000)).take(3);
 if(recent.length>=3)throw new ConvexError('Give it a minute before creating another.');
 const id=await ctx.db.insert('creatorDrafts',{owner,kind,state:'building',note:'',createdAt:Date.now(),expiresAt:Date.now()+DRAFT_LIFETIME,busyUntil:Date.now()+(kind==='video'?300_000:150_000)});
 await ctx.scheduler.runAfter(DRAFT_LIFETIME,internal.creator.expire,{id});
 await ctx.scheduler.runAfter(kind==='video'?300_000:150_000,internal.creator.timeout,{id});return id;
}});
export const source=internalQuery({args:{source:creatorInput},returns:v.id('_storage'),handler:async(ctx,{source})=>{
 const owner=await requireOwner(ctx);if(source.kind==='upload')throw new ConvexError('Choose a saved image.');
 const row=await ctx.db.get(source.id);if(!row||row.owner!==owner)throw new ConvexError('Choose your own image.');
 if('photoId' in row)return row.photoId;
 if(row.state!=='ready'||row.kind==='video'||!row.outputId||row.expiresAt<=Date.now())throw new ConvexError('This draft has expired. Upload a photo or create another.');return row.outputId;
}});
export const finish=internalMutation({args:{id:v.id('creatorDrafts'),outputId:v.optional(v.id('_storage')),mime:v.optional(v.string()),note:v.string()},returns:v.null(),handler:async(ctx,{id,outputId,mime,note})=>{
 const owner=await requireOwner(ctx),row=await ctx.db.get(id);if(!row||row.owner!==owner||row.state!=='building'||row.expiresAt<=Date.now()){if(outputId)await ctx.storage.delete(outputId);return null;}
 await ctx.db.patch(id,{state:outputId?'ready':'failed',outputId,mime,note,busyUntil:0});return null;
}});
export const saveModel=mutation({args:{id:v.id('creatorDrafts'),name:v.string(),consent:v.boolean()},returns:v.id('creatorModels'),handler:async(ctx,{id,name,consent})=>{
 const owner=await requireOwner(ctx),row=await ctx.db.get(id);if(!consent)throw new ConvexError('Confirm that you want to save this model.');
 if(!row||row.owner!==owner||row.kind==='video'||row.state!=='ready'||!row.outputId||row.expiresAt<=Date.now())throw new ConvexError('Choose one of your available photo drafts.');
 if(!name.trim()||name.trim().length>40)throw new ConvexError('Give your model a name under 40 characters.');
 const models=await ctx.db.query('creatorModels').withIndex('by_owner',q=>q.eq('owner',owner)).take(12);
 const duplicate=models.find(m=>m.photoId===row.outputId);if(duplicate)return duplicate._id;
 if(models.length>=12)throw new ConvexError('You have 12 models. Remove one before saving another.');
 return ctx.db.insert('creatorModels',{owner,name:name.trim(),photoId:row.outputId,createdAt:Date.now()});
}});
export const removeModel=mutation({args:{id:v.id('creatorModels')},returns:v.null(),handler:async(ctx,{id})=>{
 const owner=await requireOwner(ctx),row=await ctx.db.get(id);if(!row||row.owner!==owner)throw new ConvexError('Choose your own model.');
 // The draft may still reference this file during its download window.
 const draft=await ctx.db.query('creatorDrafts').withIndex('by_output',q=>q.eq('outputId',row.photoId)).first();
 if(!draft)await ctx.storage.delete(row.photoId);
 await ctx.db.delete(id);return null;
}});
export const expire=internalMutation({args:{id:v.id('creatorDrafts')},returns:v.null(),handler:async(ctx,{id})=>{
 const row=await ctx.db.get(id);if(!row||row.expiresAt>Date.now())return null;
 if(row.outputId){const models=await ctx.db.query('creatorModels').withIndex('by_owner',q=>q.eq('owner',row.owner)).take(12);if(!models.some(m=>m.photoId===row.outputId))await ctx.storage.delete(row.outputId);}
 await ctx.db.delete(id);return null;
}});

export const timeout=internalMutation({args:{id:v.id('creatorDrafts')},returns:v.null(),handler:async(ctx,{id})=>{const row=await ctx.db.get(id);if(row?.state==='building'&&row.busyUntil<=Date.now())await ctx.db.patch(id,{state:'failed',busyUntil:0,note:'This request took too long. Your inputs are kept on the page; please try again.'});return null;}});
