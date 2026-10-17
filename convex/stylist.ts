import {v,ConvexError} from 'convex/values';
import {query,mutation,internalQuery,internalMutation} from './_generated/server';
import {internal} from './_generated/api';
import {requireOwner} from './identity';
import {wardrobeContext} from './wardrobeContext';
import {eventValidator,validateEvent} from './wardrobeContextRules';
import {styleAdviceValidator,cleanAdvice} from './stylistRules';
import {currentTrends,trendReview} from './stylistTrends';
import {consumeMonthly} from './planAccess';
export const latest=query({args:{},handler:async ctx=>{
 const owner=await requireOwner(ctx),row=await ctx.db.query('stylistSessions').withIndex('by_owner',q=>q.eq('owner',owner)).order('desc').first();
 const context=await wardrobeContext(ctx,owner),stale=Boolean(row&&row.contextKey!==context.contextKey);
 const items=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).order('desc').take(30);
 const owned=await Promise.all(items.filter(i=>i.available).slice(0,12).map(async i=>({key:`w:${i._id}`,kind:'wardrobe' as const,title:i.details.name,detail:`${i.details.colour} · ${i.details.category}`,imageUrl:i.cleanPhotoId?await ctx.storage.getUrl(i.cleanPhotoId):i.photoId?await ctx.storage.getUrl(i.photoId):null})));
 const saved=await ctx.db.query('savedProducts').withIndex('by_owner',q=>q.eq('owner',owner)).order('desc').take(12);
 const conv=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${owner}`)).unique();
 const messages=conv?await ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',conv._id)).order('desc').take(300):[];
 const products=new Map<string,{key:string;kind:'product';title:string;detail:string;imageUrl:string|null;url:string}>();
 for(const message of messages)for(const option of message.result?.options??[])if(!products.has(option.url))products.set(option.url,{key:`p:${option.url}`,kind:'product',title:option.title,detail:[option.store,`₹${option.price.toLocaleString('en-IN')}`].filter(Boolean).join(' · '),imageUrl:option.imageUrl??null,url:option.url});
 for(const item of saved)if(!products.has(item.option.url))products.set(item.option.url,{key:`p:${item.option.url}`,kind:'product',title:item.option.title,detail:[item.option.store,`₹${item.option.price.toLocaleString('en-IN')}`].filter(Boolean).join(' · '),imageUrl:item.option.imageUrl??null,url:item.option.url});
 const visualProducts=[...products.values()].filter(p=>p.imageUrl).slice(0,12);
 const selected=row?.references??[],references:Array<{key:string;kind:'wardrobe'|'product';title:string;detail:string}>=[];
 for(const key of selected){if(key.startsWith('w:')){const item=items.find(i=>`w:${i._id}`===key&&i.available);if(item)references.push({key,kind:'wardrobe',title:item.details.name,detail:`${item.details.colour} · ${item.details.category}`});}else{const product=products.get(key.slice(2));if(product)references.push({key,kind:'product',title:product.title,detail:product.detail});}}
 const isStale=stale||Boolean(row?.references?.length&&references.length!==row.references.length);
 return {aiEnabled:Boolean(process.env.GEMINI_API_KEY),stale:isStale,run:row?{id:row._id,state:row.state,request:row.request,event:row.event,note:row.note,createdAt:row.createdAt,...(row.references?{references:row.references}:{}),...(!isStale&&row.advice?{advice:row.advice}:{})}:null,sources:currentTrends(),trendReview,visualSources:{wardrobe:owned.filter(i=>i.imageUrl),products:visualProducts}};
}});
export const request=mutation({args:{text:v.string(),event:v.optional(eventValidator),parentId:v.optional(v.id('stylistSessions')),references:v.optional(v.array(v.string()))},returns:v.id('stylistSessions'),handler:async(ctx,{text,event,parentId,references})=>{
 const result=await requestStyleForOwner(ctx,await requireOwner(ctx),{text,event,parentId,references});return result;
}});
export const plan=internalQuery({args:{id:v.id('stylistSessions')},handler:async(ctx,{id})=>{
 const row=await ctx.db.get(id);if(!row||row.state!=='building')return null;
 const context=await wardrobeContext(ctx,row.owner);if(row.contextKey!==context.contextKey)return null;
 const parent=row.parentId?await ctx.db.get(row.parentId):null;
 const wardrobe=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',row.owner)).take(80),saved=await ctx.db.query('savedProducts').withIndex('by_owner',q=>q.eq('owner',row.owner)).take(50),conversation=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${row.owner}`)).unique(),recentMessages=conversation?await ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',conversation._id)).order('desc').take(300):[];
 const references:Array<{key:string;kind:'wardrobe'|'product';title:string;category?:string;colour?:string;fabric?:string;pattern?:string;store?:string;price?:number;imageUrl?:string;url?:string}>=[];
 for(const key of row.references??[]){if(key.startsWith('w:')){const item=wardrobe.find(i=>`w:${i._id}`===key&&i.available);if(item)references.push({key,kind:'wardrobe',title:item.details.name,category:item.details.category,colour:item.details.colour,fabric:item.details.fabric??'',pattern:item.details.pattern??''});}else{const url=key.slice(2),product=saved.find(i=>i.option.url===url)?.option??recentMessages.flatMap(m=>m.result?.options??[]).find(o=>o.url===url);if(product)references.push({key,kind:'product',title:product.title,store:product.store??'',price:product.price,imageUrl:product.imageUrl??'',url:product.url});}}
 return {owner:row.owner,request:row.request,event:row.event,context:{shopper:context.shopper,style:context.style,taste:context.taste},references,
 previous:parent?.owner===row.owner&&parent.contextKey===context.contextKey?{request:parent.request,advice:parent.advice}:null,
 trends:currentTrends(),trendReview};
}});
export const finish=internalMutation({args:{id:v.id('stylistSessions'),advice:v.optional(styleAdviceValidator),error:v.optional(v.string())},returns:v.null(),handler:async(ctx,{id,advice,error})=>{
 const row=await ctx.db.get(id);if(!row||row.state!=='building')return null;
 const context=await wardrobeContext(ctx,row.owner);
 if(context.contextKey!==row.contextKey){await ctx.db.patch(id,{state:'failed',note:'Your preferences changed. Ask again using your updated details.'});return null;}
 await ctx.db.patch(id,{state:advice&&!error?'ready':'failed',...(advice&&!error?{advice:cleanAdvice(advice,currentTrends().map(t=>t.id),new Set(row.references??[]))}:{}),note:advice&&!error?'Personal styling ideas, not verified products or a fit guarantee.':'Your stylist could not finish. Your request is saved; please retry.'});return null;
}});
export const timeout=internalMutation({args:{id:v.id('stylistSessions')},returns:v.null(),handler:async(ctx,{id})=>{const row=await ctx.db.get(id);if(row?.state==='building')await ctx.db.patch(id,{state:'failed',note:'Your stylist took too long. Your request is saved; please retry.'});return null;}});
async function clearBatch(ctx:import('./_generated/server').MutationCtx,owner:string,cutoff:number){
 const rows=await ctx.db.query('stylistSessions').withIndex('by_owner',q=>q.eq('owner',owner)).filter(q=>q.and(q.lte(q.field('createdAt'),cutoff),q.neq(q.field('note'),'Style advice cleared.'))).take(100);
 for(const r of rows)await ctx.db.patch(r._id,{request:'',advice:undefined,references:undefined,parentId:undefined,state:'failed',note:'Style advice cleared.'});
 if(rows.length===100)await ctx.scheduler.runAfter(0,internal.stylist.clearOlder,{owner,cutoff});
}
export const clear=mutation({args:{},returns:v.null(),handler:async ctx=>{await clearBatch(ctx,await requireOwner(ctx),Date.now());return null;}});
export const clearOlder=internalMutation({args:{owner:v.string(),cutoff:v.number()},returns:v.null(),handler:async(ctx,{owner,cutoff})=>{await clearBatch(ctx,owner,cutoff);return null;}});
// Trusted coordinators must derive owner from the signed-in channel; no model-selected owner.
export const handoff=internalQuery({args:{owner:v.string(),id:v.id('stylistSessions')},handler:async(ctx,{owner,id})=>{
 const row=await ctx.db.get(id);if(row?.owner!==owner)return null;const c=await wardrobeContext(ctx,owner);
 return {version:'stylist-result.v1',requestId:id,status:c.contextKey!==row.contextKey?'stale':row.state,request:row.request,event:row.event,
 ...(row.state==='ready'&&c.contextKey===row.contextKey?{advice:row.advice}:{}),scope:'advisory_only',shoppingRequiresExplicitAction:true};
}});
export const shoppingBrief=query({args:{id:v.id('stylistSessions'),index:v.number()},handler:async(ctx,{id,index})=>{
 const owner=await requireOwner(ctx),row=await ctx.db.get(id);if(row?.owner!==owner||row.state!=='ready'||!Number.isInteger(index))throw new ConvexError('Choose a current style idea.');
 const c=await wardrobeContext(ctx,owner);if(row.contextKey!==c.contextKey)throw new ConvexError('Your preferences changed. Refresh the style brief first.');
 const look=row.advice?.looks[index];if(!look)throw new ConvexError('Choose a current style idea.');
 const parent=row.parentId?await ctx.db.get(row.parentId):null;
 const earlier=parent?.owner===owner&&parent.contextKey===c.contextKey?parent.request.slice(0,300):'';
 return {version:'stylist-shopping.v1',text:('Find '+look.search.slice(0,250)+'. Occasion: '+look.occasion.slice(0,80)+(earlier?'. Earlier brief: '+earlier:'')+'. Current styling request: '+row.request.slice(0,250)+'. Use my saved styling preferences.').slice(0,1000),sourceId:id,lookIndex:index};
}});

export async function requestStyleForOwner(ctx:import('./_generated/server').MutationCtx,owner:string,{text,event,parentId,references}:{text:string,event?:import('./wardrobeContextRules').OutfitEvent,parentId?:import('./_generated/dataModel').Id<'stylistSessions'>,references?:string[]}){
 text=text.trim();
 if(!text||text.length>1200)throw new ConvexError('Describe your styling question in 1–1,200 characters.');
 if(!process.env.GEMINI_API_KEY)throw new ConvexError('Your stylist is unavailable right now.');
 const recent=await ctx.db.query('stylistSessions').withIndex('by_owner',q=>q.eq('owner',owner).gte('_creationTime',Date.now()-86400000)).take(20);
 if(recent.length>=20)throw new ConvexError('Twenty styling requests per day while testing. Try again tomorrow.');
 if(recent.some(r=>r.state==='building'&&r.createdAt>Date.now()-120000))throw new ConvexError('Your stylist is still working on the current request.');
 await consumeMonthly(ctx,owner,'stylistSessions');
 const context=await wardrobeContext(ctx,owner);
 if(parentId){const parent=await ctx.db.get(parentId);if(parent?.owner!==owner||parent.state!=='ready'||parent.contextKey!==context.contextKey)throw new ConvexError('Your earlier style brief changed. Start a fresh question.');}
 const wardrobe=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).take(80),saved=await ctx.db.query('savedProducts').withIndex('by_owner',q=>q.eq('owner',owner)).take(50),conversation=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${owner}`)).unique(),recentMessages=conversation?await ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',conversation._id)).order('desc').take(300):[];
 const allowed=new Set<string>([...wardrobe.filter(i=>i.available).map(i=>`w:${i._id}`),...saved.map(i=>`p:${i.option.url}`),...recentMessages.flatMap(m=>(m.result?.options??[]).map(o=>`p:${o.url}`))]);
 const selected=references===undefined&&parentId?(await ctx.db.get(parentId))?.references??[]:[...new Set(references??[])];
 if(selected.length>12||selected.some(key=>!allowed.has(key)))throw new ConvexError('Choose current items from your wardrobe, saved list or recent search.');
 const id=await ctx.db.insert('stylistSessions',{owner,request:text,event:validateEvent(event),contextKey:context.contextKey,...(selected.length?{references:selected}:{}),...(parentId?{parentId}:{}),state:'building',note:'Your stylist is considering the details.',createdAt:Date.now()});
 await ctx.scheduler.runAfter(0,internal.stylistAI.generate,{id});await ctx.scheduler.runAfter(120000,internal.stylist.timeout,{id});return id;
}
