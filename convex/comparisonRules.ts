// Merchant observations only. Similar names and photos do not establish product identity.
export type PriceObservation = {
 store:string;url:string;brand?:string;manufacturerCode?:string;size?:string;colour?:string;
 quantity:number;itemPaise:number;shippingPaise?:number;mandatoryPaise?:number;
 stock:'in_stock'|'out_of_stock'|'unknown';variantVerified:boolean;priceFrom:boolean;
 observedAt:number;returnTerms?:string;seller?:string;
};
export const freshnessMs=15*60*1000;
const clean=(s?:string)=>s?.trim().toLowerCase().replace(/\s+/g,' ')||null;
export function exactIdentity(a:PriceObservation,b:PriceObservation):boolean{
 return Boolean(clean(a.brand)&&clean(a.manufacturerCode)&&clean(a.brand)===clean(b.brand)&&clean(a.manufacturerCode)===clean(b.manufacturerCode));
}
export function comparison(a:PriceObservation,b:PriceObservation,now=Date.now()){
 const gaps:string[]=[];
 if(!exactIdentity(a,b))gaps.push('Same product identity is not verified.');
 if(!a.variantVerified||!b.variantVerified||!clean(a.size)||!clean(b.size)||!clean(a.colour)||!clean(b.colour)||clean(a.size)!==clean(b.size)||clean(a.colour)!==clean(b.colour)||a.quantity!==b.quantity)gaps.push('Same size, colour and quantity are not verified.');
 if(a.priceFrom||b.priceFrom)gaps.push('A starting price cannot confirm this variant’s price.');
 if([a,b].some(o=>o.stock!=='in_stock'))gaps.push('Both variants must be confirmed in stock.');
 if([a,b].some(o=>!Number.isFinite(o.observedAt)||o.observedAt>now||now-o.observedAt>freshnessMs))gaps.push('Prices need a fresh check.');
 if([a,b].some(o=>!Number.isSafeInteger(o.quantity)||o.quantity<1||!Number.isSafeInteger(o.itemPaise)||o.itemPaise<=0||!Number.isSafeInteger(o.shippingPaise)||o.shippingPaise!<0||!Number.isSafeInteger(o.mandatoryPaise)||o.mandatoryPaise!<0))gaps.push('Full delivered totals are not confirmed.');
 if([a,b].some(o=>!o.seller||!o.returnTerms))gaps.push('Seller and return conditions need checking.');
 if(gaps.length)return {status:'unverified' as const,gaps,cheaperUrl:null,savingPaise:null,totals:null};
 const totals=[a,b].map(o=>o.itemPaise*o.quantity+o.shippingPaise!+o.mandatoryPaise!);
 if(totals.some(t=>!Number.isSafeInteger(t)))return {status:'unverified' as const,gaps:['Invalid total.'],cheaperUrl:null,savingPaise:null,totals:null};
 return {status:'comparable' as const,gaps:[],totals,cheaperUrl:totals[0]===totals[1]?null:totals[0]<totals[1]?a.url:b.url,savingPaise:Math.abs(totals[0]-totals[1])};
}
