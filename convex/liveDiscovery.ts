"use node";
import { load } from 'cheerio';
import { internalAction,action } from './_generated/server';
import { internal } from './_generated/api';
import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { allowedProductUrl,matchesOption,optionValidator,requirementsValidator,searchTerms,type Option,type Requirements } from './discoveryRules';

function structured(html:string):any[]{
 const $=load(html);const records:any[]=[];
 $('script[type="application/ld+json"]').each((_i,el)=>{try{const x=JSON.parse($(el).text());records.push(...(Array.isArray(x)?x:[x]));}catch{/* Unknown merchant markup is not a verified product. */}});
 return records.flatMap(x=>Array.isArray(x['@graph'])?x['@graph']:[x]);
}
export function listingUrls(html:string):string[]{
 return [...new Set(structured(html).filter(x=>x['@type']==='ItemList').flatMap(x=>(x.itemListElement??[]).map((p:any)=>p.url??p.item?.url)).filter((u:unknown)=>typeof u==='string'&&allowedProductUrl(u)))].slice(0,12) as string[];
}
export function productOption(html:string,url:string,observedAt:number):Option|null{
 const p=structured(html).find(x=>x['@type']==='Product');if(!p||typeof p.name!=='string')return null;
 const offers=Array.isArray(p.offers)?p.offers[0]:p.offers;
 const price=Number(offers?.price);if(offers?.priceCurrency!=='INR'||!Number.isFinite(price)||price<=0||!String(offers.availability??'').endsWith('/InStock'))return null;
 const $=load(html);let state:any;try{const script=$('#is_script').text();state=JSON.parse(script.replace(/^\s*window\.__INITIAL_STATE__\s*=\s*/,'').replace(/;\s*$/,''));}catch{state=null;}
 let fabric='';
 function readLabels(node:any){if(!node||typeof node!=='object')return;const label=node.label_0?.value?.text;const value=node.label_1?.value?.text;if(label==='Fabric'&&!fabric)fabric=Array.isArray(value)?value.join(', '):typeof value==='string'?value:'';for(const child of Object.values(node))readLabels(child);}
 function scopedDetails(node:any){if(!node||typeof node!=='object')return;if(node.tracking?.productId===p.sku&&/PRODUCT_DETAILS/i.test(node.tracking?.widgetType??''))readLabels(node);else for(const child of Object.values(node))scopedDetails(child);}
 scopedDetails(state);
 // Older product pages expose their specifications as an ordinary table.
 if(!fabric)$('tr').each((_i,el)=>{const cells=$(el).find('td');if(cells.first().text().trim()==='Fabric')fabric=cells.last().text().trim();});
 return {title:p.name.slice(0,200),url,price,colour:typeof p.color==='string'?p.color.slice(0,60):'',fabric:fabric.slice(0,80),observedAt};
}
async function page(url:string):Promise<string>{
 const response=await fetch(url,{signal:AbortSignal.timeout(12000),redirect:'error'});
 if(!response.ok)throw new Error(`Store unavailable: HTTP ${response.status}`);
 const html=await response.text();if(html.length>5000000)throw new Error('Unexpected store response');return html;
}
export async function discover(requirements:Requirements):Promise<Option[]>{
 const search=new URL('https://www.flipkart.com/search');search.searchParams.set('q',searchTerms(requirements));
 const urls=listingUrls(await page(search.href));if(!urls.length)throw new Error('No readable live catalogue');
 const matches:Option[]=[];
 for(let offset=0;offset<urls.length&&matches.length<3;offset+=3){
  const results=await Promise.allSettled(urls.slice(offset,offset+3).map(async url=>productOption(await page(url),url,Date.now())));
  for(const result of results)if(result.status==='fulfilled'&&result.value&&matchesOption(result.value,requirements))matches.push(result.value);
 }
 return matches.sort((a,b)=>a.price-b.price).slice(0,3);
}
export const search=internalAction({args:{requirements:requirementsValidator},returns:v.object({options:v.array(optionValidator),failed:v.boolean(),reason:v.optional(v.string())}),handler:async(_ctx,{requirements}):Promise<{options:Option[];failed:boolean;reason?:string}>=>{
 try{return {options:await discover(requirements),failed:false};}catch(error){return {options:[],failed:true,reason:error instanceof Error?error.message.slice(0,120):'Unknown store error'};}
}});
export const webSearch=action({args:{requirements:requirementsValidator},returns:v.object({options:v.array(optionValidator),failed:v.boolean()}),handler:async(ctx,{requirements}):Promise<{options:Option[];failed:boolean}>=>{
 const owner=await getAuthUserId(ctx);if(!owner)throw new Error('Please sign in.');
 const budget=requirements.budget;
 if(!['kurta','dress','top','saree'].includes(requirements.category??'')||typeof budget!=='number'||!Number.isFinite(budget)||budget<100||budget>50000)throw new Error('Choose clothing and a budget between ₹100 and ₹50,000.');
 for(const field of ['size','colour','fabric'] as const)if(requirements[field]&&(requirements[field]!.length>40||/[\r\n]/.test(requirements[field]!)))throw new Error('Invalid search preference.');
 const id=await ctx.runMutation(internal.webDiscovery.claim,{owner});
 try{return {options:await discover(requirements),failed:false};}catch{return {options:[],failed:true};}finally{await ctx.runMutation(internal.webDiscovery.finish,{id});}
}});
