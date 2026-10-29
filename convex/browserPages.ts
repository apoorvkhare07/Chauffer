"use node";
import {storeConfig,type Store} from './storeConfig';
export class BrowserPageError extends Error{
 constructor(public code:'not_configured'|'navigation_timeout'|'invalid_key'|'access_refused'|'quota_or_concurrency'|'provider_error'|'request_timeout'|'request_failed',public httpStatus?:number){super(`Browser read unavailable: ${code}`);}
}
export async function browserPage(store:Store,url:string,token=process.env.BROWSERLESS_API_KEY,timeoutMs=35000,purpose:'listing'|'product'='listing'):Promise<{html:string;httpStatus:number;targetHttpStatus?:number}>{
 if(!token)throw new BrowserPageError('not_configured');
 const target=new URL(url);
 if(target.origin!==storeConfig[store].origin||target.username||target.password||url.length>1500)throw new BrowserPageError('request_failed');
 const endpoint=new URL('https://production-sfo.browserless.io/content');endpoint.searchParams.set('token',token);
 // These three failed on the standard route but returned priced listings in
 // the India residential trial. Other stores retain the cheaper standard route.
 if(['Amazon','Myntra','Meesho'].includes(store)){
  endpoint.searchParams.set('proxy','residential');endpoint.searchParams.set('proxyCountry','in');endpoint.searchParams.set('proxySticky','true');
 }
 const selector=purpose==='product'?'meta[property="og:image"], script[type="application/ld+json"]':store==='H&M'?'a[href*="/en_in/productpage."]':store==='Uniqlo'?'a.product-tile__link[href*="/in/en/products/"]':store==='Amazon'?'[data-component-type="s-search-result"]':store==='Myntra'?'a[href*="/buy"]':['SNITCH','NEWME','The Souled Store'].includes(store)?'a[href*="/product/"], a[href*="/buy"]':'a[href*="/p/"]';
 try{
  const response=await fetch(endpoint.href,{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(Math.min(35000,Math.max(1,timeoutMs))),redirect:'error',body:JSON.stringify({url,gotoOptions:{waitUntil:'domcontentloaded',timeout:Math.min(15000,timeoutMs)},waitForSelector:{selector,timeout:Math.min(12000,timeoutMs)},bestAttempt:true,rejectResourceTypes:['image','media','font','stylesheet']})});
  if(!response.ok){await response.body?.cancel();throw new BrowserPageError(response.status===408?'navigation_timeout':response.status===401?'invalid_key':response.status===403?'access_refused':response.status===429?'quota_or_concurrency':'provider_error',response.status);}
  const reader=response.body?.getReader();if(!reader)throw new BrowserPageError('provider_error');let bytes=0;const chunks:Uint8Array[]=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>5000000)throw new BrowserPageError('provider_error');chunks.push(value);}}finally{await reader.cancel();}
  const targetStatus=Number(response.headers.get('x-response-code'));
  return {html:Buffer.concat(chunks).toString('utf8'),httpStatus:response.status,...(targetStatus>=100&&targetStatus<=599?{targetHttpStatus:targetStatus}:{})};
 }catch(error){
  if(error instanceof BrowserPageError)throw error;
  // Fetch failures can contain the credential-bearing endpoint. Never expose it.
  throw new BrowserPageError(error instanceof Error&&error.name==='TimeoutError'?'request_timeout':'request_failed');
 }
}
