import {WorkflowManager,type WorkflowCtx} from '@convex-dev/workflow';
import type {Id} from './_generated/dataModel';
import {components,internal} from './_generated/api';
import {v,type Infer} from 'convex/values';
import {reportValidator,usableEvidence,evidencePool,coverageCheckedReport,type Evidence} from './recommendationRules';
import type {StoreResult} from './marketplaces';
import {chooseBatch} from './ranking';
const workflow=new WorkflowManager(components.workflow);
const empty=():Infer<typeof reportValidator>=>({summary:'',choices:[],outfits:[],needsEvidence:[],limitations:[]});
export async function runRecommendation(step:WorkflowCtx,{taskId,claimId}:{taskId:Id<'recommendationTasks'>;claimId?:Id<'webSearchRuns'>}):Promise<null>{

 let report=empty(),stores:StoreResult[]=[],pool:Evidence[]=[],note:string|undefined;
 try{
  const plan=await step.runAction(internal.recommendationAgents.plan,{taskId},{retry:false});
  const applied=await step.runMutation(internal.recommendationTasks.setBrief,{taskId,brief:plan.brief,memories:plan.memories});
  if(!applied)throw new Error('STALE');
  if(!plan.search){await step.runMutation(internal.recommendationTasks.finish,{taskId,claimId,report:{...empty(),summary:plan.reply},stores,needsInput:true});return null;}
  let context=await step.runQuery(internal.recommendationTasks.context,{taskId});if(!context)throw new Error('STALE');
  let style={criteria:[] as string[],outfits:[] as Infer<typeof reportValidator>['outfits'],note:''};
  if(['wardrobe','mixed','style'].includes(plan.brief.route)){
   try{style=await step.runAction(internal.recommendationAgents.style,{taskId},{retry:false});}catch{note='The styling check could not finish. Please retry for outfit advice.';}
  }
  if(['wardrobe','style'].includes(plan.brief.route)){
   await step.runMutation(internal.recommendationTasks.setPool,{taskId,pool:[],wardrobeKey:context.wardrobe.sourceKey});
   report={...empty(),summary:style.note||'I could not complete the styling assessment.',outfits:style.outfits,limitations:style.criteria};
   try{report=await step.runAction(internal.recommendationAgents.check,{taskId,report},{retry:false});}catch{report={...empty(),summary:'The final outfit check could not finish. Please retry.'};note='No unchecked outfit advice was published.';}
   await step.runMutation(internal.recommendationTasks.finish,{taskId,claimId,report,stores,note});return null;
  }
  if(plan.brief.route==='compare'){pool=evidencePool(context.latestBatch,plan.brief.requirements);}
  else{const found=await step.runAction(internal.recommendationAgents.discover,{taskId,attempt:0,usedStores:[],need:[]},{retry:false});pool=found.pool;stores=found.stores;}
  pool=await step.runAction(internal.recommendationAgents.inspect,{taskId,pool,attempt:0},{retry:false});
  await step.runMutation(internal.recommendationTasks.setPool,{taskId,pool,wardrobeKey:context.wardrobe.sourceKey});
  try{
   report=await step.runAction(internal.recommendationAgents.recommend,{taskId,attempt:0,style:JSON.stringify(style),stores},{retry:false});
   if(report.choices.length===0&&plan.brief.route!=='compare'&&pool.length<36){
    context=await step.runQuery(internal.recommendationTasks.context,{taskId});
    if(context&&context.deadlineAt-Date.now()>25000){
     try{const found=await step.runAction(internal.recommendationAgents.discover,{taskId,attempt:1,usedStores:stores.map(s=>s.store),need:report.needsEvidence},{retry:false});
     stores.push(...found.stores);
     const before=pool.length;
     const known=new Set(pool.map(p=>p.option.url));pool.push(...found.pool.filter(p=>!known.has(p.option.url)).map((p,i)=>({...p,id:`extra${i+1}`})));pool=pool.slice(0,36);
     pool=await step.runAction(internal.recommendationAgents.inspect,{taskId,pool:pool.filter(p=>p.id.startsWith('extra')),attempt:1},{retry:false}).then(extra=>pool.map(p=>extra.find(e=>e.id===p.id)??p));
     await step.runMutation(internal.recommendationTasks.setPool,{taskId,pool,wardrobeKey:context.wardrobe.sourceKey});
     if(pool.length>before)report=await step.runAction(internal.recommendationAgents.recommend,{taskId,attempt:1,style:JSON.stringify(style),stores},{retry:false});
     }catch{note='The additional search could not complete; these choices use the evidence already gathered.';}
    }
   }
   report.outfits=style.outfits;
   report=await step.runAction(internal.recommendationAgents.check,{taskId,report},{retry:false});
  }catch{
   // Only supported listing facts are used if model judgement cannot complete.
   const ranked=chooseBatch(pool.filter(p=>usableEvidence(p,plan.brief.requirements)).map(p=>p.option),plan.brief.requirements,plan.brief.taste);
   report={...empty(),summary:'These are verified listing matches. The personal recommendation assessment could not finish.',choices:ranked.map(o=>({id:pool.find(p=>p.option.url===o.url)!.id,reason:'Matches the recorded search requirements.',evidenceIds:[pool.find(p=>p.option.url===o.url)!.id],tradeoff:'Suitability has not been assessed.'})),outfits:[]};note='You can retry for a personal assessment.';
  }
  report.choices=report.choices.filter(choice=>pool.some(p=>p.id===choice.id&&usableEvidence(p,plan.brief.requirements)));
  report=coverageCheckedReport(report,stores);
  if(plan.brief.route==='compare')report.limitations.unshift('This comparison uses the previously observed listings; prices and availability have not been refreshed.');
  await step.runMutation(internal.recommendationTasks.finish,{taskId,claimId,report,stores,note});
 }catch{await step.runMutation(internal.recommendationTasks.finish,{taskId,claimId,report:{...empty(),summary:'This request could not finish. Your message is kept; please retry.'},stores,failed:true});}
 return null;
}
export const respond=workflow.define({args:{taskId:v.id('recommendationTasks'),claimId:v.optional(v.id('webSearchRuns'))},returns:v.null()}).handler(runRecommendation);
