import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import {readFileSync} from 'node:fs';
import schema from './schema';
import {api,internal} from './_generated/api';
const modules=import.meta.glob('./**/*.ts');
const jpeg=readFileSync(new URL('../public/images/green-floral-kurta.jpg',import.meta.url)).toString('base64');
const png=new Uint8Array(200);png.set([137,80,78,71,13,10,26,10]);
const args={portraitJpeg:jpeg,garment:{kind:'upload' as const,jpeg},consent:true};
function setup(){vi.stubEnv('GEMINI_API_KEY','test');const t=convexTest(schema,modules);return {t,user:t.withIdentity({subject:'quick-test'}),other:t.withIdentity({subject:'other'})};}
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
function imageResponse(){return new Response(JSON.stringify({candidates:[{content:{parts:[{text:'{"visibleCategories":["kurta"],"category":"kurta","components":["kurta"],"detail":"green floral kurta","confidence":0.95,"ambiguous":false,"regionVisible":true}'},{inlineData:{mimeType:'image/png',data:Buffer.from(png).toString('base64')}}]}}]}));}
test('direct uploads work without a saved portrait or wardrobe and do not persist images',async()=>{
 const {t,user}=setup();const calls:any[]=[];vi.spyOn(globalThis,'fetch').mockImplementation(async(_url,init)=>{calls.push(JSON.parse(String(init?.body)));return imageResponse();});
 const first=await user.action(api.quickTryOnAI.generate,args);const second=await user.action(api.quickTryOnAI.generate,args);
 expect(first.mime).toBe('image/png');expect(second.base64).toBe(first.base64);
 expect(calls).toHaveLength(4);for(const call of calls)expect(call.contents[0].parts[1].inlineData.data).toBe(jpeg);
 await t.run(async ctx=>{expect(await ctx.db.query('stylingProfiles').withIndex('by_owner',q=>q.eq('owner','quick-test')).take(1)).toEqual([]);expect(await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner','quick-test')).take(1)).toEqual([]);expect(await ctx.db.query('tryOnPreviews').withIndex('by_owner',q=>q.eq('owner','quick-test')).take(1)).toEqual([]);expect(await ctx.db.system.query('_storage').take(1)).toEqual([]);const attempts=await ctx.db.query('stylingRequests').withIndex('by_owner_purpose',q=>q.eq('owner','quick-test').eq('purpose','tryon')).take(5);expect(attempts).toHaveLength(2);expect(attempts.every(a=>a.busyUntil===0)).toBe(true);});
});
test('auth, consent and wardrobe ownership are checked before generation',async()=>{
 const {t,user,other}=setup();const fetch=vi.spyOn(globalThis,'fetch');await expect(t.action(api.quickTryOnAI.generate,args)).rejects.toThrow('sign in');await expect(user.action(api.quickTryOnAI.generate,{...args,consent:false})).rejects.toThrow('Agree');
 const item=await t.run(async ctx=>{const photoId=await ctx.storage.store(new Blob([Buffer.from(jpeg,'base64')]));return ctx.db.insert('wardrobeItems',{owner:'quick-test',photoId,details:{name:'Kurta',category:'kurta',colour:'green'},available:true,createdAt:Date.now()});});
 await expect(other.action(api.quickTryOnAI.generate,{...args,garment:{kind:'wardrobe',id:item}})).rejects.toThrow('own wardrobe');expect(fetch).not.toHaveBeenCalled();
});
test('daily cap is removed while concurrent previews are still blocked',async()=>{
 const {t,user}=setup();const id=await user.mutation(internal.quickTryOn.claim,{consent:true});await expect(user.mutation(internal.quickTryOn.claim,{consent:true})).rejects.toThrow('current preview');await user.mutation(internal.quickTryOn.release,{id});
 await t.run(async ctx=>{for(let i=0;i<12;i++)await ctx.db.insert('stylingRequests',{owner:'quick-test',purpose:'tryon'});});const next=await user.mutation(internal.quickTryOn.claim,{consent:true});expect(next).toBeTruthy();await expect(user.mutation(internal.quickTryOn.claim,{consent:true})).rejects.toThrow('current preview');
});
test('provider failure releases the busy flag and returns a visible error',async()=>{
 const {t,user}=setup();vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('{}',{status:429}));await expect(user.action(api.quickTryOnAI.generate,args)).rejects.toThrow('service is busy');expect(await t.run(async ctx=>(await ctx.db.query('stylingRequests').withIndex('by_owner_purpose',q=>q.eq('owner','quick-test').eq('purpose','tryon')).first())?.busyUntil)).toBe(0);
});
test('product import rejects unsafe destinations and previews an allowlisted merchant image without saving',async()=>{
 const {t,user}=setup();const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('<meta property="og:title" content="Blue shirt"><meta property="og:image" content="https://images.puma.com/blue.jpg">'));
 await expect(user.action(api.quickTryOnAI.importProduct,{url:'http://127.0.0.1/private'})).rejects.toThrow('supported');expect(fetch).not.toHaveBeenCalled();
 expect(await user.action(api.quickTryOnAI.importProduct,{url:'https://in.puma.com/in/en/pd/blue-shirt/123456'})).toEqual({title:'Blue shirt',imageUrl:'https://images.puma.com/blue.jpg'});expect(fetch.mock.calls[0][1]?.redirect).toBe('manual');expect(await t.run(ctx=>ctx.db.query('savedProducts').withIndex('by_owner',q=>q.eq('owner','quick-test')).take(1))).toEqual([]);
});

test('Myntra numeric shared links load their product image while unsafe lookalikes stay rejected',async()=>{
 const {user}=setup();const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('<meta property="og:title" content="Cotton kurta"><meta property="og:image" content="https://assets.myntassets.com/kurta.jpg">'));
 for(const url of ['https://www.myntra.com.evil.example/42488619','https://www.myntra.com/','https://www.myntra.com/private/42488619','https://user:pass@www.myntra.com/42488619'])await expect(user.action(api.quickTryOnAI.importProduct,{url})).rejects.toThrow('supported');
 expect(fetch).not.toHaveBeenCalled();
 expect(await user.action(api.quickTryOnAI.importProduct,{url:'https://www.myntra.com/42488619'})).toEqual({title:'Cotton kurta',imageUrl:'https://assets.myntassets.com/kurta.jpg'});
});

test('discovery try-on uses the owned message image without saving or re-extracting the product',async()=>{
 const {t,user,other}=setup();
 const url='https://www.myntra.com/123456';
 const messageId=await t.run(async ctx=>{const conversationId=await ctx.db.insert('conversations',{key:'web:quick-test',requirements:{},revision:1,session:1,pending:false,updatedAt:Date.now(),shownUrls:[],rejectedUrls:[]});return ctx.db.insert('messages',{conversationId,session:1,role:'assistant',text:'Test results',result:{failed:false,stores:[],options:[{title:'Blue shirt',url,price:999,colour:'blue',fabric:'cotton',observedAt:Date.now(),imageUrl:'https://assets.myntassets.com/shirt.jpg'}]}});});
 const garment={kind:'discovery' as const,messageId,url};const fetch=vi.spyOn(globalThis,'fetch');
 await expect(other.action(api.quickTryOnAI.generate,{...args,garment})).rejects.toThrow('own search');
 await expect(user.action(api.quickTryOnAI.generate,{...args,garment:{...garment,url:'https://www.myntra.com/999'}})).rejects.toThrow('own search');expect(fetch).not.toHaveBeenCalled();
 fetch.mockImplementation(async url=>String(url).includes('myntassets')?new Response(Buffer.from(jpeg,'base64'),{headers:{'Content-Type':'image/jpeg'}}):imageResponse());
 expect((await user.action(api.quickTryOnAI.generate,{...args,garment})).title).toBe('Blue shirt');expect(fetch).toHaveBeenCalledTimes(3);expect(fetch.mock.calls.some(c=>String(c[0]).includes('zyte'))).toBe(false);
 expect(await t.run(ctx=>ctx.db.query('savedProducts').withIndex('by_owner',q=>q.eq('owner','quick-test')).take(1))).toEqual([]);
});

test('explicit target mismatch fails before rendering and releases the active attempt',async()=>{
 const {t,user}=setup();const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async()=>imageResponse());
 await expect(user.action(api.quickTryOnAI.generate,{...args,target:'dupatta'})).rejects.toThrow('matching item');
 expect(fetch).toHaveBeenCalledOnce();
 const rows=await t.run(ctx=>ctx.db.query('stylingRequests').withIndex('by_owner_purpose_busy',q=>q.eq('owner','quick-test').eq('purpose','tryon')).take(5));
 expect(rows).toHaveLength(1);expect(rows[0].busyUntil).toBe(0);
});
