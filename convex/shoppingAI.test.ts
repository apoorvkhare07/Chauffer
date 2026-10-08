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
 const options=current.messages.at(-1)?.result?.options;expect(options?.[0].url).toBe(urls[1]);expect(options?.some(o=>o.url===urls[0])).toBe(false);expect(options?.[0].reasons).toContain('Store details mention solid.');
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
 expect(ranked[0].price).toBe(800);expect(ranked[1].unknownPreferences).toContain('solid');expect(ranked[1].reasons).not.toContain('Store details mention solid.');
 expect(()=>normalizeDecision(reply('search',{requirements:{...fullRequirements,budget:999999}}),{}, {prefer:[],avoid:[]})).toThrow();
 expect(memoryConsent('I like this','remember')).toBe(false);expect(memoryConsent('Remember this for next time','remember')).toBe(true);
});
