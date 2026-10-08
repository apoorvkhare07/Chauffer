import {convexTest} from 'convex-test';
import workflow from '@convex-dev/workflow/test';
import {test,expect,vi,afterEach} from 'vitest';
import schema from './schema';
import {api,internal} from './_generated/api';
import {amazonOptions} from './storeExtractors';
import {productOption} from './liveDiscovery';
const modules=import.meta.glob('./**/*.ts');
afterEach(()=>{vi.restoreAllMocks();vi.clearAllTimers();vi.useRealTimers();});
const urls=Array.from({length:6},(_,i)=>`https://www.flipkart.com/cotton-kurta/p/test-${i}`);
function mockStores(){vi.spyOn(globalThis,'fetch').mockImplementation(async input=>{
 const url=String(input);if(url.includes('amazon.in'))return new Response('Unavailable',{status:503});
 if(url.includes('/search?'))return new Response(`<script type="application/ld+json">${JSON.stringify({'@type':'ItemList',itemListElement:urls.map(url=>({url}))})}</script>`);
 return new Response(`<script type="application/ld+json">${JSON.stringify({'@type':'Product',name:'Women Cotton Kurta',color:'Blue',image:'https://rukmini1.flixcart.com/image/preview.jpg',offers:{price:500,priceCurrency:'INR',availability:'https://schema.org/InStock'}})}</script><table><tr><td>Fabric</td><td>Cotton</td></tr></table>`);
});}
test('saved profile seeds discovery; shared workflow saves results privately and avoids repeats',async()=>{
 vi.useFakeTimers();mockStores();const t=convexTest(schema,modules);workflow.register(t);
 const alice=t.withIdentity({subject:'alice',issuer:'https://test.chauffeur'}),bob=t.withIdentity({subject:'bob',issuer:'https://test.chauffeur'});
 await expect(t.mutation(api.conversations.post,{text:'hi'})).rejects.toThrow('sign in');
 await alice.mutation(api.profiles.save,{preferences:{size:'L',budgetPaise:200000,language:'en'}});
 await alice.mutation(api.conversations.post,{text:'kurta'});
 expect((await alice.query(api.conversations.current,{})).requirements).toMatchObject({category:'kurta',size:'L',budget:2000});
 expect((await alice.query(api.conversations.current,{})).pending).toBe(true);
 await expect(alice.mutation(api.conversations.post,{text:'show more options'})).rejects.toThrow('already running');
 await t.finishAllScheduledFunctions(vi.runAllTimers);
 const first=await alice.query(api.conversations.current,{});expect(first.pending).toBe(false);expect(first.messages.at(-1)?.result?.options).toHaveLength(3);
 expect(first.messages.at(-1)?.result?.options[0].imageUrl).toContain('flixcart.com');
 expect((await bob.query(api.conversations.current,{})).messages).toHaveLength(1);
 const rejected=first.messages.at(-1)!.result!.options[0].url;
 await alice.mutation(api.conversations.post,{text:'Not this one: Red silk kurta under 500 size S',rejectUrl:rejected});
 expect((await alice.query(api.conversations.current,{})).requirements).toMatchObject({size:'L',budget:2000});
 await alice.mutation(api.conversations.post,{text:'None of these'});
 expect((await alice.query(api.conversations.current,{})).messages.at(-1)?.text).toContain('What should I change');
 await alice.mutation(api.conversations.post,{text:'Show more options'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const second=(await alice.query(api.conversations.current,{})).messages.at(-1)!.result!.options;expect(second).toHaveLength(3);expect(second.every(o=>!first.messages.at(-1)!.result!.options.some(p=>p.url===o.url))).toBe(true);
 // Refining allows previously seen options, but never a explicitly rejected product.
 await alice.mutation(api.conversations.post,{text:'blue size M under 1000'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const refined=await alice.query(api.conversations.current,{});expect(refined.requirements).toMatchObject({size:'M',budget:1000,colour:'blue'});expect(refined.messages.at(-1)!.result!.options.some(o=>o.url===rejected)).toBe(false);
 await expect(bob.mutation(api.conversations.post,{text:'Not this one',rejectUrl:rejected})).rejects.toThrow('Choose a product');
 await alice.mutation(api.conversations.post,{text:'reset'});const reset=await alice.query(api.conversations.current,{});expect(reset.messages).toHaveLength(1);expect(reset.requirements).toEqual({size:'L',budget:2000});
});
test('older search completion cannot change a new conversation',async()=>{
 const t=convexTest(schema,modules);const user=t.withIdentity({subject:'alice',issuer:'https://test.chauffeur'});await user.mutation(api.conversations.post,{text:'hi'});
 const c=await t.run(ctx=>ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key','web:alice')).unique());
 await user.mutation(api.conversations.post,{text:'reset'});
 expect(await t.mutation(internal.conversations.complete,{conversationId:c!._id,revision:c!.revision,error:'old error'})).toBeNull();
 expect((await user.query(api.conversations.current,{})).messages).toHaveLength(1);
});
test('product previews stay attached to their own result; unrelated image hosts are excluded',()=>{
 const html=`<div data-component-type="s-search-result" data-asin="B012345678"><h2>Women Blue Cotton Kurta</h2><span class="a-price"><span class="a-offscreen">₹500</span></span><img class="s-image" src="https://m.media-amazon.com/images/item.jpg"/></div>`;
 expect(amazonOptions(html,{category:'kurta',budget:1000},1)[0].imageUrl).toContain('m.media-amazon.com');
 expect(amazonOptions(html,{category:'kurta',budget:1000},1,['https://www.amazon.in/dp/B012345678'])).toEqual([]);
 const product=(image:string)=>`<script type="application/ld+json">${JSON.stringify({'@type':'Product',name:'Kurta',image,offers:{price:500,priceCurrency:'INR',availability:'https://schema.org/InStock'}})}</script>`;
 expect(productOption(product('https://unrelated.example/image.jpg'),urls[0],1)?.imageUrl).toBeUndefined();
});
