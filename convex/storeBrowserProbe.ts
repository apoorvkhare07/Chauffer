"use node";
// Internal, manually invoked access experiment. Not connected to shopper searches.
import {load} from 'cheerio';
import {v} from 'convex/values';
import {internalAction} from './_generated/server';
import {storeValidator,storeConfig,productStore,type Store} from './storeConfig';
import {storeSearchUrl} from './marketplaces';

const resultValidator=v.object({store:storeValidator,status:v.union(v.literal('not_configured'),v.literal('page_read'),v.literal('no_product_evidence'),v.literal('provider_unavailable')),pageTitle:v.optional(v.string()),httpStatus:v.optional(v.number()),targetHttpStatus:v.optional(v.number()),failure:v.optional(v.union(v.literal('navigation_timeout'),v.literal('invalid_key'),v.literal('access_refused'),v.literal('quota_or_concurrency'),v.literal('provider_error'),v.literal('request_timeout'),v.literal('request_failed'))),productLinks:v.number(),samples:v.array(v.object({url:v.string(),text:v.string()}))});
export async function browserAccessProbe(store:Store,token?:string):Promise<import('convex/values').Infer<typeof resultValidator>>{
 const empty={store,productLinks:0,samples:[]};
 if(!token)return {...empty,status:'not_configured'};
 // Fixed invented shopping request only: never send a user's chat, profile or
 // pictures to this experiment. One browser call; no proxy, solving or retries.
 const url=storeSearchUrl(store,{category:'sneakers',audience:'men',budget:5000});
 const endpoint=new URL('https://production-sfo.browserless.io/content');endpoint.searchParams.set('token',token);
 const selector=store==='Amazon'?'[data-component-type="s-search-result"]':store==='Myntra'?'a[href*="/buy"]':['SNITCH','NEWME','The Souled Store'].includes(store)?'a[href*="/product/"], a[href*="/buy"]':'a[href*="/p/"]';
 try{
  const response=await fetch(endpoint.href,{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(35000),redirect:'error',body:JSON.stringify({url,gotoOptions:{waitUntil:'domcontentloaded',timeout:15000},waitForSelector:{selector,timeout:12000},bestAttempt:true,rejectResourceTypes:['image','media','font']})});
  if(!response.ok){await response.body?.cancel();return {...empty,status:'provider_unavailable',httpStatus:response.status,failure:response.status===408?'navigation_timeout':response.status===401?'invalid_key':response.status===403?'access_refused':response.status===429?'quota_or_concurrency':'provider_error'};}
  const reader=response.body?.getReader();if(!reader)return {...empty,status:'provider_unavailable'};
  let bytes=0;const chunks:Uint8Array[]=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>5000000)throw new Error('Response too large');chunks.push(value);}}finally{await reader.cancel();}
  const $=load(Buffer.concat(chunks).toString('utf8')),products=new Map<string,string>();
  for(const el of $('a[href]').toArray()){
   let target;try{target=new URL($(el).attr('href')!,storeConfig[store].origin);}catch{continue;}
   if(productStore(target.href)!==store)continue;
   target.search='';target.hash='';
   if(!products.has(target.href))products.set(target.href,$(el).text().replace(/\s+/g,' ').trim().slice(0,250));
  }
  const targetStatus=Number(response.headers.get('x-response-code'));
  return {store,status:products.size?'page_read':'no_product_evidence',pageTitle:$('title').text().trim().slice(0,160),httpStatus:response.status,...(targetStatus>=100&&targetStatus<=599?{targetHttpStatus:targetStatus}:{}),productLinks:products.size,samples:[...products].slice(0,5).map(([url,text])=>({url,text}))};
 }catch(error){
  // Provider errors can contain the credential-bearing URL. Never log/return it.
  return {...empty,status:'provider_unavailable',failure:error instanceof Error&&error.name==='TimeoutError'?'request_timeout':'request_failed'};
 }
}
export const run=internalAction({args:{store:storeValidator},returns:resultValidator,handler:async(_ctx,{store})=>browserAccessProbe(store,process.env.BROWSERLESS_API_KEY)});
