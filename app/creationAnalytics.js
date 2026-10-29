import {track,tryOnAnalyticsContext} from '../analytics';
import {curatedProductForUrl} from '../shared/productEdits';
import {stores,storeConfig} from '../convex/storeConfig';
export function tryOnProperties(kind,{url,store,id}={}){
 const source=kind==='wardrobe'?'wardrobe':kind==='upload'?'upload':'product_link';
 if(source!=='product_link')return {source,product_id:typeof id==='string'?id:'unknown'};
 let known=stores.includes(store)?store:undefined;
 if(!known&&url)try{const parsed=new URL(url),host=parsed.hostname.replace(/^www\d*\./,'');if(parsed.protocol==='https:')known=stores.find(name=>new URL(storeConfig[name].origin).hostname.replace(/^www\d*\./,'')===host);}catch{}
 const curated=curatedProductForUrl(url);
 let productId=curated?.id;
 if(!productId&&known&&url)try{productId=new URL(url).pathname.match(/(?:\/|\.)([0-9]{5,})(?:\/buy|\.html|\/)?$/)?.[1];}catch{}
 return {source,store:known??'other',product_id:productId??(typeof id==='string'?id:'unknown'),...(curated?{source_page:curated.editSlug}:{})};
}
// Never send error.message: provider errors can include URLs, prompts or user data.
export function creationFailureReason(error){
 const data=typeof error==='string'?error:typeof error?.data==='string'?error.data:error?.message??'';
 if(/credit|billing|payment|402|allowance/.test(data.toLowerCase()))return 'billing_exhausted';
 if(/consent|agree to/i.test(data))return 'consent_required';
 if(/sign in|unauthenticated/i.test(data))return 'authentication_required';
 if(/current preview|still being made|already running/i.test(data))return 'request_in_progress';
 if(/quota|429|rate.?limit|service is busy|give it a minute/i.test(data))return 'rate_limited';
 if(error?.name==='TimeoutError'||/timed? ?out|took too long/i.test(data))return 'timeout';
 if(error?.name==='AbortError')return 'cancelled';
 if(/network|failed to fetch|offline/i.test(data))return 'network_error';
 if(/image.*unavailable|photo.*unavailable|no longer|expired/i.test(data))return 'image_unavailable';
 if(/jpeg|heic|smaller|photo could not be (read|converted)|image could not be read|clearer|no usable result/i.test(data))return 'invalid_image';
 if(/not configured|model.*unavailable|generation is (not available|unavailable)|creation is unavailable/i.test(data))return 'provider_unavailable';
 return 'generation_failed';
}
export function startCreationAttempt(family,properties,{remixed=false}={}){
 properties=family==='tryon'?tryOnAnalyticsContext(properties):properties;
 const started=performance.now();let finished=false;
 track(`${family}_started`,properties);
 if(remixed)track(`${family}_remixed`,properties);
 return {
  properties,
  complete(){if(finished)return;finished=true;track(`${family}_completed`,{...properties,duration_ms:Math.max(0,Math.round(performance.now()-started))});},
  fail(error){if(finished)return;finished=true;track(`${family}_failed`,{...properties,reason:creationFailureReason(error)});},
 };
}
// Watches only requests initiated here. Historic ready rows and repeated updates do nothing.
export function createAttemptObserver(){
 const pending=new Map();
 return {
  get size(){return pending.size;},
  add(id,attempt){pending.set(id,attempt);},
  observe(rows=[]){
   for(const row of rows){
    const attempt=pending.get(row.id);if(!attempt)continue;
    if(row.state==='ready'){attempt.complete();pending.delete(row.id);}
    else if(row.state==='failed'){attempt.fail(row.note);pending.delete(row.id);}
   }
  },
 };
}
export function trackTryOnExport(kind,properties={}){if(['download','share','video'].includes(kind))track('tryon_exported',tryOnAnalyticsContext({...properties,kind}));}
