import {v} from 'convex/values';
import {internalMutation,internalQuery} from './_generated/server';
import {briefValidator,evidenceValidator,reportValidator,stepValidator,limits,architectureEnabled,recipientFromText,memoryItemValidator,validateChoices} from './recommendationRules';
import {requirementsValidator,optionValidator} from './discoveryRules';
import {tasteValidator} from './taste';
import {shoppingContextValidator,loadShoppingContext} from './shoppingContext';
import {memorySettings,relevantMemory} from './shopperMemory';
import {detectCategory} from './fashionRules';
import {storeResultValidator} from './marketplaces';
import {buildDiscoveryHandoff} from './discoveryHandoff';
import {safeOutfits} from './wardrobeRules';
export const start=internalMutation({args:{conversationId:v.id('conversations'),revision:v.number()},returns:v.union(v.null(),v.id('recommendationTasks')),handler:async(ctx,{conversationId,revision})=>{
 const c=await ctx.db.get(conversationId);if(!c||c.revision!==revision||!c.key.startsWith('web:')||!architectureEnabled(c.key.slice(4)))return null;
 const existing=await ctx.db.query('recommendationTasks').withIndex('by_turn',q=>q.eq('conversationId',conversationId).eq('revision',revision)).unique();if(existing)return existing._id;
 const owner=c.key.slice(4),settings=await memorySettings(ctx,owner);
 const privateRequest=/\b(?:do not|don't|dont|never) (?:save|remember|learn)|\btemporary chat\b|याद मत|मत याद|yaad mat|mat yaad/i.test(c.inputText??'');
 return ctx.db.insert('recommendationTasks',{owner,conversationId,session:c.session,revision,architecture:2,status:'planning',createdAt:Date.now(),deadlineAt:Date.now()+limits.deadlineMs,memoryRevision:settings?.revision??0,personalisation:settings?.enabled!==false&&!privateRequest,steps:[],reserved:[],reservedTokens:0,imageBytes:0,imageCount:0});
}});
export const context=internalQuery({args:{taskId:v.id('recommendationTasks')},returns:v.union(v.null(),v.object({owner:v.string(),text:v.string(),language:v.string(),deadlineAt:v.number(),recipient:v.union(v.literal('self'),v.literal('other'),v.literal('unknown')),requirements:requirementsValidator,taste:tasteValidator,history:v.array(v.object({role:v.string(),text:v.string()})),memory:v.array(memoryItemValidator),wardrobe:shoppingContextValidator,latestBatch:v.array(optionValidator),excluded:v.array(v.string()),brief:v.optional(briefValidator),pool:v.array(evidenceValidator)})),handler:async(ctx,{taskId})=>{
 const t=await ctx.db.get(taskId);if(!t)return null;const c=await ctx.db.get(t.conversationId),settings=await memorySettings(ctx,t.owner);
 if(!c||c.revision!==t.revision||c.key!==`web:${t.owner}`||(settings?.revision??0)!==t.memoryRevision||Date.now()>t.deadlineAt||['ready','partial','failed','cancelled','needs_input'].includes(t.status))return null;
 const rows=await ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',c._id).eq('session',c.session)).order('desc').take(30);
 const prior=await ctx.db.query('recommendationTasks').withIndex('by_turn',q=>q.eq('conversationId',c._id)).order('desc').take(3);
 const recipient=recipientFromText(c.inputText??'',t.brief?.recipient??prior.find(p=>p.revision<c.revision&&p.session===c.session)?.brief?.recipient??'self');
 const changedRecipient=prior.find(p=>p.revision<c.revision&&p.session===c.session)?.brief?.recipient!==recipient;
 let requirements={...c.requirements};
 if(recipient!=='self'&&changedRecipient){delete requirements.size;delete requirements.audience;if(!/same budget|keep.*budget/i.test(c.inputText??''))delete requirements.budget;}
 const category=detectCategory(c.inputText??'')??requirements.category;
 const memory=t.personalisation?await relevantMemory(ctx,t.owner,recipient,category):[];
 const wardrobe=await loadShoppingContext(ctx,{...c,wardrobeContextRequested:recipient==='self'&&(t.brief?.wardrobeRequested??c.wardrobeContextRequested)});
 return {owner:t.owner,text:c.inputText??'',language:c.language??'en',deadlineAt:t.deadlineAt,recipient,requirements,taste:c.taste??{prefer:[],avoid:[]},history:rows.slice(0,12).reverse().map(m=>({role:m.role,text:m.text.slice(0,700)})),memory,wardrobe,latestBatch:c.referenceProduct?[c.referenceProduct]:rows.find(r=>r.result)?.result?.options??[],excluded:[...c.rejectedUrls,...(c.excludeShown?c.shownUrls:[])],...(t.brief?{brief:t.brief}:{}),pool:t.pool??[]};
}});
export const reserve=internalMutation({args:{taskId:v.id('recommendationTasks'),step:v.string(),tokens:v.number(),images:v.optional(v.number()),bytes:v.optional(v.number())},returns:v.boolean(),handler:async(ctx,{taskId,step,tokens,images=0,bytes=0})=>{
 const t=await ctx.db.get(taskId);if(!t)return false;const c=await ctx.db.get(t.conversationId),settings=await memorySettings(ctx,t.owner);
 if(!c||c.revision!==t.revision||(settings?.revision??0)!==t.memoryRevision||Date.now()>=t.deadlineAt||t.reserved.includes(step)||tokens<0||images<0||bytes<0)return false;
 if(tokens>0&&(t.reserved.filter(s=>s.startsWith('model:')).length>=limits.calls||t.reservedTokens+tokens>limits.tokens-(step==='model:final-check'?0:4000)))return false;
 if(t.imageCount+images>limits.images||t.imageBytes+bytes>limits.imageBytes)return false;
 const leases=await ctx.db.query('recommendationBudgets').withIndex('by_hour',q=>q.eq('hour',-1)).unique();
 const active=(leases?.active??[]).filter(l=>l.expiresAt>Date.now());
 const maxActive=Number(process.env.RECOMMENDATION_MAX_ACTIVE_TASKS??4);
 if(!active.some(l=>l.taskId===taskId)){if(!Number.isFinite(maxActive)||active.length>=maxActive)return false;active.push({taskId,expiresAt:t.deadlineAt});}
 if(leases)await ctx.db.patch(leases._id,{active});else await ctx.db.insert('recommendationBudgets',{hour:-1,calls:0,tokens:0,active});
 const hour=Math.floor(Date.now()/3600000);const b=await ctx.db.query('recommendationBudgets').withIndex('by_hour',q=>q.eq('hour',hour)).unique();
 const cap=Number(process.env.RECOMMENDATION_HOURLY_TOKEN_LIMIT??240000);if(!Number.isFinite(cap)||cap<=0||(b?.tokens??0)+tokens>cap)return false;
 if(tokens>0){if(b)await ctx.db.patch(b._id,{calls:b.calls+1,tokens:b.tokens+tokens});else await ctx.db.insert('recommendationBudgets',{hour,calls:1,tokens});}
 await ctx.db.patch(taskId,{reserved:[...t.reserved,step],reservedTokens:t.reservedTokens+tokens,imageBytes:t.imageBytes+bytes,imageCount:t.imageCount+images});return true;
}});
export const recordStep=internalMutation({args:{taskId:v.id('recommendationTasks'),step:stepValidator},returns:v.null(),handler:async(ctx,{taskId,step})=>{const t=await ctx.db.get(taskId);if(t)await ctx.db.patch(taskId,{steps:[...t.steps.filter(s=>s.name!==step.name),step].slice(-20)});return null;}});
export const setBrief=internalMutation({args:{taskId:v.id('recommendationTasks'),brief:briefValidator,memories:v.array(v.object({text:v.string(),category:v.string(),quote:v.string(),kind:v.union(v.literal('confirmed'),v.literal('tentative'))}))},returns:v.boolean(),handler:async(ctx,{taskId,brief,memories})=>{
 const t=await ctx.db.get(taskId);if(!t)return false;const c=await ctx.db.get(t.conversationId),settings=await memorySettings(ctx,t.owner);if(!c||c.revision!==t.revision||(settings?.revision??0)!==t.memoryRevision)return false;
 const input=c.inputText??'';
 const row=await ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',c._id).eq('session',c.session)).order('desc').take(2);
 brief.sourceMessageId=row.find(m=>m.role==='user')?._id;
 // Memories affect ranking, never hard search requirements. Gift recipients never inherit own wardrobe.
 if(brief.recipient!=='self')brief.wardrobeRequested=false;
 await ctx.db.patch(taskId,{brief,status:'retrieving'});
 await ctx.db.patch(c._id,{requirements:brief.requirements,taste:brief.taste,wardrobeContextRequested:brief.wardrobeRequested,aiTurn:false,excludeShown:brief.excludeShown});
 if(t.personalisation&&brief.recipient==='self'){
  const existing=await ctx.db.query('shopperMemories').withIndex('by_owner_active',q=>q.eq('owner',t.owner).eq('active',true)).take(100);
  for(const m of memories.slice(0,Math.min(3,100-existing.length))){
   if(!m.quote||!input.toLowerCase().includes(m.quote.toLowerCase())||m.text.length>240||m.category.length>40||existing.some(x=>x.text.toLowerCase()===m.quote.toLowerCase()))continue;
   const general=/\b(always|never|usually|remember|generally)\b|हमेशा|याद रख|hamesha|yaad rakh/i.test(m.quote);
   await ctx.db.insert('shopperMemories',{owner:t.owner,text:m.quote.slice(0,240),category:general?(m.category||brief.requirements.category||'unknown'):(brief.requirements.category||'unknown'),recipient:'self',kind:m.kind==='confirmed'&&general?'confirmed':'tentative',source:'Explicit statement in chat',...(brief.sourceMessageId?{sourceMessageId:brief.sourceMessageId}:{}),createdAt:Date.now(),updatedAt:Date.now(),active:true});
  }
 }
 return true;
}});
export const setPool=internalMutation({args:{taskId:v.id('recommendationTasks'),pool:v.array(evidenceValidator),wardrobeKey:v.string()},returns:v.null(),handler:async(ctx,{taskId,pool,wardrobeKey})=>{const t=await ctx.db.get(taskId);if(!t)return null;const c=await ctx.db.get(t.conversationId);if(c?.revision===t.revision)await ctx.db.patch(taskId,{pool:pool.slice(0,36),wardrobeKey,status:'assessing'});return null;}});
export const finish=internalMutation({args:{taskId:v.id('recommendationTasks'),report:reportValidator,stores:v.array(storeResultValidator),note:v.optional(v.string()),needsInput:v.optional(v.boolean()),failed:v.optional(v.boolean()),claimId:v.optional(v.id('webSearchRuns'))},returns:v.null(),handler:async(ctx,{taskId,report,stores,note,needsInput,failed,claimId})=>{
 if(claimId)await ctx.db.patch(claimId,{finishedAt:Date.now()});
 const leases=await ctx.db.query('recommendationBudgets').withIndex('by_hour',q=>q.eq('hour',-1)).unique();if(leases)await ctx.db.patch(leases._id,{active:(leases.active??[]).filter(l=>l.taskId!==taskId&&l.expiresAt>Date.now())});
 const t=await ctx.db.get(taskId);if(!t||['ready','partial','needs_input','failed','cancelled'].includes(t.status))return null;
 const c=await ctx.db.get(t.conversationId);if(!c||c.revision!==t.revision){await ctx.db.patch(taskId,{status:'cancelled'});return null;}
 const settings=await memorySettings(ctx,t.owner);
 if((settings?.revision??0)!==t.memoryRevision){report={summary:'Your memory settings changed. Please retry so I can use the updated preferences.',choices:[],outfits:[],needsEvidence:[],limitations:[]};failed=true;}
 if(Date.now()>t.deadlineAt){report={summary:'This request reached its time limit. Your message is kept; please retry.',choices:[],outfits:[],needsEvidence:[],limitations:[]};failed=true;}
 const brief=t.brief;let options=brief?validateChoices(report.choices,t.pool??[],brief.requirements):[];
 let outfits=report.outfits;
 const wardrobe=await loadShoppingContext(ctx,c);
 if(outfits.length){if(wardrobe.sourceKey!==t.wardrobeKey){outfits=[];report.summary='The outfit needs to be checked again against your updated wardrobe.';note='Your wardrobe changed during this request. Please retry the outfit check.';}else outfits=safeOutfits(outfits,wardrobe.items.map(i=>({_id:String(i.id),details:i.details,available:true})));}
 if(failed){options=[];outfits=[];}
 const outfitText=outfits.map(o=>`${o.title}: ${o.itemIds.map(id=>wardrobe.items.find(i=>String(i.id)===id)?.details.name??'').join(' + ')}. ${o.reason}`).join('\n\n');
 if(options.some(o=>Date.now()-o.observedAt>60000))report.limitations=['Some prices come from the recent search pool; check the store for current price and stock.',...report.limitations].slice(0,4);
 const text=[report.summary,outfitText,note,...report.limitations.slice(0,3)].filter(Boolean).join('\n\n').slice(0,3500);
 const result={options,stores,failed:failed??false};
 await ctx.db.insert('messages',{conversationId:c._id,session:c.session,role:'assistant',text,...(brief&&['discover','mixed','compare'].includes(brief.route)&&!needsInput?{result,handoff:buildDiscoveryHandoff({conversationId:c._id,session:c.session,revision:c.revision,requirements:brief.requirements,taste:brief.taste,result,text:c.inputText})}:{})});
 await ctx.db.patch(c._id,{pending:false,aiTurn:false,discoveryQuestion:undefined,discoveryStatus:needsInput?'exploring':'refining',shownUrls:[...new Set([...c.shownUrls,...options.map(o=>o.url)])].slice(-120),updatedAt:Date.now()});
 if(!failed&&!needsInput&&t.personalisation&&brief?.recipient==='self'&&brief.requirements.category){
  const memories=await ctx.db.query('shopperMemories').withIndex('by_owner_active',q=>q.eq('owner',t.owner).eq('active',true)).take(100);
  const description=`Past search for ${brief.requirements.category}${brief.requirements.occasion?' for '+brief.requirements.occasion:''}. Task preferences: ${[...brief.taste.prefer,...brief.taste.avoid.map(x=>'avoid '+x)].join(', ')||'none confirmed'}. This is past context, not a standing requirement.`.slice(0,240);
  if(memories.length<100&&!memories.some(m=>m.text===description))await ctx.db.insert('shopperMemories',{owner:t.owner,text:description,category:brief.requirements.category,recipient:'self',kind:'episode',source:'Past task summary; not a purchase or permanent preference',createdAt:Date.now(),updatedAt:Date.now(),active:true});
 }
 await ctx.db.patch(taskId,{report:{...report,outfits},status:failed?'failed':needsInput?'needs_input':note?'partial':'ready',completionNote:note??''});return null;
}});
