import {query,mutation,internalQuery,internalMutation} from './_generated/server';
import {v} from 'convex/values';
import {requireOwner} from './identity';
import {optionValidator} from './discoveryRules';
export const read=internalQuery({args:{id:v.id('savedProducts'),owner:v.string()},returns:v.union(optionValidator,v.null()),handler:async(ctx,{id,owner})=>{
 const row=await ctx.db.get(id);return row?.owner===owner?row.option:null;
}});
export const updateObservation=internalMutation({args:{id:v.id('savedProducts'),owner:v.string(),option:optionValidator},returns:v.null(),handler:async(ctx,{id,owner,option})=>{
 const row=await ctx.db.get(id);if(row?.owner===owner&&row.option.url===option.url&&row.option.observedAt<=option.observedAt){await ctx.db.patch(id,{option});await recordPrice(ctx,owner,option);}return null;
}});
export const list=query({args:{},returns:v.array(v.object({_id:v.id('savedProducts'),option:optionValidator,savedAt:v.number()})),handler:async(ctx)=>{
 const owner=await requireOwner(ctx);
 return (await ctx.db.query('savedProducts').withIndex('by_owner',q=>q.eq('owner',owner)).order('desc').take(50)).map(({_id,option,savedAt})=>({_id,option,savedAt}));
}});
// Resolve products from the signed-in shopper's actual results, never client-supplied prices.
export const save=mutation({args:{messageId:v.id('messages'),url:v.string()},returns:v.null(),handler:async(ctx,{messageId,url})=>{
 const owner=await requireOwner(ctx),message=await ctx.db.get(messageId);
 const conversation=message?await ctx.db.get(message.conversationId):null;
 const option=message?.result?.options.find(o=>o.url===url);
 if(!conversation||conversation.key!==`web:${owner}`||!option)throw new Error('Choose a product from your own search results.');
 const existing=await ctx.db.query('savedProducts').withIndex('by_owner_url',q=>q.eq('owner',owner).eq('option.url',url)).unique();
 if(existing){if(option.observedAt>=existing.option.observedAt){await ctx.db.patch(existing._id,{option});await recordPrice(ctx,owner,option);}return null;}
 const rows=await ctx.db.query('savedProducts').withIndex('by_owner',q=>q.eq('owner',owner)).take(50);
 if(rows.length>=50)throw new Error('Your shortlist holds 50 products. Remove one before saving another.');
 await ctx.db.insert('savedProducts',{owner,option,savedAt:Date.now()});await recordPrice(ctx,owner,option);return null;
}});
export const remove=mutation({args:{id:v.id('savedProducts')},returns:v.null(),handler:async(ctx,{id})=>{
 const owner=await requireOwner(ctx),row=await ctx.db.get(id);
 if(!row||row.owner!==owner)throw new Error('Saved product unavailable.');
 const history=await ctx.db.query('savedPriceHistory').withIndex('by_owner_url',q=>q.eq('owner',owner).eq('url',row.option.url)).take(30);
 for(const observation of history)await ctx.db.delete(observation._id);
 const offers=await ctx.db.query('offerEvidence').withIndex('by_owner_url',q=>q.eq('owner',owner).eq('productUrl',row.option.url)).take(20);
 for(const offer of offers)await ctx.db.delete(offer._id);
 await ctx.db.delete(id);return null;
}});
import type {MutationCtx} from './_generated/server';
import type {Option} from './discoveryRules';
async function recordPrice(ctx:MutationCtx,owner:string,option:Option){
 const rows=await ctx.db.query('savedPriceHistory').withIndex('by_owner_url',q=>q.eq('owner',owner).eq('url',option.url)).order('desc').take(30);
 if(rows.some(row=>row.observedAt===option.observedAt))return;
 for(const row of rows.slice(29))await ctx.db.delete(row._id);
 await ctx.db.insert('savedPriceHistory',{owner,url:option.url,price:option.price,observedAt:option.observedAt,...(option.source?{source:option.source}:{}),...(option.priceFrom!==undefined?{priceFrom:option.priceFrom}:{})});
}
export const history=query({args:{id:v.id('savedProducts')},returns:v.array(v.object({price:v.number(),observedAt:v.number(),priceFrom:v.optional(v.boolean())})),handler:async(ctx,{id})=>{
 const owner=await requireOwner(ctx),row=await ctx.db.get(id);if(!row||row.owner!==owner)throw new Error('Saved product unavailable.');
 return (await ctx.db.query('savedPriceHistory').withIndex('by_owner_url',q=>q.eq('owner',owner).eq('url',row.option.url)).order('desc').take(30)).map(({price,observedAt,priceFrom})=>({price,observedAt,...(priceFrom!==undefined?{priceFrom}:{})}));
}});
