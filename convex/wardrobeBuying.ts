import {v} from 'convex/values';
import {internalQuery} from './_generated/server';
import {optionValidator} from './discoveryRules';
import {garmentValidator,styleValidator,emptyStyle} from './wardrobeRules';
export const plan=internalQuery({args:{owner:v.string(),id:v.id('savedProducts')},returns:v.union(v.null(),v.object({option:optionValidator,items:v.array(v.object({id:v.id('wardrobeItems'),details:garmentValidator,available:v.boolean()})),style:styleValidator})),handler:async(ctx,{owner,id})=>{const saved=await ctx.db.get(id);if(saved?.owner!==owner)return null;const items=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).take(80),style=await ctx.db.query('wardrobeStyles').withIndex('by_owner',q=>q.eq('owner',owner)).unique();return {option:saved.option,items:items.map(i=>({id:i._id,details:i.details,available:i.available})),style:style?.details??emptyStyle};}});
