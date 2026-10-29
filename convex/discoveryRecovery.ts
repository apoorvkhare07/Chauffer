"use node";
import {v} from 'convex/values';
import {internalAction} from './_generated/server';
import {internal} from './_generated/api';
import {storeValidator,storeSearchUrl} from './marketplaces';
import {zyteExtract} from './zyteClient';
import {zyteListingPool} from './zyteDiscovery';
// Four scheduled workers maximum per search. Browser recovery fills the pool
// after the first response; it is never part of the successful first-response wait.
export const run=internalAction({args:{taskId:v.id('recommendationTasks'),stores:v.array(storeValidator)},returns:v.null(),handler:async(ctx,{taskId,stores})=>{
 const deadline=Date.now()+45000;
 for(const store of stores.slice(0,5)){
  const c=await ctx.runQuery(internal.discoveryCache.recoveryContext,{taskId});
  if(!c||Date.now()>Math.min(deadline,c.deadlineAt)-1000)return null;
  let options:ReturnType<typeof zyteListingPool>=[],readable=false;
  try{const data=await zyteExtract(storeSearchUrl(store,c.requirements,false),'productList',Math.min(18000,deadline-Date.now()),'browserHtml');options=zyteListingPool(data,store,Date.now(),c.requirements);readable=true;}catch{/* A failed page is not evidence of absent stock. */}
  await ctx.runMutation(internal.discoveryCache.put,{taskId,store,options,readable});
 }
 return null;
}});
