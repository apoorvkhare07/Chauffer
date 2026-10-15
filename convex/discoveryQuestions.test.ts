import {test,expect} from 'vitest';
import {nextDiscoveryQuestion,questionAnswer,shouldClarifyBefore} from './discoveryQuestions';
import {rankOptions} from './ranking';
import {searchTerms} from './discoveryRules';
test('question changes with the item and already confirmed information, without repeating skipped fields',()=>{
 const r={category:'sneakers',budget:5000,size:'UK 8'};
 const first=nextDiscoveryQuestion(r)!;expect(first.field).toBe('occasion');expect(questionAnswer('Workouts',first)).toEqual({occasion:'workout'});
 expect(nextDiscoveryQuestion({...r,occasion:'workout'})?.field).toBe('style');
 expect(nextDiscoveryQuestion({category:'jeans',budget:2000})?.field).toBe('fit');
 expect(nextDiscoveryQuestion({category:'dress',budget:3000,occasion:'work'})?.field).toBe('pattern');
 expect(questionAnswer('No preference, show options',first)).toEqual({});
 expect(nextDiscoveryQuestion({...r,askedDiscoveryFields:['occasion']})?.field).toBe('style');
 expect(shouldClarifyBefore({...r,askedDiscoveryFields:['occasion']})).toBe(false);
 expect(questionAnswer('Something unknown',first)).toBeNull();
});
test('answers alter retrieval and ranking while keeping the spending ceiling',()=>{
 const r={category:'sneakers',budget:5000,brand:'Nike',occasion:'workout',style:'chunky'};
 expect(searchTerms(r)).toContain('training');expect(searchTerms(r)).toContain('chunky');
 const base={store:'Amazon' as const,brand:'Nike',url:'https://www.amazon.in/dp/B000000001',title:'Men Classic Sneakers',price:4000,colour:'',fabric:'',observedAt:1};
 expect(rankOptions([base,{...base,url:'https://www.amazon.in/dp/B000000002',title:'Men Training Sneakers',price:4200}],r)[0].title).toContain('Training');
 expect(rankOptions([{...base,price:6000}],r)).toEqual([]);
});
test('confirmed taste is used as context without inventing hard constraints or asking it again',()=>{
 const r={category:'sneakers',budget:5000,occasion:'everyday',askedDiscoveryFields:[]};
 expect(nextDiscoveryQuestion(r,[],{prefer:['classic'],avoid:[]})?.field).toBe('brand');
 expect(r).not.toHaveProperty('style');
 expect(nextDiscoveryQuestion({category:'jeans',budget:2000},[],{prefer:['relaxed fit'],avoid:[]})?.field).toBe('occasion');
});
test('store variety cannot displace verified preference matches with an unrelated fit',async()=>{
 const {chooseBatch}=await import('./ranking');
 const base={store:'Amazon' as const,title:'Men Relaxed Fit Jeans',url:'https://www.amazon.in/dp/B000000001',price:2000,colour:'',fabric:'',observedAt:1};
 const matches=Array.from({length:6},(_,i)=>({...base,title:`Men Relaxed Fit Jeans ${i}`,url:`https://www.amazon.in/dp/B00000000${i+1}`}));
 const other={...base,store:'Myntra' as const,title:'Men Straight Fit Jeans',url:'https://www.myntra.com/jeans/brand/straight/123/buy'};
 const batch=chooseBatch([...matches,other],{category:'jeans',budget:2500,fit:'relaxed'},{prefer:[],avoid:[]});
 expect(batch).toHaveLength(6);expect(batch.every(o=>o.title.includes('Relaxed'))).toBe(true);
});
