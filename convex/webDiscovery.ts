import {internalMutation} from './_generated/server';
import {v} from 'convex/values';
export const claim=internalMutation({args:{owner:v.string()},returns:v.id('webSearchRuns'),handler:async(ctx,{owner})=>{
 const now=Date.now();const recent=await ctx.db.query('webSearchRuns').withIndex('by_owner',q=>q.eq('owner',owner).gte('_creationTime',now-90000)).order('desc').take(4);
 if(recent.some(row=>!row.finishedAt&&row.startedAt>now-90000))throw new Error('A search is already running.');
 if(recent.filter(row=>row.startedAt>now-60000).length>=3)throw new Error('Please wait a minute before searching again.');
 return ctx.db.insert('webSearchRuns',{owner,startedAt:now});
}});
export const claimGuestVoice=internalMutation({args:{},returns:v.id('webSearchRuns'),handler:async(ctx)=>{
 const now=Date.now(),owner='guest-voice-global';
 const recent=await ctx.db.query('webSearchRuns').withIndex('by_owner',q=>q.eq('owner',owner).gte('_creationTime',now-24*60*60_000)).order('desc').take(101);
 if(recent.length>=100)throw new Error('Guest voice requests are busy right now. Please try again later.');
 if(recent.filter(row=>row.startedAt>now-60*60_000).length>=30)throw new Error('Guest voice requests are busy right now. Please try again later.');
 if(recent.filter(row=>row.startedAt>now-60_000).length>=3)throw new Error('Please wait a minute before trying voice again.');
 return ctx.db.insert('webSearchRuns',{owner,startedAt:now});
}});
export const finish=internalMutation({args:{id:v.id('webSearchRuns')},returns:v.null(),handler:async(ctx,{id})=>{await ctx.db.patch(id,{finishedAt:Date.now()});return null;}});
