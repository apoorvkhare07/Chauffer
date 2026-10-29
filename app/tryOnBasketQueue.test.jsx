import {test,expect} from 'vitest';
import {runTryOnQueue} from './tryOnBasketQueue';
test('basket previews run sequentially, deduplicate, and continue after a piece fails',async()=>{
 const events=[];let active=0;
 await runTryOnQueue({ids:['a','b','a','c'],shouldStop:()=>false,onStart:id=>events.push('start:'+id),run:async id=>{expect(active).toBe(0);active++;await Promise.resolve();active--;if(id==='b')throw new Error('bad product image');return id;},onReady:id=>events.push('ready:'+id),onError:id=>events.push('error:'+id)});
 expect(events).toEqual(['start:a','ready:a','start:b','error:b','start:c','ready:c']);
});
test('stop preserves the current result and prevents the remaining preview calls',async()=>{
 let stop=false;const results=[];
 await runTryOnQueue({ids:['a','b'],shouldStop:()=>stop,onStart:()=>{},run:async id=>{stop=true;return id;},onReady:id=>results.push(id),onError:()=>{}});
 expect(results).toEqual(['a']);
});
test('provider busy does not cascade through the entire basket',async()=>{
 const calls=[];
 await runTryOnQueue({ids:['a','b'],shouldStop:()=>false,onStart:()=>{},run:async id=>{calls.push(id);throw new Error('The preview service is busy. Please try later.');},onReady:()=>{},onError:()=>{}});
 expect(calls).toEqual(['a']);
});
