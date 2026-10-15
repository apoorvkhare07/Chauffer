import {expect,test} from 'vitest';
import {rankOptions,chooseBatch} from './ranking';
import {nextRequest,matchesOption,searchTerms} from './discoveryRules';
import {missingQuestion,normalizeDecision} from './aiDecision';
const r={category:'sneakers',audience:'men' as const,budget:5000,size:'UK 8'};
const option=(price:number,store:'Amazon'|'Myntra'='Amazon')=>({store,title:`Men Puma Sneakers Design ${price}`,url:store==='Amazon'?`https://www.amazon.in/dp/B${String(price).padStart(9,'0')}`:`https://www.myntra.com/shoes/puma/sneakers/${price}/buy`,price,colour:'',fabric:'',observedAt:1,brand:'Puma'});
test('a budget is a spending range, with cheaper fallback below every verified in-range option',()=>{
 const batch=chooseBatch([option(700),option(800,'Myntra'),option(3200),option(4200),option(4800,'Myntra')],r,{prefer:[],avoid:[]});
 expect(batch.slice(0,3).every(o=>o.price>=3000)).toBe(true);expect(batch[0].price).toBe(4200);
 expect(rankOptions([option(700),option(4200)],{...r,pricePreference:'lowest_price'})[0].price).toBe(700);
 expect(rankOptions([option(700),option(6000)],r).map(o=>o.price)).toEqual([700]);
});
test('brand clarification is one question after size, explicit brand is hard evidence and never an inferred quality claim',()=>{
 expect(missingQuestion(r)).toBeNull();expect(missingQuestion({...r,size:undefined})).toContain('size');
 expect(missingQuestion({...r,brand:'any'})).toBeNull();
 const request=nextRequest('Puma',r);expect(request.search).toBe(true);expect(request.requirements.brand).toBe('Puma');
 expect(searchTerms({...r,brand:'Puma'})).toBe('Puma sneakers men');
 expect(matchesOption(option(3200),{...r,brand:'Nike'})).toBe(false);
 expect(matchesOption({...option(3200),title:'Men Nike-inspired Sneakers',brand:'Other'},{...r,brand:'Nike'})).toBe(false);
 expect(nextRequest('cheapest options',r).requirements.pricePreference).toBe('lowest_price');
 expect(nextRequest('open to all brands',r).requirements.brand).toBe('any');
});
test('AI cannot invent brand consent or carry an old brand into a new item',()=>{
 const raw={intent:'search',reply:'I will look',requirements:{...r,brand:'Nike',colour:null,fabric:null,occasion:null,style:null,fit:null,pattern:null,sleeve:null,length:null,mustHave:[]},taste:{prefer:[],avoid:[]},referenceOption:null,feedbackKind:null};
 expect(normalizeDecision(raw,{}, {prefer:[],avoid:[]},'sneakers under 5000 UK 8').requirements.brand).toBeUndefined();
 expect(normalizeDecision(raw,{}, {prefer:[],avoid:[]},'Nike sneakers under 5000 UK 8').requirements.brand).toBe('Nike');
 expect(nextRequest('dress under 3000 size M',{...r,brand:'Puma'}).requirements.brand).toBeUndefined();
});
test('typos, multiple brands and explicit cheap requests get useful clarification without invented preferences',()=>{
 expect(nextRequest('snearker under 5000 UK 8').requirements.category).toBe('sneakers');
 expect(nextRequest('Nike or Puma',r).reply).toContain('first');
 expect(missingQuestion({...r,pricePreference:'lowest_price'})).toBeNull();
});
test('Amazon brand evidence is read from its own result row, separately from the product title',async()=>{
 const {amazonOptions}=await import('./storeExtractors');
 const html='<div data-component-type="s-search-result" data-asin="B012345678"><h2 class="a-size-mini s-line-clamp-1">Nike</h2><h2>Men Court Vision Sneakers</h2><span class="a-price"><span class="a-offscreen">₹3,999</span></span></div>';
 expect(amazonOptions(html,{...r,brand:'Nike'},1)[0]).toMatchObject({brand:'Nike',title:'Men Court Vision Sneakers',price:3999});
 expect(amazonOptions(html,{...r,brand:'Puma'},1)).toEqual([]);
});
