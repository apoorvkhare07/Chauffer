// Internal, synthetic development fixtures. Never import private account histories.
import {v} from 'convex/values';
import {internalMutation,internalQuery} from './_generated/server';
import {internal} from './_generated/api';
import {start} from '@convex-dev/workflow';
import {architectureEnabled} from './recommendationRules';
import {journeyCases,baselinePool,relevanceCases} from '../evals/recommendation-baseline';
export const run=internalMutation({args:{caseId:v.string()},returns:v.id('conversations'),handler:async(ctx,{caseId})=>{
 if(!process.env.CONVEX_CLOUD_URL?.includes('mellow-spaniel-636'))throw new Error('Development evaluation only.');
 const owner='architecture-live-eval';if(!architectureEnabled(owner))throw new Error('Enable the synthetic evaluation owner first.');
 const fixture=[...journeyCases,...relevanceCases].find(c=>c.id===caseId)??(caseId==='blue-bags'?{request:'Find blue bags for college, men, under 2000 rupees. Search now without more questions.'}:caseId==='frozen-baseline'?{request:'Compare these navy T-shirts for everyday wear, men size M, under 900. Keep the current prices; do not search for new products.'}:null);if(!fixture)throw new Error('Unknown fixture.');
 const text=caseId==='returning-new-category'?'Men sneakers for a weekend city trip, UK 8, under 3500. Something bold this time.':caseId==='owned-plus-shopping'?'Make a dinner outfit with my navy trousers. I can buy a men top size M under 1800 if needed.':caseId==='gift-refinement'?'A navy T-shirt for my brother, size L, under 900. Less shiny for everyday wear.':fixture.request;
 if(caseId==='owned-plus-shopping'){
  const items=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).take(4);
  if(!items.length)for(const [name,category,colour] of [['Navy trousers','bottom','navy'],['Cream shirt','top','cream']] as const)await ctx.db.insert('wardrobeItems',{owner,details:{name,category,colour},available:true,createdAt:Date.now()});
 }
 if(caseId==='returning-new-category'){
  const memories=await ctx.db.query('shopperMemories').withIndex('by_owner_active',q=>q.eq('owner',owner).eq('active',true)).take(10);
  if(!memories.some(m=>m.source==='Synthetic evaluation fixture'))await ctx.db.insert('shopperMemories',{owner,text:'Usually prefers understated design but open to changes',category:'all',recipient:'self',kind:'confirmed',source:'Synthetic evaluation fixture',createdAt:Date.now(),updatedAt:Date.now(),active:true});
 }
 const old=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${owner}`)).unique();
 if(old?.pending)throw new Error('Wait for the evaluation to finish.');
 const revision=(old?.revision??0)+1,session=(old?.session??-1)+1;
 const data={key:`web:${owner}`,requirements:{},taste:{prefer:[],avoid:[]},language:'en',wardrobeContextRequested:false,referenceProduct:undefined,revision,session,pending:true,aiTurn:true,inputText:text,updatedAt:Date.now(),shownUrls:[],rejectedUrls:[]};
 const id=old?old._id:await ctx.db.insert('conversations',data);if(old)await ctx.db.patch(id,data);
 if(caseId==='frozen-baseline')await ctx.db.insert('messages',{conversationId:id,session,role:'assistant',text:'Synthetic comparison catalogue, not live listings.',result:{options:baselinePool,stores:[],failed:false}});
 await ctx.db.insert('messages',{conversationId:id,session,role:'user',text});
 const taskId=await ctx.runMutation(internal.recommendationTasks.start,{conversationId:id,revision});if(!taskId)throw new Error('Evaluation not enabled');
 await start(ctx,internal.recommendationWorkflow.respond,{taskId});return id;
}});
export const result=internalQuery({args:{conversationId:v.id('conversations')},returns:v.any(),handler:async(ctx,{conversationId})=>{
 const c=await ctx.db.get(conversationId);if(c?.key!=='web:architecture-live-eval')throw new Error('Synthetic evaluations only.');
 const t=await ctx.db.query('recommendationTasks').withIndex('by_turn',q=>q.eq('conversationId',conversationId).eq('revision',c.revision)).unique();
 const rows=await ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',conversationId).eq('session',c.session)).order('desc').take(2);
 return {elapsedMs:t?(c.pending?Date.now():c.updatedAt)-t.createdAt:0,pending:c.pending,status:t?.status??'unknown',route:t?.brief?.route??null,recipient:t?.brief?.recipient??null,requirements:t?.brief?.requirements??{},steps:t?.steps??[],reservedTokens:t?.reservedTokens??0,imageCount:t?.imageCount??0,poolCount:t?.pool?.length??0,evidence:t?.pool?.map(p=>({id:p.id,option:p.option,visual:p.visual,title:p.option.title,colour:p.option.colour,colourMatch:p.colourMatch??null,imageInspected:p.imageInspected,conflicts:p.conflicts}))??[],report:t?.report??null,result:rows.find(m=>m.role==='assistant')?.result??null};
}});
