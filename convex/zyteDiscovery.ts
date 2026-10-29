"use node";
import {normalizeZyteProduct,zyteExtract} from './zyteClient';
import {storeSearchUrl,stores,type StoreResult} from './marketplaces';
import {matchesOption,matchesCandidate,colourTier,type Option,type Requirements} from './discoveryRules';
import {namedBrands} from './discoveryPolicy';
import type {Store} from './storeConfig';

// A common listing reader, independent of each merchant's HTML layout.
// Missing/blocked extraction is unavailable, never evidence of no stock.
export function zyteListingPool(data:any,store:Store,observedAt:number,requirements?:Requirements):Option[]{
 const products=data?.productList?.products;
 if(!Array.isArray(products))throw new Error('Listing unavailable');
 const seen=new Set<string>(),options:Option[]=[];
 for(const raw of products.slice(0,60)){
  const p=normalizeZyteProduct(raw,store);
  if(!p||!p.price||p.currency!=='INR'||!p.imageUrl||seen.has(p.url))continue;
  if(typeof raw.availability==='string'&&/out.?of.?stock|sold.?out|discontinued/i.test(raw.availability))continue;
  // Product paths are merchant evidence; query strings contain shopper words and are never evidence.
  let path=new URL(p.url).pathname;try{path=decodeURIComponent(path);}catch{/* Keep malformed merchant escapes as text. */}
  path=path.replace(/[-_/]+/g,' ').slice(0,500);
  const facts=[p.title,path,typeof raw.material==='string'?raw.material:''].join(' ');
  const pathBrands=namedBrands(path);
  const brand=typeof raw.brand==='string'?raw.brand:typeof raw.brand?.name==='string'?raw.brand.name:pathBrands.length===1?pathBrands[0]:undefined;
  const option:Option={title:p.title,url:p.url,price:p.price,imageUrl:p.imageUrl,store,source:'listing',priceFrom:true,observedAt,
   colour:p.colour||facts.match(/\b(navy blue|dark blue|light blue|blue|navy|cobalt|indigo|black|white|red|pink|green|yellow|purple|lavender|lilac|violet|mauve|plum|orange|beige|brown|grey|gray)\b/gi)?.join(' ').slice(0,160)||'',
   fabric:facts.match(/\b(pure cotton|100% cotton|cotton blend|linen blend|cotton|linen|silk|rayon|viscose|georgette|chiffon|leather|suede|mesh|canvas)\b/gi)?.filter((value,index,all)=>all.findIndex(other=>other.toLowerCase()===value.toLowerCase())===index).join(' ').slice(0,160)||'',
   ...(brand?{brand:brand.slice(0,80)}:{})};
  seen.add(p.url);options.push(option);
 }
 // A nonempty response with no valid priced product is not a readable catalogue.
 if(products.length&&!products.some((raw:any)=>{const p=normalizeZyteProduct(raw,store);return p?.price&&p.currency==='INR';}))throw new Error('Listing unavailable');
 // Keep the best evidence from the bounded page, not its first ten advertisements.
 if(requirements)options.sort((a,b)=>Number(matchesCandidate(b,requirements))-Number(matchesCandidate(a,requirements))||colourTier(a.colour,requirements.colour)-colourTier(b.colour,requirements.colour)||Number(matchesOption(b,requirements))-Number(matchesOption(a,requirements)));
 return options.slice(0,10);
}
export function zyteListingOptions(data:any,store:Store,r:Requirements,excluded:string[],observedAt:number){return zyteListingPool(data,store,observedAt).filter(o=>!excluded.includes(o.url)&&matchesOption(o,r));}
export type ListingCacheEntry={store:Store;searchUrl:string;options:Option[];readable:boolean;expiresAt:number};
export type ListingCache={entries:ListingCacheEntry[];save:(store:Store,options:Option[],readable:boolean)=>Promise<unknown>};
export function cachedListingResult(entries:ListingCacheEntry[],r:Requirements,excluded:string[]){
 const valid=entries.filter(e=>e.expiresAt>Date.now()&&e.searchUrl===storeSearchUrl(e.store,r,false));
 const pools=valid.map(e=>e.options.filter(o=>!excluded.includes(o.url)&&matchesCandidate(o,r)));
 return {options:pools.flat(),stores:valid.map((e,i)=>({store:e.store,searchUrl:e.searchUrl,status:!e.readable?'unavailable':pools[i].length?'matched':'no_matches'} as StoreResult)),failed:valid.length>0&&valid.every(e=>!e.readable)};
}
export async function discoverWithZyte(r:Requirements,excluded:string[],selectedStores:string[]|undefined,deadlineAt:number,cache?:ListingCache,fast=false){
 // A fresh turn gets a 40-second retrieval window, leaving time for image checks/ranking.
 deadlineAt=Math.min(deadlineAt,Date.now()+(fast?12000:40000));
 const selected=selectedStores?([...new Set(selectedStores)].filter(s=>stores.includes(s as Store)) as Store[]):[...stores];
 const entries=(cache?.entries??[]).filter(e=>selected.includes(e.store)&&e.expiresAt>Date.now()&&e.searchUrl===storeSearchUrl(e.store,r,false));
 const cached=cachedListingResult(entries,r,excluded);
 const results=selected.filter(store=>!entries.some(e=>e.store===store)).map(store=>({store,status:'unavailable' as StoreResult['status'],searchUrl:storeSearchUrl(store,r,false)}));
 const pools:Option[][]=results.map(()=>[]);let next=0;const enough=new AbortController();
 // Four calls at a time; cache all ten normalized products before filtering or ranking.
 async function worker(){while(next<results.length&&!enough.signal.aborted){const i=next++,entry=results[i];const remaining=deadlineAt-Date.now();if(remaining<1000)return;
  let pool:Option[]=[],readable=false;
  try{const data=await zyteExtract(entry.searchUrl,'productList',fast?Math.min(6000,remaining):remaining,fast?'httpResponseBody':undefined,fast?enough.signal:undefined);pool=zyteListingPool(data,entry.store,Date.now(),r);readable=!fast||pool.length>0;pools[i]=pool.filter(o=>!excluded.includes(o.url)&&matchesCandidate(o,r));entry.status=!readable?'unavailable':pools[i].length?'matched':'no_matches';}catch{/* Keep unavailable distinct from a readable nonmatch. */}
  if(cache&&(!fast||readable))await cache.save(entry.store,pool,readable);
  if(fast&&pools.filter(p=>p.length>0).length>=2&&pools.flat().length>=8)enough.abort();
 }}
 await Promise.all(Array.from({length:Math.min(4,results.length)},worker));
 const combined=[...cached.stores,...results];
 return {options:[...cached.options,...pools.flat()],stores:combined,failed:combined.every(s=>s.status==='unavailable')};
}
