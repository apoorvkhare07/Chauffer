import type {MutationCtx,QueryCtx} from './_generated/server';
import {internalQuery,mutation,query,internalMutation} from './_generated/server';
import {v} from 'convex/values';
import {requireOwner} from './identity';
import {emptyStyle} from './wardrobeRules';
import {emptyTaste} from './taste';
import {locationValidator,cleanLocation} from './wardrobeContextRules';
export async function wardrobeContext(ctx:Pick<QueryCtx,'db'>,owner:string){
 const [profile,styleRow,photo,location]=await Promise.all([ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner',owner)).unique(),ctx.db.query('wardrobeStyles').withIndex('by_owner',q=>q.eq('owner',owner)).unique(),ctx.db.query('stylingProfiles').withIndex('by_owner',q=>q.eq('owner',owner)).unique(),ctx.db.query('wardrobeLocations').withIndex('by_owner',q=>q.eq('owner',owner)).unique()]);
 const style=styleRow?.details??emptyStyle,p=profile?.preferences,description=style.bodyDescription.trim(),confirmed=Boolean(description&&photo?.confirmedDescription===description&&photo?.photoId&&photo.photoState==='ready');
 const shopper={language:p?.language??'en',...(p?.audience?{audience:p.audience}:{}),...(p?.gender?{gender:p.gender}:{}),...(p?.size?{topSize:p.size}:{}),...(p?.jeansSize?{jeansSize:p.jeansSize}:{}),...(p?.heightCm?{heightCm:p.heightCm}:{}),body:{source:confirmed?'confirmed_photo' as const:description?'self_described' as const:'none' as const,description,photoAvailable:Boolean(photo?.photoId),needsReview:Boolean(photo?.analysis?.canEstimate&&!photo.confirmedDescription),limitations:confirmed?(photo?.analysis?.limitations??[]).slice(0,5):[]}};
 const taste=profile?.taste??emptyTaste,place=location?.location??null;const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([style,taste,shopper,place])));const contextKey=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');return {style,taste,shopper,location:place,contextKey};
}
export const get=query({args:{},handler:async ctx=>{const c=await wardrobeContext(ctx,await requireOwner(ctx));return {shopper:c.shopper,style:c.style,taste:c.taste,location:c.location,weatherEnabled:Boolean(process.env.WEATHER_API_KEY)};}});
export const setLocation=mutation({args:{location:v.union(locationValidator,v.null())},returns:v.null(),handler:async(ctx,{location})=>{const owner=await requireOwner(ctx),row=await ctx.db.query('wardrobeLocations').withIndex('by_owner',q=>q.eq('owner',owner)).unique();if(!location){if(row)await ctx.db.delete(row._id);return null;}const clean=cleanLocation(location);if(row)await ctx.db.patch(row._id,{location:clean,updatedAt:Date.now()});else await ctx.db.insert('wardrobeLocations',{owner,location:clean,updatedAt:Date.now()});return null;}});
export const place=internalQuery({args:{owner:v.string()},handler:async(ctx,{owner})=>(await wardrobeContext(ctx,owner)).location});
export const claimWeather=internalMutation({args:{owner:v.string()},returns:v.null(),handler:async(ctx,{owner})=>{const recent=await ctx.db.query('wardrobeWeatherRequests').withIndex('by_owner',q=>q.eq('owner',owner)).order('desc').take(6);if(recent.filter(r=>r._creationTime>Date.now()-60000).length>=6)throw new Error('Wait a minute before checking weather again.');await ctx.db.insert('wardrobeWeatherRequests',{owner});return null;}});
// For the discovery/stylist adapters: server-only; caller must derive owner from the authenticated channel.
export const forAgent=internalQuery({args:{owner:v.string()},handler:async(ctx,{owner})=>wardrobeContext(ctx,owner)});
