"use node";
import {discoverAcrossStores} from './liveDiscovery';
import {discoverWithZyte} from './zyteDiscovery';
import {stores} from './storeConfig';
import {chooseBatch} from './ranking';
import type {Requirements} from './discoveryRules';

// Same HTTP-first reader as signed-in discovery. Recovery is bounded to four
// unreadable stores, with the original shopper constraints unchanged.
export async function discoverGuestProducts(requirements:Requirements){
 if(!process.env.ZYTE_API_KEY)return discoverAcrossStores(requirements,[],undefined,10,{candidatePool:true});
 const deadline=Date.now()+55000;
 const priority=['Myntra','Flipkart','Amazon','Nykaa Fashion'];
 const selected=[...stores].sort((a,b)=>(priority.indexOf(a)<0?99:priority.indexOf(a))-(priority.indexOf(b)<0?99:priority.indexOf(b)));
 const first=await discoverWithZyte(requirements,[],selected,Math.min(deadline,Date.now()+12000),undefined,true);
 if(chooseBatch(first.options,requirements,{prefer:[],avoid:[]},10,[],36).length>=12)return first;
 const pending=first.stores.filter(store=>store.status==='unavailable').map(store=>store.store).slice(0,4);
 if(!pending.length||Date.now()>deadline-1000)return first;
 const recovered=await discoverWithZyte(requirements,[],pending,deadline,undefined,false);
 const merged=first.stores.map(store=>recovered.stores.find(other=>other.store===store.store)??store);
 return {options:[...new Map([...first.options,...recovered.options].map(option=>[option.url,option])).values()],stores:merged,failed:merged.every(store=>store.status==='unavailable')};
}
