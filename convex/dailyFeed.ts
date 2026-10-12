import {start} from '@convex-dev/workflow';
import {v} from 'convex/values';
import {query,mutation,internalQuery,internalMutation} from './_generated/server';
import {internal} from './_generated/api';
import {requireOwner} from './identity';
import {feedDay,nextFeedAt,feedNeedReady,needKey} from './feedRules';
import {emptyTaste,tasteValidator} from './taste';
import {requirementsValidator,optionValidator} from './discoveryRules';
import {priceDropValidator} from './feedValidators';
import {storeResultValidator} from './marketplaces';
const feedValidator=v.object({id:v.id('dailyFeeds'),day:v.string(),state:v.string(),requirements:requirementsValidator,options:v.array(optionValidator),drops:v.array(priceDropValidator),stores:v.array(storeResultValidator),note:v.string(),startedAt:v.number(),completedAt:v.optional(v.number())});
export const current=query({args:{},returns:v.object({enabled:v.boolean(),nextAt:v.optional(v.number()),needReady:v.boolean(),changed:v.boolean(),feed:v.union(v.null(),feedValidator)}),handler:async ctx=>{
 const owner=await requireOwner(ctx),now=Date.now();
 const sub=await ctx.db.query('dailySubscriptions').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 const c=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${owner}`)).unique();
 const feed=await ctx.db.query('dailyFeeds').withIndex('by_owner_day',q=>q.eq('owner',owner).eq('day',feedDay(now))).unique();
 const changed=Boolean(feed&&(!c||feed.needKey!==needKey(c.requirements,c.taste??emptyTaste)));
 return {enabled:sub?.enabled??false,...(sub?{nextAt:sub.nextAt}:{}),needReady:Boolean(c&&feedNeedReady(c.requirements,c.updatedAt,now)),changed,feed:!feed?null:{id:feed._id,day:feed.day,state:feed.state,requirements:feed.requirements,options:changed?[]:feed.options,drops:changed?[]:feed.drops,stores:feed.stores,note:feed.note,startedAt:feed.startedAt,...(feed.completedAt?{completedAt:feed.completedAt}:{})}};
}});
export const setEnabled=mutation({args:{enabled:v.boolean()},returns:v.null(),handler:async(ctx,{enabled})=>{
 const owner=await requireOwner(ctx),now=Date.now();
 const c=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${owner}`)).unique();
 if(enabled&&(!c||c.pending||!feedNeedReady(c.requirements,c.updatedAt,now)))throw new Error('Finish a chat with clothing, size and budget first.');
 const row=await ctx.db.query('dailySubscriptions').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 const data={owner,enabled,nextAt:enabled?now:nextFeedAt(now),updatedAt:now};
 if(row)await ctx.db.patch(row._id,data);else await ctx.db.insert('dailySubscriptions',data);
 if(enabled)await ctx.scheduler.runAfter(0,internal.dailyFeed.dispatch,{});
 return null;
}});
export const dispatch=internalMutation({args:{},returns:v.null(),handler:async ctx=>{
 const now=Date.now(),rows=await ctx.db.query('dailySubscriptions').withIndex('by_due',q=>q.eq('enabled',true).lte('nextAt',now)).take(25);
 for(const sub of rows){
  await ctx.db.patch(sub._id,{nextAt:nextFeedAt(now)});
  const exists=await ctx.db.query('dailyFeeds').withIndex('by_owner_day',q=>q.eq('owner',sub.owner).eq('day',feedDay(now))).unique();if(exists)continue;
  const c=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${sub.owner}`)).unique();
  if(c?.pending){await ctx.db.patch(sub._id,{nextAt:now+15*60000});continue;}
  if(!c||!feedNeedReady(c.requirements,c.updatedAt,now))continue;
  const id=await ctx.db.insert('dailyFeeds',{owner:sub.owner,day:feedDay(now),subscriptionId:sub._id,needKey:needKey(c.requirements,c.taste??emptyTaste),requirements:c.requirements,taste:c.taste??emptyTaste,state:'building',options:[],drops:[],stores:[],note:'Checking fresh store listings.',startedAt:now});
  await start(ctx,internal.dailyFeedWorkflow.generate,{id});
 }
 if(rows.length===25)await ctx.scheduler.runAfter(1000,internal.dailyFeed.dispatch,{});
 return null;
}});
export const plan=internalQuery({args:{id:v.id('dailyFeeds')},returns:v.union(v.null(),v.object({owner:v.string(),requirements:requirementsValidator,taste:tasteValidator,excludeUrls:v.array(v.string()),watched:v.array(v.object({id:v.id('savedProducts'),option:optionValidator}))})),handler:async(ctx,{id})=>{
 const feed=await ctx.db.get(id);if(!feed||feed.state!=='building')return null;
 const sub=await ctx.db.get(feed.subscriptionId);if(!sub?.enabled)return null;
 const c=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${feed.owner}`)).unique();
 if(!c||c.pending||feed.needKey!==needKey(c.requirements,c.taste??emptyTaste))return null;
 const saved=await ctx.db.query('savedProducts').withIndex('by_owner',q=>q.eq('owner',feed.owner)).order('desc').take(50);
 const previous=await ctx.db.query('dailyFeeds').withIndex('by_owner_day',q=>q.eq('owner',feed.owner)).order('desc').take(7);
 return {owner:feed.owner,requirements:feed.requirements,taste:feed.taste,excludeUrls:[...new Set([...c.shownUrls,...c.rejectedUrls,...previous.flatMap(f=>f.options.map(o=>o.url))])],watched:saved.filter(s=>!c.rejectedUrls.includes(s.option.url)).map(s=>({id:s._id,option:s.option}))};
}});
export const finish=internalMutation({args:{id:v.id('dailyFeeds'),options:v.array(optionValidator),drops:v.array(priceDropValidator),stores:v.array(storeResultValidator),failed:v.boolean(),note:v.string()},returns:v.null(),handler:async(ctx,args)=>{
 const feed=await ctx.db.get(args.id);if(!feed||feed.state!=='building')return null;
 const sub=await ctx.db.get(feed.subscriptionId),c=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${feed.owner}`)).unique();
 const valid=Boolean(sub?.enabled&&c&&!c.pending&&feed.needKey===needKey(c.requirements,c.taste??emptyTaste));
 await ctx.db.patch(feed._id,{state:valid?(args.failed?'failed':'ready'):'paused',options:valid?args.options.slice(0,6):[],drops:valid?args.drops:[],stores:args.stores,note:valid?args.note:'Shopping need changed or daily picks were paused.',completedAt:Date.now()});return null;
}});
