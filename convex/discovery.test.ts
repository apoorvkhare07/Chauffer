// @vitest-environment node
import { expect,test,afterEach,vi } from 'vitest';
import { nextRequest,matchesOption,optionsReply } from './discoveryRules';
import { listingUrls,productOption,discover } from './liveDiscovery';
import { validSignature,parsePayload } from './whatsappProtocol';
afterEach(()=>vi.restoreAllMocks());
test('one question at a time, requirements accumulate, reset clears them, purchase requests are refused',()=>{
 const greeting=nextRequest('hi');expect(greeting.search).toBe(false);
 const type=nextRequest('blue cotton kurta',greeting.requirements);expect(type.reply).toContain('maximum budget');
 const budget=nextRequest('1000',type.requirements);expect(budget.reply).toContain('size');
 const ready=nextRequest('M',budget.requirements);expect(ready.search).toBe(true);expect(ready.requirements).toEqual({category:'kurta',colour:'blue',fabric:'cotton',budget:1000,size:'M'});
 expect(nextRequest('blue cotton kurta M under 1,000').search).toBe(true);
 expect(nextRequest('reset',ready.requirements).requirements).toEqual({});
 expect(nextRequest('buy it',ready.requirements).search).toBe(false);
 expect(nextRequest('under 50').reply).toContain('₹100');
});
const url='https://www.flipkart.com/test-kurta/p/test?pid=TEST';
const option={title:'Women Straight Kurta',url,price:500,colour:'Dark Blue',fabric:'Cotton Blend',observedAt:1};
test('reject wrong category, price, colour, pure-cotton substitution and unsafe links; disclose size uncertainty',()=>{
 const r={category:'kurta',budget:1000,size:'M',colour:'blue',fabric:'cotton'};
 expect(matchesOption(option,r)).toBe(true);
 for(const o of [{...option,price:1001},{...option,colour:'Pink'},{...option,title:'Women Top'},{...option,url:'https://evil.test/p/test'}])expect(matchesOption(o,r)).toBe(false);
 expect(matchesOption(option,{...r,fabric:'pure cotton'})).toBe(false);
 expect(optionsReply([option],r)).toContain("availability hasn't been verified");
});
const ld=(x:unknown)=>`<script type="application/ld+json">${JSON.stringify(x)}</script>`;
function productHtml(){return ld([{ '@type':'Product',name:option.title,sku:'TEST',color:option.colour,offers:{price:500,priceCurrency:'INR',availability:'https://schema.org/InStock'}}])+`<script id="is_script">window.__INITIAL_STATE__ = ${JSON.stringify({recommendation:{tracking:{productId:'OTHER',widgetType:'atlas_product_details'},value:{label_0:{value:{text:'Fabric'}},label_1:{value:{text:['Silk']}}}},product:{tracking:{productId:'TEST',widgetType:'atlas_product_details'},value:{label_0:{value:{text:'Fabric'}},label_1:{value:{text:['Cotton Blend']}}}}})};</script>`;}
test('live extraction uses merchant data and scopes fabric to the actual product, never recommendations',()=>{
 expect(listingUrls(ld([{'@type':'ItemList',itemListElement:[{url},{url:'https://evil.test/p/test'},{url}]}]))).toEqual([url]);
 expect(productOption(productHtml(),url,1)).toEqual({...option,attributes:['Fabric: Cotton Blend']});
 expect(productOption(productHtml().replace('InStock','OutOfStock'),url,1)).toBeNull();
 expect(productOption('<h1>Blocked</h1>',url,1)).toBeNull();
});
test('discovery fetches fresh search and product pages; does not return sample products on access failure',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async input=>new Response(String(input).includes('/search?')?ld([{'@type':'ItemList',itemListElement:[{url}]}]):productHtml()));
 expect(await discover({category:'kurta',budget:1000,colour:'blue',fabric:'cotton'})).toHaveLength(1);expect(fetch).toHaveBeenCalledTimes(2);
 fetch.mockResolvedValue(new Response('Unavailable',{status:503}));await expect(discover({category:'kurta',budget:1000})).rejects.toThrow('Store unavailable');
});
test('Flipkart cannot report no matches when every product page is refused or unreadable',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async input=>String(input).includes('/search?')?new Response(ld({'@type':'ItemList',itemListElement:[{url}]})):new Response('Access refused',{status:403}));
 await expect(discover({category:'kurta',budget:1000})).rejects.toThrow('product details unavailable');
 fetch.mockImplementation(async input=>new Response(String(input).includes('/search?')?ld({'@type':'ItemList',itemListElement:[{url}]}):'<h1>Robot check</h1>'));
 await expect(discover({category:'kurta',budget:1000})).rejects.toThrow('product details unavailable');
});
test('Flipkart keeps genuine nonmatches and previously shown products distinct from unreadable pages',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async input=>new Response(String(input).includes('/search?')?ld({'@type':'ItemList',itemListElement:[{url}]}):productHtml()));
 expect(await discover({category:'kurta',budget:400})).toEqual([]);
 fetch.mockImplementation(async input=>new Response(String(input).includes('/search?')?ld({'@type':'ItemList',itemListElement:[{url}]}):productHtml().replace('InStock','OutOfStock')));
 expect(await discover({category:'kurta',budget:1000})).toEqual([]);
 expect(await discover({category:'kurta',budget:1000},[url])).toEqual([]);
});
test('webhook checks exact signature and routes only configured phone ID',async()=>{
 const body='{"test":true}',secret='test-secret';const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(body)));const signature='sha256='+Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
 expect(await validSignature(body,signature,secret)).toBe(true);expect(await validSignature(body+' ',signature,secret)).toBe(false);expect(await validSignature(body,null,secret)).toBe(false);
 const payload={object:'whatsapp_business_account',entry:[{changes:[{field:'messages',value:{metadata:{phone_number_id:'phone-id'},messages:[{id:'msg',from:'919999999999',type:'text',text:{body:'hi'},timestamp:'100'}]}}]}]};
 expect(parsePayload(payload,'phone-id').incoming).toHaveLength(1);expect(parsePayload(payload,'other').incoming).toEqual([]);
});
test('style searches stay concise and broad fallback can recover candidates without relaxing budget',async()=>{
 const {searchTerms}=await import('./discoveryRules');
 const r={category:'kurta',budget:1000,size:'M',style:'simple',pattern:'plain',mustHave:['no embroidery']};
 expect(searchTerms(r)).toBe('solid kurta');expect(searchTerms(r,false)).toBe('kurta');
 const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async input=>{
  const u=new URL(String(input));
  if(u.pathname==='/search')return new Response(ld({'@type':'ItemList',itemListElement:u.searchParams.get('q')==='kurta'?[{url}]:[]}));
  return new Response(productHtml());
 });
 const options=await discover(r);expect(options).toHaveLength(1);expect(fetch).toHaveBeenCalledTimes(3);
 expect(matchesOption({...option,price:1001},r)).toBe(false);
});
