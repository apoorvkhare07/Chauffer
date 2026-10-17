"use node";
import {internalAction} from './_generated/server';
import {internal} from './_generated/api';
import {v} from 'convex/values';
import {discoverAcrossStores} from './liveDiscovery';
import {chooseBatch} from './ranking';

export const generate=internalAction({args:{id:v.id('dailyFeeds')},returns:v.null(),handler:async(ctx,{id})=>{
 const plan=await ctx.runQuery(internal.dailyFeed.plan,{id});
 if(!plan){await ctx.runMutation(internal.dailyFeed.finish,{id,options:[],drops:[],stores:[],failed:false,note:'Daily picks paused.'});return null;}
 try{
  const results=await Promise.all(plan.picks.map(async pick=>{
   try{
    const result=await discoverAcrossStores(pick.requirements,plan.excludeUrls,pick.taste,2);
    const option=chooseBatch(result.options,pick.requirements,pick.taste,1)[0];
    return {category:pick.category,option,failed:result.failed};
   }catch{return {category:pick.category,option:undefined,failed:true};}
  }));
  const options=results.flatMap(({category,option})=>option?[{...option,category}]:[]).slice(0,3);
  const failed=!options.length&&results.every(r=>r.failed);
  const note=options.length?`Found ${options.length} style picks for today.`:failed?'Today’s picks could not be loaded. We’ll try again tomorrow.':'No matching picks were available today. We’ll try again tomorrow.';
  await ctx.runMutation(internal.dailyFeed.finish,{id,options,drops:[],stores:[],failed,note});
 }catch{await ctx.runMutation(internal.dailyFeed.finish,{id,options:[],drops:[],stores:[],failed:true,note:'Today’s picks could not be loaded. We’ll try again tomorrow.'});}
 return null;
}});
