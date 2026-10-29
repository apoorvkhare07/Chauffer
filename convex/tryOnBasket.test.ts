import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import {readFileSync} from 'node:fs';
import schema from './schema';
import {api,internal} from './_generated/api';
const modules=import.meta.glob('./**/*.ts');
const option={title:'Test cotton shirt',url:'https://www.myntra.com/123456',price:999,colour:'blue',fabric:'cotton',imageUrl:'https://assets.myntassets.com/shirt.jpg',observedAt:Date.now(),store:'Myntra' as const};
async function setup(){
 const t=convexTest(schema,modules),user=t.withIdentity({subject:'basket-owner'}),other=t.withIdentity({subject:'basket-other'});
 const ids=await t.run(async ctx=>{
  const catalogId=await ctx.db.insert('browseCatalog',{key:'myntra-tops',store:'Myntra',category:'Tops',audience:'women',options:[option],attemptedAt:1,updatedAt:Date.now(),leaseUntil:0,retryAt:Date.now()+3600000,state:'ready'});
  const conversationId=await ctx.db.insert('conversations',{key:'web:basket-owner',requirements:{},revision:1,session:1,pending:false,updatedAt:Date.now(),shownUrls:[],rejectedUrls:[]});
  const messageId=await ctx.db.insert('messages',{conversationId,session:1,role:'assistant',text:'Test result',result:{failed:false,stores:[],options:[option]}});
  return {catalogId,messageId};
 });return {t,user,other,...ids};
}
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
test('catalogue and chat add the same piece once without adding it to saved products',async()=>{
 const {t,user,catalogId,messageId}=await setup();
 const id=await user.mutation(api.tryOnBasket.add,{source:{kind:'catalog',id:catalogId,url:option.url}});
 expect(await user.mutation(api.tryOnBasket.add,{source:{kind:'discovery',messageId,url:option.url}})).toBe(id);
 expect(await user.query(api.tryOnBasket.list,{})).toEqual([{_id:id,option,addedAt:expect.any(Number)}]);
 expect(await user.query(api.savedProducts.list,{})).toEqual([]);
 await t.run(ctx=>ctx.db.patch(catalogId,{options:[]}));
 expect(await user.query(internal.quickTryOn.source,{source:{kind:'basket',id}})).toEqual({title:option.title,imageUrl:option.imageUrl});
});
test('basket ownership covers adds, reads, removal, generation sources and store links',async()=>{
 const {t,user,other,catalogId,messageId}=await setup();
 await expect(t.query(api.tryOnBasket.list,{})).rejects.toThrow('sign in');
 await expect(other.mutation(api.tryOnBasket.add,{source:{kind:'discovery',messageId,url:option.url}})).rejects.toThrow('own chat');
 await expect(user.mutation(api.tryOnBasket.add,{source:{kind:'catalog',id:catalogId,url:'https://www.myntra.com/9999'}})).rejects.toThrow('Choose a product');
 const id=await user.mutation(api.tryOnBasket.add,{source:{kind:'catalog',id:catalogId,url:option.url}});
 expect(await other.query(api.tryOnBasket.list,{})).toEqual([]);
 await expect(other.mutation(api.tryOnBasket.remove,{id})).rejects.toThrow('not in your');
 await expect(other.query(internal.quickTryOn.source,{source:{kind:'basket',id}})).rejects.toThrow('no longer');
 expect(await other.query(api.affiliate.link,{reference:{kind:'basket',id},source:'basket'})).toBeNull();
 expect(await user.query(api.affiliate.link,{reference:{kind:'basket',id},source:'catalog'})).toBeNull();
 expect(await user.query(api.affiliate.link,{reference:{kind:'basket',id},source:'basket'})).toMatchObject({href:option.url});
 await user.mutation(api.tryOnBasket.remove,{id});
 expect(await user.query(api.tryOnBasket.list,{})).toEqual([]);
 await expect(user.query(internal.quickTryOn.source,{source:{kind:'basket',id}})).rejects.toThrow('no longer');
});
test('basket size is enforced on the server and duplicate adds remain safe at the limit',async()=>{
 const {t,user,catalogId}=await setup();
 await t.run(ctx=>ctx.db.patch(catalogId,{options:Array.from({length:9},(_,i)=>({...option,url:`https://www.myntra.com/${123456+i}`}))}));
 for(let i=0;i<8;i++)await user.mutation(api.tryOnBasket.add,{source:{kind:'catalog',id:catalogId,url:`https://www.myntra.com/${123456+i}`}});
 await expect(user.mutation(api.tryOnBasket.add,{source:{kind:'catalog',id:catalogId,url:'https://www.myntra.com/123464'}})).rejects.toThrow('holds 8');
 await user.mutation(api.tryOnBasket.add,{source:{kind:'catalog',id:catalogId,url:option.url}});
 expect(await user.query(api.tryOnBasket.list,{})).toHaveLength(8);
});
test('basket generation uses the trusted image and original portrait without saving media',async()=>{
 const {t,user,catalogId}=await setup();vi.stubEnv('GEMINI_API_KEY','test');
 const id=await user.mutation(api.tryOnBasket.add,{source:{kind:'catalog',id:catalogId,url:option.url}});
 const jpeg=readFileSync(new URL('../public/images/green-floral-kurta.jpg',import.meta.url)).toString('base64');
 const png=new Uint8Array(200);png.set([137,80,78,71,13,10,26,10]);const bodies:any[]=[];
 vi.spyOn(globalThis,'fetch').mockImplementation(async(url,init)=>{
  if(String(url)===option.imageUrl)return new Response(Buffer.from(jpeg,'base64'),{headers:{'Content-Type':'image/jpeg'}});
  bodies.push(JSON.parse(String(init?.body)));
  return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({visibleCategories:["top"],category:"top",components:["top"],detail:"blue top",confidence:0.95,ambiguous:false,regionVisible:true})},{inlineData:{mimeType:'image/png',data:Buffer.from(png).toString('base64')}}]}}]}));
 });
 const args={portraitJpeg:jpeg,garment:{kind:'basket' as const,id},consent:true};
 await user.action(api.quickTryOnAI.generate,args);await user.action(api.quickTryOnAI.generate,args);
 expect(bodies).toHaveLength(4);expect(bodies.every(b=>b.contents[0].parts[1].inlineData.data===jpeg)).toBe(true);
 expect(await user.query(api.savedProducts.list,{})).toEqual([]);
 await t.run(async ctx=>{expect(await ctx.db.system.query('_storage').take(1)).toEqual([]);expect(await ctx.db.query('tryOnPreviews').withIndex('by_owner',q=>q.eq('owner','basket-owner')).take(1)).toEqual([]);});
});

test('new chat clears only the owners basket and rejects stale chat adds',async()=>{
 const {t,user,other,catalogId,messageId}=await setup();
 await user.mutation(api.tryOnBasket.add,{source:{kind:'catalog',id:catalogId,url:option.url}});
 await other.mutation(api.tryOnBasket.add,{source:{kind:'catalog',id:catalogId,url:option.url}});
 const before=await user.query(api.tryOnBasket.session,{});
 await t.run(ctx=>ctx.db.insert('savedProducts',{owner:'basket-owner',option,savedAt:Date.now()}));
 await user.mutation(api.conversations.newChat,{});
 expect(await user.query(api.tryOnBasket.session,{})).not.toBe(before);
 expect(await user.query(api.tryOnBasket.list,{})).toEqual([]);
 expect(await other.query(api.tryOnBasket.list,{})).toHaveLength(1);
 expect(await user.query(api.savedProducts.list,{})).toHaveLength(1);
 await expect(user.mutation(api.tryOnBasket.add,{source:{kind:'discovery',messageId,url:option.url}})).rejects.toThrow('own chat');
});
test('new search clears basket but a normal refinement keeps it',async()=>{
 const {user,catalogId}=await setup();vi.stubEnv('GEMINI_API_KEY','');
 await user.mutation(api.tryOnBasket.add,{source:{kind:'catalog',id:catalogId,url:option.url}});
 await user.mutation(api.conversations.post,{text:'hello'});
 expect(await user.query(api.tryOnBasket.list,{})).toHaveLength(1);
 await user.mutation(api.conversations.post,{text:'hello',newSearch:true});
 expect(await user.query(api.tryOnBasket.list,{})).toEqual([]);
 await user.mutation(api.tryOnBasket.add,{source:{kind:'catalog',id:catalogId,url:option.url}});
 await user.mutation(api.conversations.post,{text:'reset'});
 expect(await user.query(api.tryOnBasket.list,{})).toEqual([]);
});
