import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import workflow from '@convex-dev/workflow/test';
import schema from './schema';
import {api} from './_generated/api';
import {internal} from './_generated/api';
const modules=import.meta.glob('./**/*.ts');
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();vi.clearAllTimers();vi.useRealTimers();});
test('plan allowances are disabled by default even after the old allowance was used',async()=>{
 vi.stubEnv('PLAN_LIMITS_ENABLED',undefined);vi.useFakeTimers();
 const t=convexTest(schema,modules);workflow.register(t);const owner='unlimited-user',user=t.withIdentity({subject:owner});
 const now=new Date(),month=`${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}`;
 await t.run(async ctx=>{await ctx.db.insert('planUsage',{owner,month,wardrobeItems:3,conversations:10,stylistSessions:3});});
 await expect(user.mutation(api.wardrobe.add,{details:{name:'Fourth shirt',category:'top',colour:'blue'}})).resolves.toBeTruthy();
 await expect(user.mutation(api.conversations.post,{text:'reset'})).resolves.toBeNull();
 expect(await user.query(api.planAccess.current,{})).toMatchObject({limits:{wardrobeItems:null,conversations:null,stylistSessions:null},canUpgrade:false,usage:{wardrobeItems:3,conversations:10,stylistSessions:3}});
});
test('every account defaults to Free and monthly conversation allowance is enforced by the backend',async()=>{
 vi.stubEnv('PLAN_LIMITS_ENABLED','true');
 vi.useFakeTimers();const t=convexTest(schema,modules);workflow.register(t);const user=t.withIdentity({subject:'free-user'});
 expect(await user.query(api.planAccess.current,{})).toMatchObject({plan:'free',usage:{conversations:0,stylistSessions:0,wardrobeItems:0},limits:{conversations:10,stylistSessions:3,wardrobeItems:3}});
 for(let i=0;i<10;i++)await user.mutation(api.conversations.post,{text:'reset'});
 expect((await user.query(api.planAccess.current,{})).usage.conversations).toBe(10);
 await expect(user.mutation(api.conversations.post,{text:'reset'})).rejects.toThrow('10 free conversations');
});
test('a full free wardrobe does not block the separate conversation allowance',async()=>{
 vi.stubEnv('PLAN_LIMITS_ENABLED','true');
 vi.useFakeTimers();const t=convexTest(schema,modules);workflow.register(t);const user=t.withIdentity({subject:'wardrobe-full-user'});
 for(let i=0;i<3;i++)await user.mutation(api.wardrobe.add,{details:{name:`Shirt ${i}`,category:'top',colour:'blue'}});
 await expect(user.mutation(api.wardrobe.add,{details:{name:'Another shirt',category:'top',colour:'blue'}})).rejects.toThrow('3 free wardrobe additions this month');
 await expect(user.mutation(api.conversations.post,{text:'Find a blue shirt under 1500'})).resolves.toBeNull();
 expect((await user.query(api.planAccess.current,{})).usage).toMatchObject({wardrobeItems:3,conversations:1});
});
test('Razorpay subscription webhooks activate Pro idempotently and cancellation ends at the paid-through date',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-17T00:00:00Z'));
 const t=convexTest(schema,modules);const owner='razorpay-user';
 const end=Date.now()+10*24*60*60*1000;
 await t.run(async ctx=>{await ctx.db.insert('razorpaySubscriptions',{owner,subscriptionId:'sub_test123',planId:'plan_test123',status:'created',createdAt:Date.now(),updatedAt:Date.now()});});
 const activation=JSON.stringify({event:'subscription.activated',payload:{subscription:{entity:{id:'sub_test123',plan_id:'plan_test123',status:'active',current_end:Math.floor(end/1000)}}}});
 await t.mutation(internal.billingCore.receiveWebhook,{eventId:'evt_activation',payload:activation});
 expect(await t.withIdentity({subject:owner}).query(api.planAccess.current,{})).toMatchObject({plan:'pro',source:'razorpay',billingStatus:'active'});
 await t.mutation(internal.billingCore.receiveWebhook,{eventId:'evt_activation',payload:JSON.stringify({event:'subscription.halted',payload:{subscription:{entity:{id:'sub_test123',plan_id:'plan_test123',status:'halted'}}}})});
 expect((await t.withIdentity({subject:owner}).query(api.planAccess.current,{})).plan).toBe('pro');
 const cancellation=JSON.stringify({event:'subscription.cancelled',payload:{subscription:{entity:{id:'sub_test123',plan_id:'plan_test123',status:'cancelled',current_end:Math.floor(end/1000)}}}});
 await t.mutation(internal.billingCore.receiveWebhook,{eventId:'evt_cancel',payload:cancellation});
 expect((await t.withIdentity({subject:owner}).query(api.planAccess.current,{})).plan).toBe('pro');
 vi.setSystemTime(end+1000);
 expect((await t.withIdentity({subject:owner}).query(api.planAccess.current,{})).plan).toBe('free');
});

test('one-time Razorpay payments grant 30 days and a later purchase adds another 30 days',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-17T00:00:00Z'));
 const t=convexTest(schema,modules),owner='one-time-razorpay-user',start=Date.now(),day=24*60*60*1000;
 const order1='order_oneTime1',payment1='pay_oneTime1';
 await t.mutation(internal.billingCore.createOrderRecord,{owner,orderId:order1});
 const captured=(orderId:string,paymentId:string)=>JSON.stringify({event:'payment.captured',payload:{payment:{entity:{id:paymentId,order_id:orderId,amount:9900,currency:'INR',status:'captured',captured:true}}}});
 await t.mutation(internal.billingCore.receiveWebhook,{eventId:'evt_payment1',payload:captured(order1,payment1)});
 let plan=await t.withIdentity({subject:owner}).query(api.planAccess.current,{});
 expect(plan).toMatchObject({plan:'pro',source:'razorpay',billingStatus:'paid',periodEndsAt:start+30*day});
 await t.mutation(internal.billingCore.receiveWebhook,{eventId:'evt_payment1',payload:captured(order1,payment1)});
 expect((await t.withIdentity({subject:owner}).query(api.planAccess.current,{})).periodEndsAt).toBe(start+30*day);

 await t.mutation(internal.billingCore.createOrderRecord,{owner,orderId:'order_oneTime2'});
 await t.mutation(internal.billingCore.receiveWebhook,{eventId:'evt_payment2',payload:captured('order_oneTime2','pay_oneTime2')});
 plan=await t.withIdentity({subject:owner}).query(api.planAccess.current,{});
 expect(plan.periodEndsAt).toBe(start+60*day);
 vi.setSystemTime(start+60*day+1);
 expect(await t.withIdentity({subject:owner}).query(api.planAccess.current,{})).toMatchObject({plan:'free',lastProEndsAt:start+60*day});
});

test('a captured webhook with the wrong amount does not activate Pro',async()=>{
 vi.useFakeTimers();const t=convexTest(schema,modules),owner='wrong-amount-user';
 await t.mutation(internal.billingCore.createOrderRecord,{owner,orderId:'order_wrongAmount'});
 await t.mutation(internal.billingCore.receiveWebhook,{eventId:'evt_wrong_amount',payload:JSON.stringify({event:'payment.captured',payload:{payment:{entity:{id:'pay_wrongAmount',order_id:'order_wrongAmount',amount:100,currency:'INR',status:'captured',captured:true}}}})});
 expect((await t.withIdentity({subject:owner}).query(api.planAccess.current,{})).plan).toBe('free');
});
