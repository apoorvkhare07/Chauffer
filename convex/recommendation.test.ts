import {convexTest} from 'convex-test';
import workflow from '@convex-dev/workflow/test';
import agentTest from '@convex-dev/agent/test';
import {Agent} from '@convex-dev/agent';
import {test,expect,vi,afterEach} from 'vitest';
import schema from './schema';
import {api,internal} from './_generated/api';
import {evidencePool,validateChoices,memoryRelevant,recipientFromText,isMore,evidenceWording,coverageCheckedReport,limits,type Brief} from './recommendationRules';
import {baselinePool,baselineRequest,journeyCases} from '../evals/recommendation-baseline';
import {chooseBatch} from './ranking';
const modules=import.meta.glob('./**/*.ts');
afterEach(()=>{limits.deadlineMs=115000;vi.restoreAllMocks();vi.unstubAllEnvs();vi.clearAllTimers();vi.useRealTimers();});
function setup(){const t=convexTest(schema,modules);workflow.register(t);agentTest.register(t);return {t,user:t.withIdentity({subject:'architecture-test',issuer:'https://test.chauffeur'}),other:t.withIdentity({subject:'other-test',issuer:'https://test.chauffeur'})};}
async function task(){vi.stubEnv('RECOMMENDATION_V2_OWNERS','architecture-test');const x=setup();const c=await x.t.run(ctx=>ctx.db.insert('conversations',{key:'web:architecture-test',requirements:baselineRequest,revision:1,session:0,pending:true,aiTurn:true,inputText:journeyCases[0].request,updatedAt:Date.now(),shownUrls:[],rejectedUrls:[]}));const id=await x.t.mutation(internal.recommendationTasks.start,{conversationId:c,revision:1});return {...x,c,id:id!};}
const brief:Brief={version:2,route:'discover',recipient:'self',requirements:baselineRequest,taste:{prefer:[],avoid:[]},goal:'Everyday shirt',language:'en',memoryIds:[],wardrobeRequested:false,excludeShown:false,hardFields:['category','colour','budget']};
const report={summary:'Possible everyday picks.',choices:[{id:'p1',reason:'Crew neck listed.',evidenceIds:['p1'],tradeoff:'Fit is not verified.'}],outfits:[],needsEvidence:[],limitations:[]};
test('frozen baseline records two eligible choices without everyday tags; separates evidence from live coverage',()=>{
 const ranked=chooseBatch(baselinePool,baselineRequest,{prefer:[],avoid:[]});expect(ranked.map(o=>o.url)).toEqual([baselinePool[0].url,baselinePool[1].url]);expect(ranked).toHaveLength(2);expect(journeyCases).toHaveLength(4);
});
test('new evidence pool keeps only hard matches and does not invent visual analysis',()=>{const p=evidencePool(baselinePool,baselineRequest);expect(p).toHaveLength(2);expect(p.every(x=>!x.imageInspected&&x.visual.length===0)).toBe(true);expect(validateChoices(report.choices,p,baselineRequest)).toHaveLength(1);expect(validateChoices([{...report.choices[0],id:'invented'}],p,baselineRequest)).toEqual([]);expect(validateChoices([{...report.choices[0],evidenceIds:['p2']}],p,baselineRequest)).toEqual([]);});
test('conflicting product evidence cannot publish a recommendation',()=>{const p=evidencePool(baselinePool,baselineRequest);p[0].conflicts=['Image shows a different garment'];expect(validateChoices(report.choices,p,baselineRequest)).toEqual([]);});
test('memory scope distinguishes category, gift recipient, age and confirmed facts',()=>{
 const m={recipient:'self',category:'t-shirt',kind:'tentative',updatedAt:Date.now()};expect(memoryRelevant(m,'self','t-shirt')).toBe(true);expect(memoryRelevant(m,'self','sneakers')).toBe(false);expect(memoryRelevant(m,'other','t-shirt')).toBe(false);expect(memoryRelevant({...m,updatedAt:1},'self','t-shirt')).toBe(false);expect(memoryRelevant({...m,kind:'confirmed',updatedAt:1},'self','t-shirt')).toBe(true);
 expect(recipientFromText('for my brother')).toBe('other');expect(recipientFromText('for myself','other')).toBe('self');expect(isMore('try again')).toBe(false);expect(isMore('show more options')).toBe(true);
});
test('memory controls enforce ownership, correction, removal and learning off',async()=>{
 const {user,other}=setup();await user.mutation(api.shopperMemory.edit,{text:'Small graphics on tops',category:'t-shirt'});let memory=await user.query(api.shopperMemory.list,{});const id=memory.items[0].id as any;
 expect((await other.query(api.shopperMemory.list,{})).items).toEqual([]);await expect(other.mutation(api.shopperMemory.remove,{id})).rejects.toThrow('unavailable');
 await user.mutation(api.shopperMemory.edit,{id,text:'Plain tops',category:'t-shirt'});expect((await user.query(api.shopperMemory.list,{})).items[0].text).toBe('Plain tops');
 await user.mutation(api.shopperMemory.setEnabled,{enabled:false});expect((await user.query(api.shopperMemory.list,{})).settings.enabled).toBe(false);await user.mutation(api.shopperMemory.remove,{id});expect((await user.query(api.shopperMemory.list,{})).items).toEqual([]);
});
test('task starts idempotently and model reservations enforce call/image/token caps',async()=>{
 const {t,id,c}=await task();expect(await t.mutation(internal.recommendationTasks.start,{conversationId:c,revision:1})).toBe(id);
 for(let i=0;i<8;i++)expect(await t.mutation(internal.recommendationTasks.reserve,{taskId:id,step:`model:${i}`,tokens:100})).toBe(true);
 expect(await t.mutation(internal.recommendationTasks.reserve,{taskId:id,step:'model:9',tokens:100})).toBe(false);
 expect(await t.mutation(internal.recommendationTasks.reserve,{taskId:id,step:'model:0',tokens:100})).toBe(false);
 expect(await t.mutation(internal.recommendationTasks.reserve,{taskId:id,step:'images',tokens:0,images:13})).toBe(false);
});
test('memory removal during a run blocks context and publication of stale advice',async()=>{
 const {t,id,user}=await task();await user.mutation(api.shopperMemory.edit,{text:'No large logos',category:'all'});expect(await t.query(internal.recommendationTasks.context,{taskId:id})).toBeNull();
 await t.mutation(internal.recommendationTasks.finish,{taskId:id,report,stores:[]});const current=await user.query(api.conversations.current,{});expect(current.pending).toBe(false);expect(current.messages.at(-1)?.text).toContain('memory settings changed');expect(current.messages.at(-1)?.result).toBeUndefined();
});
test('cancelled revisions cannot publish and release claims',async()=>{const {t,id,c}=await task();await t.run(ctx=>ctx.db.patch(c,{revision:2}));await t.mutation(internal.recommendationTasks.finish,{taskId:id,report,stores:[]});expect((await t.run(ctx=>ctx.db.get(id)))?.status).toBe('cancelled');});
test('publication filters invented products and keeps priced records instead of generated prices',async()=>{
 const {t,id,user}=await task();await t.mutation(internal.recommendationTasks.setBrief,{taskId:id,brief,memories:[]});await t.mutation(internal.recommendationTasks.setPool,{taskId:id,pool:evidencePool(baselinePool,baselineRequest),wardrobeKey:''});
 await t.mutation(internal.recommendationTasks.finish,{taskId:id,report:{...report,choices:[...report.choices,{...report.choices[0],id:'invented'}]},stores:[]});const current=await user.query(api.conversations.current,{});expect(current.messages.at(-1)?.result?.options).toHaveLength(1);expect(current.messages.at(-1)?.result?.options[0].price).toBe(749);
});
test('unsupported memories and gift memories cannot be written by a planner',async()=>{
 const {t,id,user}=await task();await t.mutation(internal.recommendationTasks.setBrief,{taskId:id,brief:{...brief,recipient:'other'},memories:[{text:'Likes navy',category:'all',kind:'confirmed',quote:'navy'}]});expect((await user.query(api.shopperMemory.list,{})).items).toEqual([]);
});
test('owner-reported purchases do not create owned inventory and another user cannot record them',async()=>{
 const {t,id,user,other}=await task();await t.mutation(internal.recommendationTasks.setBrief,{taskId:id,brief,memories:[]});await t.mutation(internal.recommendationTasks.setPool,{taskId:id,pool:evidencePool(baselinePool,baselineRequest),wardrobeKey:''});await t.mutation(internal.recommendationTasks.finish,{taskId:id,report,stores:[]});
 const m=(await user.query(api.conversations.current,{})).messages.at(-1)!;const args={messageId:m.id as any,url:baselinePool[0].url,recipient:'self' as const,kind:'bought' as const,note:'Kept it'};
 await expect(other.mutation(api.shopperMemory.recordOutcome,args)).rejects.toThrow('Choose');await user.mutation(api.shopperMemory.recordOutcome,args);expect(await t.run(ctx=>ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner','architecture-test')).take(10))).toEqual([]);
});
function modelObject(object:unknown){return {object,usage:{inputTokens:100,outputTokens:80}} as any;}
const planned={route:'discover',recipient:'self',wardrobeRequested:false,memories:[],intent:'search',reply:'I will look for everyday options.',requirements:{category:'t-shirt',audience:'men',budget:900,size:'M',colour:'navy',fabric:null,occasion:'everyday',style:null,fit:null,pattern:null,sleeve:null,length:null,mustHave:[]},taste:{prefer:[],avoid:[]},referenceOption:null,feedbackKind:null};
test('new workflow runs planner, store tools, recommendation and independent check, then reuses matches on refinement',async()=>{
 vi.useFakeTimers();limits.deadlineMs=86400000;vi.stubEnv('GEMINI_API_KEY','fixture');vi.stubEnv('RECOMMENDATION_V2_OWNERS','architecture-test');const {t,user}=setup();
 // Workpool's fake-clock drain advances maintenance timers; deadline checks are tested separately.
 const calls:string[]=[];
 vi.spyOn(Agent.prototype,'generateObject').mockImplementation(async function(this:Agent,...args:any[]){
  const name=this.options.name!;calls.push(name);
  if(name.endsWith('planner'))return modelObject(planned);
  if(name.endsWith('discovery'))return modelObject({stores:['Bonkers Corner']});
  return modelObject({...report,choices:[{...report.choices[0],id:'p1'},{...report.choices[0],id:'p2',evidenceIds:['p2']}]});
 });
 vi.spyOn(globalThis,'fetch').mockImplementation(async input=>{
  if(String(input).includes('bonkerscorner.com'))return new Response(JSON.stringify({resources:{results:{products:[{title:'Men Navy Cotton Crew T-Shirt',url:'/products/navy-crew',body:'Colour: Navy',available:true,price:'749.00'},{title:'Men Navy Cotton Graphic T-Shirt',url:'/products/navy-print',body:'Colour: Navy',available:true,price:'799.00'}]}}}));
  return new Response('Blocked',{status:503});
 });
 await user.mutation(api.conversations.post,{text:journeyCases[0].request});await t.finishAllScheduledFunctions(vi.runAllTimers);
 let current=await user.query(api.conversations.current,{});expect(current.pending).toBe(false);expect(current.messages.at(-1)?.result?.options).toHaveLength(2);expect(calls).toContain('Chauffeur final-check');expect(calls).not.toContain('Chauffeur Discovery');
 const first=current.messages.at(-1)!.result!.options;
 await user.mutation(api.conversations.post,{text:'For everyday wear'});await t.finishAllScheduledFunctions(vi.runAllTimers);current=await user.query(api.conversations.current,{});expect(current.messages.at(-1)?.result?.options.map(o=>o.url)).toEqual(first.map(o=>o.url));
});
test('owned-only route validates outfit IDs and makes no store calls',async()=>{
 vi.useFakeTimers();limits.deadlineMs=86400000;vi.stubEnv('GEMINI_API_KEY','fixture');vi.stubEnv('RECOMMENDATION_V2_OWNERS','architecture-test');const {t,user}=setup();
 const ids=await t.run(async ctx=>{const ids=[];for(const [name,category] of [['Cream shirt','top'],['Navy trousers','bottom']] as const)ids.push(await ctx.db.insert('wardrobeItems',{owner:'architecture-test',details:{name,category,colour:'navy'},available:true,createdAt:Date.now()}));return ids;});
 const fetch=vi.spyOn(globalThis,'fetch').mockRejectedValue(new Error('Must not fetch stores'));
 vi.spyOn(Agent.prototype,'generateObject').mockImplementation(async function(this:Agent,...args:any[]){if(this.options.name?.endsWith('final-check'))return modelObject(JSON.parse(args[2].prompt).report);return modelObject(this.options.name?.endsWith('planner')?{...planned,route:'wardrobe',intent:'chat',wardrobeRequested:true}:{criteria:['Combine your available pieces.'],outfits:[{title:'Dinner option',reason:'Based on your recorded colours.',itemIds:ids},{title:'Invented',reason:'Invalid',itemIds:['unknown']}],note:'One combination from your wardrobe.'});});
 await user.mutation(api.conversations.post,{text:'What can I wear from my wardrobe? Do not shop.'});await t.finishAllScheduledFunctions(vi.runAllTimers);
 const current=await user.query(api.conversations.current,{});expect(current.messages.at(-1)?.text).toContain('Cream shirt + Navy trousers');expect(current.messages.at(-1)?.text).not.toContain('Invented');expect(fetch).not.toHaveBeenCalled();
});
test('new task retrieves relevant memories but excludes different categories and personalisation-off',async()=>{
 const {t,id,user}=await task();await user.mutation(api.shopperMemory.edit,{text:'Small logos',category:'t-shirt'});await user.mutation(api.shopperMemory.edit,{text:'Cushioned walking shoes',category:'sneakers'});
 const m=await user.query(api.shopperMemory.list,{});await t.run(ctx=>ctx.db.patch(id,{memoryRevision:m.settings.revision}));
 const c=await t.query(internal.recommendationTasks.context,{taskId:id});expect(c?.memory.map(x=>x.text)).toEqual(['Small logos']);
 await user.mutation(api.shopperMemory.setEnabled,{enabled:false});expect(await t.query(internal.recommendationTasks.context,{taskId:id})).toBeNull();
});

test('expired tasks cannot reserve calls or read old context',async()=>{const {t,id}=await task();await t.run(ctx=>ctx.db.patch(id,{deadlineAt:Date.now()-1}));expect(await t.query(internal.recommendationTasks.context,{taskId:id})).toBeNull();expect(await t.mutation(internal.recommendationTasks.reserve,{taskId:id,step:'model:expired',tokens:100})).toBe(false);});

test('late completion cannot publish results after the task deadline',async()=>{
 const {t,id,user}=await task();await t.mutation(internal.recommendationTasks.setBrief,{taskId:id,brief,memories:[]});await t.mutation(internal.recommendationTasks.setPool,{taskId:id,pool:evidencePool(baselinePool,baselineRequest),wardrobeKey:''});await t.run(ctx=>ctx.db.patch(id,{deadlineAt:Date.now()-1}));await t.mutation(internal.recommendationTasks.finish,{taskId:id,report,stores:[]});const c=await user.query(api.conversations.current,{});expect(c.pending).toBe(false);expect(c.messages.at(-1)?.result?.options).toEqual([]);expect(c.messages.at(-1)?.text).toContain('time limit');
});
test('final checker can remove an outfit and cannot introduce another set of items',async()=>{
 vi.stubEnv('GEMINI_API_KEY','fixture');const {t,id}=await task();await t.mutation(internal.recommendationTasks.setBrief,{taskId:id,brief,memories:[]});
 vi.spyOn(Agent.prototype,'generateObject').mockResolvedValue(modelObject({...report,outfits:[{title:'Invented',reason:'New combination',itemIds:['unknown']}]}));
 const checked=await t.action(internal.recommendationAgents.check,{taskId:id,report:{...report,outfits:[{title:'Original',reason:'Before review',itemIds:['owned1','owned2']}]}});expect(checked.outfits).toEqual([]);
});
test('model reservations keep room for the final reviewer',async()=>{
 const {t,id}=await task();expect(await t.mutation(internal.recommendationTasks.reserve,{taskId:id,step:'model:planner',tokens:19500})).toBe(true);expect(await t.mutation(internal.recommendationTasks.reserve,{taskId:id,step:'model:extra',tokens:1000})).toBe(false);expect(await t.mutation(internal.recommendationTasks.reserve,{taskId:id,step:'model:final-check',tokens:4000})).toBe(true);
});
test('explicit do-not-remember request disables personal memory for that turn',async()=>{
 vi.stubEnv('RECOMMENDATION_V2_OWNERS','architecture-test');const {t,user}=setup();await user.mutation(api.shopperMemory.edit,{text:'Small graphics',category:'all'});
 const c=await t.run(ctx=>ctx.db.insert('conversations',{key:'web:architecture-test',requirements:{},revision:1,session:0,pending:true,inputText:"Navy t-shirt. Don't remember this request.",updatedAt:Date.now(),shownUrls:[],rejectedUrls:[]}));
 const id=(await t.mutation(internal.recommendationTasks.start,{conversationId:c,revision:1}))!;expect((await t.query(internal.recommendationTasks.context,{taskId:id}))?.memory).toEqual([]);await t.mutation(internal.recommendationTasks.setBrief,{taskId:id,brief,memories:[{text:'Navy t-shirt',quote:'Navy t-shirt',category:'t-shirt',kind:'tentative'}]});expect((await user.query(api.shopperMemory.list,{})).items).toHaveLength(1);
});

test('price does not become evidence of lower material quality',()=>{
 expect(evidenceWording('Lower price point may indicate differences in material finish.')).toBe('Material quality and durability have not been verified.');expect(evidenceWording('Budget-friendly pricing may impact long-term material expectations.')).toBe('Material quality and durability have not been verified.');expect(evidenceWording('Listed cotton with a crew neckline.')).toBe('Listed cotton with a crew neckline.');
});
test('explicit saved style preferences carry over but are excluded for gifts and memory-off',async()=>{
 const {t,id,user}=await task();await t.run(ctx=>ctx.db.insert('profiles',{owner:'architecture-test',preferences:{language:'en'},taste:{prefer:['minimal','small graphics'],avoid:['large logos']},updatedAt:Date.now()}));
 let c=await t.query(internal.recommendationTasks.context,{taskId:id});expect(c?.memory.some(m=>m.text==='Avoid large logos')).toBe(true);await user.mutation(api.shopperMemory.setEnabled,{enabled:false});expect(await t.query(internal.recommendationTasks.context,{taskId:id})).toBeNull();
});

test('empty evidence cannot publish market-wide stock or price speculation, and coverage stays visible',()=>{
 const checked=coverageCheckedReport({...report,choices:[],limitations:['No store has stock.','Prices have risen.','Unsupported claim.']},[{status:'unavailable'},{status:'no_matches'}]);expect(checked.limitations).toEqual(['Some stores could not be read; this is not a complete view of their stock.']);expect(checked.summary).toContain('available evidence');
});

// Public, invented examples: no customer conversation records.
test('broad blue includes navy while specific shades and the budget stay strict',async()=>{
 const {colourMatches,matchesOption}=await import('./discoveryRules');
 expect(colourMatches('PUMA Navy','Blue')).toBe(true);
 expect(colourMatches('New Navy','blue')).toBe(true);
 expect(colourMatches('orange','blue')).toBe(false);
 expect(colourMatches('light blue','navy blue')).toBe(false);
 expect(colourMatches('navy','light blue')).toBe(false);
 expect(colourMatches('PUMA Navy','navy blue')).toBe(true);
 const bag={...baselinePool[0],title:'College Backpack',colour:'New Navy',price:1900};
 expect(matchesOption(bag,{category:'bag',colour:'blue',budget:2000})).toBe(true);
 expect(matchesOption({...bag,price:2100},{category:'bag',colour:'blue',budget:2000})).toBe(false);
});
test('a colour-specific pictured recommendation requires positive visual confirmation',()=>{
 const p=evidencePool(baselinePool,baselineRequest);
 p[0].option.imageUrl='https://images.puma.com/example.jpg';
 expect(validateChoices(report.choices,p,baselineRequest)).toEqual([]);
 p[0].imageInspected=true;p[0].colourMatch='mismatch';
 expect(validateChoices(report.choices,p,baselineRequest)).toEqual([]);
 p[0].colourMatch='uncertain';expect(validateChoices(report.choices,p,baselineRequest)).toEqual([]);
 p[0].colourMatch='match';expect(validateChoices(report.choices,p,baselineRequest)).toHaveLength(1);
});
test('image reader identifies itself and keeps existing host and response limits',async()=>{
 const {imageBytes}=await import('./productImageReader');
 const fetcher=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/jpeg'}}));
 await expect(imageBytes('https://images.puma.com/example.jpg',Date.now()+5000)).resolves.toEqual(new Uint8Array([1,2,3]));
 expect(fetcher.mock.calls[0][1]).toMatchObject({headers:{'User-Agent':'ChauffeurImageReader/1.0'},redirect:'error'});
 await expect(imageBytes('https://unknown.example/image.jpg',Date.now()+5000)).rejects.toThrow('host');
 fetcher.mockResolvedValue(new Response(new Uint8Array(500001),{headers:{'content-type':'image/jpeg'}}));
 await expect(imageBytes('https://images.puma.com/large.jpg',Date.now()+5000)).rejects.toThrow('Large image');
});

test('retry cannot exclude previous results even when the planner misreads it as more',async()=>{
 vi.stubEnv('GEMINI_API_KEY','fixture');const {t,id,c}=await task();
 vi.spyOn(Agent.prototype,'generateObject').mockResolvedValue(modelObject({...planned,intent:'more'}));
 await t.run(ctx=>ctx.db.patch(c,{inputText:'Try again',excludeShown:true,shownUrls:[baselinePool[0].url]}));
 const plan=await t.action(internal.recommendationAgents.plan,{taskId:id});expect(plan.brief.excludeShown).toBe(false);
 await t.mutation(internal.recommendationTasks.setBrief,{taskId:id,brief:plan.brief,memories:[]});
 expect((await t.query(internal.recommendationTasks.context,{taskId:id}))?.excluded).toEqual([]);
 const next=await task();await next.t.run(ctx=>ctx.db.patch(next.c,{inputText:'Show more options'}));
 expect((await next.t.action(internal.recommendationAgents.plan,{taskId:next.id})).brief.excludeShown).toBe(true);
});

test('second discovery pass can inspect eight images when the first pass used none',async()=>{
 vi.stubEnv('GEMINI_API_KEY','fixture');const {t,id}=await task();
 await t.mutation(internal.recommendationTasks.setBrief,{taskId:id,brief,memories:[]});
 const pool=Array.from({length:8},(_,i)=>({...evidencePool(baselinePool,baselineRequest)[0],id:`extra${i}`,option:{...baselinePool[0],url:`https://www.snitch.com/men-t-shirts/navy-${i}/101/buy`,imageUrl:`https://images.puma.com/test-${i}.jpg`}}));
 vi.spyOn(globalThis,'fetch').mockImplementation(async()=>new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/jpeg'}}));
 vi.spyOn(Agent.prototype,'generateObject').mockResolvedValue(modelObject({items:pool.map(p=>({id:p.id,colourMatch:'match',visible:['Navy'],conflicts:[],unknowns:[]}))}));
 const checked=await t.action(internal.recommendationAgents.inspect,{taskId:id,pool,attempt:1});
 expect(checked.filter(p=>p.imageInspected)).toHaveLength(8);
 expect((await t.run(ctx=>ctx.db.get(id)))?.imageCount).toBe(8);
});
test('unknown listing colour reaches inspection but only a positive image match permits a choice',async()=>{
 const {evidencePool,usableEvidence}=await import('./recommendationRules');
 const request={category:'sneakers',budget:10000,colour:'blue',brand:'Nike'};
 const option={title:'Nike sneakers',url:'https://www.myntra.com/123',price:4999,colour:'',fabric:'',observedAt:1,imageUrl:'https://assets.myntassets.com/shoe.jpg'};
 const pool=evidencePool([option],request);expect(pool).toHaveLength(1);
 expect(usableEvidence(pool[0],request)).toBe(false);
 expect(usableEvidence({...pool[0],imageInspected:true,colourMatch:'match'},request)).toBe(true);
 expect(usableEvidence({...pool[0],imageInspected:true,colourMatch:'uncertain'},request)).toBe(false);
 expect(evidencePool([{...option,colour:'orange'}],request)).toEqual([]);
});
test('exact colour ranks above disclosed related colours regardless of model order or price',()=>{
 const request={category:'sneakers',budget:10000,colour:'blue'};
 const pool=evidencePool([
 {title:'Purple sneakers',url:'https://www.myntra.com/991',price:9000,colour:'purple',fabric:'',observedAt:1,imageUrl:'https://assets.myntassets.com/purple.jpg'},
 {title:'Blue sneakers',url:'https://www.myntra.com/992',price:1000,colour:'blue',fabric:'',observedAt:1,imageUrl:'https://assets.myntassets.com/blue.jpg'}
 ],request).map(p=>({...p,imageInspected:true,colourMatch:p.option.colour==='blue'?'match' as const:'related' as const}));
 const choices=[...pool].reverse().map(p=>({id:p.id,reason:'Visible sneaker',evidenceIds:[p.id],tradeoff:''}));
 const result=validateChoices(choices,pool,request);
 expect(result.map(o=>o.colour)).toEqual(['blue','purple']);expect(result[1].reasons?.[0]).toContain('Related colour: purple');
 expect(validateChoices(choices,pool,{...request,colourStrict:true}).map(o=>o.colour)).toEqual(['blue']);
});
