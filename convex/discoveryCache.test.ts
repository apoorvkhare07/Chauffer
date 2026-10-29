import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import schema from './schema';
import {internal} from './_generated/api';
import {storeSearchUrl} from './marketplaces';
import {discoverWithZyte,zyteListingPool,type ListingCacheEntry} from './zyteDiscovery';
const modules=import.meta.glob('./**/*.ts');
const requirements={category:'shirt',audience:'men' as const,budget:2000,colour:'blue'};
const brief={version:2 as const,route:'discover' as const,recipient:'self' as const,requirements,taste:{prefer:[],avoid:[]},goal:'Blue shirt',language:'en',memoryIds:[],wardrobeRequested:false,excludeShown:false,hardFields:[]};
const raw=(n:number)=>({name:'Men blue cotton shirt',url:`https://www.myntra.com/${1000+n}`,price:String(600+n),currency:'INR',mainImage:{url:'https://assets.myntassets.com/shirt.jpg'}});
const pool=()=>zyteListingPool({productList:{products:Array.from({length:30},(_,i)=>raw(i))}},'Myntra',Date.now()-90000);
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
async function setup(){const t=convexTest(schema,modules);const ids=await t.run(async ctx=>{const c=await ctx.db.insert('conversations',{key:'web:cache-owner',requirements,revision:1,session:1,pending:true,inputText:'show more options',updatedAt:Date.now(),shownUrls:[],rejectedUrls:[]});const task=await ctx.db.insert('recommendationTasks',{owner:'cache-owner',conversationId:c,session:1,revision:1,architecture:2,status:'retrieving',createdAt:Date.now(),deadlineAt:Date.now()+115000,memoryRevision:0,personalisation:false,brief,steps:[],reserved:[],reservedTokens:0,imageBytes:0,imageCount:0});return {c,task};});return {t,...ids};}
test('store pool retains ten products and unshown products are reused without fetching',async()=>{
 vi.stubEnv('ZYTE_API_KEY','test');const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({productList:{products:Array.from({length:30},(_,i)=>raw(i))}})));
 const entries:ListingCacheEntry[]=[];const cache={entries,save:async(store:any,options:any,readable:boolean)=>{entries.push({store,options,readable,searchUrl:storeSearchUrl(store,requirements,false),expiresAt:Date.now()+1800000});}};
 const first=await discoverWithZyte(requirements,[],['Myntra'],Date.now()+40000,cache);expect(first.options).toHaveLength(10);expect(entries[0].options).toHaveLength(10);
 const second=await discoverWithZyte({...requirements,occasion:'Everyday wear'},first.options.slice(0,6).map(o=>o.url),['Myntra'],Date.now()+40000,cache);
 expect(second.options).toHaveLength(4);expect(fetch).toHaveBeenCalledTimes(1);expect(second.options[0].observedAt).toBe(first.options[6].observedAt);
});
test('cached pool keeps original timestamps, remains private to conversation/session, rejects late writes and expires',async()=>{
 const {t,c,task}=await setup();await t.mutation(internal.discoveryCache.put,{taskId:task,store:'Myntra',options:pool(),readable:true});const entries=await t.query(internal.discoveryCache.read,{taskId:task});expect(entries[0].options).toHaveLength(10);expect(entries[0].options[0].observedAt).toBeLessThan(Date.now()-80000);
 await t.run(ctx=>ctx.db.patch(task,{owner:'other'}));expect(await t.query(internal.discoveryCache.read,{taskId:task})).toEqual([]);
 await t.run(async ctx=>{await ctx.db.patch(task,{owner:'cache-owner'});await ctx.db.patch(c,{session:2,revision:2});});expect(await t.query(internal.discoveryCache.read,{taskId:task})).toEqual([]);
 await t.mutation(internal.discoveryCache.put,{taskId:task,store:'Myntra',options:[],readable:false});
 await t.run(async ctx=>{await ctx.db.patch(c,{session:1,revision:1});const row=await ctx.db.query('discoveryCache').withIndex('by_session_store',q=>q.eq('conversationId',c).eq('session',1).eq('store','Myntra')).unique();expect(row?.options).toHaveLength(10);await ctx.db.patch(row!._id,{expiresAt:Date.now()-1});});
 expect(await t.query(internal.discoveryCache.read,{taskId:task})).toEqual([]);await t.mutation(internal.discoveryCache.cleanup,{});expect(await t.run(ctx=>ctx.db.query('discoveryCache').withIndex('by_expiry').take(10))).toEqual([]);
});
test('changed query misses the cache; budget/soft refinements reuse public facts and reapply hard matching',async()=>{
 const {t,task}=await setup();await t.mutation(internal.discoveryCache.put,{taskId:task,store:'Myntra',options:pool(),readable:true});
 await t.run(ctx=>ctx.db.patch(task,{brief:{...brief,requirements:{...requirements,colour:'white'}}}));expect(await t.query(internal.discoveryCache.read,{taskId:task})).toEqual([]);
 await t.run(ctx=>ctx.db.patch(task,{brief:{...brief,requirements:{...requirements,budget:605,fit:'relaxed'}}}));const entries=await t.query(internal.discoveryCache.read,{taskId:task});const fetch=vi.spyOn(globalThis,'fetch');
 const found=await discoverWithZyte({...requirements,budget:605},[],['Myntra'],Date.now()+40000,{entries,save:async()=>{}});expect(found.options).toHaveLength(6);expect(found.options.every(o=>o.price<=605)).toBe(true);expect(fetch).not.toHaveBeenCalled();
});
test('real discovery action takes cache path with no planner or merchant call',async()=>{
 vi.stubEnv('ZYTE_API_KEY','test');const {t,task,c}=await setup();const options=pool();await t.mutation(internal.discoveryCache.put,{taskId:task,store:'Myntra',options,readable:true});await t.run(ctx=>ctx.db.patch(c,{excludeShown:true,shownUrls:options.slice(0,6).map(o=>o.url)}));const fetch=vi.spyOn(globalThis,'fetch');
 const found=await t.action(internal.recommendationAgents.discover,{taskId:task,attempt:0,usedStores:[],need:[]});expect(found.pool).toHaveLength(4);expect(found.cacheHit).toBe(true);expect(fetch).not.toHaveBeenCalled();expect((await t.run(ctx=>ctx.db.get(task)))?.steps[0].status).toBe('cache');
});
test('background recovery can finish after first response, but stops on new turn or cancellation',async()=>{
 const {t,c,task}=await setup();await t.run(ctx=>ctx.db.patch(task,{status:'ready'}));
 expect(await t.query(internal.discoveryCache.recoveryContext,{taskId:task})).toMatchObject({requirements});
 await t.mutation(internal.discoveryCache.put,{taskId:task,store:'Myntra',options:pool(),readable:true});expect(await t.query(internal.discoveryCache.read,{taskId:task})).toHaveLength(1);
 await t.run(ctx=>ctx.db.patch(c,{revision:2}));expect(await t.query(internal.discoveryCache.recoveryContext,{taskId:task})).toBeNull();
 await t.run(async ctx=>{await ctx.db.patch(c,{revision:1});await ctx.db.patch(task,{status:'cancelled'});});expect(await t.query(internal.discoveryCache.recoveryContext,{taskId:task})).toBeNull();
});
test('second pass waits for fresh evidence instead of returning the candidates already rejected',async()=>{
 vi.stubEnv('ZYTE_API_KEY','test');const {t,task}=await setup();const options=pool();
 const {evidencePool}=await import('./recommendationRules');
 await t.mutation(internal.discoveryCache.put,{taskId:task,store:'Myntra',options,readable:true});
 await t.run(ctx=>ctx.db.patch(task,{pool:evidencePool(options,requirements).map(p=>({...p,imageInspected:true,colourMatch:'mismatch' as const,conflicts:['Wrong colour']}))}));
 const search=t.action(internal.recommendationAgents.discover,{taskId:task,attempt:1,usedStores:['Myntra'],need:['Fresh purple candidates']});
 await new Promise(resolve=>setTimeout(resolve,80));
 await t.mutation(internal.discoveryCache.put,{taskId:task,store:'Myntra',options:[...options.slice(0,9),{...options[0],url:'https://www.myntra.com/99999'}],readable:true});
 const found=await search;expect(found.pool.map(p=>p.option.url)).toEqual(['https://www.myntra.com/99999']);
});
