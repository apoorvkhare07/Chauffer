import {test,expect} from 'vitest';
import {nextRequest,matchesOption,searchTerms} from './discoveryRules';
import {missingQuestion,normalizeDecision} from './aiDecision';
import {feedNeedReady} from './feedRules';
import {unsupportedFashionRequest} from './fashionRules';
const option={title:'Men Casual Shirt',url:'https://www.flipkart.com/test/p/test',price:700,colour:'',fabric:'',observedAt:1};
test('fashion searches preserve explicit audience and do not assume women',()=>{
 const r=nextRequest('men shirt size M under 1500');expect(r.search).toBe(true);expect(searchTerms(r.requirements)).toBe('shirt men');
 expect(searchTerms({category:'bag'})).toBe('bag');
 expect(matchesOption(option,{category:'shirt',budget:1000,audience:'women'})).toBe(false);
 expect(matchesOption({...option,title:'Women Casual Shirt'},{category:'shirt',budget:1000,audience:'men'})).toBe(false);
 expect(matchesOption({...option,title:'Unisex Casual Shirt'},{category:'shirt',budget:1000,audience:'men'})).toBe(true);
 expect(matchesOption({...option,title:'Men Dress Shirt'},{category:'dress',budget:1000})).toBe(false);
 expect(matchesOption({...option,title:'Men T-Shirt'},{category:'shirt',budget:1000})).toBe(false);
});
test('unsupported product requests are recognized without blocking supported fashion',()=>{
 expect(unsupportedFashionRequest('mobile')).toBe(true);
 expect(unsupportedFashionRequest('I need a new mobile phone')).toBe(true);
 expect(unsupportedFashionRequest('men sneakers UK 8 under 5000')).toBe(false);
});
test('switching to footwear clears clothing size and fabric; requires explicit size system',()=>{
 const switched=nextRequest('sneakers under 2000',{category:'kurta',size:'M',fabric:'cotton',colour:'pink'});
 expect(switched.requirements).toEqual({category:'sneakers',budget:2000});expect(switched.search).toBe(false);expect(switched.reply).toContain('UK');
 expect(nextRequest('UK 8',switched.requirements).search).toBe(true);
 expect(missingQuestion({category:'shoes',budget:2000,size:'8'})).toContain('system');
 expect(feedNeedReady({category:'shoes',budget:2000,size:'M'},Date.now(),Date.now())).toBe(false);
});
test('bags need no size; trousers accept waist sizes; footwear keeps category specificity',()=>{
 expect(nextRequest('bag under 1500').search).toBe(true);
 expect(nextRequest('men jeans waist 32 inches under 2000').search).toBe(true);
 expect(nextRequest('men sneakers UK 8 under 2000').requirements).toMatchObject({category:'sneakers',size:'UK 8',audience:'men'});
 expect(matchesOption({...option,title:'Men Formal Shoes'},{category:'sneakers',budget:1000})).toBe(false);
});
test('AI cannot carry a clothing size into footwear even when its plan repeats it',()=>{
 const raw={intent:'search',reply:'Searching',requirements:{category:'shoes',audience:'men',budget:2000,size:'M',colour:null,fabric:null,occasion:null,style:null,fit:null,pattern:null,sleeve:null,length:null,mustHave:[]},taste:{prefer:[],avoid:[]},referenceOption:null,feedbackKind:null};
 const plan=normalizeDecision(raw,{category:'shirt',size:'M'},{prefer:[],avoid:[]},'Find shoes');
 expect(plan.requirements.size).toBeUndefined();expect(missingQuestion(plan.requirements)).toContain('shoe size');
});
