import type {MutationCtx} from './_generated/server';
import type {Doc,Id} from './_generated/dataModel';
import {createThread} from '@convex-dev/agent';
import {components} from './_generated/api';
import {emptyTaste} from './taste';
import {nextRequest,type Requirements} from './discoveryRules';
export const welcome="Hi! I'm Chauffeur. Tell me what you're looking for and I'll check Flipkart and Amazon. Clothing, shoes or accessories—for women, men or unisex?";
export async function getConversation(ctx:MutationCtx,key:string,defaults:Requirements={}):Promise<Doc<'conversations'>>{
 const existing=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',key)).unique();if(existing)return existing;
 const id=await ctx.db.insert('conversations',{key,requirements:defaults,revision:0,session:0,pending:false,updatedAt:Date.now(),shownUrls:[],rejectedUrls:[]});
 return (await ctx.db.get(id))!;
}
export async function beginTurn(ctx:MutationCtx,conversation:Doc<'conversations'>,text:string,defaults:Requirements={},rejectUrl?:string,allowInterrupt=false){
 if(!allowInterrupt&&conversation.pending&&conversation.updatedAt>Date.now()-120000)throw new Error('A search is already running.');
 if(rejectUrl&&!conversation.shownUrls.includes(rejectUrl)){
  const recent=await ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',conversation._id).eq('session',conversation.session)).order('desc').take(80);
  if(!recent.some(m=>m.result?.options.some(o=>o.url===rejectUrl)))throw new Error('Choose a product from this conversation.');
 }
 const reset=/^(reset|start)[!.\s]*$/i.test(text);
 const previous=reset?defaults:conversation.requirements;
 const plan=text==='[unsupported message]'?{requirements:previous,reply:'Please send your clothing request as a text message for this test.',search:false}:reset?{requirements:defaults,reply:welcome,search:false}:nextRequest(text,previous);
 if(rejectUrl){plan.requirements=previous;plan.search=false;plan.reply='Got it. I’ll skip that product. What should I change: colour, fabric or budget? Or ask for more options.';}
 // A bare batch rejection needs clarification, not a paid/model-dependent search.
 const bareRejection=/^(none of these|don.t like (any|these)|not interested|no thanks)[!.\s]*$/i.test(text);
 const sameSearchMore=/^(show (me )?more( options)?|more( options)?|try again|search again|another (set|batch))[!.\s]*$/i.test(text);
 const useAI=Boolean(process.env.GEMINI_API_KEY)&&!reset&&!rejectUrl&&!bareRejection&&!sameSearchMore&&text!=='[unsupported message]';
 if(useAI){plan.requirements=previous;plan.search=false;}
 const revision=conversation.revision+1,session=conversation.session+(reset?1:0);
 const rejectedUrls=reset?[]:[...new Set([...conversation.rejectedUrls,...(rejectUrl?[rejectUrl]:[])])].slice(-120);
 let shownUrls=reset?[]:conversation.shownUrls;
 // Keep seen products excluded throughout this chat, including refinements.
 await ctx.db.patch(conversation._id,{requirements:plan.requirements,revision,session,pending:plan.search||useAI,aiTurn:useAI,inputText:text,updatedAt:Date.now(),shownUrls,rejectedUrls,...(reset?{taste:emptyTaste,agentThreadId:undefined}:{})});
 if(reset)await ctx.db.insert('messages',{conversationId:conversation._id,session,role:'assistant',text:plan.reply});
 else{
  if(conversation.revision===0)await ctx.db.insert('messages',{conversationId:conversation._id,session,role:'assistant',text:welcome});
  await ctx.db.insert('messages',{conversationId:conversation._id,session,role:'user',text});
  if(!useAI)await ctx.db.insert('messages',{conversationId:conversation._id,session,role:'assistant',text:plan.reply});
 }
 if(useAI&&!conversation.agentThreadId){const threadId=await createThread(ctx,components.agent,{userId:conversation.key,title:'Chauffeur shopping'});await ctx.db.patch(conversation._id,{agentThreadId:threadId});}
 return {...plan,aiRequested:useAI,conversationId:conversation._id,revision,session,excludeUrls:[...new Set([...shownUrls,...rejectedUrls])]};
}
export async function searchClaim(ctx:MutationCtx,owner:string,kind:'ai'|'search'='search'):Promise<Id<'webSearchRuns'>>{
 const now=Date.now();const recent=await ctx.db.query('webSearchRuns').withIndex('by_owner',q=>q.eq('owner',owner).gte('_creationTime',now-90000)).order('desc').take(13);
 if(recent.some(r=>!r.finishedAt&&r.startedAt>now-90000))throw new Error('A search is already running.');
 if(recent.filter(r=>r.startedAt>now-60000&&(r.kind??'search')===kind).length>=(kind==='ai'?12:3))throw new Error('Please wait a minute before searching again.');
 return ctx.db.insert('webSearchRuns',{owner,kind,startedAt:now});
}
