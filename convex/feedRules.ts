import {validSize} from './fashionRules';
import type {Requirements,Option} from './discoveryRules';
import {cleanTerms,type Taste,emptyTaste} from './taste';
const offset=19800000,day=86400000;
export function feedDay(now:number){return new Date(now+offset).toISOString().slice(0,10);}
export function nextFeedAt(now:number){const midnight=Math.floor((now+offset)/day)*day-offset;const morning=midnight+9*3600000;return morning>now?morning:morning+day;}
export function feedNeedReady(r:Requirements,updatedAt:number,now:number){return Boolean(r.category&&r.budget&&r.budget>=100&&r.budget<=50000&&validSize(r.category,r.size)&&updatedAt>=now-30*day);}
export function needKey(r:Requirements,taste:Taste){return JSON.stringify([Object.entries(r).sort(([a],[b])=>a.localeCompare(b)),{prefer:[...taste.prefer].sort(),avoid:[...taste.avoid].sort()}]);}
type DailyProfile={audience?:'men'|'women'|'unisex';size?:string;jeansSize?:string;budgetPaise?:number};
type DailyStyle={fitPreferences?:string;stylePreferences?:string;avoid?:string};
const dailyCategories=[['shirt','jeans','watch'],['t-shirt','jeans','jacket'],['shirt','jeans','bag'],['t-shirt','jeans','sunglasses'],['shirt','jeans','watch'],['jacket','jeans','t-shirt'],['shirt','jeans','bag']];
export function dailyCategoriesFor(day:string){const n=Math.floor(Date.parse(`${day}T00:00:00Z`)/dayMs);return dailyCategories[((n%dailyCategories.length)+dailyCategories.length)%dailyCategories.length];}
const dayMs=86400000;
export function dailyContextKey(profile:DailyProfile|undefined,taste:Taste,style:DailyStyle|undefined,photoStyle?:string){return JSON.stringify({profile:profile?{audience:profile.audience,size:profile.size,jeansSize:profile.jeansSize,budgetPaise:profile.budgetPaise}:null,taste:{prefer:[...taste.prefer].sort(),avoid:[...taste.avoid].sort()},style:style?{fit:style.fitPreferences,style:style.stylePreferences,avoid:style.avoid}:null,photoStyle:photoStyle??''});}
export function dailyRequirementsFor(day:string,profile:DailyProfile|undefined,taste:Taste=emptyTaste,style:DailyStyle|undefined,photoStyle?:string){
 const budget=profile?.budgetPaise?profile.budgetPaise/100:50000;
 const prefer=cleanTerms([...taste.prefer,...[style?.stylePreferences,style?.fitPreferences,photoStyle].filter((x):x is string=>Boolean(x))]);
 const avoid=cleanTerms([...taste.avoid,...(style?.avoid?.split(/[,;\n]/)??[])]);
 return dailyCategoriesFor(day).map(category=>({category,requirements:{category,...(profile?.audience?{audience:profile.audience}:{}),...(['shirt','t-shirt','jacket'].includes(category)&&profile?.size?{size:profile.size}:{}),...(category==='jeans'&&(profile?.jeansSize||profile?.size)?{size:profile.jeansSize??profile?.size}:{}),budget,pricePreference:profile?.budgetPaise?'best_within_budget' as const:'lowest_price' as const,...(style?.stylePreferences?{style:style.stylePreferences.slice(0,120)}:photoStyle?{style:photoStyle.slice(0,120)}:{}),...(style?.fitPreferences?{fit:style.fitPreferences.slice(0,80)}:{})},taste:{prefer,avoid}}));
}
// Same listing observation, never a claim about a size-specific checkout total or a sale.
export function listedDrop(before:Option,after:Option,now:number){
 if(before.url!==after.url||before.title!==after.title||before.colour!==after.colour||before.fabric!==after.fabric||before.priceFrom||after.priceFrom||before.source!=='product'||after.source!=='product'||after.observedAt<=before.observedAt||now-after.observedAt>15*60000||after.price>=before.price)return null;
 return {url:after.url,previousPrice:before.price,price:after.price,previousObservedAt:before.observedAt,observedAt:after.observedAt};
}
