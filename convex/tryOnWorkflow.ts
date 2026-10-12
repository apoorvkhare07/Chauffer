import {WorkflowManager} from '@convex-dev/workflow';
import {components,internal} from './_generated/api';
import {v} from 'convex/values';
const manager=new WorkflowManager(components.workflow);
export const generate=manager.define({args:{id:v.id('tryOnPreviews')},returns:v.null()}).handler(async(step,{id}):Promise<null>=>{try{await step.runAction(internal.tryOnAI.generate,{id},{retry:false});}catch{await step.runMutation(internal.tryOn.finish,{id,failureCode:'provider_error'});}return null;});
