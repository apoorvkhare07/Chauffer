import {WorkflowManager} from '@convex-dev/workflow';
import {components,internal} from './_generated/api';
import {v} from 'convex/values';
const workflow=new WorkflowManager(components.workflow);
export const respond=workflow.define({args:{conversationId:v.id('conversations'),revision:v.number(),inboxId:v.optional(v.id('waInbox')),claimId:v.optional(v.id('webSearchRuns'))},returns:v.null()}).handler(async(step,{conversationId,revision,inboxId,claimId}):Promise<null>=>{
 let plan=await step.runQuery(internal.conversations.plan,{conversationId,revision});
 if(!plan){if(claimId)await step.runMutation(internal.webDiscovery.finish,{id:claimId});return null;}
 if(plan.aiTurn){
  try{
   const decision=await step.runAction(internal.shoppingAI.interpret,{conversationId,revision},{retry:false});
   if(!decision){if(claimId)await step.runMutation(internal.webDiscovery.finish,{id:claimId});return null;}
   const applied=await step.runMutation(internal.aiConversations.apply,{conversationId,revision,decision,...(inboxId?{inboxId}:{}),...(claimId?{claimId}:{})});
   if(!applied)return null;
   if(inboxId)await step.runAction(internal.whatsapp.send,{id:inboxId,phase:'reply',text:applied.reply},{retry:false});
   if(!applied.search)return null;
   plan=await step.runQuery(internal.conversations.plan,{conversationId,revision});if(!plan)return null;
  }catch{
   const text=await step.runMutation(internal.conversations.complete,{conversationId,revision,error:'AI_UNAVAILABLE',...(claimId?{claimId}:{})});
   if(inboxId&&text)await step.runAction(internal.whatsapp.send,{id:inboxId,phase:'reply',text},{retry:false});return null;
  }
 }else if(inboxId){const reply=await step.runQuery(internal.whatsapp.plan,{id:inboxId});if(!reply)return null;await step.runAction(internal.whatsapp.send,{id:inboxId,phase:'reply',text:reply.reply},{retry:false});if(!reply.search)return null;}
 let text:string|null;
 try{
  const result=await step.runAction(internal.liveDiscovery.search,{requirements:plan.requirements,excludeUrls:plan.excludeUrls,taste:plan.taste},{retry:false});
  text=await step.runMutation(internal.conversations.complete,{conversationId,revision,result:{options:result.options,failed:result.failed,stores:result.stores??[]},...(claimId?{claimId}:{})});
 }catch{
  text=await step.runMutation(internal.conversations.complete,{conversationId,revision,error:'Search failed',...(claimId?{claimId}:{})});
 }
 if(inboxId&&text){await step.runAction(internal.whatsapp.send,{id:inboxId,phase:'options',text},{retry:false});await step.runAction(internal.whatsapp.sendPreviews,{id:inboxId},{retry:false});}
 return null;
});
