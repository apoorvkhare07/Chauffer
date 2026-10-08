import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { preferences } from './schema';
import { requireOwner } from './identity';
export const get = query({args: {}, returns: v.union(preferences, v.null()), handler: async ctx => {
 const owner = await requireOwner(ctx);
 const row = await ctx.db.query('profiles').withIndex('by_owner', q => q.eq('owner', owner)).unique();
 return row?.preferences ?? null;
}});
export const save = mutation({args: {preferences}, returns: v.null(), handler: async (ctx, args) => {
 const owner = await requireOwner(ctx);
 if (args.preferences.size && args.preferences.size.length > 40) throw new Error('Size is too long.');
 const budget = args.preferences.budgetPaise;
 if (budget !== undefined && (!Number.isSafeInteger(budget) || budget <= 0)) throw new Error('Budget must be a positive amount in paise.');
 const row = await ctx.db.query('profiles').withIndex('by_owner', q => q.eq('owner', owner)).unique();
 const data = {owner, preferences: args.preferences, updatedAt: Date.now()};
 if (row) await ctx.db.replace(row._id, data); else await ctx.db.insert('profiles', data);
 return null;
}});
export const clear = mutation({args: {}, returns: v.null(), handler: async ctx => {
 const owner = await requireOwner(ctx);
 const row = await ctx.db.query('profiles').withIndex('by_owner', q => q.eq('owner', owner)).unique();
 if (row) await ctx.db.delete(row._id);
 return null;
}});
