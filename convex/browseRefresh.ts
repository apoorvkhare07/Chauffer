"use node";
import {v} from 'convex/values';
import {internalAction} from './_generated/server';
import {internal} from './_generated/api';
import {retailOptions} from './retailExtractors';
import {expandedStoreBody} from './liveDiscovery';
import {browseSources,browseSourceOptions} from './browseRules';
import {zyteExtract} from './zyteClient';
import {zyteListingPool} from './zyteDiscovery';
import {merchantSearchUrl} from './storeConfig';
import type {Option} from './discoveryRules';
export const run=internalAction({args:{keys:v.array(v.string()),attemptedAt:v.number()},returns:v.null(),handler:async(ctx,{keys,attemptedAt})=>{
 // Continue in short chunks so adding brands cannot exceed an action’s runtime.
 for(const key of keys.slice(0,2)){
  const source=browseSources.find(s=>s.key===key);if(!source)continue;
  const url=merchantSearchUrl(source.store,source.query);let options:Option[]=[];
  const category=({'Tops':'top','Shirts':'shirt','Dresses':'dress','T-shirts':'t-shirt','Jeans':'jeans','Sneakers':'sneakers'} as Record<string,string>)[source.category];
  const requirements={category,...(source.targetBrand?{brand:source.targetBrand}:{}),...(source.audience!=='unisex'?{audience:source.audience}:{})};
  try{
   let directUrl=url;
   if(source.store==='Bonkers Corner')directUrl='https://www.bonkerscorner.com/search/suggest.json?q='+encodeURIComponent(source.query)+'&resources[type]=product&resources[limit]=10';
   if(source.store==='SNITCH')directUrl='https://api.snitch.com/products/search?page=1&limit=25&platform=web&keyword='+encodeURIComponent(source.query);
   options=retailOptions(source.store,await expandedStoreBody(source.store,requirements,directUrl),requirements,Date.now()).options.filter(o=>o.imageUrl).slice(0,10);
  }catch{/* A direct reader miss can use the common extraction route below. */}
  options=browseSourceOptions(options,source);
  // Fixed public queries only. No private chat, preferences, identity or photos enter this catalogue.
  for(const mode of ['httpResponseBody','browserHtml'] as const){
   if(options.length)break;
   try{options=browseSourceOptions(zyteListingPool(await zyteExtract(url,'productList',mode==='httpResponseBody'?8000:40000,mode),source.store,Date.now(),requirements),source);}catch{/* Keep previous observations if a store is temporarily unreadable. */}
   if(options.length)break;
  }
  await ctx.runMutation(internal.browseCatalog.finish,{key,attemptedAt,options});
 }
 if(keys.length>2)await ctx.scheduler.runAfter(0,internal.browseRefresh.run,{keys:keys.slice(2),attemptedAt});
 return null;
}});
