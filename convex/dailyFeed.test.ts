import workflow from '@convex-dev/workflow/test';
import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import schema from './schema';
import {api,internal} from './_generated/api';
import {matchesOption} from './discoveryRules';
import {feedDay,nextFeedAt,feedNeedReady,listedDrop,dailyCategoriesFor,dailyRequirementsFor,dailyContextKey,dailyTaste} from './feedRules';
const modules=import.meta.glob('./**/*.ts');
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
const requirements={category:'kurta',size:'M',budget:1500};
const option={title:'Blue cotton kurta',url:'https://www.flipkart.com/blue/p/one',price:500,colour:'blue',fabric:'pure cotton',store:'Flipkart' as const,source:'product' as const,observedAt:1000};
test('India day boundaries and next 9am check are stable',()=>{
 const now=Date.parse('2026-10-12T04:00:00Z');expect(feedDay(now)).toBe('2026-10-12');expect(nextFeedAt(now)).toBe(Date.parse('2026-10-13T03:30:00Z'));
 expect(feedDay(Date.parse('2026-10-11T19:00:00Z'))).toBe('2026-10-12');
 expect(feedNeedReady(requirements,now-31*86400000,now)).toBe(false);expect(feedNeedReady({category:'kurta',budget:1000},now,now)).toBe(false);
});
test('daily edits rotate through three product types and use saved fit and style context',()=>{
 const a=dailyCategoriesFor('2026-10-12'),b=dailyCategoriesFor('2026-10-13');expect(a).toHaveLength(3);expect(a).toContain('jeans');expect(a).not.toEqual(b);
 const picks=dailyRequirementsFor('2026-10-12',{audience:'men',size:'M',jeansSize:'32',budgetPaise:200000},{prefer:['minimal'],avoid:['neon']},{stylePreferences:'relaxed classic',fitPreferences:'straight',avoid:'synthetic'});
 expect(picks).toHaveLength(3);expect(picks[0].requirements).toMatchObject({audience:'men',size:'M',style:'relaxed classic',fit:'straight',budget:2000});expect(picks.find(p=>p.category==='jeans')?.requirements.size).toBe('32');expect(picks[0].taste).toMatchObject({prefer:['minimal','relaxed classic','straight'],avoid:['neon','synthetic']});
 expect(dailyContextKey({audience:'men',size:'M'}, {prefer:[],avoid:[]}, {stylePreferences:'classic'})).not.toBe(dailyContextKey({audience:'women',size:'M'}, {prefer:[],avoid:[]}, {stylePreferences:'classic'}));
});
test('daily picks use male and female profile gender when shopping audience is unset',()=>{
 const taste={prefer:[],avoid:[]};
 const male=dailyRequirementsFor('2026-10-12',{gender:'male'},taste,undefined);
 const female=dailyRequirementsFor('2026-10-12',{gender:'female'},taste,undefined);
 expect(male.every(pick=>pick.requirements.audience==='men')).toBe(true);
 expect(female.every(pick=>pick.requirements.audience==='women')).toBe(true);
 expect(dailyRequirementsFor('2026-10-12',{gender:'male',audience:'unisex'},taste,undefined)[0].requirements.audience).toBe('unisex');
 expect(dailyContextKey({gender:'male'},taste,undefined)).not.toBe(dailyContextKey({gender:'female'},taste,undefined));
 const maleRequirements=male[0].requirements;
 expect(matchesOption({...option,title:'Women\'s Blue Cotton Shirt'},maleRequirements)).toBe(false);
 expect(matchesOption({...option,title:'Men\'s Blue Cotton Shirt'},maleRequirements)).toBe(true);
});
test('saved items build positive style signals and repeated passes build cautious avoid signals',()=>{
 const saved=[{...option,colour:'navy',fabric:'cotton',attributes:['fit: relaxed']},{...option,url:'https://www.flipkart.com/blue/p/two',colour:'navy',fabric:'linen'}];
 const onePass=[{option:{url:'https://www.flipkart.com/red/p/one',colour:'red',fabric:'wool',attributes:['pattern: floral']}}];
 const repeatedPass=[...onePass,{option:{url:'https://www.flipkart.com/red/p/two',colour:'red',fabric:'wool',attributes:['pattern: floral']}}];
 expect(dailyTaste({prefer:['minimal'],avoid:[]},saved,onePass)).toEqual({prefer:['minimal','navy','cotton','relaxed','linen'],avoid:[]});
 expect(dailyTaste({prefer:[],avoid:['neon']},[],repeatedPass).avoid).toEqual(['neon','red','wool','floral']);
 expect(dailyTaste({prefer:[],avoid:[]},[{...saved[0],colour:'red',fabric:'wool',attributes:['pattern: floral']}],repeatedPass).avoid).toEqual([]);
});
test('price drop requires same listing attributes and dated non-starting observations',()=>{
 const fresh={...option,price:400,observedAt:2000};expect(listedDrop(option,fresh,2000)?.previousPrice).toBe(500);
 expect(listedDrop(option,{...fresh,priceFrom:true},2000)).toBeNull();expect(listedDrop(option,{...fresh,colour:'red'},2000)).toBeNull();expect(listedDrop(option,{...fresh,source:'listing'},2000)).toBeNull();expect(listedDrop(option,fresh,1000000)).toBeNull();
});
async function setup(){vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-12T04:00:00Z'));const t=convexTest(schema,modules);workflow.register(t);const alice=t.withIdentity({subject:'alice'}),bob=t.withIdentity({subject:'bob'});const profile=await t.run(async ctx=>{const id=await ctx.db.insert('profiles',{owner:'alice',preferences:{name:'Alex',age:28,gender:'undisclosed',audience:'unisex',language:'en',size:'M',jeansSize:'32',budgetPaise:200000},taste:{prefer:['minimal'],avoid:['neon']},updatedAt:Date.now()});await ctx.db.insert('wardrobeStyles',{owner:'alice',details:{bodyDescription:'',fitPreferences:'straight',stylePreferences:'relaxed classic',avoid:'synthetic'},updatedAt:Date.now()});return id;});return {t,alice,bob,profile};}
test('daily opt-in queues one feed only, keeps it private, and stopping invalidates completion',async()=>{
 const {t,alice,bob}=await setup();await expect(t.mutation(api.dailyFeed.setEnabled,{enabled:true})).rejects.toThrow('sign in');
 await expect(bob.mutation(api.dailyFeed.setEnabled,{enabled:true})).rejects.toThrow('style setup');
 await alice.mutation(api.dailyFeed.setEnabled,{enabled:true});await t.mutation(internal.dailyFeed.dispatch,{});
 let data=await alice.query(api.dailyFeed.current,{});expect(data.enabled).toBe(true);expect(data.feed?.state).toBe('building');expect((await bob.query(api.dailyFeed.current,{})).feed).toBeNull();
 await alice.mutation(api.dailyFeed.setEnabled,{enabled:true});await t.mutation(internal.dailyFeed.dispatch,{});
 const feeds=await t.run(ctx=>ctx.db.query('dailyFeeds').withIndex('by_owner_day',q=>q.eq('owner','alice')).take(10));expect(feeds).toHaveLength(1);
 await alice.mutation(api.dailyFeed.setEnabled,{enabled:false});
 await t.mutation(internal.dailyFeed.finish,{id:feeds[0]._id,options:[option],drops:[],stores:[],failed:false,note:'checked'});
 data=await alice.query(api.dailyFeed.current,{});expect(data.enabled).toBe(false);expect(data.feed?.state).toBe('paused');expect(data.feed?.options).toEqual([]);
});
test('next daily plan combines settings, saved products, repeated passes, and prior picks',async()=>{
 const {t}=await setup();
 const historical=await t.run(async ctx=>{
  const subscriptionId=await ctx.db.insert('dailySubscriptions',{owner:'alice',enabled:true,nextAt:Date.now(),updatedAt:Date.now()});
  const prior={...option,url:'https://www.flipkart.com/previous/p/item'};
  await ctx.db.insert('dailyFeeds',{owner:'alice',day:'2026-10-11',subscriptionId,needKey:'old',requirements,taste:{prefer:[],avoid:[]},state:'ready',options:[prior],drops:[],stores:[],note:'Previous picks',startedAt:Date.now()});
  const liked={...option,url:'https://www.flipkart.com/saved/p/item',colour:'navy',fabric:'cotton',attributes:['fit: relaxed']};
  await ctx.db.insert('savedProducts',{owner:'alice',option:liked,savedAt:Date.now()});
  for(const [n,colour,fabric] of [[1,'red','wool'],[2,'red','wool']] as const)await ctx.db.insert('dailyPickFeedback',{owner:'alice',kind:'pass',option:{...option,url:`https://www.flipkart.com/passed/p/${n}`,colour,fabric,attributes:['pattern: floral']},createdAt:Date.now()+n});
  return {prior,liked};
 });
 await t.mutation(internal.dailyFeed.dispatch,{});
 const feed=await t.run(ctx=>ctx.db.query('dailyFeeds').withIndex('by_owner_day',q=>q.eq('owner','alice').eq('day','2026-10-12')).unique());
 const plan=await t.query(internal.dailyFeed.plan,{id:feed!._id});
 expect(plan?.picks[0].requirements.audience).toBe('unisex');
 expect(plan?.picks[0].taste.prefer).toEqual(expect.arrayContaining(['navy','cotton','relaxed']));
 expect(plan?.picks[0].taste.avoid).toEqual(expect.arrayContaining(['red','wool','floral']));
 expect(plan?.excludeUrls).toEqual(expect.arrayContaining([historical.prior.url,historical.liked.url,'https://www.flipkart.com/passed/p/1','https://www.flipkart.com/passed/p/2']));
});
test('daily job uses preferences, is private, and hides recommendations when style changes',async()=>{
 const {t,alice,bob,profile}=await setup();await t.run(ctx=>ctx.db.patch(profile,{preferences:{name:'Alex',age:28,gender:'male',language:'en',size:'M',jeansSize:'32',budgetPaise:200000}}));await alice.mutation(api.dailyFeed.setEnabled,{enabled:true});await t.mutation(internal.dailyFeed.dispatch,{});
 const feed=await t.run(ctx=>ctx.db.query('dailyFeeds').withIndex('by_owner_day',q=>q.eq('owner','alice')).unique());
 const plan=await t.query(internal.dailyFeed.plan,{id:feed!._id});expect(plan?.picks).toHaveLength(3);expect(plan?.picks.every(pick=>pick.requirements.audience==='men')).toBe(true);expect(plan?.picks[0].taste.prefer).toContain('relaxed classic');
 const passedOption={...option,url:'https://www.flipkart.com/blue/p/two',title:'Men\'s Blue Cotton Shirt',category:'shirt'};
 await t.mutation(internal.dailyFeed.finish,{id:feed!._id,options:[{...option,category:'shirt'},passedOption],drops:[],stores:[],failed:false,note:'checked'});
 expect((await alice.query(api.dailyFeed.current,{})).feed?.options).toHaveLength(2);
 await expect(bob.mutation(api.savedProducts.saveDaily,{feedId:feed!._id,url:option.url})).rejects.toThrow('own daily edit');
 await alice.mutation(api.savedProducts.saveDaily,{feedId:feed!._id,url:option.url});expect((await alice.query(api.savedProducts.list,{}))[0].option.price).toBe(500);
 await alice.mutation(api.dailyFeed.recordPass,{feedId:feed!._id,url:passedOption.url});
 expect((await alice.query(api.dailyFeed.current,{})).changed).toBe(false);
 await t.run(ctx=>ctx.db.patch(profile,{taste:{prefer:['bold'],avoid:['neon']}}));
 const data=await alice.query(api.dailyFeed.current,{});expect(data.changed).toBe(true);expect(data.feed?.options).toEqual([]);
});
