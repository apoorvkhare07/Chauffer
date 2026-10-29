import {validBrowseOptions} from './browseRules';
import {v,ConvexError} from 'convex/values';
import {internalMutation,internalQuery} from './_generated/server';
import {requireOwner} from './identity';
import {previewSourceValidator} from './stylingRules';
import {allowedImageUrl} from './discoveryRules';
import {discoverySourceValidator,catalogSourceValidator,basketSourceValidator} from './quickTryOnRules';
export const claim=internalMutation({args:{consent:v.boolean()},returns:v.id('stylingRequests'),handler:async(ctx,{consent})=>{
 const owner=await requireOwner(ctx);if(!consent)throw new ConvexError('Agree to use the two photos for this preview.');
 const active=await ctx.db.query('stylingRequests').withIndex('by_owner_purpose_busy',q=>q.eq('owner',owner).eq('purpose','tryon').gt('busyUntil',Date.now())).first();
 if(active)throw new ConvexError('Wait for your current preview to finish.');
 const building=await ctx.db.query('tryOnPreviews').withIndex('by_owner',q=>q.eq('owner',owner).gte('_creationTime',Date.now()-180000)).take(6);
 if(building.some(r=>r.state==='building'))throw new ConvexError('Wait for your current preview to finish.');
 return ctx.db.insert('stylingRequests',{owner,purpose:'tryon',busyUntil:Date.now()+150000});
}});
export const release=internalMutation({args:{id:v.id('stylingRequests')},returns:v.null(),handler:async(ctx,{id})=>{
 const owner=await requireOwner(ctx),row=await ctx.db.get(id);if(row?.owner===owner)await ctx.db.patch(id,{busyUntil:0});return null;
}});
export const source=internalQuery({args:{source:v.union(previewSourceValidator,discoverySourceValidator,catalogSourceValidator,basketSourceValidator)},returns:v.object({title:v.string(),photoId:v.optional(v.id('_storage')),imageUrl:v.optional(v.string())}),handler:async(ctx,{source})=>{
 const owner=await requireOwner(ctx);
 if(source.kind==='basket'){const item=await ctx.db.get(source.id);if(item?.owner!==owner||!allowedImageUrl(item.option.imageUrl))throw new ConvexError('This piece is no longer in your try-on basket.');return {title:item.option.title,imageUrl:item.option.imageUrl};}
 if(source.kind==='catalog'){const row=await ctx.db.get(source.id);const item=row&&validBrowseOptions(row.options,row.store).find(o=>o.url===source.url);if(!item)throw new ConvexError('Choose an available piece from Discover.');return {title:item.title,imageUrl:item.imageUrl};}
 if(source.kind==='discovery'){const message=await ctx.db.get(source.messageId);const conversation=message&&await ctx.db.get(message.conversationId);const item=message?.result?.options.find(o=>o.url===source.url);if(conversation?.key!==`web:${owner}`||!item||!allowedImageUrl(item.imageUrl))throw new ConvexError('Choose a product from your own search results with a photo.');return {title:item.title,imageUrl:item.imageUrl};}
 if(source.kind==='wardrobe'){const item=await ctx.db.get(source.id);if(item?.owner!==owner||!item.photoId)throw new ConvexError('Choose your own wardrobe photo.');return {title:item.details.name,photoId:item.photoId};}
 const item=await ctx.db.get(source.id);if(item?.owner!==owner||!allowedImageUrl(item.option.imageUrl))throw new ConvexError('Choose your own saved product with a photo.');return {title:item.option.title,imageUrl:item.option.imageUrl};
}});
