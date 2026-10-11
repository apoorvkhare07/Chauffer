export type Offer={
 sourceUrl:string;observedAt:number;expiresAt?:number;termsVerified:boolean;
 kind:'discount'|'cashback';minimumPaise:number;fixedPaise?:number;percentBasisPoints?:number;capPaise?:number;
 bank?:string;cardType?:string;paymentMethod?:string;membership?:string;coupon?:string;
 accountRestricted:boolean;stacking:'allowed'|'not_allowed'|'unknown';
};
export type Eligibility={bank?:string;cardType?:string;paymentMethod?:string;membership?:string;coupon?:string;accountVerified?:boolean};
export function evaluateOffer(offer:Offer,subtotalPaise:number,eligibility:Eligibility={},now=Date.now()){
 const gaps:string[]=[];
 const validMoney=(n:unknown)=>Number.isSafeInteger(n)&&Number(n)>=0;
 if(!/^https:\/\//.test(offer.sourceUrl)||!offer.termsVerified)gaps.push('Merchant terms are not verified.');
 if(!Number.isFinite(offer.observedAt)||offer.observedAt>now||now-offer.observedAt>15*60*1000)gaps.push('Offer needs a fresh check.');
 if(!Number.isFinite(offer.expiresAt))gaps.push('Offer expiry is unknown.');
 else if(offer.expiresAt!<=now)gaps.push('Offer expired.');
 if(!validMoney(subtotalPaise)||!validMoney(offer.minimumPaise)||subtotalPaise<offer.minimumPaise)gaps.push('Minimum spend is not met or amount is invalid.');
 for(const key of ['bank','cardType','paymentMethod','membership','coupon'] as const){if(offer[key]&&offer[key]!.trim().toLowerCase()!==eligibility[key]?.trim().toLowerCase())gaps.push(`Eligible ${key} is not confirmed.`);}
 if(offer.accountRestricted&&!eligibility.accountVerified)gaps.push('Account eligibility is not confirmed.');
 const fixed=offer.fixedPaise!==undefined,percent=offer.percentBasisPoints!==undefined;
 if(fixed===percent||(fixed&&!validMoney(offer.fixedPaise))||(percent&&(!validMoney(offer.percentBasisPoints)||offer.percentBasisPoints!>10000))||(offer.capPaise!==undefined&&!validMoney(offer.capPaise)))gaps.push('Discount calculation is incomplete.');
 if(gaps.length)return {status:'unverified' as const,gaps,immediateDiscountPaise:null,cashbackPaise:null,payableBeforeShippingPaise:null};
 const raw=fixed?offer.fixedPaise!:Number(BigInt(subtotalPaise)*BigInt(offer.percentBasisPoints!)/10000n);
 const benefit=Math.min(subtotalPaise,raw,offer.capPaise??subtotalPaise);
 const immediate=offer.kind==='discount'?benefit:0;
 return {status:'potentially_eligible' as const,gaps:[],immediateDiscountPaise:immediate,cashbackPaise:offer.kind==='cashback'?benefit:0,payableBeforeShippingPaise:subtotalPaise-immediate};
}
// The checkout must confirm applicability. Never silently add offers with unknown stacking rules.
export function canStack(offers:Offer[]):boolean{return offers.length<=1||offers.every(o=>o.stacking==='allowed');}
