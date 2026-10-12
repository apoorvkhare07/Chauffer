import workflow from '@convex-dev/workflow/test';
import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import schema from './schema';
import {api,internal} from './_generated/api';
import {feedDay,nextFeedAt,feedNeedReady,listedDrop} from './feedRules';
const modules=import.meta.glob('./**/*.ts');
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
const requirements={category:'kurta',size:'M',budget:1500};
const option={title:'Blue cotton kurta',url:'https://www.flipkart.com/blue/p/one',price:500,colour:'blue',fabric:'pure cotton',store:'Flipkart' as const,source:'product' as const,observedAt:1000};
test('India day boundaries and next 9am check are stable',()=>{
 const now=Date.parse('2026-10-12T04:00:00Z');expect(feedDay(now)).toBe('2026-10-12');expect(nextFeedAt(now)).toBe(Date.parse('2026-10-13T03:30:00Z'));
 expect(feedDay(Date.parse('2026-10-11T19:00:00Z'))).toBe('2026-10-12');
 expect(feedNeedReady(requirements,now-31*86400000,now)).toBe(false);expect(feedNeedReady({category:'kurta',budget:1000},now,now)).toBe(false);
});
test('price drop requires same listing attributes and dated non-starting observations',()=>{
 const fresh={...option,price:400,observedAt:2000};expect(listedDrop(option,fresh,2000)?.previousPrice).toBe(500);
 expect(listedDrop(option,{...fresh,priceFrom:true},2000)).toBeNull();expect(listedDrop(option,{...fresh,colour:'red'},2000)).toBeNull();expect(listedDrop(option,{...fresh,source:'listing'},2000)).toBeNull();expect(listedDrop(option,fresh,1000000)).toBeNull();
});
async function setup(){vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-12T04:00:00Z'));const t=convexTest(schema,modules);workflow.register(t);const alice=t.withIdentity({subject:'alice'}),bob=t.withIdentity({subject:'bob'});const c=await t.run(ctx=>ctx.db.insert('conversations',{key:'web:alice',requirements,taste:{prefer:['printed'],avoid:[]},revision:1,session:0,pending:false,updatedAt:Date.now(),shownUrls:[],rejectedUrls:[]}));return {t,alice,bob,c};}
test('daily opt-in queues one feed only, keeps it private, and stopping invalidates completion',async()=>{
 const {t,alice,bob}=await setup();await expect(t.mutation(api.dailyFeed.setEnabled,{enabled:true})).rejects.toThrow('sign in');
 await expect(bob.mutation(api.dailyFeed.setEnabled,{enabled:true})).rejects.toThrow('Finish a chat');
 await alice.mutation(api.dailyFeed.setEnabled,{enabled:true});await t.mutation(internal.dailyFeed.dispatch,{});
 let data=await alice.query(api.dailyFeed.current,{});expect(data.enabled).toBe(true);expect(data.feed?.state).toBe('building');expect((await bob.query(api.dailyFeed.current,{})).feed).toBeNull();
 await alice.mutation(api.dailyFeed.setEnabled,{enabled:true});await t.mutation(internal.dailyFeed.dispatch,{});
 const feeds=await t.run(ctx=>ctx.db.query('dailyFeeds').withIndex('by_owner_day',q=>q.eq('owner','alice')).take(10));expect(feeds).toHaveLength(1);
 await alice.mutation(api.dailyFeed.setEnabled,{enabled:false});
 await t.mutation(internal.dailyFeed.finish,{id:feeds[0]._id,options:[option],drops:[],stores:[],failed:false,note:'checked'});
 data=await alice.query(api.dailyFeed.current,{});expect(data.enabled).toBe(false);expect(data.feed?.state).toBe('paused');expect(data.feed?.options).toEqual([]);
});
test('daily job snapshots taste and guards a changed need; rejects old feed recommendations',async()=>{
 const {t,alice,bob,c}=await setup();await alice.mutation(api.dailyFeed.setEnabled,{enabled:true});await t.mutation(internal.dailyFeed.dispatch,{});
 const feed=await t.run(ctx=>ctx.db.query('dailyFeeds').withIndex('by_owner_day',q=>q.eq('owner','alice')).unique());
 const plan=await t.query(internal.dailyFeed.plan,{id:feed!._id});expect(plan?.taste.prefer).toEqual(['printed']);
 await t.mutation(internal.dailyFeed.finish,{id:feed!._id,options:[option],drops:[],stores:[],failed:false,note:'checked'});
 expect((await alice.query(api.dailyFeed.current,{})).feed?.options).toHaveLength(1);
 await expect(bob.mutation(api.savedProducts.saveDaily,{feedId:feed!._id,url:option.url})).rejects.toThrow('own daily edit');
 await alice.mutation(api.savedProducts.saveDaily,{feedId:feed!._id,url:option.url});expect((await alice.query(api.savedProducts.list,{}))[0].option.price).toBe(500);
 await t.run(ctx=>ctx.db.patch(c,{requirements:{...requirements,budget:300}}));
 const data=await alice.query(api.dailyFeed.current,{});expect(data.changed).toBe(true);expect(data.feed?.options).toEqual([]);
});

test('scheduled feed searches live data and records a conservative saved-listing price drop',async()=>{
 const {t,alice}=await setup();
 await t.run(ctx=>ctx.db.insert('savedProducts',{owner:'alice',option:{...option,observedAt:Date.now()-86400000},savedAt:Date.now()-86400000}));
 vi.spyOn(globalThis,'fetch').mockImplementation(async input=>{
  const url=String(input);if(url.includes('amazon.in'))return new Response('unavailable',{status:503});
  if(url.includes('/search?'))return new Response(`<script type="application/ld+json">${JSON.stringify({'@type':'ItemList',itemListElement:[{url:option.url}]})}</script>`);
  return new Response(`<script type="application/ld+json">${JSON.stringify({'@type':'Product',name:option.title,color:option.colour,offers:{price:400,priceCurrency:'INR',availability:'https://schema.org/InStock'}})}</script><table><tr><td>Fabric</td><td>pure cotton</td></tr></table>`);
 });
 await alice.mutation(api.dailyFeed.setEnabled,{enabled:true});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const data=await alice.query(api.dailyFeed.current,{});expect(data.feed?.state).toBe('ready');expect(data.feed?.drops[0]).toMatchObject({previousPrice:500,price:400,url:option.url});
 expect(data.feed?.options).toHaveLength(1);expect(data.feed?.note).toContain('no filler');
 const saved=await t.run(ctx=>ctx.db.query('savedProducts').withIndex('by_owner',q=>q.eq('owner','alice')).unique());expect(saved?.option.price).toBe(400);
});
