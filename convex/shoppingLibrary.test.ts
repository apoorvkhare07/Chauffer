import {convexTest} from 'convex-test';
import {test,expect,vi,afterEach} from 'vitest';
import schema from './schema';
import {api,internal} from './_generated/api';
const modules=import.meta.glob('./**/*.ts');
afterEach(()=>vi.unstubAllEnvs());
const option={title:'Women Cotton Kurta',url:'https://www.flipkart.com/cotton/p/one',price:500,colour:'Blue',fabric:'Cotton',store:'Flipkart' as const,observedAt:Date.now()};
async function setup(){
 vi.stubEnv('GEMINI_API_KEY','');const t=convexTest(schema,modules);
 const alice=t.withIdentity({subject:'alice',issuer:'https://test.chauffeur'}),bob=t.withIdentity({subject:'bob',issuer:'https://test.chauffeur'});
 await alice.mutation(api.conversations.post,{text:'hi'});
 const c=await t.run(ctx=>ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key','web:alice')).unique());
 const messageId=await t.run(ctx=>ctx.db.insert('messages',{conversationId:c!._id,session:c!.session,role:'assistant',text:'Options',result:{options:[option],stores:[],failed:false}}));
 return {t,alice,bob,c:c!,messageId};
}
test('shortlist resolves actual private merchant observations, deduplicates and survives new chats',async()=>{
 const {t,alice,bob,messageId}=await setup();
 await expect(t.query(api.savedProducts.list,{})).rejects.toThrow('sign in');
 await expect(bob.mutation(api.savedProducts.save,{messageId,url:option.url})).rejects.toThrow('own search');
 await expect(alice.mutation(api.savedProducts.save,{messageId,url:'https://www.flipkart.com/invented/p/two'})).rejects.toThrow('own search');
 await alice.mutation(api.savedProducts.save,{messageId,url:option.url});
 await alice.mutation(api.savedProducts.save,{messageId,url:option.url});
 await alice.mutation(api.conversations.post,{text:'reset'});
 const saved=await alice.query(api.savedProducts.list,{});expect(saved).toHaveLength(1);expect(saved[0].option.price).toBe(500);
 expect(await bob.query(api.savedProducts.list,{})).toEqual([]);
 expect(await alice.query(api.savedProducts.history,{id:saved[0]._id})).toHaveLength(1);
 await expect(bob.query(api.savedProducts.history,{id:saved[0]._id})).rejects.toThrow('unavailable');
 await expect(bob.query(api.commerce.compareSaved,{ids:[saved[0]._id]})).rejects.toThrow('own saved');
 await expect(bob.mutation(api.savedProducts.remove,{id:saved[0]._id})).rejects.toThrow('unavailable');
 await alice.mutation(api.savedProducts.remove,{id:saved[0]._id});expect(await alice.query(api.savedProducts.list,{})).toEqual([]);
});
test('history is private and cancelling a request prevents late results from being written',async()=>{
 const {t,alice,bob,c}=await setup();
 await alice.mutation(api.conversations.post,{text:'reset'});
 expect((await alice.query(api.conversations.history,{})).sessions).toHaveLength(1);
 expect((await bob.query(api.conversations.history,{session:0})).messages).toEqual([]);
 await t.run(ctx=>ctx.db.patch(c._id,{pending:true}));
 const before=await t.run(ctx=>ctx.db.get(c._id));
 await alice.mutation(api.conversations.cancel,{});
 expect(await t.mutation(internal.conversations.complete,{conversationId:c._id,revision:before!.revision,result:{options:[option],stores:[],failed:false}})).toBeNull();
 expect((await alice.query(api.conversations.current,{})).messages.at(-1)?.text).toContain('Stopped');
});
test('forgetting taste preserves saved size and budget; an exact batch rejection does not depend on AI',async()=>{
 const {t,alice,c}=await setup();
 await alice.mutation(api.profiles.save,{preferences:{language:'hi',size:'M',budgetPaise:150000}});
 await t.run(async ctx=>{const p=await ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner','alice')).unique();await ctx.db.patch(p!._id,{taste:{prefer:['printed'],avoid:['sequins']}});});
 await alice.mutation(api.profiles.forgetTaste,{});
 expect(await alice.query(api.profiles.taste,{})).toEqual({prefer:[],avoid:[]});
 expect(await alice.query(api.profiles.get,{})).toMatchObject({size:'M',budgetPaise:150000});
 vi.stubEnv('GEMINI_API_KEY','mock-key');await alice.mutation(api.conversations.post,{text:'None of these'});
 expect((await alice.query(api.conversations.current,{})).messages.at(-1)?.text).toContain('What should I change');
 expect((await t.run(ctx=>ctx.db.get(c._id)))?.pending).toBe(false);
 await t.run(ctx=>ctx.db.patch(c._id,{pending:true,updatedAt:Date.now()}));
 await expect(alice.mutation(api.profiles.clear,{})).rejects.toThrow('current request');
 expect(await alice.query(api.profiles.get,{})).toMatchObject({size:'M',budgetPaise:150000});
});
test('offer evidence is private and arithmetic never becomes a confirmed variant discount',async()=>{
 const {t,alice,bob,messageId}=await setup();await alice.mutation(api.savedProducts.save,{messageId,url:option.url});
 const item=(await alice.query(api.savedProducts.list,{}))[0];
 const offer={sourceUrl:option.url,observedAt:Date.now(),expiresAt:Date.now()+60000,termsVerified:true,kind:'discount' as const,minimumPaise:10000,fixedPaise:5000,accountRestricted:false,stacking:'unknown' as const};
 await expect(t.mutation(internal.offerEvidence.record,{owner:'alice',productUrl:option.url,label:'Test terms',offer:{...offer,sourceUrl:'https://untrusted.example/'}})).rejects.toThrow('source');
 await t.mutation(internal.offerEvidence.record,{owner:'alice',productUrl:option.url,label:'Test terms',offer});
 const result=await alice.query(api.offerEvidence.forSaved,{id:item._id});expect(result[0]).toMatchObject({status:'unverified',immediateDiscountPaise:null});
 expect(result[0].gaps.join(' ')).toContain('checkout');
 await expect(bob.query(api.offerEvidence.forSaved,{id:item._id})).rejects.toThrow('unavailable');
});
