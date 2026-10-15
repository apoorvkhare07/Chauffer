import {v} from 'convex/values';
import {searchTerms,optionValidator,type Requirements} from './discoveryRules';
import {stores,storeValidator,merchantSearchUrl,type Store} from './storeConfig';
export {stores,storeValidator,type Store};
export const storeResultValidator=v.object({store:storeValidator,status:v.union(v.literal('matched'),v.literal('no_matches'),v.literal('unavailable')),searchUrl:v.string()});
export type StoreResult={store:Store;status:'matched'|'no_matches'|'unavailable';searchUrl:string};
export function storeSearchUrl(store:Store,r:Requirements,includeSoft=true):string {
 return merchantSearchUrl(store,searchTerms(r,includeSoft),r.budget);
}

export const discoveryResultValidator=v.object({options:v.array(optionValidator),failed:v.boolean(),stores:v.array(storeResultValidator)});
