import {v} from 'convex/values';
import {internalQuery,internalMutation} from './_generated/server';
import {optionValidator,requirementsValidator} from './discoveryRules';
import {storeValidator,stores,storeSearchUrl} from './marketplaces';
export const entryValidator=v.object({store:storeValidator,searchUrl:v.string(),options:v.array(optionValidator),readable:v.boolean(),expiresAt:v.number()});
export const read=internalQuery({args:{taskId:v.id('recommendationTasks')},returns:v.array(entryValidator),handler:async(ctx,{taskId})=>{
 const task=await ctx.db.get(taskId);if(!task?.brief)return [];
 const c=await ctx.db.get(task.conversationId);if(c?.key!==`web:${task.owner}`||c.session!==task.session||c.revision!==task.revision||Date.now()>task.deadlineAt)return [];
 const entries=await Promise.all(stores.map(store=>ctx.db.query('discoveryCache').withIndex('by_session_store',q=>q.eq('conversationId',task.conversationId).eq('session',task.session).eq('store',store)).unique()));
 return entries.flatMap(e=>e&&e.expiresAt>Date.now()&&e.searchUrl===storeSearchUrl(e.store,task.brief!.requirements,false)?[{store:e.store,searchUrl:e.searchUrl,options:e.options,readable:e.readable,expiresAt:e.expiresAt}]:[]);
}});
export const put=internalMutation({args:{taskId:v.id('recommendationTasks'),store:storeValidator,options:v.array(optionValidator),readable:v.boolean()},returns:v.null(),handler:async(ctx,{taskId,store,options,readable})=>{
 const task=await ctx.db.get(taskId);if(!task?.brief)return null;
 const c=await ctx.db.get(task.conversationId);if(c?.key!==`web:${task.owner}`||c.session!==task.session||c.revision!==task.revision||Date.now()>task.deadlineAt)return null;
 const old=await ctx.db.query('discoveryCache').withIndex('by_session_store',q=>q.eq('conversationId',c._id).eq('session',c.session).eq('store',store)).unique();
 const row={conversationId:c._id,session:c.session,store,searchUrl:storeSearchUrl(store,task.brief.requirements,false),options:options.slice(0,10),readable,expiresAt:Date.now()+(readable?30*60000:2*60000)};
 if(old)await ctx.db.replace(old._id,row);else await ctx.db.insert('discoveryCache',row);return null;
}});
export const cleanup=internalMutation({args:{},returns:v.null(),handler:async ctx=>{
 const expired=await ctx.db.query('discoveryCache').withIndex('by_expiry',q=>q.lte('expiresAt',Date.now())).take(200);
 for(const row of expired)await ctx.db.delete(row._id);
 if(expired.length===200)await ctx.scheduler.runAfter(0,internal.discoveryCache.cleanup,{});return null;
}});
import {internal} from './_generated/api';

export const recoveryContext=internalQuery({args:{taskId:v.id('recommendationTasks')},returns:v.union(v.null(),v.object({requirements:requirementsValidator,deadlineAt:v.number()})),handler:async(ctx,{taskId})=>{
 const task=await ctx.db.get(taskId);if(!task?.brief||['cancelled','failed','needs_input'].includes(task.status)||Date.now()>task.deadlineAt)return null;
 const c=await ctx.db.get(task.conversationId);if(c?.key!==`web:${task.owner}`||c.session!==task.session||c.revision!==task.revision)return null;
 return {requirements:task.brief.requirements,deadlineAt:task.deadlineAt};
}});
