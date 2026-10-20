import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import agentTest from '@convex-dev/agent/test';
import {Agent} from '@convex-dev/agent';
import schema from './schema';
import {api,internal} from './_generated/api';
import {emptyStyle} from './wardrobeRules';
import {cleanAdvice} from './stylistRules';
import {currentTrends,trendExpiry} from './stylistTrends';
const modules=import.meta.glob('./**/*.ts');
const advice={summary:'Explore relaxed tailoring.',contextUsed:['Minimal'],sections:[{title:'Fit',advice:'Try a straight-leg trouser.',reason:'A clean line suits the brief.'}],looks:[{title:'Dinner',occasion:'Evening',pieces:['Navy shirt','Straight trousers'],why:'Relaxed and polished',styling:'Keep shoes simple',alternative:'A soft knit',search:'navy relaxed shirt'}],palette:[{name:'Navy',hex:'#123456',use:'Base colour'}],trends:[{sourceId:'invented-source',adaptation:'Bad citation'}],caveats:['Sizes vary.']};
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();vi.clearAllTimers();vi.useRealTimers();});
function setup(){vi.useFakeTimers();vi.stubEnv('GEMINI_API_KEY','test');const t=convexTest(schema,modules);agentTest.register(t);return {t,a:t.withIdentity({subject:'alice'}),b:t.withIdentity({subject:'bob'})};}
test('stylist works without wardrobe/photos, rejects cross-owner refinements and validates handoffs',async()=>{
 const {t,a,b}=setup();await expect(t.mutation(api.stylist.request,{text:'Dinner'})).rejects.toThrow('sign in');
 const id=await a.mutation(api.stylist.request,{text:'Dinner under 2000'});
 await t.mutation(internal.stylist.finish,{id,advice});
 expect((await a.query(api.stylist.latest,{})).run?.advice?.trends).toEqual([]);
 expect((await b.query(api.stylist.latest,{})).run).toBeNull();
 await expect(b.mutation(api.stylist.request,{text:'Change colour',parentId:id})).rejects.toThrow('earlier');
 expect(await t.query(internal.stylist.handoff,{owner:'bob',id})).toBeNull();
 await expect(b.query(api.stylist.shoppingBrief,{id,index:0})).rejects.toThrow('current');
 const brief=await a.query(api.stylist.shoppingBrief,{id,index:0});expect(brief.text).toContain('under 2000');
 await expect(a.query(api.stylist.shoppingBrief,{id,index:0.5})).rejects.toThrow('current');
 const refined=await a.mutation(api.stylist.request,{text:'No blue',parentId:id});
 expect((await t.query(internal.stylist.plan,{id:refined}))?.previous?.request).toContain('Dinner');
});
test('saved profile changes invalidate existing advice and late results',async()=>{
 const {t,a}=setup();const id=await a.mutation(api.stylist.request,{text:'Colours for work'});
 await a.mutation(api.wardrobeMetadata.saveStyle,{details:{...emptyStyle,stylePreferences:'Minimal'}});
 await t.mutation(internal.stylist.finish,{id,advice});
 expect((await a.query(api.stylist.latest,{})).stale).toBe(true);
 expect((await a.query(api.stylist.latest,{})).run?.advice).toBeUndefined();
 await expect(a.query(api.stylist.shoppingBrief,{id,index:0})).rejects.toThrow();
});
test('stylist refuses parallel runs; timeout rejects late advice; clearing preserves daily cap',async()=>{
 const {t,a}=setup();await t.run(ctx=>ctx.db.insert('userPlans',{owner:'alice',plan:'pro',status:'active',source:'test',updatedAt:Date.now()}));const id=await a.mutation(api.stylist.request,{text:'Dinner'});
 await expect(a.mutation(api.stylist.request,{text:'Office'})).rejects.toThrow('still working');
 await t.mutation(internal.stylist.timeout,{id});await t.mutation(internal.stylist.finish,{id,advice});
 expect((await a.query(api.stylist.latest,{})).run?.state).toBe('failed');
 await t.run(async ctx=>{const r=(await ctx.db.get(id))!;for(let i=0;i<19;i++)await ctx.db.insert('stylistSessions',{owner:'alice',request:'Test',contextKey:r.contextKey,event:r.event,state:'failed',note:'',createdAt:Date.now()});});
 await a.mutation(api.stylist.clear,{});
 await expect(a.mutation(api.stylist.request,{text:'Another'})).rejects.toThrow('Twenty');
});
test('free plan includes three stylist sessions each UTC month',async()=>{
 vi.stubEnv('PLAN_LIMITS_ENABLED','true');
 const {t,a}=setup();
 for(let i=0;i<3;i++){const id=await a.mutation(api.stylist.request,{text:`Brief ${i}`});await t.mutation(internal.stylist.timeout,{id});}
 expect((await a.query(api.planAccess.current,{})).usage.stylistSessions).toBe(3);
 await expect(a.mutation(api.stylist.request,{text:'One more brief'})).rejects.toThrow('3 free stylist sessions');
});
test('model receives confirmed context, no raw photos or inventory, and outputs are stored safely',async()=>{
 const {t,a}=setup();await a.mutation(api.styling.saveSetup,{preferences:{language:'en',size:'M',heightCm:175},style:{...emptyStyle,stylePreferences:'Classic'}});
 const mock=vi.spyOn(Agent.prototype,'generateObject').mockResolvedValue({object:advice,usage:{}} as any);
 const id=await a.mutation(api.stylist.request,{text:'A classic dinner look'});
 await t.action(internal.stylistAI.generate,{id});
 expect(mock).toHaveBeenCalledOnce();const prompt=JSON.parse(mock.mock.calls[0][2].prompt as string);
 expect(prompt.context.shopper.topSize).toBe('M');expect(prompt.context.shopper.body.source).toBe('none');expect(prompt.owner).toBeUndefined();expect(prompt.references).toEqual([]);
 expect((await a.query(api.stylist.latest,{})).run?.state).toBe('ready');
});
test('stylist can only use selected owner sources and returns only those image references',async()=>{
 const {t,a,b}=setup();
 const details={name:'Navy cotton shirt',category:'top' as const,colour:'Navy',fabric:'Cotton'};
 const aliceItem=await a.mutation(api.wardrobe.add,{details}),bobItem=await b.mutation(api.wardrobe.add,{details});
 await expect(a.mutation(api.stylist.request,{text:'Style this shirt',references:[`w:${bobItem}`]})).rejects.toThrow('Choose current items');
 const generated={...advice,looks:[{...advice.looks[0],references:[`w:${aliceItem}`,`w:${bobItem}`]}]};
 let modelPrompt:any;
 vi.spyOn(Agent.prototype,'generateObject').mockImplementation(async(_ctx,_thread,config:any)=>{modelPrompt=JSON.parse(config.prompt);return {object:generated,usage:{}} as any;});
 const id=await a.mutation(api.stylist.request,{text:'Style this shirt',references:[`w:${aliceItem}`]});
 await t.action(internal.stylistAI.generate,{id});
 const result=(await a.query(api.stylist.latest,{})).run?.advice;
 expect(modelPrompt.references).toMatchObject([{key:`w:${aliceItem}`,title:'Navy cotton shirt',colour:'Navy'}]);
 expect(result?.looks[0].references).toEqual([`w:${aliceItem}`]);
});
test('trend evidence expires and invalid palette values cannot become styles',()=>{
 expect(currentTrends(trendExpiry+1)).toEqual([]);
 const clean=cleanAdvice({...advice,palette:[{name:'Bad',hex:'url(https://bad)',use:'No'}]},[]);
 expect(clean.palette[0].hex).toBe('#e9edf6');expect(clean.trends).toEqual([]);
});
test('unreviewed photo style stays out of agent context and confirmed notes clear with photo removal',async()=>{
 const {t,a}=setup();const photoId=await t.run(ctx=>ctx.storage.store(new Blob(['fixture'])));
 await t.run(ctx=>ctx.db.insert('stylingProfiles',{owner:'alice',onboarding:'active',photoId,photoState:'ready',analysis:{usable:true,canEstimate:false,proportions:'',shape:'',confidence:'low',limitations:[],visibleStyle:'Blue casual shirt'},updatedAt:Date.now()}));
 expect((await a.query(api.wardrobeContext.get,{})).shopper.photoStyle).toBeUndefined();
 await a.mutation(api.styling.confirmVisualStyle,{photoId,text:'Blue casual shirt'});
 expect((await a.query(api.wardrobeContext.get,{})).shopper.photoStyle).toBe('Blue casual shirt');
 await a.mutation(api.styling.removePhoto,{});
 expect((await a.query(api.wardrobeContext.get,{})).shopper.photoStyle).toBeUndefined();
});
