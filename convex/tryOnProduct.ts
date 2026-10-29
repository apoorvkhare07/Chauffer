"use node";
import {load} from 'cheerio';
import {zyteProduct} from './zyteClient';
import {allowedImageUrl,allowedProductUrl} from './discoveryRules';
import {productStore} from './storeConfig';
import {jsonAssignment} from './retailExtractors';
import {curatedProductForUrl} from '../shared/productEdits';

export function productImage(html:string,url:string):{title:string;imageUrl:string}|null{
 const $=load(html),candidates:{image:unknown;title:unknown}[]=[];
 const title=$('meta[property="og:title"]').attr('content')||$('title').text()||'Linked product';
 const add=(image:unknown,name:unknown=title)=>{if(Array.isArray(image))for(const i of image.slice(0,8))add(i,name);else candidates.push({image:typeof image==='object'&&image!==null?(image as any).url??(image as any).contentUrl:image,title:name});};
 // Product records are preferable to tiny social sharing thumbnails or site logos.
 const walk=(record:any,depth=0)=>{if(!record||depth>5)return;if(Array.isArray(record)){record.slice(0,50).forEach(x=>walk(x,depth+1));return;}if(typeof record!=='object')return;if([record['@type']].flat().includes('Product'))add(record.image,record.name);if(record['@graph'])walk(record['@graph'],depth+1);};
 for(const el of $('script[type="application/ld+json"]').toArray())try{walk(JSON.parse($(el).text()));}catch{/* Ignore invalid merchant JSON. */}
 if(productStore(url)==='Myntra'){
  const pdp=jsonAssignment(html,'window.__myx')?.pdpData;
  if(pdp&&String(pdp.id)===new URL(url).pathname.match(/\d+(?=\/buy\/?$|\/?$)/)?.[0])for(const item of (pdp.media?.albums?.[0]?.images??[]).slice(0,8))add(item.imageURL,pdp.name);
 }
 add($('meta[property="og:image"],meta[name="og:image"]').attr('content'));
 add($('meta[name="twitter:image"],meta[property="twitter:image"]').attr('content'));
 for(const candidate of candidates){if(typeof candidate.image!=='string'||!candidate.image.trim())continue;try{const imageUrl=new URL(candidate.image.trim(),url);if(imageUrl.protocol==='http:')imageUrl.protocol='https:';if(allowedImageUrl(imageUrl.href))return {title:(typeof candidate.title==='string'?candidate.title:title).trim().slice(0,160),imageUrl:imageUrl.href};}catch{/* Invalid URL. */}}
 return null;
}
export async function directPage(url:string){
 if(url.length>2000||!allowedProductUrl(url))throw new Error('unsupported');
 const signal=AbortSignal.timeout(12000);let target=url;
 for(let hop=0;hop<3;hop++){
  const response=await fetch(target,{headers:{'User-Agent':'ChauffeurImageReader/1.0','Accept':'text/html,application/xhtml+xml'},redirect:'manual',signal});
  if([301,302,303,307,308].includes(response.status)){const location=response.headers.get('location');await response.body?.cancel();if(!location)throw new Error('redirect');const next=new URL(location,target).href;if(!allowedProductUrl(next)||productStore(next)!==productStore(url))throw new Error('redirect');target=next;continue;}
  if(!response.ok){await response.body?.cancel();throw new Error('unavailable');}
  const reader=response.body?.getReader();if(!reader)throw new Error('unavailable');let size=0;const chunks:Uint8Array[]=[];
  try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>3000000)throw new Error('large');chunks.push(part.value);}}finally{await reader.cancel();}
  return productImage(Buffer.concat(chunks).toString('utf8'),target);
 }
 throw new Error('redirect');
}
export async function readTryOnProduct(url:string){
 const curated=curatedProductForUrl(url);
 if(curated)return {title:curated.title,imageUrl:curated.imageUrl};
 if(process.env.ZYTE_API_KEY)return zyteProduct(url);
 const result=await directPage(url);
 if(!result)throw new Error('no image');
 return result;
}
