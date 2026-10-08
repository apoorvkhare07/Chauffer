import {query,mutation,internalQuery,internalMutation} from './_generated/server';
import {getAuthUserId} from '@convex-dev/auth/server';
import {v,type Infer} from 'convex/values';
import {internal} from './_generated/api';
import {start} from '@convex-dev/workflow';
import {requirementsValidator,optionsReply} from './discoveryRules';
import {discoveryResultValidator} from './marketplaces';
import {emptyTaste,tasteValidator} from './taste';
import {getConversation,beginTurn,searchClaim,welcome} from './conversationCore';
const messageValidator=v.object({id:v.string(),role:v.union(v.literal('user'),v.literal('assistant')),text:v.string(),result:v.optional(discoveryResultValidator)});
const currentValidator=v.object({aiEnabled:v.boolean(),pendingPhase:v.string(),requirements:requirementsValidator,pending:v.boolean(),messages:v.array(messageValidator)});
export const current=query({args:{},returns:currentValidator,handler:async (ctx):Promise<Infer<typeof currentValidator>>=>{
 const owner=await getAuthUserId(ctx);if(!owner)throw new Error('Please sign in.');
 const c=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${owner}`)).unique();
 if(!c)return {aiEnabled:Boolean(process.env.GEMINI_API_KEY),pendingPhase:'idle',requirements:{},pending:false,messages:[{id:'welcome',role:'assistant' as const,text:welcome}]};
 const rows=await ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',c._id).eq('session',c.session)).order('desc').take(80);
 return {aiEnabled:Boolean(process.env.GEMINI_API_KEY),pendingPhase:c.aiTurn?'thinking':'searching',requirements:c.requirements,pending:c.pending&&c.updatedAt>Date.now()-120000,messages:rows.reverse().map(r=>({id:r._id,role:r.role,text:r.text,...(r.result?{result:r.result}:{})}))};
}});
export const post=mutation({args:{text:v.string(),rejectUrl:v.optional(v.string())},returns:v.null(),handler:async(ctx,{text,rejectUrl}):Promise<null>=>{
 const owner=await getAuthUserId(ctx);if(!owner)throw new Error('Please sign in.');
 text=text.trim();if(!text||text.length>1000)throw new Error('Use a message between 1 and 1,000 characters.');
 const profile=await ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 const defaults={...(profile?.preferences.size?{size:profile.preferences.size}:{}),...(profile?.preferences.budgetPaise?{budget:profile.preferences.budgetPaise/100}:{})};
 const conversation=await getConversation(ctx,`web:${owner}`,defaults);
 if(conversation.revision===0||/^(reset|start)[!.\s]*$/i.test(text)){await ctx.db.patch(conversation._id,{taste:profile?.taste??emptyTaste,language:profile?.preferences.language??'en'});conversation.taste=profile?.taste??emptyTaste;}
 const turn=await beginTurn(ctx,conversation,text,defaults,rejectUrl);
 if(/^(reset|start)[!.\s]*$/i.test(text))await ctx.db.patch(conversation._id,{taste:profile?.taste??emptyTaste});
 if(turn.search||turn.aiRequested){
  const claimId=await searchClaim(ctx,owner,turn.aiRequested?'ai':'search');
  await start(ctx,internal.discoveryWorkflow.respond,{conversationId:turn.conversationId,revision:turn.revision,claimId});
 }
 return null;
}});
export const plan=internalQuery({args:{conversationId:v.id('conversations'),revision:v.number()},returns:v.union(v.null(),v.object({requirements:requirementsValidator,excludeUrls:v.array(v.string()),session:v.number(),taste:tasteValidator,aiTurn:v.boolean()})),handler:async(ctx,{conversationId,revision})=>{
 const c=await ctx.db.get(conversationId);return !c||c.revision!==revision?null:{requirements:c.requirements,taste:c.taste??emptyTaste,aiTurn:c.aiTurn??false,excludeUrls:[...new Set([...c.shownUrls,...c.rejectedUrls])],session:c.session};
}});
export const complete=internalMutation({args:{conversationId:v.id('conversations'),revision:v.number(),result:v.optional(discoveryResultValidator),error:v.optional(v.string()),claimId:v.optional(v.id('webSearchRuns'))},returns:v.union(v.null(),v.string()),handler:async(ctx,{conversationId,revision,result,error,claimId})=>{
 if(claimId)await ctx.db.patch(claimId,{finishedAt:Date.now()});
 const c=await ctx.db.get(conversationId);if(!c||c.revision!==revision)return null;
 const text=error?(error==='AI_UNAVAILABLE'?'AI could not respond just now. Please try again in a moment.':'The search could not finish. Please try again.'):result?.failed?'I couldn’t reach the stores just now. Try again later, or open their searches below.':result?.options.length?`I found ${result.options.length} new options. Tell me what you like or dislike, or ask for more.`:'No new verified matches in the results I could read. Try a different colour, fabric or budget; I haven’t repeated the same products.';
 await ctx.db.insert('messages',{conversationId,session:c.session,role:'assistant',text,...(result?{result}:{})});
 await ctx.db.patch(conversationId,{pending:false,aiTurn:false,updatedAt:Date.now(),shownUrls:[...new Set([...c.shownUrls,...(result?.options.map(o=>o.url)??[])])].slice(-120)});
 if(!result)return text;
 return (result.failed?text:optionsReply(result.options,c.requirements))+'\n\n'+result.stores.filter(s=>s.status!=='matched').map(s=>`${s.store}: ${s.status==='unavailable'?'live access unavailable':'no new verified matches'}. Search on the store: ${s.searchUrl}`).join('\n');
}});
