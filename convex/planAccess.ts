import {ConvexError,v} from 'convex/values';
import {mutation,query,type MutationCtx,type QueryCtx} from './_generated/server';
import {requireOwner} from './identity';

// Plan limits are off unless PLAN_LIMITS_ENABLED is set to 'true' in Convex.
export function planLimitsEnabled(){return process.env.PLAN_LIMITS_ENABLED==='true';}

export const FREE_LIMITS={wardrobeItems:3,conversations:10,stylistSessions:3} as const;
export const PRO_LIMITS={wardrobeItems:null,conversations:null,stylistSessions:null} as const;
function monthKey(now=Date.now()){const d=new Date(now);return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;}
function nextMonth(now=Date.now()){const d=new Date(now);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1);}
async function userPlan(ctx:QueryCtx|MutationCtx,owner:string){
 const row=await ctx.db.query('userPlans').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 return row?.plan==='pro'&&((row.status==='active'&&(!row.periodEndsAt||row.periodEndsAt>Date.now()))||(row.status==='cancelled'&&(row.periodEndsAt??0)>Date.now()))?'pro':'free';
}
async function usage(ctx:QueryCtx|MutationCtx,owner:string){
 const month=monthKey();const row=await ctx.db.query('planUsage').withIndex('by_owner_month',q=>q.eq('owner',owner).eq('month',month)).unique();
 return {month,conversations:row?.conversations??0,stylistSessions:row?.stylistSessions??0,wardrobeItems:row?.wardrobeItems??0};
}
export const current=query({args:{},handler:async ctx=>{
 const owner=await requireOwner(ctx),plan=await userPlan(ctx,owner),used=await usage(ctx,owner);
 const planRow=await ctx.db.query('userPlans').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 const latest=await ctx.db.query('razorpaySubscriptions').withIndex('by_owner_created',q=>q.eq('owner',owner)).order('desc').first();
 const latestOrder=await ctx.db.query('razorpayOrders').withIndex('by_owner_created',q=>q.eq('owner',owner)).order('desc').first();
 const pro=plan==='pro',limitsEnabled=planLimitsEnabled();return {plan,source:plan==='pro'?(planRow?.source??'manual'):'default',periodEndsAt:pro?(planRow?.periodEndsAt??latest?.currentEnd):nextMonth(),lastProEndsAt:planRow?.plan==='pro'&&planRow.source==='razorpay'?planRow.periodEndsAt:undefined,billingStatus:latestOrder?.status??latest?.status??null,cancelAtCycleEnd:latest?.cancelAtCycleEnd??false,usage:used,limits:{wardrobeItems:!limitsEnabled||pro?null:FREE_LIMITS.wardrobeItems,conversations:!limitsEnabled||pro?null:FREE_LIMITS.conversations,stylistSessions:!limitsEnabled||pro?null:FREE_LIMITS.stylistSessions},canUpgrade:limitsEnabled&&!pro};
}});
export const ensureDefault=mutation({args:{},returns:v.null(),handler:async ctx=>{const owner=await requireOwner(ctx),row=await ctx.db.query('userPlans').withIndex('by_owner',q=>q.eq('owner',owner)).unique();if(!row)await ctx.db.insert('userPlans',{owner,plan:'free',status:'active',source:'default',updatedAt:Date.now()});return null;}});
export async function enforceWardrobeCapacity(ctx:MutationCtx,owner:string){
 if(!planLimitsEnabled())return;
 const plan=await userPlan(ctx,owner);if(plan==='pro')return;
 const month=monthKey(),row=await ctx.db.query('planUsage').withIndex('by_owner_month',q=>q.eq('owner',owner).eq('month',month)).unique();
 if((row?.wardrobeItems??0)>=FREE_LIMITS.wardrobeItems)throw new ConvexError({code:'PLAN_LIMIT',feature:'wardrobe',message:'You’ve used your 3 free wardrobe additions this month. Upgrade to Pro or wait until next month.'});
}
export async function recordWardrobeAddition(ctx:MutationCtx,owner:string){
 if(!planLimitsEnabled())return;
 if(await userPlan(ctx,owner)==='pro')return;
 const month=monthKey(),row=await ctx.db.query('planUsage').withIndex('by_owner_month',q=>q.eq('owner',owner).eq('month',month)).unique();
 if(row)await ctx.db.patch(row._id,{wardrobeItems:(row.wardrobeItems??0)+1});else await ctx.db.insert('planUsage',{owner,month,conversations:0,stylistSessions:0,wardrobeItems:1});
}
export async function consumeMonthly(ctx:MutationCtx,owner:string,feature:'conversations'|'stylistSessions'){
 if(!planLimitsEnabled())return;
 if(await userPlan(ctx,owner)==='pro')return;
 const month=monthKey(),limit=FREE_LIMITS[feature],row=await ctx.db.query('planUsage').withIndex('by_owner_month',q=>q.eq('owner',owner).eq('month',month)).unique();
 const used=row?.[feature]??0;
 if(used>=limit)throw new ConvexError({code:'PLAN_LIMIT',feature,message:feature==='conversations'?'You’ve used your 10 free conversations this month. Upgrade to Pro for unlimited access.':'You’ve used your 3 free stylist sessions this month. Upgrade to Pro for unlimited access.'});
 if(row)await ctx.db.patch(row._id,{[feature]:used+1});else await ctx.db.insert('planUsage',{owner,month,conversations:feature==='conversations'?1:0,stylistSessions:feature==='stylistSessions'?1:0});
}
