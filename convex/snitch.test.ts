// @vitest-environment node
import {test,expect,vi,afterEach} from 'vitest';
import {retailOptions} from './retailExtractors';
import {discoverAcrossStores} from './liveDiscovery';
import {allowedProductUrl} from './discoveryRules';
import {storeSearchUrl} from './marketplaces';

const r={category:'shirt',audience:'men' as const,budget:2000,size:'M'};
// Invented products using the public search response's field names. No customer data.
const product={title:'Blue Cotton Shirt',shopify_product_type:'Shirts',handle:'blue-cotton-shirt',shopify_product_id:123456789,
 status:'active',selling_price:1199,mrp:2199,color:"['Blue']",colors:['Blue','Red'],material:'Cotton',fit:'Regular Fit',
 preview_image:'https://cdn.shopify.com/shirt.jpg',variants:[{size:'M',inventory_quantity:null,location_info:[{omni_inventory:4,quick_com_inventory:0}]}]};
const response=(products:unknown[])=>JSON.stringify({status:{code:200,message:'Successful'},data:{products}});
afterEach(()=>vi.restoreAllMocks());

test('SNITCH uses real product destinations and the website’s keyword route',()=>{
 expect(allowedProductUrl('https://www.snitch.com/men-shirts/blue-cotton-shirt/123456789/buy')).toBe(true);
 expect(allowedProductUrl('https://www.snitch.com/men-shirts/buy')).toBe(false);
 expect(allowedProductUrl('https://www.snitch.com.evil.test/men-shirts/blue-cotton-shirt/123/buy')).toBe(false);
 expect(new URL(storeSearchUrl('SNITCH',r)).pathname).toBe('/search/shirt%20men');
});

test('SNITCH reads selling price and this colour only; rejects wrong audience, stock, budget and excluded products',()=>{
 const html=response([product,{...product,handle:'sold-out',variants:[{size:'M',inventory_quantity:0}]},
  {...product,handle:'other-size',variants:[{size:'L',inventory_quantity:5}]},
  {...product,handle:'expensive',selling_price:2500},{...product,handle:'inactive',status:'draft'},
  {...product,handle:'../bad'}, {...product,handle:'missing-price',selling_price:null}]);
 const result=retailOptions('SNITCH',html,{...r,colour:'blue'},42);
 expect(result.readable).toBe(true);expect(result.options).toHaveLength(1);
 expect(result.options[0]).toMatchObject({title:'Men Blue Cotton Shirt',store:'SNITCH',price:1199,colour:'Blue',fabric:'Cotton',observedAt:42,imageUrl:product.preview_image,priceFrom:true});
 expect(retailOptions('SNITCH',html,{...r,audience:'women'},42).options).toEqual([]);
 expect(retailOptions('SNITCH',html,{...r,colour:'red'},42).options).toEqual([]);
 expect(retailOptions('SNITCH',html,r,42,[result.options[0].url]).options).toEqual([]);
 expect(retailOptions('SNITCH',response([]),r,42)).toEqual({readable:true,options:[]});
 for(const shell of ['<html>Enable JavaScript</html>','{"data":{}}',JSON.stringify({status:{code:403},data:{products:[product]}})])expect(retailOptions('SNITCH',shell,r,42)).toEqual({readable:false,options:[]});
 const shoe={...product,title:'Blue Sneakers',shopify_product_type:'Shoes',variants:[{size:'8',inventory_quantity:5}]};
 expect(retailOptions('SNITCH',response([shoe]),{category:'sneakers',audience:'men',budget:5000,size:'UK 8'},42).options).toHaveLength(1);
});

test('discovery reads SNITCH’s public catalogue without browser cookies or credentials when other stores fail',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async input=>{
  const url=new URL(String(input));
  return url.hostname==='api.snitch.com'?new Response(response([product])):new Response('Unavailable',{status:403});
 });
 const result=await discoverAcrossStores(r);
 expect(result.options).toHaveLength(1);expect(result.options[0].store).toBe('SNITCH');
 expect(result.stores.find(s=>s.store==='SNITCH')?.status).toBe('matched');
 const calls=fetch.mock.calls.filter(([input])=>new URL(String(input)).hostname==='api.snitch.com');
 expect(calls).toHaveLength(1);const url=new URL(String(calls[0][0]));
 expect(url.pathname).toBe('/products/search');expect(url.searchParams.get('keyword')).toBe('shirt');
 expect(url.searchParams.get('limit')).toBe('25');expect(calls[0][1]?.headers).toBeUndefined();
});
