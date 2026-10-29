"use node";
import {v} from 'convex/values';
import {internalAction} from './_generated/server';
import {storeValidator,productStore,merchantSearchUrl} from './storeConfig';
import {zyteExtract,normalizeZyteProduct,ZyteError} from './zyteClient';
import {merchantImage} from './tryOnRenderer';
const sample=v.object({title:v.string(),url:v.string(),imageUrl:v.optional(v.string()),price:v.optional(v.number()),currency:v.optional(v.string()),colour:v.optional(v.string())});
// Internal trial only. Listing requests use an invented, fixed query.
export const run=internalAction({args:{store:storeValidator,url:v.optional(v.string())},returns:v.object({ok:v.boolean(),elapsedMs:v.number(),count:v.number(),samples:v.array(sample),imageDownloaded:v.boolean(),failure:v.optional(v.string())}),handler:async(_ctx,{store,url})=>{
 const start=Date.now();try{
  if(url&&productStore(url)!==store)throw new ZyteError('unavailable');
  const target=url??merchantSearchUrl(store,'blue shirt men');const data=await zyteExtract(target,url?'product':'productList');
  const raw=url?[data.product]:data.productList?.products??[];
  const items=raw.slice(0,40).map((p:any)=>normalizeZyteProduct(p,store)).filter((p:any)=>p!==null);
  let imageDownloaded=false;if(url&&items[0]?.imageUrl){await merchantImage(items[0].imageUrl);imageDownloaded=true;}
  return {ok:items.length>0&&(!url||imageDownloaded),elapsedMs:Date.now()-start,count:items.length,samples:items.slice(0,3),imageDownloaded};
 }catch(error){return {ok:false,elapsedMs:Date.now()-start,count:0,samples:[],imageDownloaded:false,failure:error instanceof ZyteError?error.code:'request_or_image_failed'};}
}});

export const nikeListing=internalAction({args:{store:storeValidator},returns:v.string(),handler:async(_ctx,{store})=>{
 const data=await zyteExtract(merchantSearchUrl(store,'Nike blue sneakers men',10000),'productList',40000);
 return JSON.stringify((data.productList?.products??[]).slice(0,10).map((p:any)=>({name:p.name,brand:p.brand,color:p.color,price:p.price,currency:p.currency,url:p.url,description:p.description,additionalProperties:p.additionalProperties,image:p.mainImage,keys:Object.keys(p)})));
}});

export const listingSpeed=internalAction({args:{store:storeValidator,mode:v.union(v.literal('httpResponseBody'),v.literal('browserHtml'))},returns:v.any(),handler:async(_ctx,{store,mode})=>{
 const started=Date.now();try{const data=await zyteExtract(merchantSearchUrl(store,'Nike blue sneakers men',10000),'productList',30000,mode);const products=(data.productList?.products??[]).map((p:any)=>normalizeZyteProduct(p,store)).filter(Boolean);return {store,mode,elapsedMs:Date.now()-started,count:products.length,samples:products.slice(0,2)};}catch{return {store,mode,elapsedMs:Date.now()-started,count:0,failed:true};}
}});
