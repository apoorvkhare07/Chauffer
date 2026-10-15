import {convexTest} from 'convex-test';
import workflow from '@convex-dev/workflow/test';
import agentTest from '@convex-dev/agent/test';
import {Agent} from '@convex-dev/agent';
import {test,expect,vi,afterEach} from 'vitest';
import schema from './schema';
import {api,internal} from './_generated/api';
import {normalizeDecision,memoryConsent} from './aiDecision';
import {rankOptions} from './ranking';
const modules=import.meta.glob('./**/*.ts');
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();vi.clearAllTimers();vi.useRealTimers();});
const fullRequirements={category:'kurta',budget:1500,size:'M',colour:null,fabric:null,occasion:'office',style:null,fit:'straight',pattern:'solid',sleeve:null,length:null,mustHave:[]};
function reply(intent='search',extra:Record<string,unknown>={}){return {intent,reply:'I’ll look for understated kurtas for office within your budget.',requirements:fullRequirements,taste:{prefer:['solid','straight'],avoid:['embroidered']},referenceOption:null,feedbackKind:null,...extra};}
function modelReply(object:unknown){return {object,usage:{inputTokens:100,outputTokens:80}} as any;}
function setup(){vi.useFakeTimers();vi.stubEnv('GEMINI_API_KEY','test-key');const t=convexTest(schema,modules);workflow.register(t);agentTest.register(t);return {t,user:t.withIdentity({subject:'alice',issuer:'https://test.chauffeur'})};}
function products(){const urls=['https://www.flipkart.com/a/p/a','https://www.flipkart.com/b/p/b','https://www.flipkart.com/c/p/c'];vi.spyOn(globalThis,'fetch').mockImplementation(async input=>{
 const url=String(input);if(url.includes('amazon.in'))return new Response('blocked',{status:503});
 if(url.includes('/search?'))return new Response(`<script type="application/ld+json">${JSON.stringify({'@type':'ItemList',itemListElement:urls.map(url=>({url}))})}</script>`);
 const i=urls.indexOf(url),names=['Women Embroidered Kurta','Women Solid Straight Kurta','Women Printed Kurta'];
 return new Response(`<script type="application/ld+json">${JSON.stringify({'@type':'Product',name:names[i],color:'Blue',offers:{price:[300,800,500][i],priceCurrency:'INR',availability:'https://schema.org/InStock'}})}</script>`);
});return urls;}
test('AI plans free text in the shared workflow, ranks real evidence and saves only consented taste',async()=>{
 const {t,user}=setup();const urls=products();const generate=vi.spyOn(Agent.prototype,'generateObject').mockImplementation(async()=>modelReply(reply()));
 await user.mutation(api.conversations.post,{text:'Office ke liye understated kurta chahiye, M, 1500 tak. Heavy embroidery nahi.'});
 expect((await user.query(api.conversations.current,{})).pendingPhase).toBe('thinking');
 await t.finishAllScheduledFunctions(vi.runAllTimers);
 let current=await user.query(api.conversations.current,{});expect(generate).toHaveBeenCalledTimes(1);expect(current.requirements).toMatchObject({occasion:'office',pattern:'solid',budget:1500});
 const options=current.messages.at(-1)?.result?.options;expect(options?.[0].url).toBe(urls[1]);expect(options?.some(o=>o.url===urls[0])).toBe(false);expect(options?.[0].reasons).toContain('Store details match your solid preference.');
 expect(await t.run(ctx=>ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner','alice')).unique())).toBeNull();
 generate.mockImplementation(async()=>modelReply(reply('remember')));
 await user.mutation(api.conversations.post,{text:'Remember my preference for solid straight kurtas, avoid embroidery.'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const profile=await t.run(ctx=>ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner','alice')).unique());expect(profile?.taste?.prefer).toContain('solid');expect(profile?.preferences).toMatchObject({size:'M',budgetPaise:150000});
 await user.mutation(api.profiles.save,{preferences:{language:'hi',size:'L',budgetPaise:200000}});
 expect((await t.run(ctx=>ctx.db.get(profile!._id)))?.taste?.prefer).toContain('solid');
 await user.mutation(api.conversations.post,{text:'reset'});expect((await user.query(api.conversations.current,{})).requirements).toEqual({size:'L',budget:2000});
 const conversation=await t.run(ctx=>ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key','web:alice')).unique());expect(conversation?.taste?.prefer).toContain('solid');
});
test('missing details get one question; invalid reference, false memory consent and model failure cannot silently act',async()=>{
 const {t,user}=setup();const generate=vi.spyOn(Agent.prototype,'generateObject').mockImplementation(async()=>modelReply(reply('refine',{requirements:{...fullRequirements,category:null,size:null,budget:null}})));
 await user.mutation(api.conversations.post,{text:'Something understated for office'});await t.finishAllScheduledFunctions(vi.runAllTimers);expect((await user.query(api.conversations.current,{})).messages.at(-1)?.text).toContain('What would you like');
 generate.mockImplementation(async()=>modelReply(reply('remember')));await user.mutation(api.conversations.post,{text:'Solid looks better'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 expect(await t.run(ctx=>ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner','alice')).unique())).toBeNull();
 generate.mockRejectedValue(new Error('quota error with sensitive provider diagnostics'));await user.mutation(api.conversations.post,{text:'Can you try some office kurtas?'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const failed=await user.query(api.conversations.current,{});expect(failed.pending).toBe(false);expect(failed.messages.at(-1)?.text).not.toContain('sensitive');expect(failed.messages.at(-1)?.text).toContain('could not');
});
test('numbered feedback targets only the latest verified batch and keeps rejected products excluded',async()=>{
 const {t,user}=setup();const urls=products();const generate=vi.spyOn(Agent.prototype,'generateObject').mockImplementation(async()=>modelReply(reply()));
 await user.mutation(api.conversations.post,{text:'plain kurta M under 1500'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const first=(await user.query(api.conversations.current,{})).messages.at(-1)!.result!.options[0];
 generate.mockImplementation(async()=>modelReply(reply('feedback',{referenceOption:1,feedbackKind:'dislike',taste:{prefer:['printed'],avoid:['solid','embroidered']},requirements:{...fullRequirements,pattern:'printed',fit:null}})));
 await user.mutation(api.conversations.post,{text:'First one is too plain, prefer printed instead'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const current=await user.query(api.conversations.current,{});expect(current.messages.at(-1)?.result?.options.some(o=>o.url===first.url)).toBe(false);
 const feedback=await t.run(ctx=>ctx.db.query('feedback').withIndex('by_conversation').order('desc').take(1));expect(feedback[0].url).toBe(first.url);
 const c=await t.run(ctx=>ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key','web:alice')).unique());
 expect(await t.mutation(internal.aiConversations.apply,{conversationId:c!._id,revision:c!.revision-1,decision:normalizeDecision(reply(),{}, {prefer:[],avoid:[]})})).toBeNull();
});
test('preference ranking cannot invent attributes or override hard budget/constraints',()=>{
 const base={url:'https://www.flipkart.com/a/p/a',title:'Women Kurta',price:500,colour:'Blue',fabric:'Cotton',observedAt:1};
 const ranked=rankOptions([base,{...base,title:'Women Solid Straight Kurta',price:800}],{category:'kurta',budget:1000},{prefer:['solid'],avoid:[]});
 expect(ranked[0].price).toBe(800);expect(ranked[1].unknownPreferences).toContain('solid');expect(ranked[1].reasons).not.toContain('Store details match your solid preference.');
 expect(()=>normalizeDecision(reply('search',{requirements:{...fullRequirements,budget:999999}}),{}, {prefer:[],avoid:[]})).toThrow();
 expect(memoryConsent('I like this','remember')).toBe(false);expect(memoryConsent('Remember this for next time','remember')).toBe(true);
 expect(memoryConsent('I usually wear black','remember')).toBe(false);
 expect(memoryConsent('I like this, do not save it permanently or search yet','remember')).toBe(false);
 expect(memoryConsent('Do not forget my preferences','forget')).toBe(false);
});
test('negative styles never become required search words; synonyms rank real details and chat changes persist',()=>{
 const raw=reply('search',{requirements:{...fullRequirements,style:'simple',pattern:'plain',mustHave:['no embroidery']},taste:{prefer:['plain','simple'],avoid:[]}});
 const plan=normalizeDecision(raw,{}, {prefer:[],avoid:[]});
 expect(plan.requirements.mustHave).toEqual([]);expect(plan.taste.avoid).toContain('embroidered');
 const base={url:'https://www.flipkart.com/a/p/a',title:'Women Plain Kurta',price:500,colour:'Blue',fabric:'Cotton',observedAt:1};
 expect(rankOptions([base,{...base,title:'Women Embroidery Kurta'}],plan.requirements,plan.taste)).toHaveLength(1);
 expect(rankOptions([base],{category:'kurta',budget:1000,mustHave:['solid']},{prefer:[],avoid:[]})).toHaveLength(1);
 const waiting=normalizeDecision({...raw,intent:'chat'}, {category:'kurta',budget:1000,size:'L'},{prefer:[],avoid:[]});
 expect(waiting.requirements).toMatchObject({budget:1500,size:'M',pattern:'solid'});expect(waiting.taste.avoid).toContain('embroidered');
});

test('the model cannot turn an ordinary style preference into a mandatory filter',()=>{
 const raw=reply('search',{requirements:{...fullRequirements,mustHave:['solid']}});
 expect(normalizeDecision(raw,{}, {prefer:[],avoid:[]},'Something simple for office').requirements.mustHave).toEqual([]);
 expect(normalizeDecision(raw,{}, {prefer:[],avoid:[]},'Only plain kurtas please').requirements.mustHave).toEqual(['solid']);
 expect(normalizeDecision(raw,{}, {prefer:[],avoid:[]},'Plain is preferred, not a must').requirements.mustHave).toEqual([]);
 expect(normalizeDecision(raw,{}, {prefer:[],avoid:[]},'सिर्फ कॉटन।').requirements.fabric).toBe('pure cotton');
 expect(normalizeDecision(raw,{}, {prefer:[],avoid:[]},'Only cotton blend please').requirements.fabric).not.toBe('pure cotton');
});

test('broad printed feedback cannot silently acquire a new floral preference',()=>{
 const plan=normalizeDecision(reply('feedback',{requirements:{...fullRequirements,pattern:'floral',style:null},taste:{prefer:['printed','floral'],avoid:['solid']}}),{category:'kurta',budget:1500,size:'M'}, {prefer:['solid'],avoid:[]},'Second one is too plain. Show printed kurtas instead, same size and budget.');
 expect(plan.requirements.pattern).toBe('printed');expect(plan.taste.prefer).toEqual(['printed']);
 const negative=normalizeDecision(reply('feedback',{taste:{prefer:['solid'],avoid:['printed']}}),{}, {prefer:[],avoid:[]},"I don't want printed kurtas");expect(negative.requirements.pattern).toBe('solid');
});
test('card feedback targets that verified card even after later batches; like alone does not launch a search',async()=>{
 const {t,user}=setup();products();const generate=vi.spyOn(Agent.prototype,'generateObject').mockImplementation(async()=>modelReply(reply()));
 await user.mutation(api.conversations.post,{text:'plain kurta size M under 1500'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const first=(await user.query(api.conversations.current,{})).messages.at(-1)!;const chosen=first.result!.options[0];
 const c=await t.run(ctx=>ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key','web:alice')).unique());
 await t.run(ctx=>ctx.db.insert('messages',{conversationId:c!._id,session:c!.session,role:'assistant',text:'Different later batch',result:{options:[],failed:false,stores:[]}}));
 generate.mockImplementation(async()=>modelReply(reply('feedback',{referenceOption:1,feedbackKind:'like'})));
 await user.mutation(api.conversations.post,{text:'I like option 1. Keep that preference for this conversation; do not save it permanently or search yet.',reference:{messageId:first.id as any,url:chosen.url}});
 await t.finishAllScheduledFunctions(vi.runAllTimers);
 const feedback=await t.run(ctx=>ctx.db.query('feedback').withIndex('by_conversation',q=>q.eq('conversationId',c!._id)).order('desc').take(1));
 expect(feedback[0].url).toBe(chosen.url);
 expect((await user.query(api.conversations.current,{})).messages.at(-1)?.result).toBeUndefined();
 expect(await t.run(ctx=>ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner','alice')).unique())).toBeNull();
});
test('a plain more request preserves requirements and exclusions without another model interpretation',async()=>{
 const {t,user}=setup();products();const generate=vi.spyOn(Agent.prototype,'generateObject').mockImplementation(async()=>modelReply(reply()));
 await user.mutation(api.conversations.post,{text:'plain kurta size M under 1500'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const first=await user.query(api.conversations.current,{}),shown=first.messages.at(-1)!.result!.options;
 await user.mutation(api.conversations.post,{text:'Show more options'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const next=await user.query(api.conversations.current,{});expect(next.requirements).toEqual(first.requirements);expect(generate).toHaveBeenCalledTimes(1);
 expect(next.messages.at(-1)!.result!.options.every(o=>!shown.some(p=>p.url===o.url))).toBe(true);
});

test('printed correction removes an outdated plain preference without banning mixed prints',()=>{
 const plan=normalizeDecision(reply('refine',{requirements:{...fullRequirements,style:'understated',pattern:'printed'},taste:{prefer:['solid','printed','cotton'],avoid:['heavy embroidery']}}),{category:'kurta',budget:1500,size:'M',style:'solid',pattern:'solid'}, {prefer:['solid','cotton'],avoid:['heavy embroidery']},'The first one is too plain. Show printed kurtas instead, same size and budget.');
 expect(plan.taste.prefer).not.toContain('solid');
 expect(plan.requirements.style).toBeUndefined();
 expect(plan.requirements.pattern).toBe('printed');
 expect(plan.requirements).toMatchObject({budget:1500,size:'M'});
 expect(plan.taste.avoid).not.toContain('solid');
});

test('conflicting avoided styles cannot remain positive requirement notes',()=>{
 const plan=normalizeDecision(reply('refine',{requirements:{...fullRequirements,style:'solid',pattern:'printed'},taste:{prefer:['solid','printed'],avoid:['solid']}}),{}, {prefer:[],avoid:[]},'Printed instead, floral is not a must');
 expect(plan.requirements.style).toBeUndefined();
 expect(plan.taste.prefer).toEqual(['printed']);
});

test('refining a preference keeps previously shown products excluded',async()=>{
 const {t,user}=setup();products();const generate=vi.spyOn(Agent.prototype,'generateObject').mockImplementation(async()=>modelReply(reply()));
 await user.mutation(api.conversations.post,{text:'plain kurta M under 1500'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const first=(await user.query(api.conversations.current,{})).messages.at(-1)!.result!.options;
 await t.run(async ctx=>{const c=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key','web:alice')).unique();await ctx.db.patch(c!._id,{shownUrls:[]});}); // Recover older-chat exclusions from persisted messages.
 generate.mockImplementation(async()=>modelReply(reply('refine',{requirements:{...fullRequirements,pattern:'printed'},taste:{prefer:['printed'],avoid:['embroidered']}})));
 await user.mutation(api.conversations.post,{text:'Printed instead, same size and budget'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const next=(await user.query(api.conversations.current,{})).messages.at(-1)!.result!.options;
 expect(next.every(o=>!first.some(p=>p.url===o.url))).toBe(true);expect(next).toEqual([]); // The tiny fixture catalogue was exhausted in the first batch.
});

test('saved audience survives model drift, while an explicit different audience overrides it',()=>{
 const prior={category:'shirt',audience:'men' as const,size:'M',budget:1500};
 const wrong=reply('search',{requirements:{...fullRequirements,category:'shirt',audience:'women'}});
 const decision=normalizeDecision(wrong,prior,{prefer:[],avoid:[]},'Show me casual shirts');
 expect(decision.requirements.audience).toBe('men');
 expect(normalizeDecision(wrong,prior,{prefer:[],avoid:[]},'Find a shirt for my wife').requirements.audience).toBe('women');
 expect(normalizeDecision(wrong,prior,{prefer:[],avoid:[]},'Find women shirts for a gift').requirements.audience).toBe('women');
 const options=rankOptions([{title:'Women Casual Shirt',url:'https://www.flipkart.com/test/p/one',price:700,colour:'',fabric:'',observedAt:1},{title:'Men Casual Shirt',url:'https://www.flipkart.com/test/p/two',price:700,colour:'',fabric:'',observedAt:1}],decision.requirements,{prefer:[],avoid:[]});
 expect(options.map(o=>o.title)).toEqual(['Men Casual Shirt']);
});

test('settings repair an existing chat and fresh AI context uses saved age, audience and language',async()=>{
 const {t,user}=setup();
 const id=await t.run(ctx=>ctx.db.insert('conversations',{key:'web:alice',language:'hi',requirements:{category:'dress',audience:'women',size:'M',budget:1500},revision:7,session:0,pending:false,updatedAt:Date.now(),shownUrls:[],rejectedUrls:[]}));
 await user.mutation(api.profiles.save,{preferences:{language:'en',audience:'men',age:28,size:'L',budgetPaise:200000}});
 let c=await t.run(ctx=>ctx.db.get(id));expect(c?.requirements).toEqual({audience:'men',size:'L',budget:2000});expect(c?.language).toBe('en');
 const generate=vi.spyOn(Agent.prototype,'generateObject').mockImplementation(async(_ctx,_thread,opts:any)=>{
  const prompt=JSON.parse(opts.prompt);expect(prompt.language).toBe('en');expect(prompt.profile).toMatchObject({age:28,audience:'men'});expect(prompt.requirements.audience).toBe('men');
  return modelReply(reply('chat',{reply:'What kind of outfit would you like?',requirements:{...fullRequirements,category:null,budget:null,size:null,audience:null}}));
 });
 await user.mutation(api.conversations.post,{text:'hi'});await t.finishAllScheduledFunctions(vi.runAllTimers);expect(generate).toHaveBeenCalledOnce();
 expect((await user.query(api.conversations.current,{})).requirements.audience).toBe('men');
 expect((await user.query(api.profiles.get,{}))?.age).toBe(28);
 await expect(user.mutation(api.profiles.save,{preferences:{language:'en',age:28.5}})).rejects.toThrow('age');
});

test('a new For you search starts fresh while keeping saved preferences and prior history',async()=>{
 const {t,user}=setup();vi.stubEnv('GEMINI_API_KEY','');
 await user.mutation(api.profiles.save,{preferences:{language:'en',audience:'men',age:28,size:'M',budgetPaise:200000}});
 const id=await t.run(async ctx=>{
  const id=await ctx.db.insert('conversations',{key:'web:alice',language:'en',requirements:{category:'kurta',audience:'women',colour:'pink',size:'L',budget:1000},revision:3,session:0,pending:false,updatedAt:Date.now(),shownUrls:[],rejectedUrls:[]});
  await ctx.db.insert('messages',{conversationId:id,session:0,role:'user',text:'Old gift search'});return id;
 });
 await user.mutation(api.conversations.post,{text:'hi',newSearch:true});
 const current=await user.query(api.conversations.current,{});
 expect(current.requirements).toEqual({audience:'men',size:'M',budget:2000});
 expect(current.messages.some(m=>m.text==='Old gift search')).toBe(false);
 expect((await user.query(api.conversations.history,{})).sessions[0].preview).toBe('Old gift search');
 expect((await t.run(ctx=>ctx.db.get(id)))?.session).toBe(1);
});
