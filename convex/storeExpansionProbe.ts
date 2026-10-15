"use node";
// Manual, fixed-query access check. No shopper history or paid browser requests.
import {browserPage,BrowserPageError} from './browserPages';
import {v} from 'convex/values';
import {internalAction} from './_generated/server';
import {addedStores,storeValidator} from './storeConfig';
import {storeSearchUrl} from './marketplaces';
import {expandedStoreBody} from './liveDiscovery';
import {expandedRetailOptions} from './expandedRetail';
import {optionValidator,type Requirements} from './discoveryRules';
const scenarios={women_jeans:{category:'jeans',audience:'women',budget:3000,size:'32'},men_shirts:{category:'shirt',audience:'men',budget:2500,size:'M'},men_footwear:{category:'shoes',audience:'men',budget:15000,size:'UK 8'}} satisfies Record<string,Requirements>;
export const run=internalAction({args:{browserUniqlo:v.optional(v.boolean()),scenario:v.union(v.literal('women_jeans'),v.literal('men_shirts'),v.literal('men_footwear'))},returns:v.array(v.object({store:storeValidator,status:v.union(v.literal('matched'),v.literal('no_matches'),v.literal('unavailable')),count:v.number(),reason:v.optional(v.string()),samples:v.array(optionValidator)})),handler:async(_ctx,{scenario,browserUniqlo})=>{
 const r=scenarios[scenario];return Promise.all((browserUniqlo?addedStores.filter(store=>store==='Uniqlo'):addedStores).map(async store=>{try{const body=store==='Uniqlo'&&browserUniqlo?(await browserPage(store,storeSearchUrl(store,r))).html:await expandedStoreBody(store,r,storeSearchUrl(store,r));const found=expandedRetailOptions(store,body,r,Date.now());return {store,status:!found.readable?'unavailable' as const:found.options.length?'matched' as const:'no_matches' as const,count:found.options.length,...(!found.readable?{reason:'no_readable_products'}:{}),samples:found.options.slice(0,2)};}catch(error){return {store,status:'unavailable' as const,count:0,reason:error instanceof BrowserPageError?error.code:error instanceof Error&&/^Store unavailable: HTTP \d{3}$/.test(error.message)?error.message:'request_failed',samples:[]};}}));
}});
