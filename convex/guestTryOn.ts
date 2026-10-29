import {mutation,query} from './_generated/server';
import {v,ConvexError} from 'convex/values';
import {requireOwner} from './identity';
import {hashSecret} from './lib/otp';
import type {MutationCtx} from './_generated/server';

async function ownedResult(ctx:MutationCtx,token:string){
 const owner=await requireOwner(ctx);
 if(!/^[a-f0-9-]{72}$/.test(token))throw new ConvexError('This preview is unavailable.');
 const hash=await hashSecret(token),row=await ctx.db.query('guestTrials').withIndex('by_token',q=>q.eq('tokenHash',hash)).unique();
 if(!row||row.tryOnState!=='ready'||!row.tryOnOutputId||(!row.tryOnSavedAt&&row.mediaExpiresAt<=Date.now()))throw new ConvexError('This preview has expired. Try another look.');
 if(row.tryOnOwner&&row.tryOnOwner!==owner)throw new ConvexError('This preview belongs to another account.');
 if(!row.tryOnOwner)await ctx.db.patch(row._id,{tryOnOwner:owner});
 return {row,owner};
}
export const exportImage=mutation({args:{token:v.string()},returns:v.string(),handler:async(ctx,{token})=>{
 const {row}=await ownedResult(ctx,token);const url=await ctx.storage.getUrl(row.tryOnOutputId!);
 if(!url)throw new ConvexError('This preview is unavailable.');return url;
}});
export const save=mutation({args:{token:v.string(),consent:v.boolean()},returns:v.id('guestTrials'),handler:async(ctx,{token,consent})=>{
 if(!consent)throw new ConvexError('Confirm that you want to keep this look in your wardrobe.');
 const {row,owner}=await ownedResult(ctx,token);
 if(!row.tryOnSavedAt){
  const saved=await ctx.db.query('guestTrials').withIndex('by_tryon_owner_saved',q=>q.eq('tryOnOwner',owner).gte('tryOnSavedAt',0)).take(80);
  if(saved.length>=80)throw new ConvexError('Remove a saved look before adding another.');
  await ctx.db.patch(row._id,{tryOnSavedAt:Date.now()});
 }
 return row._id;
}});
export const saved=query({args:{},returns:v.array(v.object({id:v.id('guestTrials'),title:v.string(),url:v.union(v.string(),v.null()),createdAt:v.number()})),handler:async ctx=>{
 const owner=await requireOwner(ctx),rows=await ctx.db.query('guestTrials').withIndex('by_tryon_owner_saved',q=>q.eq('tryOnOwner',owner).gte('tryOnSavedAt',0)).order('desc').take(80);
 return Promise.all(rows.map(async row=>({id:row._id,title:row.tryOnTitle||'My try-on',url:row.tryOnOutputId?await ctx.storage.getUrl(row.tryOnOutputId):null,createdAt:row.tryOnSavedAt!})));
}});
export const remove=mutation({args:{id:v.id('guestTrials')},returns:v.null(),handler:async(ctx,{id})=>{
 const owner=await requireOwner(ctx),row=await ctx.db.get(id);
 if(!row||row.tryOnOwner!==owner||!row.tryOnSavedAt)throw new ConvexError('Choose your own saved look.');
 for(const storageId of [row.tryOnOutputId,row.tryOnPreviewId,row.tryOnPhotoId,row.tryOnGarmentId])if(storageId)await ctx.storage.delete(storageId);
 await ctx.db.patch(id,{tryOnSavedAt:undefined,tryOnOutputId:undefined,tryOnPreviewId:undefined,tryOnPhotoId:undefined,tryOnGarmentId:undefined,tryOnTitle:undefined,tryOnState:'expired',tryOnSucceeded:true});return null;
}});
