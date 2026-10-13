import {load} from 'cheerio';
import {v} from 'convex/values';
import {allowedProductUrl,optionValidator,type Option} from './discoveryRules';
export const intelligenceValidator=v.object({checkedAt:v.number(),status:v.union(v.literal('checked'),v.literal('unavailable')),note:v.string(),offers:v.array(v.object({text:v.string(),kind:v.union(v.literal('discount'),v.literal('cashback'),v.literal('conditional')),sourceUrl:v.string()})),matches:v.array(v.object({option:optionValidator,identity:v.union(v.literal('same_product'),v.literal('alternative'))})),gaps:v.array(v.string())});
export function readAdvertisedOffers(html:string,url:string){
 if(!allowedProductUrl(url))return [];
 const $=load(html);$('script,style,noscript,[hidden],[aria-hidden="true"]').remove();
 const candidates:string[]=[];
 // Only dedicated merchant offer areas or short leaf-like offer rows. Never page-wide text.
 $('[id*="sopp"], [id*="promoPrice"], [id*="offers"], [id*="Offers"], li, span, p').each((_i,el)=>{
  const text=$(el).text().replace(/\s+/g,' ').trim();
  if(text.length>=12&&text.length<=600&&/\b(bank offer|special price|cashback|coupon|flat.*off|\d+%.*off|discount.*(?:card|payment))\b/i.test(text)&&/(₹|Rs\.?|\d+%)/i.test(text))candidates.push(text);
 });
 return [...new Set(candidates)].filter((x,i,a)=>!a.some((y,j)=>i!==j&&y.includes(x)&&y.length>x.length)).slice(0,8).map(text=>({text,sourceUrl:url,kind:/cashback/i.test(text)?'cashback' as const:/bank|card|coupon|minimum|purchase|payment/i.test(text)?'conditional' as const:'discount' as const}));
}
export function identityKind(a:Option,b:Option){
 const clean=(s?:string)=>s?.trim().toLowerCase().replace(/\s+/g,' ');
 return a.brand&&a.manufacturerCode&&clean(a.brand)===clean(b.brand)&&clean(a.manufacturerCode)===clean(b.manufacturerCode)?'same_product' as const:'alternative' as const;
}
