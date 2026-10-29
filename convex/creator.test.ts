import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import {readFileSync} from 'node:fs';
import schema from './schema';
import {api,internal} from './_generated/api';
const modules=import.meta.glob('./**/*.ts');
const jpeg=readFileSync(new URL('../public/images/green-floral-kurta.jpg',import.meta.url));
const args={kind:'photo' as const,aspect:'4:5' as const,scene:'Studio',pose:'Standing',direction:'',primary:{kind:'upload' as const,jpeg:jpeg.toString('base64')},consent:true};
function setup(){vi.stubEnv('GEMINI_API_KEY','test');const t=convexTest(schema,modules);return {t,user:t.withIdentity({subject:'creator-test'}),other:t.withIdentity({subject:'other'})};}
function response(){return new Response(JSON.stringify({candidates:[{content:{parts:[{inlineData:{mimeType:'image/jpeg',data:jpeg.toString('base64')}}]}}]}));}
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
test('auth, consent, input limits and model ownership reject before any provider request',async()=>{
 const {t,user,other}=setup();const fetch=vi.spyOn(globalThis,'fetch');
 await expect(t.action(api.creatorAI.generate,args)).rejects.toThrow('sign in');
 await expect(user.action(api.creatorAI.generate,{...args,consent:false})).rejects.toThrow('Agree');
 await expect(user.action(api.creatorAI.generate,{...args,direction:'x'.repeat(801)})).rejects.toThrow('800');
 const id=await t.run(async ctx=>{const photoId=await ctx.storage.store(new Blob([jpeg]));return ctx.db.insert('creatorModels',{owner:'creator-test',photoId,name:'Test',createdAt:Date.now()});});
 await expect(other.action(api.creatorAI.generate,{...args,model:{kind:'model',id}})).rejects.toThrow('own image');
 await expect(other.mutation(api.creator.removeModel,{id})).rejects.toThrow('own model');expect(fetch).not.toHaveBeenCalled();
});
test('temporary output can be saved as a model and reused without exposing another account',async()=>{
 const {t,user,other}=setup();const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async()=>response());
 const id=await user.action(api.creatorAI.generate,args);const rows=await user.query(api.creator.drafts,{});expect(rows).toHaveLength(1);expect(rows[0].state).toBe('ready');expect(await other.query(api.creator.drafts,{})).toEqual([]);
 await expect(other.mutation(api.creator.saveModel,{id,name:'Other',consent:true})).rejects.toThrow('your available');
 const modelId=await user.mutation(api.creator.saveModel,{id,name:'My model',consent:true});expect(await user.mutation(api.creator.saveModel,{id,name:'Same',consent:true})).toBe(modelId);
 expect(await other.query(api.creator.models,{})).toEqual([]);
 await user.action(api.creatorAI.generate,{...args,model:{kind:'model',id:modelId}});
 expect(JSON.parse(String(fetch.mock.calls[1][1]?.body)).contents[0].parts).toHaveLength(3);
 await t.run(async ctx=>{await ctx.db.patch(id,{expiresAt:0});});await t.mutation(internal.creator.expire,{id});
 const models=await user.query(api.creator.models,{});expect(models[0].url).toBeTruthy();
 await user.mutation(api.creator.removeModel,{id:modelId});expect(await user.query(api.creator.models,{})).toEqual([]);
});
test('concurrent creation is blocked and provider failure releases the slot without retries',async()=>{
 const {user}=setup();const id=await user.mutation(internal.creator.claim,{kind:'photo',consent:true});await expect(user.action(api.creatorAI.generate,args)).rejects.toThrow('still being made');await user.mutation(internal.creator.finish,{id,note:'Failed'});
 const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('{}',{status:429}));await expect(user.action(api.creatorAI.generate,args)).rejects.toThrow('busy');expect(fetch).toHaveBeenCalledTimes(1);expect((await user.query(api.creator.drafts,{}))[0].state).toBe('failed');
 expect(await user.mutation(internal.creator.claim,{kind:'photo',consent:true})).toBeTruthy();
});
test('expired, video and foreign drafts cannot be used as images',async()=>{
 const {t,user,other}=setup();vi.spyOn(globalThis,'fetch').mockImplementation(async()=>response());const id=await user.action(api.creatorAI.generate,args);
 await expect(other.query(internal.creator.source,{source:{kind:'draft',id}})).rejects.toThrow('own image');
 await t.run(ctx=>ctx.db.patch(id,{expiresAt:0}));await expect(user.query(internal.creator.source,{source:{kind:'draft',id}})).rejects.toThrow('expired');
 const row=await t.run(ctx=>ctx.db.get(id));await t.mutation(internal.creator.expire,{id});expect(await t.run(ctx=>ctx.storage.get(row!.outputId!))).toBeNull();
});
test('video uses current interactions endpoint and never stores input images or provider keys',async()=>{
 const {t,user}=setup();const mp4=Buffer.alloc(200);mp4.write('ftyp',4);const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({steps:[{type:'model_output',content:[{type:'video',mime_type:'video/mp4',data:mp4.toString('base64')}]}]})));
 const id=await user.action(api.creatorAI.generate,{...args,kind:'video',aspect:'9:16'});const call=fetch.mock.calls[0];expect(call[0]).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');const body=JSON.parse(String(call[1]?.body));expect(body.store).toBe(false);expect(body.model).toBe('gemini-omni-1.1-flash');expect(body.response_format.resolution).toBe('720p');
 expect((await user.query(api.creator.drafts,{}))[0].mime).toBe('video/mp4');const row=await t.run(ctx=>ctx.db.get(id));expect(JSON.stringify(row)).not.toContain('base64');expect(await t.run(ctx=>ctx.db.system.query('_storage').take(5))).toHaveLength(1);
 await expect(user.mutation(api.creator.saveModel,{id,name:'Video',consent:true})).rejects.toThrow('photo drafts');
});

test('exhausted provider allowance is explained without retrying or exposing the provider response',async()=>{
 const {user}=setup();const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({error:{status:'RESOURCE_EXHAUSTED',message:'Credit balance exhausted private provider detail'}}),{status:402}));
 await expect(user.action(api.creatorAI.generate,args)).rejects.toThrow('AI credits or billing allowance');expect(fetch).toHaveBeenCalledTimes(1);
 const [draft]=await user.query(api.creator.drafts,{});expect(draft.state).toBe('failed');expect(draft.note).toContain('changing your photo or retrying will not fix it');expect(draft.note).not.toContain('private provider detail');
});
