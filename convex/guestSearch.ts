import {mutation,query,internalMutation,internalQuery} from './_generated/server';
import {internal} from './_generated/api';
import {v,ConvexError} from 'convex/values';
import {hashSecret} from './lib/otp';
import {discoveryResultValidator} from './marketplaces';
import {requirementsValidator} from './discoveryRules';
const canRetry=(row:any)=>Boolean(row&&row.text&&(row.attempts??1)<2&&(row.state==='failed'||(row.state==='ready'&&row.result&&!row.result.options.length)||(row.state==='pending'&&(row.updatedAt??row.createdAt)<Date.now()-120000)));
const validToken=(token:string)=>/^[a-f0-9-]{72}$/.test(token);
export const current=query({args:{token:v.string()},returns:v.union(v.null(),v.object({createdAt:v.number(),updatedAt:v.number(),attempts:v.number(),canRetry:v.boolean(),text:v.string(),state:v.union(v.literal('pending'),v.literal('clarifying'),v.literal('ready'),v.literal('failed')),reply:v.optional(v.string()),result:v.optional(discoveryResultValidator)})),handler:async(ctx,{token})=>{
 if(!validToken(token))return null;
 const tokenHash=await hashSecret(token);
 const row=await ctx.db.query('guestSearches').withIndex('by_token',q=>q.eq('tokenHash',tokenHash)).unique();
 return row?{createdAt:row.createdAt,updatedAt:row.updatedAt??row.createdAt,attempts:row.attempts??1,canRetry:canRetry(row),text:row.text,state:row.state==='pending'&&(row.updatedAt??row.createdAt)<Date.now()-120000?'failed':row.state,reply:row.reply,result:row.result}:null;
}});

export const start=mutation({args:{token:v.string(),text:v.string()},returns:v.boolean(),handler:async(ctx,{token,text})=>{
 if(!validToken(token))throw new ConvexError('Please reload and try again.');
 text=text.trim();if(!text||text.length>1000)throw new ConvexError('Use a request between 1 and 1,000 characters.');
 const tokenHash=await hashSecret(token);
 const existing=await ctx.db.query('guestSearches').withIndex('by_token',q=>q.eq('tokenHash',tokenHash)).unique();
 const trial=await ctx.db.query('guestTrials').withIndex('by_token',q=>q.eq('tokenHash',tokenHash)).unique();
 if(existing){if(existing.text===text){if(trial&&!trial.chatUsed)await ctx.db.patch(trial._id,{chatUsed:true});return false;}throw new ConvexError('Sign in to continue shopping.');}
 const recent=await ctx.db.query('guestSearches').withIndex('by_created',q=>q.gt('createdAt',Date.now()-86400000)).take(100);
 if(recent.length>=100||recent.filter(r=>r.createdAt>Date.now()-3600000).length>=30)throw new ConvexError('Guest searches are busy right now. Sign in to continue.');
 const now=Date.now(),id=await ctx.db.insert('guestSearches',{tokenHash,text,attempts:1,state:'pending',createdAt:now,updatedAt:now});
 if(trial)await ctx.db.patch(trial._id,{chatUsed:true});else{const trialId=await ctx.db.insert('guestTrials',{tokenHash,chatUsed:true,tryOnAttempts:0,tryOnBusy:false,tryOnState:'unused',wardrobeAttempts:0,wardrobeBusy:false,wardrobeUsed:false,wardrobeState:'unused',createdAt:Date.now(),mediaExpiresAt:Date.now()+30*60_000,expiresAt:Date.now()+24*60*60_000});await ctx.scheduler.runAfter(30*60_000,internal.guestTrials.cleanup,{id:trialId});await ctx.scheduler.runAfter(24*60*60_000,internal.guestTrials.cleanup,{id:trialId});}
 await ctx.scheduler.runAfter(0,internal.guestSearchWorker.run,{id,attempt:1});
 await ctx.scheduler.runAfter(86400000,internal.guestSearch.clearContent,{id});
 return true;
}});
export const answerAudience=mutation({args:{token:v.string(),audience:v.union(v.literal('men'),v.literal('women'),v.literal('unisex'))},returns:v.null(),handler:async(ctx,{token,audience})=>{
 if(!validToken(token))throw new ConvexError('Please reload and try again.');
 const tokenHash=await hashSecret(token),row=await ctx.db.query('guestSearches').withIndex('by_token',q=>q.eq('tokenHash',tokenHash)).unique();
 if(!row||row.state!=='clarifying'||!row.requirements?.category)throw new ConvexError('This audience question is no longer active.');
 await ctx.db.patch(row._id,{requirements:{...row.requirements,audience},state:'pending',reply:undefined,result:undefined,updatedAt:Date.now()});
 await ctx.scheduler.runAfter(0,internal.guestSearchWorker.run,{id:row._id,attempt:row.attempts??1});return null;
}});
export const context=internalQuery({args:{id:v.id('guestSearches')},handler:async(ctx,{id})=>ctx.db.get(id)});
export const finish=internalMutation({args:{id:v.id('guestSearches'),attempt:v.optional(v.number()),state:v.union(v.literal('clarifying'),v.literal('ready'),v.literal('failed')),reply:v.string(),requirements:v.optional(requirementsValidator),result:v.optional(discoveryResultValidator)},returns:v.null(),handler:async(ctx,{id,attempt,...data})=>{const row=await ctx.db.get(id);if(row?.state==='pending'&&(attempt===undefined||attempt===(row.attempts??1)))await ctx.db.patch(id,{...data,updatedAt:Date.now()});return null;}});
// Keep only the anonymous quota marker; search text and results expire after a day.
export const clearContent=internalMutation({args:{id:v.id('guestSearches')},handler:async(ctx,{id})=>{if(await ctx.db.get(id))await ctx.db.patch(id,{text:'',state:'ready',reply:'Your guest preview has expired. Sign in to continue.',requirements:undefined,result:undefined,updatedAt:Date.now()});}});

// A failed first search is not a second shopping request. Permit one deliberate retry.
export const retry=mutation({args:{token:v.string()},returns:v.null(),handler:async(ctx,{token})=>{
 if(!validToken(token))throw new ConvexError('Please reload and try again.');
 const tokenHash=await hashSecret(token),row=await ctx.db.query('guestSearches').withIndex('by_token',q=>q.eq('tokenHash',tokenHash)).unique();
 if(!canRetry(row)||!row)throw new ConvexError('Sign in to continue shopping.');
 await ctx.db.patch(row._id,{attempts:(row.attempts??1)+1,state:'pending',reply:undefined,result:undefined,updatedAt:Date.now()});
 await ctx.scheduler.runAfter(0,internal.guestSearchWorker.run,{id:row._id,attempt:(row.attempts??1)+1});return null;
}});
