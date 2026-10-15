import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import workflow from '@convex-dev/workflow/test';
import agentTest from '@convex-dev/agent/test';
import {Agent} from '@convex-dev/agent';
import schema from './schema';
import {api,internal} from './_generated/api';
import {validateEvent,localClock,cleanLocation} from './wardrobeContextRules';
import {fetchWardrobeWeather} from './wardrobeWeather';
const modules=import.meta.glob('./**/*.ts');
const event={timeZone:'Asia/Kolkata',date:'2026-10-15',period:'evening' as const,setting:'indoors' as const};
function setup(){vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-15T10:00:00Z'));vi.stubEnv('GEMINI_API_KEY','test-key');vi.stubEnv('WEATHER_API_KEY','');const t=convexTest(schema,modules);workflow.register(t);agentTest.register(t);return {t,alice:t.withIdentity({subject:'alice'}),bob:t.withIdentity({subject:'bob'})};}
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();vi.clearAllTimers();vi.useRealTimers();});
async function pieces(alice:any){return Promise.all([alice.mutation(api.wardrobe.add,{details:{name:'Blue shirt',category:'top',colour:'blue',kind:'Shirt'}}),alice.mutation(api.wardrobe.add,{details:{name:'Black jeans',category:'bottom',colour:'black',kind:'Jeans'}})]);}
test('clock respects local midnight and invalid dates/zones are rejected',()=>{
 expect(localClock(Date.parse('2026-10-15T20:00:00Z'),'Asia/Kolkata')).toMatchObject({date:'2026-10-16',period:'night'});
 expect(()=>validateEvent({...event,timeZone:'bad/zone'})).toThrow('time zone');expect(()=>validateEvent({...event,date:'2026-02-31'},Date.parse('2026-02-01'))).toThrow('date');expect(()=>validateEvent({...event,date:'2026-10-14'},Date.parse('2026-10-15'))).toThrow('90 days');
 expect(cleanLocation({source:'device',latitude:18.523456,longitude:73.854321})).toEqual({source:'device',latitude:18.52,longitude:73.85});expect(()=>cleanLocation({source:'device',latitude:100,longitude:0})).toThrow('not valid');
});
test('context uses saved size and only confirmed photo descriptions; no raw personal media in handoff',async()=>{
 const {t,alice,bob}=setup();await alice.mutation(api.profiles.save,{preferences:{name:'Private name',language:'en',gender:'male',audience:'men',size:'M',jeansSize:'32',heightCm:178}});
 await t.run(async ctx=>{await ctx.db.insert('stylingProfiles',{owner:'alice',onboarding:'complete',photoState:'ready',photoId:await ctx.storage.store(new Blob(['portrait'])),analysis:{usable:true,canEstimate:true,proportions:'UNCONFIRMED_SECRET',shape:'rectangle',confidence:'low',limitations:['Loose clothes']},updatedAt:Date.now()});});
 const before=await alice.query(api.wardrobeContext.get,{});expect(before.shopper).toMatchObject({topSize:'M',jeansSize:'32',heightCm:178,body:{source:'none',description:'',needsReview:true}});expect(JSON.stringify(before)).not.toContain('UNCONFIRMED_SECRET');
 expect((await bob.query(api.wardrobeContext.get,{})).shopper.topSize).toBeUndefined();
 await t.run(async ctx=>{const photo=await ctx.db.query('stylingProfiles').first();await ctx.db.patch(photo!._id,{confirmedDescription:'Longer torso'});await ctx.db.insert('wardrobeStyles',{owner:'alice',details:{bodyDescription:'Longer torso',fitPreferences:'Roomy',stylePreferences:'Minimal',avoid:'Scratchy fabric'},updatedAt:Date.now()});});
 expect((await alice.query(api.wardrobeContext.get,{})).shopper.body).toMatchObject({source:'confirmed_photo',description:'Longer torso',limitations:['Loose clothes']});
 const handoff=await t.query(internal.wardrobeHandoff.context,{owner:'alice',request:'Find a jacket',useWardrobe:true,useStyling:false});expect(handoff).not.toHaveProperty('shopper');expect(JSON.stringify(handoff)).not.toContain('Longer torso');expect(JSON.stringify(handoff)).not.toContain('Private name');expect(handoff.contextKey).toMatch(/^[a-f0-9]{64}$/);
});
test('wardrobe AI gets owner context, explicit event and unavailable weather; profile changes invalidate output',async()=>{
 const {t,alice,bob}=setup();const ids=await pieces(alice);await pieces(bob);
 await alice.mutation(api.profiles.save,{preferences:{language:'hi',size:'M',jeansSize:'32'}});await alice.mutation(api.wardrobeContext.setLocation,{location:{source:'city',city:'Pune, India'}});
 vi.spyOn(Agent.prototype,'generateObject').mockImplementation(async(_ctx,_thread,config:any)=>{const p=JSON.parse(config.prompt);expect(p.shopper.topSize).toBe('M');expect(p.shopper.language).toBe('hi');expect(p.items.map((i:any)=>i._id).sort()).toEqual(ids.sort());expect(p.event).toEqual(event);expect(p.weather.status).toBe('unavailable');expect(p.clock.timeZone).toBe('Asia/Kolkata');return {object:{outfits:[{title:'Dinner',reason:'Your relaxed combination',itemIds:ids}],guidance:{summary:'For dinner',tips:['Keep the shirt untucked.']}},usage:{inputTokens:50,outputTokens:50}} as any;});
 await alice.mutation(api.wardrobe.request,{text:'Dinner in English please',event});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const latest=await alice.query(api.wardrobe.latest,{});expect(latest.outfits).toHaveLength(1);expect(latest.guidance?.tips).toHaveLength(1);expect(latest.weather?.status).toBe('unavailable');expect(await t.query(internal.wardrobeHandoff.result,{owner:'bob',id:latest.id!})).toBeNull();
 await alice.mutation(api.profiles.save,{preferences:{language:'en',size:'L',jeansSize:'34'}});expect((await alice.query(api.wardrobe.latest,{})).changed).toBe(true);expect((await t.query(internal.wardrobeHandoff.result,{owner:'alice',id:latest.id!}))?.status).toBe('stale');await expect(alice.mutation(api.wardrobe.wear,{id:latest.id!,index:0})).rejects.toThrow('changed');
});
test('changing context while generating rejects the late guidance, not just outfit cards',async()=>{
 const {t,alice}=setup();const ids=await pieces(alice);await alice.mutation(api.wardrobe.request,{text:'Dinner',event});const run=await alice.query(api.wardrobe.latest,{});
 await alice.mutation(api.wardrobeContext.setLocation,{location:{source:'city',city:'Mumbai, India'}});
 await t.mutation(internal.wardrobe.finish,{id:run.id!,outfits:[{title:'Dinner',reason:'Old context',itemIds:ids}],guidance:{summary:'Stale private advice',tips:[]}});
 const latest=await alice.query(api.wardrobe.latest,{});expect(latest.outfits).toEqual([]);expect(latest.guidance).toBeUndefined();expect(latest.changed).toBe(true);
});
test('weather falls back without a key or stale observations and never sends wardrobe context',async()=>{
 setup();const location={source:'city' as const,city:'Pune, India'};const fetcher=vi.spyOn(globalThis,'fetch');expect((await fetchWardrobeWeather(location,event)).status).toBe('unavailable');expect(fetcher).not.toHaveBeenCalled();
 vi.stubEnv('WEATHER_API_KEY','weather-fixture');fetcher.mockImplementation(async url=>{const u=new URL(String(url));expect(u.hostname).toBe('api.weatherapi.com');expect(u.searchParams.get('q')).toBe('Pune, India');return new Response(JSON.stringify({location:{name:'Pune',region:'Maharashtra',country:'India',tz_id:'Asia/Kolkata'},current:{last_updated_epoch:Date.now()/1000-9000,temp_c:27,feelslike_c:29,wind_kph:10,humidity:60,is_day:1,condition:{text:'Clear'}}}));});
 expect((await fetchWardrobeWeather(location,{...event,period:'auto'})).status).toBe('unavailable');
 fetcher.mockResolvedValue(new Response(JSON.stringify({location:{name:'Pune',region:'Maharashtra',country:'India',tz_id:'Asia/Kolkata'},forecast:{forecastday:[{date:event.date,hour:[{time:event.date+' 19:00',time_epoch:Date.now()/1000+12600,temp_c:23,feelslike_c:24,wind_kph:10,humidity:70,is_day:0,chance_of_rain:60,condition:{text:'Light rain'}}]}]}})));
 expect(await fetchWardrobeWeather(location,event)).toMatchObject({status:'ready',kind:'forecast',rainChance:60,isDay:false,hour:19,source:'WeatherAPI.com'});
});
test('location is private, removable and weather lookup is rate limited',async()=>{
 const {t,alice,bob}=setup();await expect(t.mutation(api.wardrobeContext.setLocation,{location:{source:'city',city:'Pune'}})).rejects.toThrow('sign in');await alice.mutation(api.wardrobeContext.setLocation,{location:{source:'device',latitude:18.523456,longitude:73.854321}});expect((await bob.query(api.wardrobeContext.get,{})).location).toBeNull();expect((await alice.query(api.wardrobeContext.get,{})).location).toMatchObject({latitude:18.52});await alice.mutation(api.wardrobeContext.setLocation,{location:null});expect((await alice.query(api.wardrobeContext.get,{})).location).toBeNull();for(let i=0;i<6;i++)await t.mutation(internal.wardrobeContext.claimWeather,{owner:'alice'});await expect(t.mutation(internal.wardrobeContext.claimWeather,{owner:'alice'})).rejects.toThrow('Wait a minute');
});
