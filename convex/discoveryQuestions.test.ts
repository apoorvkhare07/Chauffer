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
