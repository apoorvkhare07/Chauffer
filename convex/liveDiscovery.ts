"use node";
import {stores,storeSearchUrl,storeResultValidator,type StoreResult} from './marketplaces';
import {chooseBatch} from './ranking';
import {tasteValidator,emptyTaste,type Taste} from './taste';
import {amazonOptions} from './storeExtractors';
import { load } from 'cheerio';
import { internalAction,action } from './_generated/server';
import { internal } from './_generated/api';
import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { allowedProductUrl,matchesOption,allowedImageUrl,optionValidator,requirementsValidator,searchTerms,type Option,type Requirements } from './discoveryRules';

function structured(html:string):any[]{
 const $=load(html);const records:any[]=[];
 $('script[type="application/ld+json"]').each((_i,el)=>{try{const x=JSON.parse($(el).text());records.push(...(Array.isArray(x)?x:[x]));}catch{/* Unknown merchant markup is not a verified product. */}});
 return records.flatMap(x=>Array.isArray(x['@graph'])?x['@graph']:[x]);
}
export function listingUrls(html:string):string[]{
 return [...new Set(structured(html).filter(x=>x['@type']==='ItemList').flatMap(x=>(x.itemListElement??[]).map((p:any)=>p.url??p.item?.url)).filter((u:unknown)=>typeof u==='string'&&allowedProductUrl(u)&&new URL(u).hostname==='www.flipkart.com'))].slice(0,12) as string[];
}
export function productOption(html:string,url:string,observedAt:number):Option|null{
 const p=structured(html).find(x=>x['@type']==='Product');if(!p||typeof p.name!=='string')return null;
 const offers=Array.isArray(p.offers)?p.offers[0]:p.offers;
 const price=Number(offers?.price);if(offers?.priceCurrency!=='INR'||!Number.isFinite(price)||price<=0||!String(offers.availability??'').endsWith('/InStock'))return null;
 const $=load(html);let state:any;try{const script=$('#is_script').text();state=JSON.parse(script.replace(/^\s*window\.__INITIAL_STATE__\s*=\s*/,'').replace(/;\s*$/,''));}catch{state=null;}
 let fabric='';const attributes:string[]=[];
 const labels=new Set(['Pattern','Type','Fit','Style','Sleeve','Sleeve Style','Sleeve Length','Length','Occasion','Fabric']);
 function readLabels(node:any){if(!node||typeof node!=='object')return;const label=node.label_0?.value?.text;const value=node.label_1?.value?.text;const detail=Array.isArray(value)?value.join(', '):typeof value==='string'?value:'';if(label==='Fabric'&&!fabric)fabric=detail;if(labels.has(label)&&detail&&attributes.length<15)attributes.push(`${label}: ${detail.slice(0,120)}`);for(const child of Object.values(node))readLabels(child);}
 function scopedDetails(node:any){if(!node||typeof node!=='object')return;if(node.tracking?.productId===p.sku&&/PRODUCT_DETAILS/i.test(node.tracking?.widgetType??''))readLabels(node);else for(const child of Object.values(node))scopedDetails(child);}
 scopedDetails(state);
 // Older product pages expose their specifications as an ordinary table.
 if(!fabric)$('tr').each((_i,el)=>{const cells=$(el).find('td');if(cells.first().text().trim()==='Fabric')fabric=cells.last().text().trim();});
 const rawImage=Array.isArray(p.image)?p.image[0]:typeof p.image==='object'?p.image?.url:p.image;
 const imageUrl=allowedImageUrl(rawImage)?rawImage:undefined;
 const brand=typeof p.brand==='string'?p.brand:typeof p.brand?.name==='string'?p.brand.name:undefined;
 // A marketplace SKU is not a manufacturer code and cannot establish a cross-store match.
 const manufacturerCode=typeof p.mpn==='string'?p.mpn:undefined;
 return {...(imageUrl?{imageUrl}:{}),...(brand?{brand:brand.slice(0,80)}:{}),...(manufacturerCode?{manufacturerCode:manufacturerCode.slice(0,80)}:{}),title:p.name.slice(0,200),url,price,colour:typeof p.color==='string'?p.color.slice(0,60):'',fabric:fabric.slice(0,80),attributes:[...new Set(attributes)],observedAt};
}
async function page(url:string):Promise<string>{
 const response=await fetch(url,{signal:AbortSignal.timeout(12000),redirect:'error'});
 if(!response.ok)throw new Error(`Store unavailable: HTTP ${response.status}`);
 const html=await response.text();if(html.length>5000000)throw new Error('Unexpected store response');return html;
}
export async function discover(requirements:Requirements,excludeUrls:string[]=[],limit=3):Promise<Option[]>{
 const search=new URL('https://www.flipkart.com/search');search.searchParams.set('q',searchTerms(requirements));
 const hasSoft=searchTerms(requirements)!==searchTerms(requirements,false);
 const broad=new URL(search.href);broad.searchParams.set('q',searchTerms(requirements,false));
 const pages=await Promise.allSettled([page(search.href),...(hasSoft?[page(broad.href)]:[])]);
 if(pages.every(p=>p.status==='rejected'))throw (pages[0] as PromiseRejectedResult).reason;
 const catalogues=pages.filter((p):p is PromiseFulfilledResult<string>=>p.status==='fulfilled').map(p=>listingUrls(p.value));
 const catalogue=[...new Set(catalogues.length>1?[...catalogues[0].slice(0,6),...catalogues[1]]:catalogues[0]??[])].slice(0,12);if(!catalogue.length)throw new Error('No readable live catalogue');
 const urls=catalogue.filter(url=>!excludeUrls.includes(url));
 const matches:Option[]=[];
 for(let offset=0;offset<urls.length&&matches.length<limit;offset+=3){
  const results=await Promise.allSettled(urls.slice(offset,offset+3).map(async url=>productOption(await page(url),url,Date.now())));
  for(const result of results)if(result.status==='fulfilled'&&result.value&&matchesOption(result.value,requirements))matches.push(result.value);
 }
 return matches.sort((a,b)=>a.price-b.price).slice(0,limit);
}
export async function discoverAcrossStores(requirements:Requirements,excludeUrls:string[]=[],taste:Taste=emptyTaste):Promise<{options:Option[];failed:boolean;stores:StoreResult[]}>{
 const results=await Promise.all(stores.map(async store=>{
  const searchUrl=storeSearchUrl(store,requirements);
  try{
   let options:Option[];
   if(store==='Flipkart')options=(await discover(requirements,excludeUrls,12)).map(o=>({...o,store,source:'product' as const}));
   else{
    const broadUrl=storeSearchUrl(store,requirements,false);
    const pages=await Promise.allSettled([page(searchUrl),...(broadUrl!==searchUrl?[page(broadUrl)]:[])]);
    const readable=pages.filter((p):p is PromiseFulfilledResult<string>=>p.status==='fulfilled'&&load(p.value)('[data-component-type="s-search-result"]').length>0);
    if(!readable.length)throw new Error('Amazon search not readable');
    const pools=readable.map(p=>amazonOptions(p.value,requirements,Date.now(),excludeUrls,12));
    const candidates=pools.length>1?[...pools[0].slice(0,6),...pools[1]]:pools[0];
    options=[...new Map(candidates.map(o=>[o.url,o])).values()].slice(0,12);
   }
   return {options,result:{store,status:options.length?'matched':'no_matches',searchUrl} as StoreResult};
  }catch(error){console.warn('Store discovery unavailable',store,error instanceof Error?error.message.slice(0,120):'Unknown response');return {options:[] as Option[],result:{store,status:'unavailable',searchUrl} as StoreResult};}
 }));
 const options=chooseBatch(results.flatMap(x=>x.options),requirements,taste);
 return {options,failed:results.every(x=>x.result.status==='unavailable'),stores:results.map(x=>({...x.result,status:x.result.status==='unavailable'?'unavailable':options.some(o=>o.store===x.result.store)?'matched':'no_matches'}))};
}
const searchResultValidator=v.object({options:v.array(optionValidator),failed:v.boolean(),stores:v.array(storeResultValidator)});
export const search=internalAction({args:{requirements:requirementsValidator,excludeUrls:v.optional(v.array(v.string())),taste:v.optional(tasteValidator)},returns:v.object({options:v.array(optionValidator),failed:v.boolean(),reason:v.optional(v.string()),stores:v.optional(v.array(storeResultValidator))}),handler:async(_ctx,{requirements,excludeUrls,taste})=>discoverAcrossStores(requirements,excludeUrls,taste)});
export const webSearch=action({args:{requirements:requirementsValidator},returns:searchResultValidator,handler:async(ctx,{requirements}):Promise<{options:Option[];failed:boolean;stores:StoreResult[]}>=>{
 const owner=await getAuthUserId(ctx);if(!owner)throw new Error('Please sign in.');
 const budget=requirements.budget;
 if(!['kurta','dress','top','saree'].includes(requirements.category??'')||typeof budget!=='number'||!Number.isFinite(budget)||budget<100||budget>50000)throw new Error('Choose clothing and a budget between ₹100 and ₹50,000.');
 for(const field of ['size','colour','fabric'] as const)if(requirements[field]&&(requirements[field]!.length>40||/[\r\n]/.test(requirements[field]!)))throw new Error('Invalid search preference.');
 const id=await ctx.runMutation(internal.webDiscovery.claim,{owner});
 try{return await discoverAcrossStores(requirements);}finally{await ctx.runMutation(internal.webDiscovery.finish,{id});}
}});
