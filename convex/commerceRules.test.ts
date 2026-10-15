import {test,expect} from 'vitest';
import {comparison,type PriceObservation} from './comparisonRules';
import {evaluateOffer,canStack,type Offer} from './offerRules';
import {replyLanguage} from './conversationLanguage';
const now=1000000;
const item:PriceObservation={store:'Flipkart',url:'https://www.flipkart.com/item/p/one',brand:'Brand',manufacturerCode:'STYLE-1',size:'M',colour:'Blue',quantity:1,itemPaise:100000,shippingPaise:0,mandatoryPaise:0,stock:'in_stock',variantVerified:true,priceFrom:false,observedAt:now,seller:'Store seller',returnTerms:'7 days'};
test('saved reply language wins unless the shopper explicitly requests a switch',()=>{
 expect(replyLanguage('Show me a casual dress under 2000','hinglish')).toBe('hinglish');
 expect(replyLanguage('मुझे नीला कुर्ता चाहिए','en')).toBe('en');
 expect(replyLanguage('Office ke liye simple kurta chahiye','en')).toBe('en');
 expect(replyLanguage('M','hi')).toBe('hi');
 expect(replyLanguage('Please reply in English','hi')).toBe('en');
});
test('exact comparison needs the same identity, variant, stock, fresh full totals and conditions',()=>{
 const other={...item,store:'Amazon',url:'https://www.amazon.in/dp/B012345678',itemPaise:95000,shippingPaise:6000};
 expect(comparison(item,other,now)).toMatchObject({status:'comparable',cheaperUrl:item.url,savingPaise:1000});
 for(const change of [{manufacturerCode:undefined},{size:'L'},{shippingPaise:undefined},{stock:'unknown' as const},{priceFrom:true},{observedAt:0},{returnTerms:undefined}])expect(comparison(item,{...other,...change},now).status).toBe('unverified');
});
test('offer benefits require evidence, eligibility, expiry and valid rules; cashback does not reduce payable',()=>{
 const offer:Offer={sourceUrl:item.url,observedAt:now,expiresAt:now+10000,termsVerified:true,kind:'discount',minimumPaise:50000,percentBasisPoints:1000,capPaise:5000,bank:'Example bank',accountRestricted:false,stacking:'unknown'};
 expect(evaluateOffer(offer,100000,{bank:'Example bank'},now)).toMatchObject({status:'potentially_eligible',immediateDiscountPaise:5000,payableBeforeShippingPaise:95000});
 expect(evaluateOffer({...offer,kind:'cashback'},100000,{bank:'Example bank'},now)).toMatchObject({cashbackPaise:5000,immediateDiscountPaise:0,payableBeforeShippingPaise:100000});
 for(const change of [{termsVerified:false},{expiresAt:now},{minimumPaise:200000},{fixedPaise:2000},{percentBasisPoints:11000}])expect(evaluateOffer({...offer,...change},100000,{bank:'Example bank'},now).status).toBe('unverified');
 expect(evaluateOffer(offer,100000,{},now).status).toBe('unverified');
 expect(canStack([offer,offer])).toBe(false);
});
