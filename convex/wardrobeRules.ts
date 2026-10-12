import {v,type Infer} from 'convex/values';
export const garmentValidator=v.object({name:v.string(),category:v.union(v.literal('top'),v.literal('bottom'),v.literal('dress'),v.literal('kurta'),v.literal('saree'),v.literal('outerwear'),v.literal('shoes'),v.literal('accessory')),colour:v.string(),fabric:v.optional(v.string()),pattern:v.optional(v.string()),notes:v.optional(v.string())});
export type Garment=Infer<typeof garmentValidator>;
export const outfitValidator=v.object({title:v.string(),reason:v.string(),itemIds:v.array(v.id('wardrobeItems'))});
export function validateGarment(g:Garment){if(!g.name.trim()||g.name.length>80||!g.colour.trim()||g.colour.length>60||(g.fabric?.length??0)>40||(g.pattern?.length??0)>40||(g.notes?.length??0)>240)throw new Error('Use a name, colour and short clothing details.');}
export function wardrobeKey(items:{_id:string;details:Garment;available:boolean;lastWornAt?:number}[]){return JSON.stringify(items.map(i=>[i._id,i.details,i.available,i.lastWornAt??null]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))));}
export function completeOutfit(items:{details:Garment}[]){const types=new Set(items.map(i=>i.details.category));return types.has('dress')||(types.has('kurta')&&types.has('bottom'))||(types.has('top')&&types.has('bottom'))||(types.has('saree')&&types.has('top'));}
export function safeOutfits(raw:{title:string;reason:string;itemIds:string[]}[],items:{_id:string;details:Garment;available:boolean}[]){
 const seen=new Set<string>();return raw.flatMap(o=>{const ids=[...new Set(o.itemIds)],selected=ids.map(id=>items.find(i=>i._id===id&&i.available));const key=ids.slice().sort().join('|');if(!ids.length||ids.length>6||selected.some(i=>!i)||!completeOutfit(selected as {details:Garment}[])||seen.has(key))return [];seen.add(key);return [{title:o.title.slice(0,100),reason:o.reason.slice(0,450),itemIds:ids}];}).slice(0,3);
}
