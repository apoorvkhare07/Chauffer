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
 await alice.mutation(api.wardrobeMetadata.saveStyle,{details:{bodyDescription:'Long torso',fitPreferences:'Relaxed',stylePreferences:'Colourful',avoid:'Tight sleeves'}});
 const generate=vi.spyOn(Agent.prototype,'generateObject').mockImplementation(async(_ctx,_thread,config:any)=>{const prompt=JSON.parse(config.prompt);expect(prompt.style.fitPreferences).toBe('Relaxed');expect(prompt.items.map((i:any)=>i._id)).not.toContain(dress);return {object:{outfits:[{title:'Easy office outfit',reason:'Cotton for the warm day you described.',itemIds:[shirt,trousers]},{title:'Unavailable',reason:'No',itemIds:[dress]}]},usage:{inputTokens:100,outputTokens:50}} as any;});
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
test('photo analysis creates a private draft, sends a real image and preserves confirmed corrections',async()=>{
 const {t,alice,bob}=setup();const jpeg=readFileSync(new URL('../public/images/green-floral-kurta.jpg',import.meta.url)).toString('base64');
 const analysis={details:{name:'Green floral kurta',category:'kurta' as const,colour:'green',kind:'Kurta',brand:'GuessedBrand',cut:'Straight',occasion:'Casual',fabric:'',pattern:'Floral',notes:''},uncertainties:['Fabric cannot be confirmed from appearance.'],brandEvidence:''};
 vi.spyOn(Agent.prototype,'generateObject').mockImplementation(async(_ctx,_thread,config:any)=>{expect(config.messages[0].content[1].type).toBe('image');expect(config.messages[0].content[1].image.length).toBeGreaterThan(128);return {object:analysis,usage:{}} as any;});
 await expect(t.action(api.wardrobePhoto.analyse,{jpegBase64:jpeg})).rejects.toThrow('sign in');
 const result=await alice.action(api.wardrobePhoto.analyse,{jpegBase64:jpeg});expect(result.analysis.details.brand).toBe('');expect(await alice.query(api.wardrobe.list,{})).toEqual([]);
 await expect(bob.mutation(api.wardrobeMetadata.confirm,{id:result.id,details:top})).rejects.toThrow('again');
 const id=await alice.mutation(api.wardrobeMetadata.confirm,{id:result.id,details:{...result.analysis.details,colour:'teal',fabric:'cotton'}});
 const row=(await alice.query(api.wardrobe.list,{}))[0];expect(row.id).toBe(id);expect(row.details.colour).toBe('teal');expect(row.analysis?.details.colour).toBe('green');expect(row.photoUrl).toBeTruthy();
 await expect(alice.mutation(api.wardrobeMetadata.confirm,{id:result.id,details:top})).rejects.toThrow('again');
 await t.run(async ctx=>{const draft=await ctx.db.get(result.id);expect(draft?.photoId).toBeUndefined();});
});
test('failed analysis removes its stored photo and rate limits attempts',async()=>{
 const {t,alice}=setup();const jpeg=readFileSync(new URL('../public/images/green-floral-kurta.jpg',import.meta.url)).toString('base64');vi.spyOn(Agent.prototype,'generateObject').mockRejectedValue(new Error('provider unavailable'));
 for(let i=0;i<3;i++)await expect(alice.action(api.wardrobePhoto.analyse,{jpegBase64:jpeg})).rejects.toThrow('provider unavailable');
 await expect(alice.action(api.wardrobePhoto.analyse,{jpegBase64:jpeg})).rejects.toThrow('Wait a minute');
 await t.run(async ctx=>{const drafts=await ctx.db.query('wardrobePhotoDrafts').withIndex('by_owner',q=>q.eq('owner','alice')).take(4);expect(drafts).toHaveLength(3);expect(drafts.every(d=>d.state==='failed'&&!d.photoId)).toBe(true);});
});
test('optional styling preferences are private and invalidate earlier outfits',async()=>{
 const {t,alice,bob}=setup();await alice.mutation(api.wardrobe.add,{details:{name:'Dress',category:'dress',colour:'green'}});
 const rows=await t.run(ctx=>ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner','alice')).take(80));
 await t.run(ctx=>ctx.db.insert('wardrobeOutfits',{owner:'alice',request:'Office',wardrobeKey:wardrobeKey(rows),threadId:'fixture',state:'ready',outfits:[{title:'Dress',reason:'Test',itemIds:[rows[0]._id]}],note:'',createdAt:Date.now()}));
 const details={bodyDescription:'Long torso',fitPreferences:'Relaxed waist',stylePreferences:'Colourful',avoid:'Tight sleeves'};await alice.mutation(api.wardrobeMetadata.saveStyle,{details});expect(await alice.query(api.wardrobeMetadata.style,{})).toEqual(details);expect((await bob.query(api.wardrobeMetadata.style,{})).bodyDescription).toBe('');expect((await alice.query(api.wardrobe.latest,{})).changed).toBe(true);
 await expect(alice.mutation(api.wardrobeMetadata.saveStyle,{details:{...details,avoid:'x'.repeat(301)}})).rejects.toThrow('300');
 await alice.mutation(api.wardrobeMetadata.saveStyle,{details:{bodyDescription:'',fitPreferences:'',stylePreferences:'',avoid:''}});expect((await alice.query(api.wardrobeMetadata.style,{})).bodyDescription).toBe('');
});
test('expired unconfirmed photo drafts are cleaned without deleting confirmed inventory photos',async()=>{
 const {t}=setup();const photo=await t.run(ctx=>ctx.storage.store(new Blob(['fixture'])));
 const id=await t.run(ctx=>ctx.db.insert('wardrobePhotoDrafts',{owner:'alice',photoId:photo,state:'ready',createdAt:Date.now()-86400001}));
 await t.mutation(internal.wardrobeMetadata.cleanup,{});await t.run(async ctx=>{expect(await ctx.db.get(id)).toBeNull();expect(await ctx.storage.get(photo)).toBeNull();});
});

test('shopping context includes only the signed-in owner wardrobe and styling preferences',async()=>{
 const {t,alice,bob}=setup();await alice.mutation(api.wardrobe.add,{details:{...top,brand:'Known label',kind:'Shirt'}});await bob.mutation(api.wardrobe.add,{details:{name:'Private dress',category:'dress',colour:'red'}});
 await alice.mutation(api.wardrobeMetadata.saveStyle,{details:{bodyDescription:'',fitPreferences:'Relaxed',stylePreferences:'Minimal',avoid:''}});
 const id=await t.run(ctx=>ctx.db.insert('conversations',{key:'web:alice',agentThreadId:'fixture',aiTurn:true,inputText:'A top to wear with my trousers for a birthday',requirements:{category:'top',budget:1500,size:'M'},revision:1,session:1,pending:true,updatedAt:Date.now(),shownUrls:[],rejectedUrls:[]}));
 const context=await t.query(internal.aiConversations.context,{conversationId:id,revision:1});expect(context?.prompt.wardrobe).toHaveLength(1);expect(context?.prompt.wardrobe[0].name).toBe('Blue shirt');expect(context?.prompt.stylePreferences.fitPreferences).toBe('Relaxed');
});
