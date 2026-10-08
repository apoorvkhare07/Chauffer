// @vitest-environment node
import {test,expect,vi,afterEach} from 'vitest';
import {amazonOptions,meeshoOptions} from './storeExtractors';
import {discoverAcrossStores} from './liveDiscovery';
import {allowedProductUrl,nextRequest,optionsReply} from './discoveryRules';
const r={category:'kurta',budget:1000,colour:'blue',fabric:'cotton',size:'M'};
afterEach(()=>vi.restoreAllMocks());
const catalog={valid:true,hero_pid:123,original_product_id:123,hero_product_name:'Women Blue Cotton Straight Kurta',slug:'women-blue-kurta',product_id:'abc123',full_details:'Fabric: Cotton\nColor: Blue',app_event_data:{competitive_pricing:{input_product_id:123,input_product_price:400}},min_catalog_price:100};
test('Meesho uses the exact hero product price and links, marks listing/variant uncertainty, rejects unrelated catalogue prices',()=>{
 expect(meeshoOptions({catalogs:[catalog]},r,1)).toEqual([{title:catalog.hero_product_name,url:'https://www.meesho.com/women-blue-kurta/p/abc123',price:400,colour:'Blue',fabric:'Cotton',observedAt:1,store:'Meesho',source:'listing',priceFrom:true}]);
 expect(meeshoOptions({catalogs:[{...catalog,app_event_data:{competitive_pricing:{input_product_id:999,input_product_price:100}}},{...catalog,valid:false},{...catalog,slug:'https://evil.test'}]},r,1)).toEqual([]);
 expect(meeshoOptions({catalogs:[{...catalog,full_details:'Fabric: Rayon\nColor: Red'}]},r,1)).toEqual([]);
});
test('Amazon extracts each search row independently and cannot treat a challenge or a crossed-out price as a product',()=>{
 const html='<div data-component-type="s-search-result" data-asin="B012345678"><h2>Brand name</h2><h2>Women Blue Cotton Kurta</h2><span class="a-price a-text-price"><span class="a-offscreen">₹2,000</span></span><span class="a-price"><span class="a-offscreen">₹599</span></span></div>';
 expect(amazonOptions(html,r,1)[0]).toMatchObject({store:'Amazon',price:599,url:'https://www.amazon.in/dp/B012345678',priceFrom:true,source:'listing'});
 expect(amazonOptions('<h1>Robot check</h1>',r,1)).toEqual([]);
 expect(allowedProductUrl('https://www.amazon.in.evil.test/dp/B012345678')).toBe(false);
 expect(allowedProductUrl('https://www.meesho.com/search?q=kurta')).toBe(false);
});
test('search attempts only Flipkart and Amazon; one blocked store does not discard another store’s results',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async url=>{
  if(new URL(String(url)).hostname==='www.amazon.in')return new Response('<div data-component-type="s-search-result" data-asin="B012345678"><h2>Brand</h2><h2>Women Blue Cotton Kurta</h2><span class="a-price"><span class="a-offscreen">₹599</span></span></div>');
  return new Response('Unavailable',{status:503});
 });
 const result=await discoverAcrossStores(r);
 expect(result.failed).toBe(false);expect(result.options).toHaveLength(1);
 expect(result.stores.map(s=>[s.store,s.status])).toEqual([['Flipkart','unavailable'],['Amazon','matched']]);
 expect(new URL(result.stores[1].searchUrl).searchParams.get('k')).toBe('blue cotton kurta women');
 expect(fetch.mock.calls.map(([url])=>new URL(String(url)).hostname).sort()).toEqual(['www.amazon.in','www.flipkart.com']);
});
test('chat accumulates separate answers, clears refinements explicitly and does not search on thanks',()=>{
 const category=nextRequest('kurta'),budget=nextRequest('under ₹1,000',category.requirements),ready=nextRequest('M',budget.requirements);
 expect(ready.search).toBe(true);expect(ready.reply).toContain('Flipkart and Amazon');
 const refined=nextRequest('blue pure cotton',ready.requirements);expect(refined.requirements.fabric).toBe('pure cotton');
 expect(nextRequest('any colour any fabric',refined.requirements).requirements).toEqual(ready.requirements);
 expect(nextRequest('thanks',ready.requirements).search).toBe(false);
});

test('multi-store WhatsApp replies preserve complete product links and disclosures within the message limit',()=>{
 const options=Array.from({length:9},(_,i)=>({title:'Women Blue Cotton Kurta '.repeat(9),url:`https://www.flipkart.com/${'long-product-name-'.repeat(15)}${i}/p/test`,price:400,colour:'Blue',fabric:'Pure Cotton',observedAt:1}));
 const reply=optionsReply(options,r);expect(reply.length).toBeLessThan(3500);expect(reply).toContain("won't place orders");expect(reply).toContain("availability hasn't been verified");expect(reply).toContain(options[0].url);
});
