import {convexTest} from 'convex-test';
import {test,expect,vi,afterEach} from 'vitest';
import schema from './schema';
import {api,internal} from './_generated/api';
const modules=import.meta.glob('./**/*.ts');
afterEach(()=>vi.restoreAllMocks());
test('web search requires sign-in and validates requirements before external access',async()=>{
 const t=convexTest(schema,modules);const fetch=vi.spyOn(globalThis,'fetch');
 await expect(t.action(api.liveDiscovery.webSearch,{requirements:{category:'kurta',budget:1000}})).rejects.toThrow('sign in');
 const user=t.withIdentity({subject:'alice',issuer:'https://test.chauffeur'});
 await expect(user.action(api.liveDiscovery.webSearch,{requirements:{category:'kurta',budget:-1}})).rejects.toThrow('budget');
 expect(fetch).not.toHaveBeenCalled();
});
test('web search returns the shared live results and completes its search claim',async()=>{
 const t=convexTest(schema,modules);const user=t.withIdentity({subject:'alice',issuer:'https://test.chauffeur'});const url='https://www.flipkart.com/test-kurta/p/test?pid=TEST';
 vi.spyOn(globalThis,'fetch').mockImplementation(async input=>new Response(String(input).includes('/search?')?`<script type="application/ld+json">${JSON.stringify([{'@type':'ItemList',itemListElement:[{url}]}])}</script>`:`<script type="application/ld+json">${JSON.stringify([{'@type':'Product',name:'Women Straight Kurta',color:'Blue',offers:{price:500,priceCurrency:'INR',availability:'https://schema.org/InStock'}}])}</script><table><tr><td>Fabric</td><td>Pure Cotton</td></tr></table>`));
 const result=await user.action(api.liveDiscovery.webSearch,{requirements:{category:'kurta',budget:1000,colour:'blue',fabric:'cotton',size:'M'}});
 expect(result.failed).toBe(false);expect(result.options[0]).toMatchObject({url,price:500,fabric:'Pure Cotton'});
 const row=await t.run(ctx=>ctx.db.query('webSearchRuns').withIndex('by_owner',q=>q.eq('owner','alice')).first());expect(row?.finishedAt).toBeDefined();
});
test('web searches are limited per user and store failures remain honest, with no diagnostic leak',async()=>{
 const t=convexTest(schema,modules);const user=t.withIdentity({subject:'alice',issuer:'https://test.chauffeur'});
 vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('Blocked',{status:503}));
 expect(await user.action(api.liveDiscovery.webSearch,{requirements:{category:'kurta',budget:1000}})).toMatchObject({options:[],failed:true,stores:[{store:'Flipkart',status:'unavailable'},{store:'Amazon',status:'unavailable'},{store:'Meesho',status:'unavailable'}]});
 const claim=await t.mutation(internal.webDiscovery.claim,{owner:'alice'});
 await expect(t.mutation(internal.webDiscovery.claim,{owner:'alice'})).rejects.toThrow('already running');
 expect(await t.mutation(internal.webDiscovery.claim,{owner:'bob'})).toBeDefined();
 await t.mutation(internal.webDiscovery.finish,{id:claim});
});
