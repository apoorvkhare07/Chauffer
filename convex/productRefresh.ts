"use node";
import {action} from './_generated/server';
import {internal} from './_generated/api';
import {getAuthUserId} from '@convex-dev/auth/server';
import {v} from 'convex/values';
import {allowedProductUrl} from './discoveryRules';
import {productOption} from './liveDiscovery';
export const refresh=action({args:{id:v.id('savedProducts')},returns:v.union(v.literal('refreshed'),v.literal('unavailable')),handler:async(ctx,{id}):Promise<'refreshed'|'unavailable'>=>{
 const owner=await getAuthUserId(ctx);if(!owner)throw new Error('Please sign in.');
 const row=await ctx.runQuery(internal.savedProducts.read,{id,owner});
 if(!row||!allowedProductUrl(row.url))throw new Error('Saved product unavailable.');
 const claimId=await ctx.runMutation(internal.webDiscovery.claim,{owner});
 try{
  const response=await fetch(row.url,{redirect:'error',signal:AbortSignal.timeout(12000)});
  if(!response.ok)return 'unavailable';
  const html=await response.text();if(html.length>5000000)return 'unavailable';
  const fresh=productOption(html,row.url,Date.now());
  if(!fresh)return 'unavailable';
  await ctx.runMutation(internal.savedProducts.updateObservation,{id,owner,option:{...fresh,store:row.store,source:'product'}});
  return 'refreshed';
 }catch{return 'unavailable';}finally{await ctx.runMutation(internal.webDiscovery.finish,{id:claimId});}
}});
