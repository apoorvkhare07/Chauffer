import {v} from 'convex/values';
import {searchTerms,type Requirements} from './discoveryRules';
export const stores=['Flipkart','Amazon','Meesho'] as const;
export type Store=typeof stores[number];
export const storeValidator=v.union(v.literal('Flipkart'),v.literal('Amazon'),v.literal('Meesho'));
export const storeResultValidator=v.object({store:storeValidator,status:v.union(v.literal('matched'),v.literal('no_matches'),v.literal('unavailable')),searchUrl:v.string()});
export type StoreResult={store:Store;status:'matched'|'no_matches'|'unavailable';searchUrl:string};
export function storeSearchUrl(store:Store,r:Requirements):string {
 const url=new URL(store==='Flipkart'?'https://www.flipkart.com/search':store==='Amazon'?'https://www.amazon.in/s':'https://www.meesho.com/search');
 url.searchParams.set(store==='Amazon'?'k':'q',searchTerms(r));
 if(store==='Amazon'&&r.budget)url.searchParams.set('rh',`p_36:-${Math.floor(r.budget*100)}`);
 return url.href;
}
