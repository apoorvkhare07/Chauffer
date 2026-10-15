import {v,ConvexError} from 'convex/values';
import {mutation,internalQuery,internalMutation,type MutationCtx} from './_generated/server';
import type {Id} from './_generated/dataModel';
import {internal} from './_generated/api';
import {requireOwner} from './identity';
import {garmentValidator,type Garment} from './wardrobeRules';
export function visualKey(details:Garment){return JSON.stringify([details.category,details.colour,details.pattern,details.kind,details.cut,details.attributes]);}
export async function queueCleanPhoto(ctx:MutationCtx,id:Id<'wardrobeItems'>){
 const item=await ctx.db.get(id);if(!item?.photoId)return;
 if(item.cleanPhotoState==='building')return;
 const day=new Date().toISOString().slice(0,10),attempts=item.cleanPhotoDay===day?(item.cleanPhotoAttempts??0):0;
 if(attempts>=3)throw new ConvexError('Three clean-photo attempts per piece today. Try again tomorrow.');
 const version=(item.cleanPhotoVersion??0)+1;
 await ctx.db.patch(id,{cleanPhotoState:'building',cleanPhotoVersion:version,cleanPhotoDay:day,cleanPhotoAttempts:attempts+1,cleanPhotoNote:'Creating your clean wardrobe photo.'});
 await ctx.scheduler.runAfter(0,internal.wardrobeImageAI.generate,{id,version});
 await ctx.scheduler.runAfter(150000,internal.wardrobeImages.timeout,{id,version});
}
export const request=mutation({args:{id:v.id('wardrobeItems')},returns:v.null(),handler:async(ctx,{id})=>{const owner=await requireOwner(ctx),item=await ctx.db.get(id);if(item?.owner!==owner||!item.photoId)throw new Error('Choose your own piece with a photo.');await queueCleanPhoto(ctx,id);return null;}});
export const plan=internalQuery({args:{id:v.id('wardrobeItems'),version:v.number()},returns:v.union(v.null(),v.object({photoId:v.id('_storage'),details:garmentValidator})),handler:async(ctx,{id,version})=>{const item=await ctx.db.get(id);return item?.photoId&&item.cleanPhotoState==='building'&&item.cleanPhotoVersion===version?{photoId:item.photoId,details:item.details}:null;}});
export const finish=internalMutation({args:{id:v.id('wardrobeItems'),version:v.number(),photoId:v.id('_storage'),outputId:v.optional(v.id('_storage')),note:v.optional(v.string())},returns:v.null(),handler:async(ctx,{id,version,photoId,outputId,note})=>{
 const item=await ctx.db.get(id);if(!item||item.photoId!==photoId||item.cleanPhotoVersion!==version||item.cleanPhotoState!=='building'){if(outputId)await ctx.storage.delete(outputId);return null;}
 if(outputId&&item.cleanPhotoId)await ctx.storage.delete(item.cleanPhotoId);
 await ctx.db.patch(id,{cleanPhotoState:outputId?'ready':'failed',...(outputId?{cleanPhotoId:outputId}:{}),cleanPhotoNote:outputId?'AI-created clean photo. Compare with your original if details look different.':note||'Could not create the clean photo. Your original is safe; you can retry.'});return null;
}});
export const timeout=internalMutation({args:{id:v.id('wardrobeItems'),version:v.number()},returns:v.null(),handler:async(ctx,{id,version})=>{const item=await ctx.db.get(id);if(item?.cleanPhotoState==='building'&&item.cleanPhotoVersion===version)await ctx.db.patch(id,{cleanPhotoState:'failed',cleanPhotoNote:'The clean photo took too long. Your original is safe; please retry.'});return null;}});
