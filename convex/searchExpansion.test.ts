import {test,expect} from 'vitest';
import {normalizeDecision} from './aiDecision';
import {nextRequest,matchesOption} from './discoveryRules';
const previous={category:'shirt',audience:'men' as const,size:'M',budget:2000,colour:'blue',fabric:'pure cotton',fit:'slim',sleeve:'full sleeve',mustHave:['cotton']};
test('switching from apparel to sneakers drops stale apparel constraints even if AI repeats them',()=>{
 const raw={intent:'search',reply:'Looking',requirements:{...previous,category:'sneakers',size:'UK 8',budget:5000,occasion:null,style:null,pattern:null,length:null},taste:{prefer:[],avoid:[]},referenceOption:null,feedbackKind:null};
 const {requirements:r}=normalizeDecision(raw,previous,{prefer:[],avoid:[]},'Find men sneakers UK 8 under 5k');
 expect(r).toMatchObject({category:'sneakers',size:'UK 8',budget:5000,audience:'men'});
 for(const key of ['colour','fabric','fit','sleeve'])expect(r[key as keyof typeof r]).toBeUndefined();
 expect(r.mustHave??[]).toEqual([]);
 const sameBudget=normalizeDecision(raw,previous,{prefer:[],avoid:[]},'Find sneakers UK 8, keep my budget');expect(sameBudget.requirements.fabric).toBeUndefined();
 const waiting=normalizeDecision({...raw,intent:'chat',requirements:{...raw.requirements,size:null}},previous,{prefer:[],avoid:[]},'Sneakers under 5k');expect(waiting.requirements.fabric).toBeUndefined();expect(waiting.requirements.size).toBeUndefined();expect(waiting.requirements.mustHave).toEqual([]);
 const kept=normalizeDecision(raw,previous,{prefer:[],avoid:[]},'Find blue sneakers UK 8 under 5k');expect(kept.requirements.colour).toBe('blue');
});
test('sneaker synonyms and adult audience match merchant evidence without accepting children or shoe accessories',()=>{
 const item={title:'Men Casual Trainers',url:'https://www.flipkart.com/shoe/p/one',price:1999,colour:'',fabric:'',observedAt:1};
 expect(matchesOption(item,{category:'sneakers',audience:'men',budget:5000})).toBe(true);
 expect(matchesOption({...item,title:'Boys Sneakers for Kids'},{category:'sneakers',audience:'men',budget:5000})).toBe(false);
 expect(matchesOption({...item,title:'Shoe Cleaner for Men Sneakers'},{category:'sneakers',budget:5000})).toBe(false);
 expect(matchesOption({...item,title:'Men Sneaker Graphic Printed T-shirt'},{category:'sneakers',budget:5000})).toBe(false);
 expect(nextRequest('women night suits size M under 2000').requirements.category).toBe('sleepwear');
 expect(nextRequest('women salwar suit size M under 2000').requirements.category).toBe('salwar');
 expect(nextRequest('women hoodie size M under 2.5k').requirements).toMatchObject({category:'hoodie',budget:2500,audience:'women'});
});

test('any colour clears stale colour ranking and hard constraints as well as the displayed filter',()=>{
 const raw={intent:'search',reply:'Looking',requirements:{category:'dress',audience:'women',size:'M',budget:2000,colour:'blue',fabric:null,fit:null,sleeve:null,occasion:null,style:null,pattern:null,length:null,mustHave:['blue']},taste:{prefer:['blue','solid'],avoid:['red']},referenceOption:null,feedbackKind:null};
 const plan=normalizeDecision(raw,{category:'sneakers',colour:'blue'},{prefer:['blue'],avoid:[]},'Women dresses size M under 2000, any colour');
 expect(plan.requirements.colour).toBeUndefined();expect(plan.requirements.mustHave).toEqual([]);expect(plan.taste).toEqual({prefer:['solid'],avoid:[]});
});
