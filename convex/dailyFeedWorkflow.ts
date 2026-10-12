import {WorkflowManager} from '@convex-dev/workflow';
import {components,internal} from './_generated/api';
import {v} from 'convex/values';
const manager=new WorkflowManager(components.workflow);
export const generate=manager.define({args:{id:v.id('dailyFeeds')},returns:v.null()}).handler(async(step,{id}):Promise<null>=>{
 try{await step.runAction(internal.dailyFeedWorker.generate,{id},{retry:false});}
 catch{await step.runMutation(internal.dailyFeed.finish,{id,options:[],drops:[],stores:[],failed:true,note:'Today’s store check could not finish. We’ll check again tomorrow.'});}
 return null;
});
