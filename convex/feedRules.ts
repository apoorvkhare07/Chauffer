import {validSize} from './fashionRules';
import type {Requirements,Option} from './discoveryRules';
import type {Taste} from './taste';
const offset=19800000,day=86400000;
export function feedDay(now:number){return new Date(now+offset).toISOString().slice(0,10);}
export function nextFeedAt(now:number){const midnight=Math.floor((now+offset)/day)*day-offset;const morning=midnight+9*3600000;return morning>now?morning:morning+day;}
export function feedNeedReady(r:Requirements,updatedAt:number,now:number){return Boolean(r.category&&r.budget&&r.budget>=100&&r.budget<=50000&&validSize(r.category,r.size)&&updatedAt>=now-30*day);}
export function needKey(r:Requirements,taste:Taste){return JSON.stringify([Object.entries(r).sort(([a],[b])=>a.localeCompare(b)),{prefer:[...taste.prefer].sort(),avoid:[...taste.avoid].sort()}]);}
// Same listing observation, never a claim about a size-specific checkout total or a sale.
export function listedDrop(before:Option,after:Option,now:number){
 if(before.url!==after.url||before.title!==after.title||before.colour!==after.colour||before.fabric!==after.fabric||before.priceFrom||after.priceFrom||before.source!=='product'||after.source!=='product'||after.observedAt<=before.observedAt||now-after.observedAt>15*60000||after.price>=before.price)return null;
 return {url:after.url,previousPrice:before.price,price:after.price,previousObservedAt:before.observedAt,observedAt:after.observedAt};
}
