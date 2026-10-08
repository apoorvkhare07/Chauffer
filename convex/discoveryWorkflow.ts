import { WorkflowManager } from '@convex-dev/workflow';
import { components,internal } from './_generated/api';
import { v } from 'convex/values';
import { optionsReply } from './discoveryRules';
const workflow=new WorkflowManager(components.workflow);
export const respond=workflow.define({args:{id:v.id('waInbox')},returns:v.null()}).handler(async(step,{id}):Promise<null>=>{
 const plan=await step.runQuery(internal.whatsapp.plan,{id});if(!plan)return null;
 await step.runAction(internal.whatsapp.send,{id,phase:'reply',text:plan.reply},{retry:false});
 if(plan.search){
  const result=await step.runAction(internal.liveDiscovery.search,{requirements:plan.requirements},{retry:false});
  let text=result.failed?"I couldn't access live store results just now. Please try again later; I haven't used saved or sample products.":optionsReply(result.options,plan.requirements);
  if(result.stores)text+='\n\n'+result.stores.filter(s=>s.status!=='matched').map(s=>`${s.store}: ${s.status==='unavailable'?'live access unavailable':'no verified matches'}. Search on the store: ${s.searchUrl}`).join('\n');
  await step.runAction(internal.whatsapp.send,{id,phase:'options',text},{retry:false});
 }
 return null;
});
