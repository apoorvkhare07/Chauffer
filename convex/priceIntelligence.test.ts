import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import schema from './schema';
import {api,internal} from './_generated/api';
import {identityKind,readAdvertisedOffers} from './priceIntelligenceRules';
const modules=import.meta.glob('./**/*.ts');
const option={title:'Women cotton kurta',url:'https://www.flipkart.com/kurta/p/one',price:800,colour:'white',fabric:'cotton',observedAt:Date.now(),store:'Flipkart' as const};
afterEach(()=>vi.restoreAllMocks());
test('offer extraction separates cashback and conditional terms and rejects unrelated/hidden markup',()=>{
 const html='<script>Flat ₹999 off</script><p hidden>Bank offer ₹900 off</p><p>10% cashback up to ₹100</p><li>Bank offer 10% off on ABC cards, minimum ₹1000</li><p>Popular clothes</p>';
 const terms=readAdvertisedOffers(html,option.url);expect(terms).toHaveLength(2);expect(terms.map(x=>x.kind)).toEqual(['cashback','conditional']);expect(readAdvertisedOffers(html,'https://evil.example/p/a')).toEqual([]);
});
test('matching titles, images and marketplace SKU cannot establish manufacturer identity',()=>{
 expect(identityKind(option,{...option})).toBe('alternative');expect(identityKind({...option,brand:' A ',manufacturerCode:'Code 1'},{...option,brand:'a',manufacturerCode:'code 1'})).toBe('same_product');expect(identityKind({...option,brand:'a',manufacturerCode:'1'},{...option,brand:'a',manufacturerCode:'2'})).toBe('alternative');
});
test('price intelligence is private, ignores deleted sources and cleans up with saved product',async()=>{
 const t=convexTest(schema,modules),alice=t.withIdentity({subject:'alice'}),bob=t.withIdentity({subject:'bob'});
 const id=await t.run(ctx=>ctx.db.insert('savedProducts',{owner:'alice',option,savedAt:Date.now()}));
 const report={checkedAt:Date.now(),status:'unavailable' as const,note:'Unavailable',offers:[],matches:[],gaps:['Shipping unknown']};
 await t.mutation(internal.priceIntelligence.record,{id,owner:'alice',report});expect(await alice.query(api.priceIntelligence.get,{id})).toEqual(report);await expect(bob.query(api.priceIntelligence.get,{id})).rejects.toThrow('unavailable');
 await alice.mutation(api.savedProducts.remove,{id});await t.mutation(internal.priceIntelligence.record,{id,owner:'alice',report});expect(await t.run(ctx=>ctx.db.query('priceIntelligence').withIndex('by_saved',q=>q.eq('savedId',id)).take(1))).toEqual([]);
});
test('unreadable live pages keep the old dated price and produce no invented offers',async()=>{
 const t=convexTest(schema,modules),alice=t.withIdentity({subject:'alice'});const id=await t.run(ctx=>ctx.db.insert('savedProducts',{owner:'alice',option,savedAt:Date.now()}));vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('challenge',{status:403}));
 expect(await alice.action(api.priceIntelligenceWorker.check,{id})).toBe('unavailable');expect((await alice.query(api.savedProducts.list,{}))[0].option.price).toBe(800);expect(await alice.query(api.priceIntelligence.get,{id})).toMatchObject({status:'unavailable',offers:[],matches:[]});
});
test('fresh offer terms and other-store identity matches remain separate from delivered-price proof',async()=>{
 const t=convexTest(schema,modules),alice=t.withIdentity({subject:'alice'});const id=await t.run(ctx=>ctx.db.insert('savedProducts',{owner:'alice',option,savedAt:Date.now()}));
 const product=(price:number)=>`<script type="application/ld+json">${JSON.stringify({'@type':'Product',name:'Women cotton kurta',brand:'Brand A',mpn:'Style-1',color:'white',offers:{priceCurrency:'INR',price,availability:'https://schema.org/InStock'}})}</script><li>Bank offer 10% off on ABC cards, minimum ₹1000</li>`;
 vi.spyOn(globalThis,'fetch').mockImplementation(async input=>new Response(String(input).includes('amazon.in/s?')?'<div data-component-type="s-search-result" data-asin="B123456789"><h2>Women cotton kurta</h2><span class="a-price"><span class="a-offscreen">₹700</span></span></div>':product(String(input).includes('amazon.in/dp/')?700:800)));
 expect(await alice.action(api.priceIntelligenceWorker.check,{id})).toBe('checked');const report=await alice.query(api.priceIntelligence.get,{id});expect(report?.offers[0].kind).toBe('conditional');expect(report?.matches[0].identity).toBe('same_product');expect(report?.gaps.join(' ')).toContain('Shipping');expect(report).not.toHaveProperty('savingPaise');
});
