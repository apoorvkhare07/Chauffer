import {test,expect} from 'vitest';
import sharp from 'sharp';
import {lacksBluePixels} from './productImageColour';
test('blue veto rejects black, grey and orange but preserves navy and light blue',async()=>{
 for(const [colour,rejected] of [['#171717',true],['#999999',true],['#ed7519',true],['#17345a',false],['#76bce3',false]] as const){
 const image=await sharp({create:{width:80,height:80,channels:3,background:colour}}).png().toBuffer();
 expect(await lacksBluePixels(image)).toBe(rejected);
 }
});
