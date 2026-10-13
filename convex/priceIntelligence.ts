import {v} from 'convex/values';
import {query,internalMutation} from './_generated/server';
import {requireOwner} from './identity';
import {intelligenceValidator} from './priceIntelligenceRules';
export const get=query({args:{id:v.id('savedProducts')},returns:v.union(intelligenceValidator,v.null()),handler:async(ctx,{id})=>{const owner=await requireOwner(ctx),saved=await ctx.db.get(id);if(saved?.owner!==owner)throw new Error('Saved product unavailable.');return (await ctx.db.query('priceIntelligence').withIndex('by_saved',q=>q.eq('savedId',id)).unique())?.report??null;}});
export const record=internalMutation({args:{id:v.id('savedProducts'),owner:v.string(),report:intelligenceValidator},returns:v.null(),handler:async(ctx,{id,owner,report})=>{const saved=await ctx.db.get(id);if(saved?.owner!==owner)return null;const old=await ctx.db.query('priceIntelligence').withIndex('by_saved',q=>q.eq('savedId',id)).unique();if(old){if(old.report.checkedAt<=report.checkedAt)await ctx.db.patch(old._id,{report});}else await ctx.db.insert('priceIntelligence',{owner,savedId:id,report});return null;}});
