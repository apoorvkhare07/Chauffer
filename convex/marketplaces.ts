import {v} from 'convex/values';
import {searchTerms,optionValidator,type Requirements} from './discoveryRules';
export const stores=['Flipkart','Amazon'] as const;
export type Store=typeof stores[number];
export const storeValidator=v.union(v.literal('Flipkart'),v.literal('Amazon'));
export const storeResultValidator=v.object({store:storeValidator,status:v.union(v.literal('matched'),v.literal('no_matches'),v.literal('unavailable')),searchUrl:v.string()});
export type StoreResult={store:Store;status:'matched'|'no_matches'|'unavailable';searchUrl:string};
export function storeSearchUrl(store:Store,r:Requirements):string {
 const url=new URL(store==='Flipkart'?'https://www.flipkart.com/search':'https://www.amazon.in/s');
 url.searchParams.set(store==='Amazon'?'k':'q',searchTerms(r));
 if(store==='Amazon'&&r.budget)url.searchParams.set('rh',`p_36:-${Math.floor(r.budget*100)}`);
 return url.href;
}

export const discoveryResultValidator=v.object({options:v.array(optionValidator),failed:v.boolean(),stores:v.array(storeResultValidator)});
