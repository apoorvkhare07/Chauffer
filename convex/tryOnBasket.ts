import {v,ConvexError} from 'convex/values';
import {query,mutation} from './_generated/server';
import {requireOwner} from './identity';
import {optionValidator,allowedImageUrl,type Option} from './discoveryRules';
import {browseSources,browseSourceOptions} from './browseRules';
import {discoverySourceValidator,catalogSourceValidator,TRY_ON_BASKET_LIMIT} from './quickTryOnRules';
import {productStore} from './storeConfig';
import {browseBrand} from './browseBrands';

export const list=query({args:{},returns:v.array(v.object({_id:v.id('tryOnBasket'),option:optionValidator,addedAt:v.number()})),handler:async ctx=>{
 const owner=await requireOwner(ctx);
 return (await ctx.db.query('tryOnBasket').withIndex('by_owner',q=>q.eq('owner',owner)).order('asc').take(TRY_ON_BASKET_LIMIT)).map(({_id,option,addedAt})=>({_id,option,addedAt}));
}});
export const add=mutation({args:{source:v.union(discoverySourceValidator,catalogSourceValidator)},returns:v.id('tryOnBasket'),handler:async(ctx,{source})=>{
 const owner=await requireOwner(ctx);let option:Option|undefined;
 if(source.kind==='catalog'){
  const row=await ctx.db.get(source.id),feed=row&&browseSources.find(s=>s.key===row.key);
  if(row&&feed)option=browseSourceOptions(row.options,feed).find(o=>o.url===source.url);
 }else{
  const message=await ctx.db.get(source.messageId),conversation=message&&await ctx.db.get(message.conversationId);
  if(message?.role==='assistant'&&conversation?.key===`web:${owner}`&&message.session===conversation.session)option=message.result?.options.find(o=>o.url===source.url);
 }
 const store=option&&productStore(option.url);
 if(!option||!store||!allowedImageUrl(option.imageUrl))throw new ConvexError('Choose a product with a photo from Discover or your own chat.');
 const existing=await ctx.db.query('tryOnBasket').withIndex('by_owner_url',q=>q.eq('owner',owner).eq('url',option!.url)).unique();
 if(existing)return existing._id;
 const items=await ctx.db.query('tryOnBasket').withIndex('by_owner',q=>q.eq('owner',owner)).take(TRY_ON_BASKET_LIMIT);
 if(items.length>=TRY_ON_BASKET_LIMIT)throw new ConvexError(`Your try-on basket holds ${TRY_ON_BASKET_LIMIT} pieces. Remove one to add another.`);
 const brand=browseBrand(option),{brand:unused,...facts}=option;
 return ctx.db.insert('tryOnBasket',{owner,url:option.url,option:{...facts,store,...(brand?{brand}:{})},addedAt:Date.now()});
}});
export const remove=mutation({args:{id:v.id('tryOnBasket')},returns:v.null(),handler:async(ctx,{id})=>{
 const owner=await requireOwner(ctx),row=await ctx.db.get(id);
 if(!row||row.owner!==owner)throw new ConvexError('That piece is not in your try-on basket.');
 await ctx.db.delete(id);return null;
}});

export const session=query({args:{},returns:v.string(),handler:async ctx=>{const owner=await requireOwner(ctx);const conversation=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${owner}`)).unique();return `${owner}:${conversation?.session??0}`;}});
