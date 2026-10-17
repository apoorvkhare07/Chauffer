import {start} from '@convex-dev/workflow';
import {v} from 'convex/values';
import {query,mutation,internalQuery,internalMutation,type QueryCtx,type MutationCtx} from './_generated/server';
import {internal} from './_generated/api';
import {requireOwner} from './identity';
import {feedDay,nextFeedAt,dailyContextKey,dailyRequirementsFor} from './feedRules';
import {emptyTaste,tasteValidator} from './taste';
import {requirementsValidator,optionValidator} from './discoveryRules';
import {priceDropValidator} from './feedValidators';
import {storeResultValidator} from './marketplaces';

const feedValidator=v.object({id:v.id('dailyFeeds'),day:v.string(),state:v.string(),requirements:requirementsValidator,options:v.array(optionValidator),drops:v.array(priceDropValidator),stores:v.array(storeResultValidator),note:v.string(),startedAt:v.number(),completedAt:v.optional(v.number())});
type Ctx=QueryCtx|MutationCtx;
async function context(ctx:Ctx,owner:string){
 const profile=await ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 const taste=profile?.taste??emptyTaste;
 const styleRow=await ctx.db.query('wardrobeStyles').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 const styling=await ctx.db.query('stylingProfiles').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 const preferences=profile?.preferences;
 const ready=Boolean(preferences?.name?.trim()&&preferences.age!==undefined&&preferences.gender&&styleRow?.details.stylePreferences.trim());
 const style=styleRow?.details;
 const key=dailyContextKey(preferences?{audience:preferences.audience,size:preferences.size,jeansSize:preferences.jeansSize,budgetPaise:preferences.budgetPaise}:undefined,taste,style,styling?.confirmedVisualStyle);
 return {ready,key,profile,taste,style,photoStyle:styling?.confirmedVisualStyle};
}

export const current=query({args:{},returns:v.object({enabled:v.boolean(),nextAt:v.optional(v.number()),needReady:v.boolean(),changed:v.boolean(),feed:v.union(v.null(),feedValidator)}),handler:async ctx=>{return currentFeedForOwner(ctx,await requireOwner(ctx));
}});

export const setEnabled=mutation({args:{enabled:v.boolean()},returns:v.null(),handler:async(ctx,{enabled})=>{return setFeedForOwner(ctx,await requireOwner(ctx),enabled);
}});

export const dispatch=internalMutation({args:{},returns:v.null(),handler:async ctx=>{
 const now=Date.now(),rows=await ctx.db.query('dailySubscriptions').withIndex('by_due',q=>q.eq('enabled',true).lte('nextAt',now)).take(25);
 for(const sub of rows){
  await ctx.db.patch(sub._id,{nextAt:nextFeedAt(now)});
  const exists=await ctx.db.query('dailyFeeds').withIndex('by_owner_day',q=>q.eq('owner',sub.owner).eq('day',feedDay(now))).unique();if(exists)continue;
  const c=await context(ctx,sub.owner);if(!c.ready)continue;
  const picks=dailyRequirementsFor(feedDay(now),c.profile?.preferences,c.taste,c.style,c.photoStyle);
  const id=await ctx.db.insert('dailyFeeds',{owner:sub.owner,day:feedDay(now),subscriptionId:sub._id,needKey:c.key,requirements:picks[0].requirements,taste:c.taste,state:'building',options:[],drops:[],stores:[],note:'Finding today’s style picks.',startedAt:now});
  await start(ctx,internal.dailyFeedWorkflow.generate,{id});
 }
 if(rows.length===25)await ctx.scheduler.runAfter(1000,internal.dailyFeed.dispatch,{});
 return null;
}});

export const plan=internalQuery({args:{id:v.id('dailyFeeds')},returns:v.union(v.null(),v.object({owner:v.string(),needKey:v.string(),picks:v.array(v.object({category:v.string(),requirements:requirementsValidator,taste:tasteValidator})),excludeUrls:v.array(v.string())})),handler:async(ctx,{id})=>{
 const feed=await ctx.db.get(id);if(!feed||feed.state!=='building')return null;
 const sub=await ctx.db.get(feed.subscriptionId);if(!sub?.enabled)return null;
 const c=await context(ctx,feed.owner);if(!c.ready||feed.needKey!==c.key)return null;
 const picks=dailyRequirementsFor(feed.day,c.profile?.preferences,c.taste,c.style,c.photoStyle);
 const previous=await ctx.db.query('dailyFeeds').withIndex('by_owner_day',q=>q.eq('owner',feed.owner)).order('desc').take(7);
 const saved=await ctx.db.query('savedProducts').withIndex('by_owner',q=>q.eq('owner',feed.owner)).order('desc').take(50);
 return {owner:feed.owner,needKey:c.key,picks,excludeUrls:[...new Set([...previous.flatMap(f=>f.options.map(o=>o.url)),...saved.map(s=>s.option.url)])]};
}});

export const finish=internalMutation({args:{id:v.id('dailyFeeds'),options:v.array(optionValidator),drops:v.array(priceDropValidator),stores:v.array(storeResultValidator),failed:v.boolean(),note:v.string()},returns:v.null(),handler:async(ctx,args)=>{
 const feed=await ctx.db.get(args.id);if(!feed||feed.state!=='building')return null;
 const sub=await ctx.db.get(feed.subscriptionId),c=await context(ctx,feed.owner);
 const valid=Boolean(sub?.enabled&&c.ready&&feed.needKey===c.key);
 await ctx.db.patch(feed._id,{state:valid?(args.failed?'failed':'ready'):'paused',options:valid?args.options.slice(0,3):[],drops:[],stores:[],note:valid?args.note:'Your style preferences changed. We’ll refresh your picks tomorrow.',completedAt:Date.now()});return null;
}});

export async function currentFeedForOwner(ctx:Ctx,owner:string){
 const now=Date.now();
 const sub=await ctx.db.query('dailySubscriptions').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 const feed=await ctx.db.query('dailyFeeds').withIndex('by_owner_day',q=>q.eq('owner',owner).eq('day',feedDay(now))).unique();
 const c=await context(ctx,owner),changed=Boolean(feed&&feed.needKey!==c.key);
 return {enabled:sub?.enabled??false,...(sub?{nextAt:sub.nextAt}:{}),needReady:c.ready,changed,feed:!feed?null:{id:feed._id,day:feed.day,state:feed.state,requirements:feed.requirements,options:changed?[]:feed.options,drops:[],stores:[],note:feed.note,startedAt:feed.startedAt,...(feed.completedAt?{completedAt:feed.completedAt}:{})}};
}

export async function setFeedForOwner(ctx:MutationCtx,owner:string,enabled:boolean){
 const now=Date.now(),c=await context(ctx,owner);
 if(enabled&&!c.ready)throw new Error('Complete your style setup before turning on daily picks.');
 const row=await ctx.db.query('dailySubscriptions').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 const data={owner,enabled,nextAt:enabled?now:nextFeedAt(now),updatedAt:now};
 if(row)await ctx.db.patch(row._id,data);else await ctx.db.insert('dailySubscriptions',data);
 if(enabled){
  const existing=await ctx.db.query('dailyFeeds').withIndex('by_owner_day',q=>q.eq('owner',owner).eq('day',feedDay(now))).unique();
  if(existing&&(existing.needKey!==c.key||existing.state==='paused'||existing.state==='failed')){
   const picks=dailyRequirementsFor(feedDay(now),c.profile?.preferences,c.taste,c.style,c.photoStyle);
   await ctx.db.patch(existing._id,{needKey:c.key,requirements:picks[0].requirements,taste:c.taste,state:'building',options:[],drops:[],stores:[],note:'Finding today’s style picks.',startedAt:now,completedAt:undefined});
   await start(ctx,internal.dailyFeedWorkflow.generate,{id:existing._id});
  }else await ctx.scheduler.runAfter(0,internal.dailyFeed.dispatch,{});
 }
 return null;
}
