import {test,expect} from 'vitest';
import {inspectionCandidates,type Evidence} from './recommendationRules';
const r={category:'sneakers',audience:'men' as const,budget:10000,brand:'Nike'};
function candidate(id:string,title:string,extra:Partial<Evidence['option']>={}):Evidence{return {id,option:{title,url:`https://www.myntra.com/shoes/nike/${id}/buy`,imageUrl:`https://assets.myntassets.com/${id}.jpg`,store:'Myntra',price:4000,brand:'Nike',colour:'white',fabric:'',observedAt:1,...extra},visual:[],conflicts:[],unknowns:[],imageInspected:false};}
test('different sneaker designs get inspected before repeated model listings without deleting variants',()=>{
 const pool=[candidate('1','Nike Court Vision Low Sneakers Men'),candidate('2','Nike Court Vision Lo Sneakers Men'),candidate('3','Nike Court Vision Low NN Sneakers Men'),candidate('4','Nike Killshot 2 Sneakers Men'),candidate('5','Nike Ebernon Sneakers Men')];
 expect(inspectionCandidates(pool,r,undefined,3).map(p=>p.id)).toEqual(['1','4','5']);
 expect(inspectionCandidates(pool,r).map(p=>p.id).sort()).toEqual(['1','2','3','4','5']);
 expect(pool.map(p=>p.id)).toEqual(['1','2','3','4','5']);
});
test('variety never promotes related colours ahead of exact colours or violates brand/budget',()=>{
 const pool=[candidate('1','Nike Court Vision Sneakers',{colour:'blue'}),candidate('2','Nike Court Vision Sneakers',{colour:'blue'}),candidate('3','Nike Killshot Sneakers',{colour:'purple'}),candidate('4','Other Sneakers',{brand:'Other',colour:'blue'}),candidate('5','Nike Ebernon Sneakers',{price:11000,colour:'blue'})];
 expect(inspectionCandidates(pool,{...r,colour:'blue'}).map(p=>p.id)).toEqual(['1','2','3']);
 expect(inspectionCandidates(pool,{...r,colour:'blue',colourStrict:true}).map(p=>p.id)).toEqual(['1','2']);
});
test('explicit style evidence stays ahead of design variety and unknown colour can still be checked',()=>{
 const pool=[candidate('1','Nike Solid Sneakers'),candidate('2','Nike Solid Sneakers'),candidate('3','Nike Printed Sneakers'),candidate('4','Nike Court Sneakers',{colour:''})];
 expect(inspectionCandidates(pool,{...r,pattern:'solid'},undefined,2).map(p=>p.id)).toEqual(['1','2']);
 expect(inspectionCandidates([pool[3]],{...r,colour:'purple'}).map(p=>p.id)).toEqual(['4']);
});
test('same image with different merchant sizing parameters is deferred within the unchanged eight-image limit',()=>{
 const pool=Array.from({length:12},(_,i)=>candidate(String(i+1),`Nike Design ${i+1} Sneakers`));
 pool[1].option.imageUrl=pool[0].option.imageUrl+'?width=900';
 const result=inspectionCandidates(pool,r);
 expect(result).toHaveLength(8);expect(result.map(p=>p.id)).not.toContain('2');
 pool[0].imageInspected=true;expect(inspectionCandidates(pool,r).map(p=>p.id)).not.toContain('1');
});

test('distinct bag types keep their original relevance order; variety does not force a belt bag ahead',()=>{
 const names=['Travel Hiking Bag','All Blue Pedal Backpack','35L Laptop Backpack','Solid Backpack With Pouch','Hayward Futura Backpack','Rizz Casual Backpack','Tropea Crossbody Bag','Training 4Athlts Backpack','Polyester Belt Bag'];
 const pool=names.map((name,i)=>candidate(String(i),name,{brand:undefined,colour:'blue'}));
 expect(inspectionCandidates(pool,{category:'bag',budget:10000,colour:'blue',occasion:'college'}).map(p=>p.id)).toEqual(['0','1','2','3','4','5','6','7']);
});
