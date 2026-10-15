import {expect,test} from 'vitest';
import {renderedOptions} from './renderedRetail';
const r={category:'sneakers',audience:'men' as const,budget:5000,size:'UK 8'};
const fk=(price='₹999')=>`<div data-id="SHO123456789"><a href="/shoe/p/itm123?pid=SHO123456789&tracking=1"><img src="https://rukminim2.flixcart.com/shoe.jpg"></a><a title="Men Blue Sneakers" href="/shoe/p/itm123?pid=SHO123456789&tracking=1">Men Blue Sneakers</a><a href="/shoe/p/itm123?pid=SHO123456789"><div class="hZ3P6w">${price}</div><div class="kRYCnD">₹1,999</div></a><div>Coupon price ₹499</div></div>`;
test('Flipkart rendered cards bind the current price to the exact item, ignoring MRP and conditional prices',()=>{
 const result=renderedOptions('Flipkart',fk(),r,42);expect(result.readable).toBe(true);expect(result.options[0]).toMatchObject({title:'Men Blue Sneakers',price:999,source:'listing',priceFrom:true,url:'https://www.flipkart.com/shoe/p/itm123?pid=SHO123456789',imageUrl:'https://rukminim2.flixcart.com/shoe.jpg'});
 expect(renderedOptions('Flipkart',fk('₹6,000'),r,42)).toMatchObject({readable:true,options:[]});
 expect(renderedOptions('Flipkart',fk(),r,42,['https://www.flipkart.com/shoe/p/itm123?pid=SHO123456789&other=2']).options).toEqual([]);
 expect(renderedOptions('Flipkart',fk().replaceAll('pid=SHO123456789','pid=SHO987654321'),r,42).options).toEqual([]);
 expect(renderedOptions('Flipkart','<h1>Access Denied</h1>',r,42).readable).toBe(false);
});
test('Souled Store uses product-scoped price, category and image, while preserving audience and must-haves',()=>{
 const card=`<a href="/product/yugen-brown-sneakers?get=1"><img src="https://prod-img.thesouledstore.com/shoe.jpg"><h5 class="product-name-text">Yugen: Brown</h5><div class="listprice"><span>Men Low Top Sneakers</span></div><div class="price-block"><span class="offer">₹ 2599</span><s>₹3999</s></div><div>Member price ₹1999</div></a>`;
 const result=renderedOptions('The Souled Store',card,r,42);expect(result.options[0]).toMatchObject({title:'Yugen: Brown Men Low Top Sneakers',price:2599,colour:'Brown',url:'https://www.thesouledstore.com/product/yugen-brown-sneakers',imageUrl:'https://prod-img.thesouledstore.com/shoe.jpg'});
 expect(renderedOptions('The Souled Store',card,{...r,audience:'women'},42).options).toEqual([]);
 expect(renderedOptions('The Souled Store',card,{...r,mustHave:['leather']},42).options).toEqual([]);
 expect(renderedOptions('The Souled Store',card.replaceAll('2599','9999'),r,42)).toMatchObject({readable:true,options:[]});
});
