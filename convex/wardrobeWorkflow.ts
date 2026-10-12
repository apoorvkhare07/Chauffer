import {WorkflowManager} from '@convex-dev/workflow';
import {components,internal} from './_generated/api';
import {v} from 'convex/values';
const manager=new WorkflowManager(components.workflow);
export const generate=manager.define({args:{id:v.id('wardrobeOutfits')},returns:v.null()}).handler(async(step,{id}):Promise<null>=>{
 try{const result=await step.runAction(internal.wardrobeAI.suggest,{id},{retry:false});await step.runMutation(internal.wardrobe.finish,{id,...result});}
 catch{await step.runMutation(internal.wardrobe.finish,{id,outfits:[],error:'AI_UNAVAILABLE'});}
 return null;
});
