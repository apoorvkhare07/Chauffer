import {validBrowseOptions} from './browseRules';
import {query,httpAction} from './_generated/server';
import {getAuthUserId} from '@convex-dev/auth/server';
import {internal} from './_generated/api';
import {hashSecret} from './lib/otp';
import {referenceValidator,sourceValidator,validProduct,signLink,verifyLink,signingSecret} from './affiliateRules';
import {destination,convertCuelinks,cuelinksEnabled} from './affiliateProviders';
import {productStore} from './storeConfig';
import type {Option} from './discoveryRules';

// Only stored, owner-bound evidence (or the guest's secret) can mint a link.
// No owner/guest token is embedded in the resulting URL or sent to providers.
export const link=query({args:{reference:referenceValidator,source:sourceValidator},handler:async(ctx,{reference:r,source}):Promise<{href:string;affiliate:boolean;amazon:boolean}|null>=>{
 let option:Option|undefined;
 if(r.kind==='guest'){
  if(source!=='guest-search'||!/^[a-f0-9-]{72}$/.test(r.token))return null;
  const tokenHash=await hashSecret(r.token);
  const row=await ctx.db.query('guestSearches').withIndex('by_token',q=>q.eq('tokenHash',tokenHash)).unique();
  if(row?.state==='ready')option=row.result?.options.find(o=>o.url===r.url);
 }else{
  const owner=await getAuthUserId(ctx);if(!owner)return null;
  if(r.kind==='basket'){
   if(source!=='basket')return null;
   const row=await ctx.db.get(r.id);if(row?.owner===owner)option=row.option;
  }else if(r.kind==='catalog'){
   if(source!=='catalog')return null;
   const row=await ctx.db.get(r.id);if(row)option=validBrowseOptions(row.options,row.store).find(o=>o.url===r.url);
  }else if(r.kind==='message'){
   if(!['search','history'].includes(source))return null;
   const row=await ctx.db.get(r.id),conversation=row?await ctx.db.get(row.conversationId):null;
   if(row?.role==='assistant'&&conversation?.key===`web:${owner}`)option=row.result?.options.find(o=>o.url===r.url);
  }else if(r.kind==='saved'){
   if(!['saved','wardrobe-review'].includes(source))return null;
   const row=await ctx.db.get(r.id);if(row?.owner===owner)option=row.option;
  }else if(r.kind==='daily'){
   if(source!=='daily')return null;
   const row=await ctx.db.get(r.id);if(row?.owner===owner&&row.state==='ready')option=row.options.find(o=>o.url===r.url);
  }else{
   if(source!=='price-comparison')return null;
   const saved=await ctx.db.get(r.id);
   if(saved?.owner===owner){const row=await ctx.db.query('priceIntelligence').withIndex('by_saved',q=>q.eq('savedId',r.id)).unique();option=row?.report.matches.find(m=>m.option.url===r.url)?.option;}
  }
 }
 const store=option?.store??(option?productStore(option.url):undefined);
 if(!option||!store||!validProduct(option.url,store))return null;
 const secret=signingSecret(),site=process.env.CONVEX_SITE_URL;
 // Safe setup fallback: signed routing needs its own server-only secret.
 if(!secret||!site)return {href:option.url,affiliate:false,amazon:false};
 const token=await signLink({v:1,url:option.url,store,source,exp:Date.now()+24*60*60*1000},secret);
 const amazon=Boolean(process.env.AMAZON_ASSOCIATE_TAG);
 return {href:`${site}/go?token=${encodeURIComponent(token)}`,affiliate:amazon||cuelinksEnabled(),amazon};
}});
const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
export const go=httpAction(async(ctx,request)=>{
 const params=new URL(request.url).searchParams;
 if([...params.keys()].some(k=>k!=='token')||params.getAll('token').length!==1)return new Response('Invalid product reference',{status:400,headers});
 const secret=signingSecret();if(!secret)return new Response('Product links are temporarily unavailable',{status:503,headers});
 const claims=await verifyLink(params.get('token')!,secret);
 if(!claims)return new Response('This product link is invalid or expired. Reload Chauffeur and reopen the product.',{status:400,headers});
 const resolved=await destination(claims.store,claims.url,claims.source,{convert:async(productUrl,source)=>{
  const config=await hashSecret(process.env.CUELINKS_API_KEY??'');
  const cached=await ctx.runMutation(internal.affiliateCore.reserve,{productUrl,source,config});
  if(!cached.convert)return cached.url;
  const result=await convertCuelinks(productUrl,source);
  await ctx.runMutation(internal.affiliateCore.cache,{productUrl,source,config,url:result.url,ttl:result.ttl});
  return result.url;
 }});
 try{
  await ctx.runMutation(internal.affiliateCore.record,{store:claims.store,productUrl:claims.url,linkType:resolved.linkType,source:claims.source});
 }catch{
  // A metrics outage must not prevent shopping or send an unrecorded affiliate click.
  return new Response(null,{status:302,headers:{...headers,Location:claims.url}});
 }
 return new Response(null,{status:302,headers:{...headers,Location:resolved.url}});
});

export const disclosure=query({args:{},handler:async()=>({enabled:Boolean(signingSecret()&&process.env.CONVEX_SITE_URL&&(process.env.AMAZON_ASSOCIATE_TAG||cuelinksEnabled())),amazon:Boolean(process.env.AMAZON_ASSOCIATE_TAG)})});
