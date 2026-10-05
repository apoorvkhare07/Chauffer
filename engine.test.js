import test from 'node:test';
import assert from 'node:assert/strict';
import {search,makeOrder,transition,products} from './engine.js';
test('English and Hindi requests respect total budget and selected size',()=>{
 for(const text of ['Blue cotton kurta under 1000 size M','नीला कॉटन कुर्ता 1000 रुपये के अंदर साइज M','neeli cotton kurti 1000 rupaye size M']){
 const {results}=search(text);assert.equal(results.length,3);assert.ok(results.every(p=>p.price+p.fee<=1000&&p.sizes.includes('M')&&p.color==='blue'));}
 assert.equal(search('blue kurta under 600').results.length,0);
});
test('explicit size overrides remembered size and unavailable size excludes products',()=>{assert.equal(search('kurta size S',{size:'XL'}).filters.size,'S');assert.equal(search('kurta size XL').results.length,2);});
test('approval validates variant and order actions follow order status',()=>{const p=products[0];assert.throws(()=>makeOrder(p,'XXL','UPI'));const order=makeOrder(p,'M','UPI');assert.equal(order.total,839);assert.throws(()=>transition(order,'return'));const delivered=transition(order,'deliver');assert.equal(transition(delivered,'return').status,'Return requested in demo');assert.throws(()=>transition(transition(order,'cancel'),'deliver'));});
