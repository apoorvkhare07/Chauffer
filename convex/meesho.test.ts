// @vitest-environment node
import {test,expect,vi,afterEach} from 'vitest';
import {meeshoOptions} from './storeExtractors';
import {discoverAcrossStores} from './liveDiscovery';
const r={category:'sneakers',audience:'men' as const,budget:5000,size:'UK 8'};
const product={valid:true,hero_pid:123,original_product_id:123,hero_product_name:'White Sneakers For Men',name:'Men Sneakers',
 slug:'white-sneakers-for-men',product_id:'test123',num_designs:1,min_product_price:389,min_catalog_price:389,
 full_details:'Material: Synthetic\nColor: White\nPattern: Solid',product_images:[{id:123,url:'https://images.meesho.com/images/products/123/shoe.jpg'}]};
afterEach(()=>vi.restoreAllMocks());
test('Meesho accepts the current single-product listed price with the matching hero image and exclusions',()=>{
 const result=meeshoOptions({catalogs:[product]},r,42);
 expect(result).toHaveLength(1);expect(result[0]).toMatchObject({store:'Meesho',price:389,colour:'White',fabric:'Synthetic',imageUrl:product.product_images[0].url,priceFrom:true});
 expect(meeshoOptions({catalogs:[product]},r,42,[result[0].url])).toEqual([]);
 const bad=[{...product,num_designs:2},{...product,min_product_price:0},{...product,min_product_price:null},
  {...product,original_product_id:999},{...product,product_images:[{id:999,url:product.product_images[0].url}]},
  {...product,name:'Women Sneakers'},{...product,slug:'https://evil.test'},{...product,min_product_price:6000}];
 expect(meeshoOptions({catalogs:bad},r,42)).toEqual([]);
 expect(()=>meeshoOptions({message:'access denied'},r,42)).toThrow('No readable Meesho search');
});
test('Meesho discovery uses the bounded public search request without browser cookies',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async input=>new URL(String(input)).pathname==='/api/v1/products/search'?new Response(JSON.stringify({catalogs:[product]})):new Response('Unavailable',{status:403}));
 const result=await discoverAcrossStores(r);
 expect(result.options).toHaveLength(1);expect(result.options[0].store).toBe('Meesho');
 expect(result.stores.find(s=>s.store==='Meesho')?.status).toBe('matched');
 const calls=fetch.mock.calls.filter(([input])=>new URL(String(input)).pathname==='/api/v1/products/search');expect(calls).toHaveLength(1);
 const init=calls[0][1]!;expect(init.method).toBe('POST');expect(init.headers).toEqual({'Content-Type':'application/json'});
 expect(JSON.parse(init.body as string)).toMatchObject({query:'sneakers men',type:'text_search',page:1,limit:20,offset:0});
});
