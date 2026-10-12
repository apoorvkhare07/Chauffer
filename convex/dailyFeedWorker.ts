"use node";
import {internalAction} from './_generated/server';
import {internal} from './_generated/api';
import {v} from 'convex/values';
import {discoverAcrossStores,productOption} from './liveDiscovery';
import {rankOptions,chooseBatch} from './ranking';
import {allowedProductUrl} from './discoveryRules';
import {listedDrop} from './feedRules';
export const generate=internalAction({args:{id:v.id('dailyFeeds')},returns:v.null(),handler:async(ctx,{id})=>{
 const plan=await ctx.runQuery(internal.dailyFeed.plan,{id});
 if(!plan){await ctx.runMutation(internal.dailyFeed.finish,{id,options:[],drops:[],stores:[],failed:false,note:'Daily picks paused.'});return null;}
 try{
  const watched=plan.watched.filter(w=>rankOptions([w.option],plan.requirements,plan.taste).length).slice(0,3);
  const [result,checks]=await Promise.all([discoverAcrossStores(plan.requirements,plan.excludeUrls,plan.taste,6),Promise.all(watched.map(async w=>{
   try{
    if(!allowedProductUrl(w.option.url)||w.option.store!=='Flipkart')return null;
    const response=await fetch(w.option.url,{redirect:'error',signal:AbortSignal.timeout(12000)});if(!response.ok)return null;
    const html=await response.text();if(html.length>5000000)return null;
    const fresh=productOption(html,w.option.url,Date.now());if(!fresh)return null;
    const option={...fresh,store:w.option.store,source:'product' as const};
    await ctx.runMutation(internal.savedProducts.updateObservation,{id:w.id,owner:plan.owner,option});
    return {option,drop:listedDrop(w.option,option,Date.now())};
   }catch{return null;}
  }))]);
  const drops=checks.flatMap(c=>c?.drop?[c.drop]:[]);
  const dropped=checks.flatMap(c=>c?.drop?[c.option]:[]);
  const candidates=chooseBatch([...dropped,...result.options.filter(o=>!dropped.some(d=>d.url===o.url))],plan.requirements,plan.taste,6,drops.map(d=>d.url));
  const options=[...candidates.filter(o=>drops.some(d=>d.url===o.url)),...candidates.filter(o=>!drops.some(d=>d.url===o.url))];
  await ctx.runMutation(internal.dailyFeed.finish,{id,options,drops:drops.filter(d=>options.some(o=>o.url===d.url)),stores:result.stores,failed:result.failed&&!options.length,note:options.length<4?'Fewer than four matching options could be read today; no filler products were added.':'Fresh picks based on your current chat. Saved matching Flipkart items were checked for listed-price changes.'});
 }catch{await ctx.runMutation(internal.dailyFeed.finish,{id,options:[],drops:[],stores:[],failed:true,note:'Stores could not be checked today. No sample recommendations were substituted.'});}
 return null;
}});
