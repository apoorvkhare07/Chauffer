import {performance} from 'node:perf_hooks';
import {test,vi,afterAll} from 'vitest';
import {convexTest} from 'convex-test';
import agentTest from '@convex-dev/agent/test';
import workflow from '@convex-dev/workflow/test';
import {Agent,createThread} from '@convex-dev/agent';
import schema from '../convex/schema';
import {api,internal,components} from '../convex/_generated/api';
import {emptyStyle,wardrobeKey} from '../convex/wardrobeRules';
import {readFileSync,writeFileSync,mkdirSync,appendFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {judge} from './judge';
import {cases} from './cases';
import rubric from './rubric.json';
const modules=import.meta.glob('../convex/**/*.ts');
const label=process.env.EVAL_LABEL||'baseline';
const dir='tmp/evals/'+label;mkdirSync(dir,{recursive:true});
const selected=cases.filter(c=>!process.env.EVAL_CASES||process.env.EVAL_CASES.split(',').includes(c.id));
const repeats=Number(process.env.EVAL_REPEATS||3);
if(!Number.isInteger(repeats)||repeats<1||repeats>3||!selected.length||selected.length>24)throw new Error('Eval bounds exceeded');
const sources=['shoppingAI.ts','aiDecision.ts','wardrobeAI.ts','stylistAI.ts','stylistRules.ts','stylistTrends.ts','discoveryPolicy.ts','aiConversations.ts','wardrobe.ts','wardrobeContext.ts','wardrobeContextRules.ts','discoveryUpdate.ts','conversationLanguage.ts'];
const sourceText=Object.fromEntries(sources.map(f=>[f,readFileSync('convex/'+f,'utf8')]));
const hash=createHash('sha256').update(JSON.stringify(sourceText)).digest('hex');
writeFileSync(dir+'/manifest.json',JSON.stringify({createdAt:new Date().toISOString(),label,hash,sources:sourceText,judgeSource:readFileSync('evals/judge.ts','utf8'),rubric,cases:selected,repeats,model:process.env.GEMINI_MODEL||'gemini-3.1-flash-lite'},null,2));
const results:any[]=[];
let consecutiveServiceFailures=0;
let traces:any[]=[];
const original=Agent.prototype.generateObject;
vi.spyOn(Agent.prototype,'generateObject').mockImplementation(function(this:any,...args:any[]){traces.push({prompt:args[2]?.prompt,maxOutputTokens:args[2]?.maxOutputTokens,maxRetries:args[2]?.maxRetries});return original.apply(this,args as any) as any;});
for(const c of selected)for(let repeat=1;repeat<=repeats;repeat++)test(c.id+' #'+repeat,async()=>{
 if(process.env.CHAUFFER_LIVE_EVAL!=='1')throw new Error('Run through evals/run.mjs');
 if(consecutiveServiceFailures>=2)throw new Error('Stopped after two service failures; inspect the recorded errors before another paid run.');
 vi.useFakeTimers();traces=[];const started=performance.now();
 let output:any,error='',checks:string[]=[];
 try{
 const t=convexTest(schema,modules);agentTest.register(t);workflow.register(t);const owner='eval-'+c.id,actor=t.withIdentity({subject:owner});
 await actor.mutation(api.styling.saveSetup,{preferences:{language:'en',...(c.profile||{})},style:{...emptyStyle,...(c.style||{})}});
 if(c.agent==='stylist'){
 const id=await actor.mutation(api.stylist.request,{text:c.text});await t.action(internal.stylistAI.generate,{id});const row=await actor.query(api.stylist.latest,{});
 output=row.run;if(output.state!=='ready')checks.push('generation_failed');
 }else if(c.agent==='wardrobe'){
 for(const raw of c.items){const {available=true,...details}=raw;const id=await actor.mutation(api.wardrobe.add,{details});if(!available)await actor.mutation(api.wardrobe.setAvailable,{id,available});}
 await actor.mutation(api.wardrobe.request,{text:c.text});const row=await actor.query(api.wardrobe.latest,{});
 output=await t.action(internal.wardrobeAI.suggest,{id:row.id!});
 }else{
 const threadId=await t.run(ctx=>createThread(ctx,components.agent,{userId:owner}));
 const id=await t.run(ctx=>ctx.db.insert('conversations',{key:'web:'+owner,agentThreadId:threadId,aiTurn:true,inputText:c.text,requirements:c.requirements||{},taste:{prefer:[],avoid:[]},revision:1,session:1,pending:true,updatedAt:Date.now(),shownUrls:[],rejectedUrls:[]}));
 output=await t.action(internal.shoppingAI.interpret,{conversationId:id,revision:1});
 const applied=await t.mutation(internal.aiConversations.apply,{conversationId:id,revision:1,decision:output});output={...output,applied};
 for(const [k,val] of Object.entries(c.checks||{})){const actual=k==='intent'?output.intent:output.requirements[k];if(actual!==val)checks.push(k+': expected '+val+', got '+actual);}
 }
 }catch(e){error=e instanceof Error?e.message:'unknown';checks.push('runtime_error');}
 finally{vi.clearAllTimers();vi.useRealTimers();}
 const latencyMs=Math.round(performance.now()-started),trace=traces.map(t=>({...t,prompt:t.prompt?JSON.parse(t.prompt):null}));
 let scored:any;try{scored=error?{score:{abstain:true,firstFailure:'runtime_error'},error}:await judge(c,output,trace);}catch(e){scored={score:{abstain:true,firstFailure:'scorer_unavailable'},error:e instanceof Error?e.name:'unknown'};}
 consecutiveServiceFailures=error||scored.error?consecutiveServiceFailures+1:0;
 const pass=!error&&!checks.length&&!scored.score.abstain&&scored.score.requirements===3&&scored.score.evidence===3&&scored.score.usefulness>=2;
 const result={caseId:c.id,agent:c.agent,repeat,label,hash,input:c,output,error,checks,trace,latencyMs,judge:scored,pass};
 results.push(result);writeFileSync(dir+'/'+c.id+'-'+repeat+'.json',JSON.stringify(result,null,2));appendFileSync(dir+'/progress.jsonl',JSON.stringify({caseId:c.id,repeat,pass,checks,score:scored.score,latencyMs})+'\n');
 console.log(c.id,repeat,pass?'PASS':'REVIEW',checks.join(','),scored.score.firstFailure||'');
},150000);
afterAll(()=>{writeFileSync(dir+'/results.json',JSON.stringify(results,null,2));vi.restoreAllMocks();});
