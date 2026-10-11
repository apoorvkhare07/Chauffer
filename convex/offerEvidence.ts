import {v} from 'convex/values';
import {internalMutation,query} from './_generated/server';
import {requireOwner} from './identity';
import {allowedProductUrl} from './discoveryRules';
import {evaluateOffer} from './offerRules';
import {offerValidator} from './offerValidators';
const eligibilityValidator=v.object({bank:v.optional(v.string()),cardType:v.optional(v.string()),paymentMethod:v.optional(v.string()),membership:v.optional(v.string()),coupon:v.optional(v.string())});
// Only a future trusted store reader may record terms. The client and LLM cannot invent offers.
export const record=internalMutation({args:{owner:v.string(),productUrl:v.string(),label:v.string(),offer:offerValidator},returns:v.id('offerEvidence'),handler:async(ctx,args)=>{
 const source=new URL(args.offer.sourceUrl);
 if(!args.owner||!allowedProductUrl(args.productUrl)||source.username||source.password||source.origin!==new URL(args.productUrl).origin||args.label.length>200)throw new Error('Offer source is not verified for this store.');
 const existing=await ctx.db.query('offerEvidence').withIndex('by_owner_url',q=>q.eq('owner',args.owner).eq('productUrl',args.productUrl)).order('desc').take(20);
 for(const row of existing.slice(19))await ctx.db.delete(row._id);
 return ctx.db.insert('offerEvidence',args);
}});
export const forSaved=query({args:{id:v.id('savedProducts'),eligibility:v.optional(eligibilityValidator)},returns:v.array(v.object({label:v.string(),sourceUrl:v.string(),observedAt:v.number(),kind:v.union(v.literal('discount'),v.literal('cashback')),status:v.union(v.literal('unverified'),v.literal('potentially_eligible')),gaps:v.array(v.string()),immediateDiscountPaise:v.union(v.number(),v.null()),cashbackPaise:v.union(v.number(),v.null()),payableBeforeShippingPaise:v.union(v.number(),v.null())})),handler:async(ctx,{id,eligibility})=>{
 const owner=await requireOwner(ctx),item=await ctx.db.get(id);if(!item||item.owner!==owner)throw new Error('Saved product unavailable.');
 const rows=await ctx.db.query('offerEvidence').withIndex('by_owner_url',q=>q.eq('owner',owner).eq('productUrl',item.option.url)).order('desc').take(20);
 return rows.map(row=>{
  const calculated=evaluateOffer(row.offer,Math.round(item.option.price*100),eligibility);
  // Discovery prices have no verified size-specific cart. Arithmetic is not eligibility proof.
  return {label:row.label,sourceUrl:row.offer.sourceUrl,observedAt:row.offer.observedAt,kind:row.offer.kind,status:'unverified' as const,gaps:[...calculated.gaps,'Exact variant price and offer applicability require checkout confirmation.'],immediateDiscountPaise:null,cashbackPaise:null,payableBeforeShippingPaise:null};
 });
}});
