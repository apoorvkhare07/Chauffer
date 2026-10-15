import {mutation,query,internalMutation,internalQuery} from './_generated/server';
import {internal} from './_generated/api';
import {v,ConvexError} from 'convex/values';
import {hashSecret} from './lib/otp';
import {discoveryResultValidator} from './marketplaces';
const validToken=(token:string)=>/^[a-f0-9-]{72}$/.test(token);
export const current=query({args:{token:v.string()},handler:async(ctx,{token})=>{
 if(!validToken(token))return null;
 const tokenHash=await hashSecret(token);
 const row=await ctx.db.query('guestSearches').withIndex('by_token',q=>q.eq('tokenHash',tokenHash)).unique();
 return row?{createdAt:row.createdAt,text:row.text,state:row.state==='pending'&&row.createdAt<Date.now()-120000?'failed':row.state,reply:row.reply,result:row.result}:null;
}});

export const start=mutation({args:{token:v.string(),text:v.string()},returns:v.null(),handler:async(ctx,{token,text})=>{
 if(!validToken(token))throw new ConvexError('Please reload and try again.');
 text=text.trim();if(!text||text.length>1000)throw new ConvexError('Use a request between 1 and 1,000 characters.');
 const tokenHash=await hashSecret(token);
 const existing=await ctx.db.query('guestSearches').withIndex('by_token',q=>q.eq('tokenHash',tokenHash)).unique();
 if(existing){if(existing.text===text)return null;throw new ConvexError('Sign in to continue shopping.');}
 const recent=await ctx.db.query('guestSearches').withIndex('by_created',q=>q.gt('createdAt',Date.now()-86400000)).take(100);
 if(recent.length>=100||recent.filter(r=>r.createdAt>Date.now()-3600000).length>=30)throw new ConvexError('Guest searches are busy right now. Sign in to continue.');
 const id=await ctx.db.insert('guestSearches',{tokenHash,text,state:'pending',createdAt:Date.now()});
 await ctx.scheduler.runAfter(0,internal.guestSearchWorker.run,{id});
 await ctx.scheduler.runAfter(86400000,internal.guestSearch.clearContent,{id});
 return null;
}});
export const context=internalQuery({args:{id:v.id('guestSearches')},handler:async(ctx,{id})=>ctx.db.get(id)});
export const finish=internalMutation({args:{id:v.id('guestSearches'),state:v.union(v.literal('ready'),v.literal('failed')),reply:v.string(),result:v.optional(discoveryResultValidator)},handler:async(ctx,{id,...data})=>{const row=await ctx.db.get(id);if(row?.state==='pending')await ctx.db.patch(id,data);}});
// Keep only the anonymous quota marker; search text and results expire after a day.
export const clearContent=internalMutation({args:{id:v.id('guestSearches')},handler:async(ctx,{id})=>{if(await ctx.db.get(id))await ctx.db.patch(id,{text:'',state:'ready',reply:'Your guest preview has expired. Sign in to continue.',result:undefined});}});
