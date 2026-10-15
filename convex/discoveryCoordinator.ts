import {discoveryHandoffValidator} from './discoveryHandoff';
import {v} from 'convex/values';
import {internalQuery} from './_generated/server';
import {loadShoppingContext,shoppingContextValidator} from './shoppingContext';
import {requirementsValidator} from './discoveryRules';
import {tasteValidator,emptyTaste} from './taste';
export const context=internalQuery({args:{conversationId:v.id('conversations'),revision:v.number()},returns:v.union(v.null(),v.object({session:v.number(),requirements:requirementsValidator,taste:tasteValidator,text:v.string(),language:v.string(),deadlineAt:v.number(),wardrobe:shoppingContextValidator})),handler:async(ctx,{conversationId,revision})=>{
 const c=await ctx.db.get(conversationId);if(!c||c.revision!==revision||!c.pending)return null;
 return {session:c.session,requirements:c.requirements,taste:c.taste??emptyTaste,text:c.inputText??'',language:c.language??'en',deadlineAt:c.updatedAt+110000,wardrobe:await loadShoppingContext(ctx,c)};
}});
// Specialist consumers get a current, owner-scoped report only; old revisions cannot be reused.
export const handoff=internalQuery({args:{conversationId:v.id('conversations'),revision:v.number()},returns:v.union(v.null(),discoveryHandoffValidator),handler:async(ctx,{conversationId,revision})=>{
 const c=await ctx.db.get(conversationId);if(!c||c.revision!==revision)return null;
 const rows=await ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',c._id).eq('session',c.session)).order('desc').take(30);
 const row=rows.find(m=>m.handoff?.request.revision===revision);if(!row?.handoff)return null;
 if(row.stylingSourceKey){const fresh=await loadShoppingContext(ctx,c);if(row.stylingSourceKey!==fresh.sourceKey)return {...row.handoff,styling:{state:'stale' as const,summary:'Wardrobe changed; check again.',matches:[],limitations:[]}};}
 return row.handoff;
}});
