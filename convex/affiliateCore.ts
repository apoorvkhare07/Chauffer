import {internalMutation} from './_generated/server';
import {v} from 'convex/values';
import {sourceValidator,linkTypeValidator,validProduct} from './affiliateRules';
import {storeValidator} from './storeConfig';
// A short lease prevents concurrent clicks from repeating a provider conversion.
export const reserve=internalMutation({args:{productUrl:v.string(),source:sourceValidator,config:v.string()},handler:async(ctx,args)=>{
 const row=await ctx.db.query('affiliateLinkCache').withIndex('by_product_source',q=>q.eq('productUrl',args.productUrl).eq('source',args.source)).unique();
 const now=Date.now();
 if(row&&row.config===args.config&&row.expiresAt>now)return {convert:false,url:row.trackingUrl??null};
 if(row&&row.leaseUntil>now)return {convert:false,url:null};
 const data={...args,expiresAt:0,leaseUntil:now+10_000,trackingUrl:undefined};
 if(row)await ctx.db.patch(row._id,data);else await ctx.db.insert('affiliateLinkCache',data);
 return {convert:true,url:null};
}});
export const cache=internalMutation({args:{productUrl:v.string(),source:sourceValidator,config:v.string(),url:v.union(v.string(),v.null()),ttl:v.number()},handler:async(ctx,args)=>{
 const row=await ctx.db.query('affiliateLinkCache').withIndex('by_product_source',q=>q.eq('productUrl',args.productUrl).eq('source',args.source)).unique();
 if(row&&row.config===args.config)await ctx.db.patch(row._id,{trackingUrl:args.url??undefined,expiresAt:Date.now()+Math.min(86400000,Math.max(0,args.ttl)),leaseUntil:0});
}});
export const record=internalMutation({args:{store:storeValidator,productUrl:v.string(),linkType:linkTypeValidator,source:sourceValidator},handler:async(ctx,args)=>{
 if(!validProduct(args.productUrl,args.store))throw new Error('Invalid product');
 await ctx.db.insert('affiliateClicks',{...args,createdAt:Date.now()});
}});
