import {v} from 'convex/values';
import {internalQuery} from './_generated/server';
import {wardrobeContext} from './wardrobeContext';
import {wardrobeKey} from './wardrobeRules';
// A typed, read-only adapter for the discovery/stylist orchestrator. No model call or merchant search.
// The caller derives owner from the signed-in channel and records active-request consent before invoking.
export const context=internalQuery({args:{owner:v.string(),request:v.string(),useWardrobe:v.boolean(),useStyling:v.boolean()},handler:async(ctx,args)=>{
 if(args.request.length>1000)throw new Error('Keep the handoff request under 1,000 characters.');
 const c=await wardrobeContext(ctx,args.owner),rows=args.useWardrobe?await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',args.owner)).take(80):[];
 return {version:'wardrobe-context.v1' as const,source:'wardrobe' as const,request:args.request,generatedAt:Date.now(),scope:{wardrobe:args.useWardrobe,styling:args.useStyling},inventoryKey:wardrobeKey(rows),contextKey:c.contextKey,items:rows.filter(i=>i.available).map(i=>({id:i._id,details:i.details,...(i.lastWornAt?{lastWornAt:i.lastWornAt}:{})})),...(args.useStyling?{shopper:c.shopper,style:c.style,taste:c.taste}:{}),limits:['Confirmed available owned items only.','Photo styling is tentative; no fit guarantee.','No raw portrait or generated try-on image.']};
}});
export const result=internalQuery({args:{owner:v.string(),id:v.id('wardrobeOutfits')},handler:async(ctx,{owner,id})=>{
 const run=await ctx.db.get(id);if(run?.owner!==owner)return null;
 const c=await wardrobeContext(ctx,owner),rows=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).take(80),stale=run.wardrobeKey!==wardrobeKey(rows)||(run.contextKey?run.contextKey!==c.contextKey:run.styleKey!==JSON.stringify(c.style));
 return {version:'wardrobe-result.v1' as const,source:'wardrobe' as const,requestId:id,status:stale?'stale':run.state==='building'?'pending':run.state==='failed'?'failed':run.outfits.length?'ready':'needs_context',generatedAt:run.completedAt??run.createdAt,outfits:stale?[]:run.outfits,...(!stale&&run.guidance?{guidance:run.guidance}:{}),...(!stale&&run.weather?{weather:run.weather}:{}),event:run.event??null,inventoryKey:run.wardrobeKey,contextKey:run.contextKey??null,nextAction:stale?'refresh_context':run.outfits.length?'review_outfits':'clarify_or_add_owned_items'};
}});
