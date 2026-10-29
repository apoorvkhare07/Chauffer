"use node";
import {allowedImageUrl,allowedProductUrl} from './discoveryRules';
import {productStore,storeConfig,type Store} from './storeConfig';
export class ZyteError extends Error{constructor(public code:'not_configured'|'credentials'|'limit'|'unavailable'|'no_product'|'unsafe_image'){super(code);}}
export type ZyteProduct={title:string;url:string;imageUrl?:string;price?:number;currency?:string;colour?:string};
export function normalizeZyteProduct(raw:any,store:Store):ZyteProduct|null{
 if(!raw||typeof raw.name!=='string'||!raw.name.trim()||typeof raw.url!=='string'||productStore(raw.url)!==store)return null;
 const image=raw.mainImage?.url??raw.images?.[0]?.url;let imageUrl:string|undefined;
 if(typeof image==='string'){try{const u=new URL(image,raw.url);if(u.protocol==='http:')u.protocol='https:';if(allowedImageUrl(u.href))imageUrl=u.href;}catch{/* Untrusted merchant URL. */}}
 const price=typeof raw.price==='string'&&/^\d+(\.\d+)?$/.test(raw.price)?Number(raw.price):undefined;
 return {title:raw.name.trim().slice(0,160),url:raw.url,...(imageUrl?{imageUrl}:{}),...(price!==undefined&&Number.isFinite(price)&&price>0?{price}:{}),...(typeof raw.currency==='string'?{currency:raw.currency.slice(0,3)}:{}),...(typeof raw.color==='string'?{colour:raw.color.slice(0,80)}:{})};
}
export async function zyteExtract(url:string,kind:'product'|'productList',timeoutMs=55000,extractFrom?:'httpResponseBody'|'browserHtml',stopSignal?:AbortSignal){
 if(timeoutMs<1000)throw new ZyteError('unavailable');
 const key=process.env.ZYTE_API_KEY;if(!key)throw new ZyteError('not_configured');
 const u=new URL(url);if(url.length>2000||u.protocol!=='https:'||u.username||u.password||u.port||!Object.values(storeConfig).some(c=>c.origin===u.origin))throw new ZyteError('unavailable');
 if(kind==='product'&&!allowedProductUrl(url))throw new ZyteError('unavailable');
 // Send public product/search URLs only. Never send shopper photos, identity or chats.
 // One provider call, no automatic retries. Provider rendering is selected by Zyte.
 const response=await fetch('https://api.zyte.com/v1/extract',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Basic '+Buffer.from(key+':').toString('base64')},body:JSON.stringify({url,[kind]:true,geolocation:'IN',...(extractFrom?{[`${kind}Options`]:{extractFrom}}:{})}),redirect:'error',signal:AbortSignal.any([AbortSignal.timeout(Math.min(55000,Math.floor(timeoutMs))),...(stopSignal?[stopSignal]:[])])});
 if(!response.ok){await response.body?.cancel();throw new ZyteError(response.status===401||response.status===403?'credentials':response.status===429?'limit':'unavailable');}
 const reader=response.body?.getReader();if(!reader)throw new ZyteError('unavailable');const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const p=await reader.read();if(p.done)break;size+=p.value.length;if(size>2000000)throw new ZyteError('unavailable');chunks.push(p.value);}}finally{await reader.cancel();}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new ZyteError('unavailable');}
}
export async function zyteProduct(url:string){
 const store=productStore(url);if(!store)throw new ZyteError('no_product');
 const data=await zyteExtract(url,'product');const item=normalizeZyteProduct(data.product,store);
 if(!item)throw new ZyteError('no_product');if(!item.imageUrl)throw new ZyteError('unsafe_image');
 return {title:item.title,imageUrl:item.imageUrl};
}
