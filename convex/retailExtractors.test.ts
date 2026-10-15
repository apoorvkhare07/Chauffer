import {test,expect} from 'vitest';
import {retailOptions,jsonAssignment} from './retailExtractors';
import {allowedProductUrl,allowedImageUrl} from './discoveryRules';
import {stores,storeSearchUrl} from './marketplaces';
import {chooseBatch} from './ranking';
const r={category:'sneakers',audience:'men' as const,budget:5000,size:'UK 8'};
const script=(name:string,data:unknown)=>`<script>${name} = ${JSON.stringify(data)}; window.other = true;</script>`;
const next=(data:unknown)=>`<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({props:{pageProps:data}})}</script>`;
test('Myntra uses actual listed price and product rows; ignores recommendation pools and mismatched audiences',()=>{
 const p={productName:'Men Sneakers',gender:'Men',landingPageUrl:'casual-shoes/brand/men-sneakers/123/buy',price:2500,mrp:8000,primaryColour:'Blue',searchImage:'http://assets.myntassets.com/shoe.jpg'};
 const html=script('window.__myx',{searchData:{results:{products:[p,{...p,productName:'Kids Sneakers',gender:'Boys',landingPageUrl:'shoes/brand/kids/124/buy'},{...p,price:6000}]}},recommendations:[{...p,price:1}]});
 const result=retailOptions('Myntra',html,r,1);expect(result.readable).toBe(true);expect(result.options).toHaveLength(1);expect(result.options[0]).toMatchObject({price:2500,imageUrl:'https://assets.myntassets.com/shoe.jpg',source:'listing',priceFrom:true});
 expect(jsonAssignment(script('window.__myx',{value:'a } { " quote'}),'window.__myx')).toEqual({value:'a } { " quote'});
});
test('AJIO uses INR base price and not conditional offer price or was-price',()=>{
 const p={name:'Low Top Sneakers',segmentNameText:'Men',url:'/brand-sneakers/p/123_blue',price:{currencyIso:'INR',value:4000},offerPrice:{value:2000},wasPriceData:{value:8000},fnlColorVariantData:{brandName:'Test',outfitPictureURL:'https://assets.ajio.com/shoe.jpg'}};
 const result=retailOptions('AJIO',script('window.__PRELOADED_STATE__',{grid:{entities:{one:p}}}),r,1);expect(result.options[0]).toMatchObject({price:4000,brand:'Test'});
 expect(retailOptions('AJIO',script('window.__PRELOADED_STATE__',{grid:{entities:{one:{...p,price:{currencyIso:'USD',value:50}}}}}),r,1).options).toEqual([]);
});
test('Bonkers and Bewakoof avoid unavailable items, members-only prices and sneaker-themed apparel',()=>{
 const p={title:'Men White Sneakers',url:'/products/white-sneakers',available:true,price:'2499.00',compare_at_price_min:'5000.00',image:'https://cdn.shopify.com/shoe.jpg'};
 const data=(products:unknown[])=>JSON.stringify({resources:{results:{products}}});
 expect(retailOptions('Bonkers Corner',data([p,{...p,available:false}]),r,1).options[0].price).toBe(2499);
 const bw={name:'Men Sneaker Graphic T-shirt',productUrl:'graphic-tee',price:499,sellingPrice:499,member_price:199,stock_status:true};
 expect(retailOptions('Bewakoof',next({data:{products:[bw]}}),r,1).options).toEqual([]);
 expect(retailOptions('Bewakoof',next({data:{products:[{...bw,name:'Men Blue Sneakers',productUrl:'blue-sneakers',price:2499,sellingPrice:2499}]}}),r,1).options[0].price).toBe(2499);
});
test('NEWME uses available web variant price and does not substitute app coupon price',()=>{
 const p={name:'Floral Dress',slug:'floral-dress',variations:[{stock_status:'instock',sale_price:'1599'},{stock_status:'outofstock',sale_price:'100'}],best_price_text_app:{price:999}};
 const html=next({productsData:{data:{products:[p]}}});
 expect(retailOptions('NEWME',html,{category:'dress',budget:2000,audience:'women'},1).options[0]).toMatchObject({price:1599,priceFrom:true});
 expect(retailOptions('NEWME',html,{category:'dress',budget:2000,audience:'men'},1).options).toEqual([]);
});
test('all featured stores have search destinations; unrendered shells are unavailable, never fabricated stock',()=>{
 expect(stores).toHaveLength(20);for(const store of stores)expect(new URL(storeSearchUrl(store,r)).protocol).toBe('https:');
 for(const store of ['Meesho','The Souled Store','SNITCH'] as const)expect(retailOptions(store,'<html>Enable JavaScript</html>',r,1)).toEqual({options:[],readable:false});
 for(const u of ['https://www.myntra.com.evil.test/shoes/123/buy','https://www.ajio.com/search/?text=shoes','https://www.bonkerscorner.com/products/foo/../../admin','https://user:pass@www.bewakoof.com/p/shoe'])expect(allowedProductUrl(u)).toBe(false);
 expect(allowedImageUrl('https://assets.myntassets.com.evil.test/x')).toBe(false);
});
test('six-result shortlist includes different stores before a second result from one store',()=>{
 const pool=['Flipkart','Amazon','Myntra','AJIO','Bonkers Corner','Bewakoof'].flatMap((store,i)=>Array.from({length:3},(_,n)=>({store:store as typeof stores[number],title:`Men Sneakers ${i}-${n}`,url:store==='Amazon'?`https://www.amazon.in/dp/B0000000${i}${n}`:store==='Myntra'?`https://www.myntra.com/shoes/test/${i}${n+1}/buy`:store==='Bonkers Corner'?`https://www.bonkerscorner.com/products/shoe-${n}`:store==='Bewakoof'?`https://www.bewakoof.com/p/shoe-${n}`:`https://www.${store.toLowerCase()}.com/shoe/p/item-${n}`,price:100+i*200+n,colour:'',fabric:'',observedAt:1})));
 expect(new Set(chooseBatch(pool,r,{prefer:[],avoid:[]}).map(o=>o.store)).size).toBe(6);
});
