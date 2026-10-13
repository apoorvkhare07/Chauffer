import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import agentTest from '@convex-dev/agent/test';
import {Agent} from '@convex-dev/agent';
import schema from './schema';
import {api} from './_generated/api';
import {decodeAudio} from './shoppingInput';
const modules=import.meta.glob('./**/*.ts');
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
function setup(){const t=convexTest(schema,modules);agentTest.register(t);vi.stubEnv('GEMINI_API_KEY','test');return {t,alice:t.withIdentity({subject:'alice'}),bob:t.withIdentity({subject:'bob'})};}
const option={title:'White cotton kurta',url:'https://www.flipkart.com/kurta/p/one',price:800,colour:'white',fabric:'cotton',observedAt:Date.now(),store:'Flipkart' as const};
test('wardrobe buying ignores invented/unavailable pairings and keeps ownership private',async()=>{
 const {t,alice,bob}=setup();const id=await t.run(ctx=>ctx.db.insert('savedProducts',{owner:'alice',option,savedAt:Date.now()}));const clothing=await alice.mutation(api.wardrobe.add,{details:{name:'Black trousers',category:'bottom',colour:'black'}});const unavailable=await alice.mutation(api.wardrobe.add,{details:{name:'White kurta',category:'kurta',colour:'white'}});await alice.mutation(api.wardrobe.setAvailable,{id:unavailable,available:false});
 vi.spyOn(Agent.prototype,'generateObject').mockResolvedValue({object:{summary:'Consider your existing wardrobe.',pairs:[{id:clothing,reason:'Possible pairing'},{id:unavailable,reason:'Unavailable'},{id:'invented',reason:'Made up'}],similarIds:[unavailable,'invented'],gaps:['Fit unknown']}} as any);
 const result=await alice.action(api.wardrobeBuyingAI.review,{id,occasion:'Office'});expect(result.pairs).toEqual([{name:'Black trousers',reason:'Possible pairing'}]);expect(result.similar).toEqual(['White kurta (currently unavailable)']);await expect(bob.action(api.wardrobeBuyingAI.review,{id,occasion:''})).rejects.toThrow('unavailable');
});
test('wardrobe changes while AI is working reject stale buying advice',async()=>{
 const {t,alice}=setup();const id=await t.run(ctx=>ctx.db.insert('savedProducts',{owner:'alice',option,savedAt:Date.now()}));const clothing=await alice.mutation(api.wardrobe.add,{details:{name:'Trousers',category:'bottom',colour:'black'}});
 vi.spyOn(Agent.prototype,'generateObject').mockImplementation(async()=>{await alice.mutation(api.wardrobe.setAvailable,{id:clothing,available:false});return {object:{summary:'old',pairs:[],similarIds:[],gaps:[]}} as any;});await expect(alice.action(api.wardrobeBuyingAI.review,{id,occasion:''})).rejects.toThrow('changed');
});
test('audio accepts matching supported containers and rejects oversized or mislabeled data',()=>{
 const bytes=Buffer.alloc(200);bytes.write('RIFF');bytes.write('WAVE',8);expect(decodeAudio(bytes.toString('base64'),'audio/wav')).toHaveLength(200);expect(()=>decodeAudio(bytes.toString('base64'),'audio/webm')).toThrow();expect(()=>decodeAudio('A'.repeat(940000),'audio/wav')).toThrow();
});
test('shopping input requires sign-in and consent and passes audio without saving messages',async()=>{
 const {t,alice}=setup();const bytes=Buffer.alloc(200);bytes.write('RIFF');bytes.write('WAVE',8);const args={kind:'voice' as const,base64:bytes.toString('base64'),mime:'audio/wav',consent:true};
 await expect(t.action(api.shoppingInput.read,args)).rejects.toThrow('sign in');await expect(alice.action(api.shoppingInput.read,{...args,consent:false})).rejects.toThrow('agree');const spy=vi.spyOn(Agent.prototype,'generateObject').mockResolvedValue({object:{text:'A blue kurta under ₹1000, M',uncertainties:[]}} as any);expect((await alice.action(api.shoppingInput.read,args)).text).toContain('1000');const input=(spy.mock.calls[0][2] as any).messages[0].content[1];expect(input.type).toBe('file');expect(input.mediaType).toBe('audio/wav');expect(await t.run(ctx=>ctx.db.query('messages').take(1))).toEqual([]);
});
test('data snapshot includes only owned shopping data and excludes auth secrets and image handles',async()=>{
 const {t,alice,bob}=setup();await alice.mutation(api.profiles.save,{preferences:{language:'en',size:'M'}});await alice.mutation(api.wardrobe.add,{details:{name:'Private dress',category:'dress',colour:'red'}});const exported=JSON.parse(await alice.query(api.accountSupport.download,{}));expect(exported.wardrobe[0].details.name).toBe('Private dress');expect(exported.scope).toContain('not a complete');expect(exported).not.toHaveProperty('authAccounts');expect(JSON.parse(await bob.query(api.accountSupport.download,{})).wardrobe).toEqual([]);await expect(t.query(api.accountSupport.download,{})).rejects.toThrow('sign in');
});
test('sign out everywhere invalidates owned sessions and their refresh tokens, leaving another account intact',async()=>{
 const {t}=setup();const ids=await t.run(async ctx=>{const a=await ctx.db.insert('users',{email:'a@example.test'}),b=await ctx.db.insert('users',{email:'b@example.test'});const session=await ctx.db.insert('authSessions',{userId:a,expirationTime:Date.now()+100000});await ctx.db.insert('authRefreshTokens',{sessionId:session,expirationTime:Date.now()+100000});const other=await ctx.db.insert('authSessions',{userId:b,expirationTime:Date.now()+100000});return {a,session,other};});const alice=t.withIdentity({subject:ids.a});await alice.action(api.accountSupport.signOutEverywhere,{confirmation:'SIGN OUT'});expect(await t.run(ctx=>ctx.db.get(ids.session))).toBeNull();expect(await t.run(ctx=>ctx.db.query('authRefreshTokens').withIndex('sessionId',q=>q.eq('sessionId',ids.session)).take(1))).toEqual([]);expect(await t.run(ctx=>ctx.db.get(ids.other))).not.toBeNull();
});
