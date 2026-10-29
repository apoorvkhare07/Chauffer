import {convexTest} from 'convex-test';
import workflow from '@convex-dev/workflow/test';
import {test,expect,vi,afterEach} from 'vitest';
import schema from './schema';
import {api,internal} from './_generated/api';
import {amazonOptions} from './storeExtractors';
import {productOption} from './liveDiscovery';
const modules=import.meta.glob('./**/*.ts');
afterEach(()=>{vi.restoreAllMocks();vi.clearAllTimers();vi.useRealTimers();});
const urls=Array.from({length:6},(_,i)=>`https://www.flipkart.com/cotton-kurta/p/test-${i}`);
function mockStores(){vi.spyOn(globalThis,'fetch').mockImplementation(async input=>{
 const url=String(input);if(url.includes('amazon.in'))return new Response('Unavailable',{status:503});
 if(url.includes('/search?'))return new Response(`<script type="application/ld+json">${JSON.stringify({'@type':'ItemList',itemListElement:urls.map(url=>({url}))})}</script>`);
 return new Response(`<script type="application/ld+json">${JSON.stringify({'@type':'Product',name:`Women Cotton Kurta Design ${urls.indexOf(url)}`,color:'Blue',image:'https://rukmini1.flixcart.com/image/preview.jpg',offers:{price:500,priceCurrency:'INR',availability:'https://schema.org/InStock'}})}</script><table><tr><td>Fabric</td><td>Cotton</td></tr></table>`);
});}
test('saved profile seeds discovery; shared workflow saves results privately and avoids repeats',async()=>{
 vi.useFakeTimers();mockStores();const t=convexTest(schema,modules);workflow.register(t);
 const alice=t.withIdentity({subject:'alice',issuer:'https://test.chauffeur'}),bob=t.withIdentity({subject:'bob',issuer:'https://test.chauffeur'});
 await expect(t.mutation(api.conversations.post,{text:'hi'})).rejects.toThrow('sign in');
 await alice.mutation(api.profiles.save,{preferences:{size:'L',budgetPaise:200000,language:'en'}});
 await alice.mutation(api.conversations.post,{text:'kurta'});
 expect((await alice.query(api.conversations.current,{})).requirements).toMatchObject({category:'kurta',size:'L',budget:2000});
 const clarification=await alice.query(api.conversations.current,{});expect(clarification.pending).toBe(false);expect(clarification.discoveryQuestion?.field).toBe('occasion');
 await alice.mutation(api.conversations.post,{text:'For everyday wear'});
 expect((await alice.query(api.conversations.current,{})).requirements).toMatchObject({occasion:'everyday',size:'L',budget:2000});
 expect((await alice.query(api.conversations.current,{})).pending).toBe(true);
 await expect(alice.mutation(api.conversations.post,{text:'show more options'})).rejects.toThrow('already running');
 await t.finishAllScheduledFunctions(vi.runAllTimers);
 const first=await alice.query(api.conversations.current,{});expect(first.pending).toBe(false);expect(first.messages.at(-1)?.result?.options).toHaveLength(3);
 expect(first.messages.at(-1)?.result?.options[0].imageUrl).toContain('flixcart.com');
 expect((await bob.query(api.conversations.current,{})).messages).toHaveLength(1);
 const rejected=first.messages.at(-1)!.result!.options[0].url;
 await alice.mutation(api.conversations.post,{text:'Not this one: Red silk kurta under 500 size S',rejectUrl:rejected});
 expect((await alice.query(api.conversations.current,{})).requirements).toMatchObject({size:'L',budget:2000});
 await alice.mutation(api.conversations.post,{text:'None of these'});
 expect((await alice.query(api.conversations.current,{})).messages.at(-1)?.text).toContain('What should I change');
 await alice.mutation(api.conversations.post,{text:'Show more options'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const second=(await alice.query(api.conversations.current,{})).messages.at(-1)!.result!.options;expect(second).toHaveLength(3);expect(second.every(o=>!first.messages.at(-1)!.result!.options.some(p=>p.url===o.url))).toBe(true);
 // Refining can reuse matching picks but must still exclude explicitly rejected ones.
 await alice.mutation(api.conversations.post,{text:'blue size M under 1000'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const refined=await alice.query(api.conversations.current,{});expect(refined.requirements).toMatchObject({size:'M',budget:1000,colour:'blue'});expect(refined.messages.at(-1)!.result!.options).toHaveLength(3);expect(refined.messages.at(-1)!.result!.options.some(o=>o.url===rejected)).toBe(false);
 await expect(bob.mutation(api.conversations.post,{text:'Not this one',rejectUrl:rejected})).rejects.toThrow('Choose a product');
 await alice.mutation(api.conversations.post,{text:'reset'});const reset=await alice.query(api.conversations.current,{});expect(reset.messages).toHaveLength(1);expect(reset.requirements).toEqual({size:'L',budget:2000});
});
test('older search completion cannot change a new conversation',async()=>{
 const t=convexTest(schema,modules);const user=t.withIdentity({subject:'alice',issuer:'https://test.chauffeur'});await user.mutation(api.conversations.post,{text:'hi'});
 const c=await t.run(ctx=>ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key','web:alice')).unique());
 await user.mutation(api.conversations.post,{text:'reset'});
 expect(await t.mutation(internal.conversations.complete,{conversationId:c!._id,revision:c!.revision,error:'old error'})).toBeNull();
 expect((await user.query(api.conversations.current,{})).messages).toHaveLength(1);
});
test('out-of-scope requests get a fixed reply without calling the AI',async()=>{
 const originalKey=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='test-key';
 try{
  const t=convexTest(schema,modules);const user=t.withIdentity({subject:'scope-user',issuer:'https://test.chauffeur'});
  await user.mutation(api.conversations.post,{text:'mobile'});
  const current=await user.query(api.conversations.current,{});
  expect(current.pending).toBe(false);
  expect(current.messages.at(-1)?.text).toContain('fashion shopping and styling');
 }finally{if(originalKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=originalKey;}
});
test('product previews stay attached to their own result; unrelated image hosts are excluded',()=>{
 const html=`<div data-component-type="s-search-result" data-asin="B012345678"><h2>Women Blue Cotton Kurta</h2><span class="a-price"><span class="a-offscreen">₹500</span></span><img class="s-image" src="https://m.media-amazon.com/images/item.jpg"/></div>`;
 expect(amazonOptions(html,{category:'kurta',budget:1000},1)[0].imageUrl).toContain('m.media-amazon.com');
 expect(amazonOptions(html,{category:'kurta',budget:1000},1,['https://www.amazon.in/dp/B012345678'])).toEqual([]);
 const product=(image:string)=>`<script type="application/ld+json">${JSON.stringify({'@type':'Product',name:'Kurta',image,offers:{price:500,priceCurrency:'INR',availability:'https://schema.org/InStock'}})}</script>`;
 expect(productOption(product('https://unrelated.example/image.jpg'),urls[0],1)?.imageUrl).toBeUndefined();
});
test('skipping a discovery question searches without inventing the skipped preference and offers a different refinement',async()=>{
 vi.useFakeTimers();mockStores();const t=convexTest(schema,modules);workflow.register(t);const user=t.withIdentity({subject:'skip-user',issuer:'https://test.chauffeur'});
 await user.mutation(api.conversations.post,{text:'kurta under 2000 size M'});
 let current=await user.query(api.conversations.current,{});expect(current.discoveryQuestion?.field).toBe('occasion');expect(current.pending).toBe(false);
 await user.mutation(api.conversations.post,{text:'No preference, show options'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 current=await user.query(api.conversations.current,{});expect(current.requirements.occasion).toBeUndefined();expect(current.requirements).toMatchObject({budget:2000,size:'M'});expect(current.messages.at(-1)?.result?.options.length).toBeGreaterThan(0);expect(current.discoveryQuestion?.field).toBe('pattern');
});
test('discovery success requires explicit confirmation; reset isolates chat taste and old sessions',async()=>{
 vi.useFakeTimers();mockStores();const t=convexTest(schema,modules);workflow.register(t);const user=t.withIdentity({subject:'goal-user',issuer:'https://test.chauffeur'});
 await user.mutation(api.profiles.save,{preferences:{size:'M',budgetPaise:200000,language:'en'}});
 await t.run(async ctx=>{const p=await ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner','goal-user')).unique();await ctx.db.patch(p!._id,{taste:{prefer:['floral'],avoid:['black']}});});
 await user.mutation(api.conversations.post,{text:'kurta just search'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 let current=await user.query(api.conversations.current,{});expect(current.discoveryStatus).toBe('refining');
 await user.mutation(api.conversations.post,{text:'These work for me'});
 current=await user.query(api.conversations.current,{});expect(current.discoveryStatus).toBe('satisfied');expect(current.pending).toBe(false);expect(current.discoveryQuestion).toBeUndefined();
 await user.mutation(api.conversations.post,{text:'reset'});
 current=await user.query(api.conversations.current,{});expect(current.discoveryStatus).toBe('exploring');expect(current.messages).toHaveLength(1);
 const row=await t.run(ctx=>ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key','web:goal-user')).unique());expect(row?.taste).toEqual({prefer:[],avoid:[]});expect(row?.shownUrls).toEqual([]);expect(row?.rejectedUrls).toEqual([]);
 const saved=await t.run(ctx=>ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner','goal-user')).unique());expect(saved?.taste?.prefer).toContain('floral');
});
test('AI context contains only the active session history and its current need',async()=>{
 const t=convexTest(schema,modules);
 const id=await t.run(async ctx=>{const id=await ctx.db.insert('conversations',{key:'web:context-user',agentThreadId:'fixture',aiTurn:true,inputText:'black',requirements:{category:'jeans',budget:2500,size:'32',fit:'relaxed'},taste:{prefer:['relaxed'],avoid:[]},revision:2,session:2,pending:true,updatedAt:Date.now(),shownUrls:[],rejectedUrls:[]});
 await ctx.db.insert('messages',{conversationId:id,session:1,role:'user',text:'Old chat: red party dresses'});await ctx.db.insert('messages',{conversationId:id,session:2,role:'user',text:'Relaxed jeans under 2500'});return id;});
 const context=await t.query(internal.aiConversations.context,{conversationId:id,revision:2});expect(context?.prompt.history.map(m=>m.text)).toEqual(['Relaxed jeans under 2500']);expect(context?.prompt.requirements).toMatchObject({fit:'relaxed',budget:2500,size:'32'});expect(context?.prompt.wardrobe).toEqual([]);
});
test('starting a new chat archives the current session without adding a blank user message',async()=>{
 const t=convexTest(schema,modules);const user=t.withIdentity({subject:'new-chat-user',issuer:'https://test.chauffeur'});
 await t.run(async ctx=>{const id=await ctx.db.insert('conversations',{key:'web:new-chat-user',requirements:{},revision:4,session:2,pending:false,updatedAt:Date.now(),shownUrls:[],rejectedUrls:[]});await ctx.db.insert('messages',{conversationId:id,session:2,role:'user',text:'blue shirts'});});
 await user.mutation(api.conversations.newChat,{});
 const current=await user.query(api.conversations.current,{});expect(current.messages).toHaveLength(1);expect(current.messages[0].role).toBe('assistant');expect(current.messages[0].text).toContain('Tell me what you\'re looking for');
 const history=await user.query(api.conversations.history,{});expect(history.sessions).toHaveLength(1);expect(history.sessions[0].preview).toBe('blue shirts');expect(history.messages).toEqual([]);
});

 test('answering an occasion question rechecks the same catalogue; more still excludes seen picks',async()=>{
 vi.useFakeTimers();mockStores();const t=convexTest(schema,modules);workflow.register(t);
 const user=t.withIdentity({subject:'occasion-fixture',issuer:'https://test.chauffeur'});
 await user.mutation(api.conversations.post,{text:'blue cotton kurta M under 1200'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const first=await user.query(api.conversations.current,{});expect(first.discoveryQuestion?.field).toBe('occasion');
 const picks=first.messages.at(-1)!.result!.options;expect(picks.length).toBeGreaterThan(0);
 await user.mutation(api.conversations.post,{text:'For everyday wear'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const refined=await user.query(api.conversations.current,{});
 const {askedDiscoveryFields,...confirmed}=first.requirements;
 expect(refined.requirements).toMatchObject({...confirmed,occasion:'everyday'});
 expect(refined.messages.at(-1)!.result!.options.map(o=>o.url)).toEqual(picks.map(o=>o.url));
 await user.mutation(api.conversations.post,{text:'show more options'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const more=await user.query(api.conversations.current,{});
 expect(more.messages.at(-1)!.result!.options.every(o=>!picks.some(p=>p.url===o.url))).toBe(true);
 });
