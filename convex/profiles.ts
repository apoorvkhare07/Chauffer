import {savePreferences} from './profilePreferences';
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { preferences } from './schema';
import { requireOwner } from './identity';
import {tasteValidator,emptyTaste} from './taste';
export const taste=query({args:{},returns:tasteValidator,handler:async ctx=>{
 const owner=await requireOwner(ctx);
 return (await ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner',owner)).unique())?.taste??emptyTaste;
}});
export const forgetTaste=mutation({args:{},returns:v.null(),handler:async ctx=>{
 const owner=await requireOwner(ctx);
 const row=await ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 if(row)await ctx.db.patch(row._id,{taste:emptyTaste,updatedAt:Date.now()});
 const c=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${owner}`)).unique();
 if(c){if(c.pending&&c.updatedAt>Date.now()-120000)throw new Error('Wait for the current search to finish.');await ctx.db.patch(c._id,{taste:emptyTaste});}
 return null;
}});
export const get = query({args: {}, returns: v.union(preferences, v.null()), handler: async ctx => {
 const owner = await requireOwner(ctx);
 const row = await ctx.db.query('profiles').withIndex('by_owner', q => q.eq('owner', owner)).unique();
 return row?.preferences ?? null;
}});
export const save = mutation({args: {preferences}, returns: v.null(), handler: async (ctx, args) => {
 const owner = await requireOwner(ctx);
 await savePreferences(ctx,owner,args.preferences);
 return null;
}});
export const clear = mutation({args: {}, returns: v.null(), handler: async ctx => {
 const owner = await requireOwner(ctx);
 const conversation=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${owner}`)).unique();
 if(conversation?.pending&&conversation.updatedAt>Date.now()-120000)throw new Error('Wait for the current request to finish before clearing preferences.');
 const row = await ctx.db.query('profiles').withIndex('by_owner', q => q.eq('owner', owner)).unique();
 if (row) await ctx.db.delete(row._id);
 return null;
}});
