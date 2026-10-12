import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import workflow from '@convex-dev/workflow/test';
import agentTest from '@convex-dev/agent/test';
import {Agent} from '@convex-dev/agent';
import {readFileSync} from 'node:fs';
import schema from './schema';
import {api,internal} from './_generated/api';
import {safeOutfits,wardrobeKey} from './wardrobeRules';
const modules=import.meta.glob('./**/*.ts');
const top={name:'Blue shirt',category:'top' as const,colour:'blue',fabric:'cotton'};
const bottom={name:'Black trousers',category:'bottom' as const,colour:'black'};
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();vi.clearAllTimers();vi.useRealTimers();});
function setup(){vi.useFakeTimers();vi.stubEnv('GEMINI_API_KEY','test-key');const t=convexTest(schema,modules);workflow.register(t);agentTest.register(t);return {t,alice:t.withIdentity({subject:'alice'}),bob:t.withIdentity({subject:'bob'})};}
test('outfit safety rejects invented, unavailable, incomplete and duplicate combinations',()=>{
 const items=[{_id:'top',details:top,available:true},{_id:'bottom',details:bottom,available:true},{_id:'dress',details:{name:'Dress',category:'dress' as const,colour:'green'},available:false}];
 const raw=(ids:string[])=>({title:'Today',reason:'For walking',itemIds:ids});
 const outfits=safeOutfits([raw(['top','bottom']),raw(['bottom','top']),raw(['top']),raw(['dress']),raw(['invented','top'])],items);
 expect(outfits).toHaveLength(1);expect(outfits[0].itemIds).toEqual(['top','bottom']);
});
test('wardrobe items and edits belong only to their owner',async()=>{
 const {alice,bob}=setup();const id=await alice.mutation(api.wardrobe.add,{details:top});
 expect(await bob.query(api.wardrobe.list,{})).toEqual([]);
 await expect(bob.mutation(api.wardrobe.updateDetails,{id,details:bottom})).rejects.toThrow('own wardrobe');await expect(bob.mutation(api.wardrobe.remove,{id})).rejects.toThrow('own wardrobe');
 await alice.mutation(api.wardrobe.updateDetails,{id,details:{...top,pattern:'striped'}});expect((await alice.query(api.wardrobe.list,{}))[0].details.pattern).toBe('striped');
});
test('outfit AI receives available confirmed items; wear history is private and edits invalidate suggestions',async()=>{
 const {t,alice,bob}=setup();const shirt=await alice.mutation(api.wardrobe.add,{details:top}),trousers=await alice.mutation(api.wardrobe.add,{details:bottom}),dress=await alice.mutation(api.wardrobe.add,{details:{name:'Green dress',category:'dress',colour:'green'}});
 await alice.mutation(api.wardrobe.setAvailable,{id:dress,available:false});
 const generate=vi.spyOn(Agent.prototype,'generateObject').mockImplementation(async(_ctx,_thread,config:any)=>{const prompt=JSON.parse(config.prompt);expect(prompt.items.map((i:any)=>i._id)).not.toContain(dress);return {object:{outfits:[{title:'Easy office outfit',reason:'Cotton for the warm day you described.',itemIds:[shirt,trousers]},{title:'Unavailable',reason:'No',itemIds:[dress]}]},usage:{inputTokens:100,outputTokens:50}} as any;});
 await alice.mutation(api.wardrobe.request,{text:'Office today, warm weather, lots of walking.'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const result=await alice.query(api.wardrobe.latest,{});expect(generate).toHaveBeenCalledTimes(1);expect(result.state).toBe('ready');expect(result.outfits).toHaveLength(1);expect((await bob.query(api.wardrobe.latest,{})).outfits).toEqual([]);
 await expect(bob.mutation(api.wardrobe.wear,{id:result.id!,index:0})).rejects.toThrow('own outfit');await alice.mutation(api.wardrobe.wear,{id:result.id!,index:0});expect((await alice.query(api.wardrobe.latest,{})).wornIndex).toBe(0);expect((await alice.query(api.wardrobe.list,{})).find(i=>i.id===shirt)?.lastWornAt).toBeDefined();
 await alice.mutation(api.wardrobe.setAvailable,{id:trousers,available:false});expect((await alice.query(api.wardrobe.latest,{})).changed).toBe(true);expect((await alice.query(api.wardrobe.latest,{})).outfits).toEqual([]);
});
test('changed wardrobe rejects late outfit completion',async()=>{
 const {t,alice}=setup();const shirt=await alice.mutation(api.wardrobe.add,{details:top}),trousers=await alice.mutation(api.wardrobe.add,{details:bottom});
 const rows=await t.run(ctx=>ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner','alice')).take(80));
 const id=await t.run(ctx=>ctx.db.insert('wardrobeOutfits',{owner:'alice',request:'Office',wardrobeKey:wardrobeKey(rows),threadId:'fixture',state:'building',outfits:[],note:'',createdAt:Date.now()}));
 await alice.mutation(api.wardrobe.setAvailable,{id:trousers,available:false});await t.mutation(internal.wardrobe.finish,{id,outfits:[{title:'Outfit',reason:'Test',itemIds:[shirt,trousers]}]});expect((await alice.query(api.wardrobe.latest,{})).outfits).toEqual([]);
});
test('photo upload is authenticated and creates only an owned wardrobe image',async()=>{
 const {t,alice,bob}=setup();const jpeg=readFileSync(new URL('../public/images/green-floral-kurta.jpg',import.meta.url)).toString('base64');
 await expect(t.action(api.wardrobePhoto.add,{details:top,jpegBase64:jpeg})).rejects.toThrow('sign in');await expect(alice.action(api.wardrobePhoto.add,{details:top,jpegBase64:'not an image'})).rejects.toThrow('JPEG');
 const id=await alice.action(api.wardrobePhoto.add,{details:top,jpegBase64:jpeg});const list=await alice.query(api.wardrobe.list,{});expect(list[0].id).toBe(id);expect(list[0].photoUrl).toBeTruthy();expect(await bob.query(api.wardrobe.list,{})).toEqual([]);
 await alice.mutation(api.wardrobe.remove,{id});expect(await alice.query(api.wardrobe.list,{})).toEqual([]);
});
