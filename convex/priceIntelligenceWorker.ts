"use node";
import {action} from './_generated/server';
import {internal} from './_generated/api';
import {v} from 'convex/values';
import {getAuthUserId} from '@convex-dev/auth/server';
import {allowedProductUrl,type Option} from './discoveryRules';
import {productOption,listingUrls} from './liveDiscovery';
import {amazonOptions} from './storeExtractors';
import {identityKind,readAdvertisedOffers} from './priceIntelligenceRules';
async function page(url:string){const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('Store unavailable.');const reader=r.body?.getReader();if(!reader)throw new Error('Empty response.');let length=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>5000000){await reader.cancel();throw new Error('Response too large.');}chunks.push(value);}return Buffer.concat(chunks).toString('utf8');}
export const check=action({args:{id:v.id('savedProducts')},returns:v.union(v.literal('checked'),v.literal('unavailable')),handler:async(ctx,{id}):Promise<'checked'|'unavailable'>=>{
 const owner=await getAuthUserId(ctx);if(!owner)throw new Error('Please sign in.');const saved=await ctx.runQuery(internal.savedProducts.read,{id,owner});if(!saved||!allowedProductUrl(saved.url))throw new Error('Saved product unavailable.');const claim=await ctx.runMutation(internal.webDiscovery.claim,{owner});
 const checkedAt=Date.now();const gaps=['Requested size and stock are not verified.','Shipping, seller and return conditions need store confirmation.','Advertised offers are conditional; no discount is applied.'];
 try{
  const html=await page(saved.url),fresh=productOption(html,saved.url,checkedAt);
  if(!fresh)throw new Error('Product page unreadable.');
  const base:Option={...fresh,store:saved.store,source:'product'};
  await ctx.runMutation(internal.savedProducts.updateObservation,{id,owner,option:base});
  const query=[base.brand,base.manufacturerCode||base.title].filter(Boolean).join(' ').slice(0,180);
  const candidates:Option[]=[];
  try{
   if(saved.store==='Flipkart'){
    const url=new URL('https://www.amazon.in/s');url.searchParams.set('k',query);
    const category=/saree|sari/i.test(base.title)?'saree':/dress/i.test(base.title)?'dress':/top|tunic/i.test(base.title)?'top':'kurta';
    const links=amazonOptions(await page(url.href),{category,budget:50000},Date.now(),[],3);
    const results=await Promise.allSettled(links.map(async link=>{const detail=productOption(await page(link.url),link.url,Date.now());return detail?{...detail,store:'Amazon' as const,source:'product' as const}:link;}));
    for(const result of results)if(result.status==='fulfilled')candidates.push(result.value);
   }else{
    const url=new URL('https://www.flipkart.com/search');url.searchParams.set('q',query);
    const links=listingUrls(await page(url.href)).slice(0,3);
    const results=await Promise.allSettled(links.map(async link=>{const detail=productOption(await page(link),link,Date.now());return detail?{...detail,store:'Flipkart' as const,source:'product' as const}:null;}));
    for(const result of results)if(result.status==='fulfilled'&&result.value)candidates.push(result.value);
   }
  }catch{gaps.push('The other store could not be searched just now.');}
  if(!candidates.length)gaps.push('No other-store candidates were readable; this does not establish that the product is unavailable there.');
  if(!base.brand||!base.manufacturerCode)gaps.push('The store does not supply enough manufacturer identity to verify an exact cross-store match.');
  await ctx.runMutation(internal.priceIntelligence.record,{id,owner,report:{checkedAt,status:'checked',note:'Fresh listed price and advertised terms checked. Same-product identity does not establish matching size or delivered total.',offers:readAdvertisedOffers(html,base.url),matches:candidates.map(option=>({option,identity:identityKind(base,option)})),gaps}});
  return 'checked';
 }catch{
  await ctx.runMutation(internal.priceIntelligence.record,{id,owner,report:{checkedAt,status:'unavailable',note:'The store did not provide a readable current product page. Your previous price remains dated; no offers or matches were inferred.',offers:[],matches:[],gaps}});return 'unavailable';
 }finally{await ctx.runMutation(internal.webDiscovery.finish,{id:claim});}
}});
