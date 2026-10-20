import {affiliateRules,validProduct,type AffiliateSource,type LinkType} from './affiliateRules';
import type {Store} from './storeConfig';
export type Destination={url:string;linkType:LinkType};
export type Conversion={url:string|null;ttl:number};
export type ProviderContext={convert:(url:string,source:AffiliateSource)=>Promise<string|null>};
export function cuelinksEnabled(){return process.env.CUELINKS_ENABLED==='true'&&Boolean(process.env.CUELINKS_API_KEY);}
export function safeTrackingUrl(raw:unknown,original:string,source?:AffiliateSource):string|null{
 try{
  if(typeof raw!=='string'||raw.length>8192)return null;
  const u=new URL(raw);
  // Use the documented long URL only, never arbitrary/shortened redirect hosts.
  if(u.protocol!=='https:'||u.hostname!=='linksredirect.com'||u.port||u.username||u.password||u.pathname!=='/'||u.hash||u.searchParams.getAll('url').length!==1||u.searchParams.get('url')!==original||(source!==undefined&&u.searchParams.get('subid')!==source))return null;
  return u.href;
 }catch{return null;}
}
export async function convertCuelinks(url:string,source:AffiliateSource,fetcher:typeof fetch=fetch):Promise<Conversion>{
 if(!cuelinksEnabled())return {url:null,ttl:0};
 try{
  const response=await fetcher('https://developers.cuelinks.com/pub_api/v3/links/convert',{
   method:'POST',redirect:'error',signal:AbortSignal.timeout(2500),
   headers:{Authorization:`Token ${process.env.CUELINKS_API_KEY}`,'Content-Type':'application/json'},
   body:JSON.stringify({url,subid:source,shorten:false}),
  });
  if(!response.ok||Number(response.headers.get('content-length')??0)>32768)return {url:null,ttl:60_000};
  // Bound the response body even if Content-Length is absent or dishonest.
  const reader=response.body?.getReader();if(!reader)return {url:null,ttl:60_000};
  const chunks:Uint8Array[]=[];let length=0;
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>32768){await reader.cancel();return {url:null,ttl:60_000};}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const data=JSON.parse(new TextDecoder().decode(bytes))?.data;
  const tracked=data?.affiliated===true&&data.original_url===url?safeTrackingUrl(data.tracking_url,url,source):null;
  return {url:tracked,ttl:tracked?24*60*60*1000:5*60*1000};
 }catch{return {url:null,ttl:60_000};}
}
const providers:Record<LinkType,(url:string,source:AffiliateSource,ctx:ProviderContext)=>Promise<Destination>>={
 plain:async url=>({url,linkType:'plain'}),
 'amazon-tag':async url=>{
  const tag=process.env.AMAZON_ASSOCIATE_TAG;
  if(!tag||!/^[a-zA-Z0-9_-]{1,80}$/.test(tag))return {url,linkType:'plain'};
  const target=new URL(url);target.searchParams.set('tag',tag);
  return {url:target.href,linkType:'amazon-tag'};
 },
 cuelinks:async(url,source,ctx)=>{
  if(!cuelinksEnabled())return {url,linkType:'plain'};
  const converted=await ctx.convert(url,source);
  const safe=safeTrackingUrl(converted,url,source);
  return safe?{url:safe,linkType:'cuelinks'}:{url,linkType:'plain'};
 },
};
export async function destination(store:Store,url:string,source:AffiliateSource,ctx:ProviderContext):Promise<Destination>{
 if(!validProduct(url,store))throw new Error('Invalid product destination');
 const rule=affiliateRules[store];
 try{return await providers[rule.deepLinkAllowed?rule.provider:'plain'](url,source,ctx);}catch{return {url,linkType:'plain'};}
}
