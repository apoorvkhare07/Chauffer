// @vitest-environment node
import {test,expect,vi,afterEach} from 'vitest';
import {expandedRetailOptions} from './expandedRetail';
import {discoverAcrossStores} from './liveDiscovery';
import {allowedProductUrl,allowedImageUrl} from './discoveryRules';
import {stores,addedStores} from './storeConfig'
import {storeSearchUrl} from './marketplaces';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
const jeans={category:'jeans',audience:'women' as const,budget:3000,size:'32'};
const shoe={category:'sneakers',audience:'men' as const,budget:6000,size:'UK 8'};
const script=(id:string,data:unknown)=>`<script id="${id}" type="application/json">${JSON.stringify(data)}</script>`;
test('new stores use trusted Indian destinations without allowing lookalikes or overseas H&M/Uniqlo',()=>{
 expect(stores).toHaveLength(20);expect(addedStores).toHaveLength(10);
 for(const store of addedStores)expect(new URL(storeSearchUrl(store,jeans)).protocol).toBe('https:');
 for(const url of ['https://www2.hm.com/en_us/productpage.123.html','https://www.uniqlo.com/us/en/products/E12345-000/00','https://freakins.com.evil.test/products/jeans','https://in.puma.com/in/en/search?q=shoes','https://user:pass@offduty.in/products/jeans'])expect(allowedProductUrl(url)).toBe(false);
 expect(allowedImageUrl('https://images.puma.com/image/upload/shoe.jpg')).toBe(true);expect(allowedImageUrl('https://image.hm.com.evil.test/x.jpg')).toBe(false);
});
test('Shopify readers keep rupees, stock, product tags, category, hard constraints and exclusions',()=>{
 const p={title:'Wide Fit',type:'Jeans',available:true,price:'2399.00',vendor:'Freakins',url:'/products/women-blue-jeans',tags:['nnt_women'],body:'<p>100% cotton</p>',image:'https://cdn.shopify.com/jeans.jpg'};
 const body=(products:any[])=>JSON.stringify({resources:{results:{products}}});
 const parsed=expandedRetailOptions('FREAKINS',body([p,{...p,url:'/products/sold',available:false},{...p,url:'/products/too-much',price:'3500.00'},{...p,url:'https://evil.test/products/jeans'}]),jeans,1);
 expect(parsed.readable).toBe(true);expect(parsed.options).toHaveLength(1);expect(parsed.options[0]).toMatchObject({price:2399,store:'FREAKINS',fabric:'100% cotton'});
 expect(expandedRetailOptions('FREAKINS',body([p]),{...jeans,audience:'men'},1).options).toEqual([]);
 expect(expandedRetailOptions('FREAKINS',body([p]),jeans,1,[parsed.options[0].url]).options).toEqual([]);
 expect(expandedRetailOptions('Off Duty',body([{...p,tags:['All-men-denims'],url:'/products/loose-jeans'}]),{...jeans,audience:'men'},1).options).toHaveLength(1);
});
test('H&M ignores member prices, sold-out items and colours belonging to other variants',()=>{
 const url='https://www2.hm.com/en_in/productpage.1234567890.html';
 const p={title:'Wide Jeans',locale:'en_in',category:'ladies_jeans',pdpUrl:url,isOutOfStock:false,prices:[{priceType:'whitePrice',price:2499},{priceType:'redPrice',price:1999},{priceType:'clubPrice',price:999}],swatches:[{colorLink:url,colorName:'Blue'},{colorLink:'https://www2.hm.com/en_in/productpage.1234567891.html',colorName:'Black'}]};
 const html=script('__NEXT_DATA__',{props:{pageProps:{srpProps:{hits:[p,{...p,isOutOfStock:true,pdpUrl:url.replace('890','892')}]}}}});
 expect(expandedRetailOptions('H&M',html,jeans,1).options[0]).toMatchObject({price:1999,colour:'Blue'});
 expect(expandedRetailOptions('H&M',html,{...jeans,colour:'black'},1).options).toEqual([]);
});
test('Nykaa and Tata use row selling price rather than promotional coupon or MRP',()=>{
 const p={title:'Example Brand',subTitle:'Women Blue Jeans',actionUrl:'/women-blue-jeans/p/123',isOutOfStock:0,price:4999,discountedPrice:1999,offer_message:'Extra 20% off',plp_pdp_bridge:{siblings_colour:[{action_url:'/other-jeans/p/124',color_name:'Black'}]}};
 expect(expandedRetailOptions('Nykaa Fashion',script('__PRELOADED_STATE__',{listingV2:{products:[p]}}),jeans,1).options[0]).toMatchObject({price:1999,colour:'Blue'});
 const tata={inStockFlag:true,productname:'Women Cotton Blue Jeans',webURL:'/women-blue-jeans/p-mp123456',brandname:'Example',productColor:'Blue',price:{sellingPrice:{currencyIso:'INR',doubleValue:1799},mrpPrice:{doubleValue:3999}}};
 expect(expandedRetailOptions('Tata CLiQ',JSON.stringify({searchresult:[tata]}),jeans,1).options[0].price).toBe(1799);
});
test('PUMA keeps the priced swatch, excludes app-only stock and respects the budget',()=>{
 const p={name:'Classic Sneakers',orderable:true,isAppExclusive:false,productPrice:{price:7999,salePrice:4799,isSalePriceElapsed:false},colorName:'Black',preview:'https://images.puma.com/image/upload/shoe.jpg'};
 const render=(variant:typeof p)=>script('__NEXT_DATA__',{props:{country:'IN',urqlState:{one:{data:JSON.stringify({searchProducts:{itemsSection:{items:[{productSearchHit:{id:'123456',color:'01',variantProduct:variant,masterProduct:{brand:'PUMA'}}}]}}})}}}})+'<a href="/in/en/pd/classic-sneakers/123456?search=true&swatch=01"></a>';
 const html=render(p);
 expect(expandedRetailOptions('PUMA',html,shoe,1).options[0]).toMatchObject({price:4799,colour:'Black',url:'https://in.puma.com/in/en/pd/classic-sneakers/123456?swatch=01'});
 expect(expandedRetailOptions('PUMA',render({...p,isAppExclusive:true}),shoe,1).options).toEqual([]);
});
test('Westside canonicalises only its own links and uses sellingPrice, not a zero placeholder',()=>{
 const p={gender:'Women',name:'Blue Wide Jeans',url:'https://checkout.westside.com/products/blue-wide-jeans?variant=123',inStock:true,sellingPrice:1999,price:0,finalPrice:0};
 const data=JSON.stringify({statusCode:200,payload:{result:[p,{...p,url:'https://evil.test/products/jeans'},{...p,inStock:false,url:'https://checkout.westside.com/products/sold-jeans'}]}});
 expect(expandedRetailOptions('Westside',data,jeans,1).options).toHaveLength(1);expect(expandedRetailOptions('Westside',data,jeans,1).options[0]).toMatchObject({price:1999,url:'https://www.westside.com/products/blue-wide-jeans'});
 for(const store of addedStores)expect(expandedRetailOptions(store,'<h1>Access denied</h1>',jeans,1)).toEqual({options:[],readable:false});
});
test('added stores enter the existing search and do not trigger extra paid browser fallbacks',async()=>{
 vi.stubEnv('BROWSERLESS_API_KEY','');
 const calls:string[]=[];vi.spyOn(globalThis,'fetch').mockImplementation(async input=>{const url=String(input);calls.push(url);if(url.startsWith('https://freakins.com/search/suggest.json'))return new Response(JSON.stringify({resources:{results:{products:[{available:true,title:'Women Blue Jeans',type:'Jeans',url:'/products/blue-jeans',price:'2499.00'}]}}}));return new Response('Unavailable',{status:503});});
 const found=await discoverAcrossStores(jeans);
 expect(found.stores).toHaveLength(20);expect(found.options.some(p=>p.store==='FREAKINS')).toBe(true);expect(found.stores.find(s=>s.store==='Uniqlo')?.status).toBe('unavailable');expect(calls.some(u=>u.includes('browserless'))).toBe(false);
});

test('VegNonVeg uses the merchant Footwear category for broad shoes, never guesses sneaker models or toddler sizes',()=>{
 const html='<script>var products = [{"id":"1","category":["Footwear"]},{"id":"2","category":["Footwear"]}];</script>'+['AIR DUNK LOW','AIR JORDAN TD'].map((name,i)=>`<a class="gt-product-click" href="/products/shoe-${i}" data-product='{"id":"${i+1}"}'><div class="info"><p>Nike</p><p><span class="p-name">${name}</span></p><p>₹ 5,000</p></div></a>`).join('');
 const found=expandedRetailOptions('VegNonVeg',html,{...shoe,category:'shoes'},1);expect(found.readable).toBe(true);expect(found.options).toHaveLength(1);expect(found.options[0].title).toContain('Footwear');
 expect(expandedRetailOptions('VegNonVeg',html,shoe,1).options).toEqual([]);
});

test('Uniqlo rendered search keeps current row prices and ignores the Best Sellers carousel',()=>{
 const card='<a class="product-tile__link" href="/in/en/products/E123456-000/00?colorDisplayCode=66" aria-label="Slim Jeans, Rs. 2,490.00, Unisex"><h2>Slim Jeans</h2><div class="product-tile__content-area"><div>Men, S-XXL</div></div></a>';
 const body='<div class="fr-ec-product-collection--type-grid">'+card+'</div><div>'+card.replace('2490','990')+'</div>';
 const parsed=expandedRetailOptions('Uniqlo',body,jeans,1);expect(parsed.readable).toBe(true);expect(parsed.options).toHaveLength(1);expect(parsed.options[0]).toMatchObject({price:2490,title:'Unisex Slim Jeans',url:'https://www.uniqlo.com/in/en/products/E123456-000/00?colorDisplayCode=66'});
});
