import {nextDiscoveryQuestion,shouldClarifyBefore,discoveryQuestionValidator} from './discoveryQuestions';
import {preferences} from './schema';
import {internalQuery,internalMutation} from './_generated/server';
import {v} from 'convex/values';
import {decisionValidator,memoryConsent,missingQuestion} from './aiDecision';
import {requirementsValidator,optionValidator} from './discoveryRules';
import {tasteValidator,emptyTaste} from './taste';
import {garmentValidator,styleValidator,emptyStyle} from './wardrobeRules';
import {replyLanguage} from './conversationLanguage';
export const context=internalQuery({args:{conversationId:v.id('conversations'),revision:v.number()},returns:v.union(v.null(),v.object({threadId:v.string(),prompt:v.object({discoveryQuestion:v.optional(discoveryQuestionValidator),profile:v.optional(preferences),text:v.string(),language:v.string(),requirements:requirementsValidator,taste:tasteValidator,history:v.array(v.object({role:v.string(),text:v.string()})),wardrobe:v.array(garmentValidator),stylePreferences:styleValidator,latestBatch:v.array(v.object({number:v.number(),option:optionValidator}))})})),handler:async(ctx,{conversationId,revision})=>{
 const c=await ctx.db.get(conversationId);if(!c||c.revision!==revision||!c.aiTurn||!c.agentThreadId)return null;
 const rows=await ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',conversationId).eq('session',c.session)).order('desc').take(30);
 const result=rows.find(m=>m.result)?.result;
 const owner=c.key.startsWith('web:')?c.key.slice(4):null;const wardrobe=owner?await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).take(80):[];const style=owner?await ctx.db.query('wardrobeStyles').withIndex('by_owner',q=>q.eq('owner',owner)).unique():null;
 const profile=owner?await ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner',owner)).unique():null;
 return {threadId:c.agentThreadId,prompt:{...(c.discoveryQuestion?{discoveryQuestion:c.discoveryQuestion}:{}),...(profile?{profile:profile.preferences}:{}),text:c.inputText??'',language:replyLanguage(c.inputText??'',profile?.preferences.language??c.language),requirements:c.requirements,taste:c.taste??emptyTaste,history:rows.slice(0,12).reverse().map(m=>({role:m.role,text:m.text.slice(0,700)})),wardrobe:wardrobe.map(i=>i.details),stylePreferences:style?.details??emptyStyle,latestBatch:(c.referenceProduct?[c.referenceProduct]:result?.options??[]).map((option,i)=>({number:i+1,option}))}};
}});
export const apply=internalMutation({args:{conversationId:v.id('conversations'),revision:v.number(),decision:decisionValidator,inboxId:v.optional(v.id('waInbox')),claimId:v.optional(v.id('webSearchRuns'))},returns:v.union(v.null(),v.object({search:v.boolean(),reply:v.string()})),handler:async(ctx,{conversationId,revision,decision,inboxId,claimId})=>{
 const c=await ctx.db.get(conversationId);if(!c||c.revision!==revision)return null;
 let reply=decision.reply;const missing=missingQuestion(decision.requirements);
 let search=['search','refine','more'].includes(decision.intent)||(decision.intent==='feedback'&&Boolean(decision.feedbackKind));
 if(missing&&search){reply=missing;search=false;}
 if(/(?:do not|don't)\s+search\s+yet|wait before search|or search yet/i.test(c.inputText??''))search=false;
 const consent=memoryConsent(c.inputText??'',decision.intent);
 const wantsMemory=decision.intent==='remember'||decision.intent==='forget';
 if(wantsMemory&&!consent){reply='Say “remember my preferences” to save your taste for future visits, or “forget my remembered preferences” to clear it.';search=false;}
 let taste=wantsMemory&&!consent?(c.taste??emptyTaste):decision.intent==='forget'&&consent?emptyTaste:decision.taste;
 const recent=await ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',conversationId).eq('session',c.session)).order('desc').take(30);
 const latest=recent.find(m=>m.result)?.result;const referenced=c.referenceProduct&&!decision.referenceOption?c.referenceProduct:decision.referenceOption?(c.referenceProduct?[c.referenceProduct]:latest?.options)?.[decision.referenceOption-1]:undefined;
 if(decision.referenceOption&&!referenced){reply='Which product did you mean? Choose a numbered option from the latest results.';search=false;taste=c.taste??emptyTaste;}
 const rejected=referenced&&decision.feedbackKind==='dislike'?[...new Set([...c.rejectedUrls,referenced.url])].slice(-120):c.rejectedUrls;
 if(decision.feedbackKind||wantsMemory)await ctx.db.insert('feedback',{conversationId,session:c.session,...(referenced?{url:referenced.url}:{}),kind:consent&&wantsMemory?decision.intent as 'remember'|'forget':decision.feedbackKind??'refine',text:c.inputText??'',taste});
 if(consent&&wantsMemory){
  const owner=c.key.startsWith('web:')?c.key.slice(4):null;
  if(owner){const profile=await ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner',owner)).unique();const preferences=profile?.preferences??{language:'en' as const};
   if(decision.intent==='remember'){
    if(decision.requirements.size&&/^(XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|[2-4]XL)$/.test(decision.requirements.size))preferences.size=decision.requirements.size;
    if(decision.requirements.budget)preferences.budgetPaise=Math.round(decision.requirements.budget*100);
   }
   if(profile)await ctx.db.patch(profile._id,{taste,preferences,updatedAt:Date.now()});else await ctx.db.insert('profiles',{owner,preferences,taste,updatedAt:Date.now()});reply=decision.intent==='forget'?'I’ve cleared your remembered taste preferences. Your saved size and budget stay in account settings.':'I’ll remember your budget, taste and any letter-based clothing size. Shoe and waist sizes stay in this conversation.';}
  else reply=decision.intent==='remember'?'I’ll keep these preferences for this WhatsApp conversation. Linking your account for memory across channels isn’t connected yet.':'I’ve cleared the taste preferences for this WhatsApp conversation.';
 }
 let discoveryQuestion;
 if(search&&!missing&&decision.intent==='search'&&!c.discoveryQuestion&&shouldClarifyBefore(decision.requirements)&&!/no questions|don.t ask|just (?:search|show)|show (?:me )?options/i.test(c.inputText??'')){
  discoveryQuestion=nextDiscoveryQuestion(decision.requirements);if(discoveryQuestion){search=false;reply=discoveryQuestion.question;decision.requirements.askedDiscoveryFields=[discoveryQuestion.field];}
 }
 if(!search&&claimId)await ctx.db.patch(claimId,{finishedAt:Date.now()});
 await ctx.db.patch(conversationId,{discoveryQuestion:discoveryQuestion??undefined,requirements:decision.requirements,taste,rejectedUrls:rejected,shownUrls:[...new Set([...recent.slice().reverse().flatMap(m=>m.result?.options.map(o=>o.url)??[]),...c.shownUrls])].slice(-120),pending:search,aiTurn:false,updatedAt:Date.now()});
 await ctx.db.insert('messages',{conversationId,session:c.session,role:'assistant',text:reply,ai:true});
 if(inboxId){const inbox=await ctx.db.get(inboxId);if(!inbox)return null;await ctx.db.patch(inboxId,{reply,search,requirements:decision.requirements});}
 return {search,reply};
}});
export const recordUsage=internalMutation({args:{conversationId:v.id('conversations'),model:v.string(),inputTokens:v.number(),outputTokens:v.number()},returns:v.null(),handler:async(ctx,args)=>{await ctx.db.insert('aiUsage',{...args,createdAt:Date.now()});return null;}});
