import {test,expect,vi,afterEach} from 'vitest';
import * as ai from 'ai';
vi.mock('ai',()=>({generateObject:vi.fn()}));
import * as images from './productImageReader';
import * as pixels from './productImageColour';
import {inspectGuestColours} from './guestProductColours';
import {chooseBatch} from './ranking';
const r={category:'shirt',audience:'men' as const,colour:'blue',fabric:'linen',budget:1000};
const product=(i:number)=>({title:'Men linen shirt',price:899,fabric:'linen',colour:'',url:`https://www.myntra.com/${i}`,imageUrl:`https://assets.myntassets.com/${i}.jpg`,observedAt:1});
afterEach(()=>{vi.restoreAllMocks();vi.mocked(ai.generateObject).mockReset();vi.unstubAllEnvs();});
test('guest photo check is capped, preserves listing facts and accepts only supplied image IDs',async()=>{
 vi.stubEnv('GEMINI_API_KEY','fixture');const read=vi.spyOn(images,'imageBytes').mockResolvedValue(new Uint8Array([1]));vi.spyOn(pixels,'lacksBluePixels').mockResolvedValue(false);
 const generate=vi.mocked(ai.generateObject).mockResolvedValue({object:{items:[{id:'p1',colour:'navy',confident:true},{id:'p2',colour:'orange',confident:true},{id:'invented',colour:'blue',confident:true},{id:'p3',colour:'blue',confident:false}]}} as any);
 const result=await inspectGuestColours(Array.from({length:9},(_,i)=>product(i)),r);
 expect(read).toHaveBeenCalledTimes(6);expect(generate).toHaveBeenCalledTimes(1);expect(result[0]).toMatchObject({price:899,fabric:'linen',colour:'navy'});expect(result[2].colour).toBe('');expect(chooseBatch(result,r,{prefer:[],avoid:[]})).toHaveLength(1);
});
test('blue pixel veto and provider failure cannot manufacture colour matches',async()=>{
 vi.stubEnv('GEMINI_API_KEY','fixture');vi.spyOn(images,'imageBytes').mockResolvedValue(new Uint8Array([1]));vi.spyOn(pixels,'lacksBluePixels').mockResolvedValue(true);
 const generate=vi.mocked(ai.generateObject).mockResolvedValue({object:{items:[{id:'p1',colour:'blue',confident:true}]}} as any);
 expect((await inspectGuestColours([product(1)],r))[0].colour).toBe('');generate.mockRejectedValue(new Error('unavailable'));expect(await inspectGuestColours([product(1)],r)).toEqual([product(1)]);
});
test('known colours do not incur another model call',async()=>{
 vi.stubEnv('GEMINI_API_KEY','fixture');const generate=vi.mocked(ai.generateObject);const options=[{...product(1),colour:'blue'}];expect(await inspectGuestColours(options,r)).toEqual(options);expect(generate).not.toHaveBeenCalled();
});
