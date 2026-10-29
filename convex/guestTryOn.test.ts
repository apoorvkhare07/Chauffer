import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import {readFileSync} from 'node:fs';
import schema from './schema';
import {api,internal} from './_generated/api';
import {hashSecret} from './lib/otp';
const modules=import.meta.glob('./**/*.ts');
const jpeg=readFileSync(new URL('../public/images/green-floral-kurta.jpg',import.meta.url)).toString('base64');
const token=()=>crypto.randomUUID()+crypto.randomUUID();
const response=(identify=false)=>identify?new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({visibleCategories:["kurta"],category:"kurta",components:["kurta"],detail:"green kurta",confidence:0.95,ambiguous:false,regionVisible:true})}]}}]})):new Response(JSON.stringify({candidates:[{content:{parts:[{text:'{"visibleCategories":["kurta"],"category":"kurta","components":["kurta"],"detail":"green floral kurta","confidence":0.95,"ambiguous":false,"regionVisible":true}'},{inlineData:{mimeType:'image/jpeg',data:jpeg}}]}}]}));
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
function setup(){vi.stubEnv('GEMINI_API_KEY','test');vi.stubEnv('ZYTE_API_KEY','');return convexTest(schema,modules);}
async function ready(t:ReturnType<typeof convexTest>,key=token()){
 const id=await t.mutation(internal.guestTrials.claim,{tokenHash:await hashSecret(key),kind:'tryon'});
 const [outputId,previewId]=await t.run(async ctx=>Promise.all([ctx.storage.store(new Blob(['full image'])),ctx.storage.store(new Blob(['preview']))]));
 await t.mutation(internal.guestTrials.finishTryOn,{id,outputId,previewId,title:'Blue shirt',note:'AI preview'});
 return {key,id,outputId,previewId};
}
test('consent and safe product sources are checked before spending a guest attempt',async()=>{
 const t=setup(),key=token(),fetch=vi.spyOn(globalThis,'fetch');
 await expect(t.action(api.guestTrialsAI.tryOn,{token:key,portraitJpeg:jpeg,garmentJpeg:jpeg})).rejects.toThrow('Agree');
 await expect(t.action(api.guestTrialsAI.tryOn,{token:key,portraitJpeg:jpeg,productUrl:'http://127.0.0.1/private',consent:true})).rejects.toThrow('supported');
 await expect(t.action(api.guestTrialsAI.tryOn,{token:key,portraitJpeg:jpeg,garmentJpeg:jpeg,productUrl:'https://in.puma.com/in/en/pd/blue-shirt/123456',consent:true})).rejects.toThrow('one product');
 expect(fetch).not.toHaveBeenCalled();expect(await t.run(ctx=>ctx.db.query('guestTrials').take(1))).toEqual([]);
});
test('guest upload gets only a preview and inputs are not stored; next generation is gated',async()=>{
 const t=setup(),key=token(),fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async(_url,init)=>response(JSON.parse(String(init?.body??'{}')).generationConfig?.responseMimeType==='application/json'));
 const args={token:key,portraitJpeg:jpeg,garmentJpeg:jpeg,consent:true};
 const result=await t.action(api.guestTrialsAI.tryOn,args),row=await t.run(ctx=>ctx.db.query('guestTrials').first());
 expect(result.url).toBe(await t.run(ctx=>ctx.storage.getUrl(row!.tryOnPreviewId!)));
 expect(result.url).not.toBe(await t.run(ctx=>ctx.storage.getUrl(row!.tryOnOutputId!)));
 expect(row!.tryOnPhotoId).toBeUndefined();expect(row!.tryOnGarmentId).toBeUndefined();
 expect((await t.query(api.guestTrials.current,{token:key}))?.tryOnUsed).toBe(true);
 await expect(t.action(api.guestTrialsAI.tryOn,args)).rejects.toThrow('Sign in');expect(fetch).toHaveBeenCalledTimes(2);
});
test('pasted product links use the existing product reader, merchant image and shared try-on renderer',async()=>{
 const t=setup(),key=token(),calls:string[]=[];
 vi.spyOn(globalThis,'fetch').mockImplementation(async(url,init)=>{calls.push(String(url));if(String(url).includes('generativelanguage'))return response(JSON.parse(String(init?.body??'{}')).generationConfig?.responseMimeType==='application/json');if(String(url).includes('images.puma.com'))return new Response(Buffer.from(jpeg,'base64'),{headers:{'content-type':'image/jpeg'}});return new Response('<meta property="og:title" content="Blue shirt"><meta property="og:image" content="https://images.puma.com/blue.jpg">');});
 const result=await t.action(api.guestTrialsAI.tryOn,{token:key,portraitJpeg:jpeg,productUrl:'https://in.puma.com/in/en/pd/blue-shirt/123456',consent:true});
 expect(result.url).toBeTruthy();expect(calls).toHaveLength(4);expect(calls[0]).toContain('in.puma.com');expect(calls[1]).toContain('images.puma.com');expect(calls[2]).toContain('generativelanguage');
});
test('download/save/list require login and transfer the preview to only one account',async()=>{
 const t=setup(),r=await ready(t),user=t.withIdentity({subject:'first-owner'}),other=t.withIdentity({subject:'other-owner'});
 await expect(t.mutation(api.guestTryOn.exportImage,{token:r.key})).rejects.toThrow('sign in');
 await expect(t.mutation(api.guestTryOn.save,{token:r.key,consent:true})).rejects.toThrow('sign in');
 await expect(t.query(api.guestTryOn.saved,{})).rejects.toThrow('sign in');
 expect(await user.mutation(api.guestTryOn.exportImage,{token:r.key})).toBe(await t.run(ctx=>ctx.storage.getUrl(r.outputId)));
 await expect(other.mutation(api.guestTryOn.exportImage,{token:r.key})).rejects.toThrow('another account');
 expect((await other.query(api.guestTrials.current,{token:r.key}))?.tryOnUrl).toBeNull();
 expect((await t.query(api.guestTrials.current,{token:r.key}))?.tryOnUrl).toBeNull();
 await expect(user.mutation(api.guestTryOn.save,{token:r.key,consent:false})).rejects.toThrow('Confirm');
 expect(await user.mutation(api.guestTryOn.save,{token:r.key,consent:true})).toBe(r.id);
 expect(await user.mutation(api.guestTryOn.save,{token:r.key,consent:true})).toBe(r.id);
 expect(await user.query(api.guestTryOn.saved,{})).toHaveLength(1);expect(await other.query(api.guestTryOn.saved,{})).toEqual([]);
 expect(await t.run(ctx=>ctx.db.query('wardrobeItems').take(1))).toEqual([]);
});
test('saving keeps a look after guest cleanup; removing deletes media but not the spent allowance',async()=>{
 const t=setup(),r=await ready(t),user=t.withIdentity({subject:'owner'}),other=t.withIdentity({subject:'other'});
 await user.mutation(api.guestTryOn.save,{token:r.key,consent:true});
 await t.run(ctx=>ctx.db.patch(r.id,{mediaExpiresAt:Date.now()-1,expiresAt:Date.now()-1}));
 await t.mutation(internal.guestTrials.cleanup,{id:r.id});expect((await user.query(api.guestTryOn.saved,{}))[0].url).toBeTruthy();
 await expect(other.mutation(api.guestTryOn.remove,{id:r.id})).rejects.toThrow('own saved look');
 await user.mutation(api.guestTryOn.remove,{id:r.id});expect(await user.query(api.guestTryOn.saved,{})).toEqual([]);
 expect(await t.run(ctx=>ctx.storage.get(r.outputId))).toBeNull();expect(await t.run(ctx=>ctx.storage.get(r.previewId))).toBeNull();
 expect((await t.query(api.guestTrials.current,{token:r.key}))?.tryOnUsed).toBe(true);
});
test('expired media is deleted without restoring a free try-on, including late generation completion',async()=>{
 const t=setup(),r=await ready(t);
 await t.run(ctx=>ctx.db.patch(r.id,{mediaExpiresAt:Date.now()-1,expiresAt:Date.now()-1}));
 await t.mutation(internal.guestTrials.cleanup,{id:r.id});
 expect(await t.run(ctx=>ctx.storage.get(r.outputId))).toBeNull();expect((await t.query(api.guestTrials.current,{token:r.key}))?.tryOnUsed).toBe(true);
 await expect(t.mutation(internal.guestTrials.claim,{tokenHash:await hashSecret(r.key),kind:'tryon'})).rejects.toThrow('Sign in');
 const late=await t.run(ctx=>ctx.storage.store(new Blob(['late image'])));
 expect(await t.mutation(internal.guestTrials.finishTryOn,{id:r.id,outputId:late,note:'late'})).toBe(false);expect(await t.run(ctx=>ctx.storage.get(late))).toBeNull();
});
test('failures allow at most three deliberate attempts; a concurrent call is blocked',async()=>{
 const t=setup(),key=token(),tokenHash=await hashSecret(key);
 const id=await t.mutation(internal.guestTrials.claim,{tokenHash,kind:'tryon'});
 await expect(t.mutation(internal.guestTrials.claim,{tokenHash,kind:'tryon'})).rejects.toThrow('already being prepared');
 await t.mutation(internal.guestTrials.finishTryOn,{id,note:'failed'});
 vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('{}',{status:429}));
 for(let i=0;i<2;i++)await expect(t.action(api.guestTrialsAI.tryOn,{token:key,portraitJpeg:jpeg,garmentJpeg:jpeg,consent:true})).rejects.toThrow('busy');
 expect((await t.query(api.guestTrials.current,{token:key}))?.tryOnUsed).toBe(true);
 await expect(t.action(api.guestTrialsAI.tryOn,{token:key,portraitJpeg:jpeg,garmentJpeg:jpeg,consent:true})).rejects.toThrow('Sign in');
});
test('an old discovery-only session still gets its first try-on window',async()=>{
 const t=setup(),key=token(),tokenHash=await hashSecret(key);
 await t.mutation(internal.guestTrials.markChat,{tokenHash});
 const row=await t.run(ctx=>ctx.db.query('guestTrials').withIndex('by_token',q=>q.eq('tokenHash',tokenHash)).unique());
 await t.run(ctx=>ctx.db.patch(row!._id,{mediaExpiresAt:Date.now()-1,expiresAt:Date.now()-1}));
 expect((await t.query(api.guestTrials.current,{token:key}))?.tryOnUsed).toBe(false);
 const id=await t.mutation(internal.guestTrials.claim,{tokenHash,kind:'tryon'});
 await t.mutation(internal.guestTrials.cleanup,{id});
 expect((await t.query(api.guestTrials.current,{token:key}))?.tryOnState).toBe('building');
});
