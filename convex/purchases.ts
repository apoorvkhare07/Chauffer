import { internalMutation, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { quote } from './schema';
import { requireOwner } from './identity';
const review = v.object({_id: v.id('purchaseReviews'), _creationTime: v.number(), owner: v.string(), quote, status: v.union(v.literal('review'), v.literal('approved'), v.literal('revoked')), approvedAt: v.optional(v.number())});
// Only a trusted backend may prepare a review. Public clients cannot invent quotes.
export const prepare = internalMutation({args: {owner: v.string(), quote}, returns: v.id('purchaseReviews'), handler: async (ctx, args) => {
 const q = args.quote;
 if (!args.owner || !q.title || !q.variant || !q.addressReference || !q.returnTerms) throw new Error('Incomplete purchase review.');
 const url = new URL(q.productUrl);
 if (url.protocol !== 'https:') throw new Error('Product link must use HTTPS.');
 if (![q.quantity, q.itemPaise, q.shippingPaise, q.totalPaise].every(Number.isSafeInteger) || q.quantity < 1 || q.itemPaise < 1 || q.shippingPaise < 0 || q.totalPaise !== q.itemPaise * q.quantity + q.shippingPaise) throw new Error('Invalid purchase total.');
 const now = Date.now();
 if (!Number.isFinite(q.observedAt) || !Number.isFinite(q.expiresAt) || q.observedAt > now || q.expiresAt <= now || q.expiresAt <= q.observedAt || q.expiresAt - q.observedAt > 10 * 60 * 1000) throw new Error('Purchase quote is stale or invalid.');
 return await ctx.db.insert('purchaseReviews', {...args, status: 'review'});
}});
export const list = query({args: {}, returns: v.array(review), handler: async ctx => {
 const owner = await requireOwner(ctx);
 return await ctx.db.query('purchaseReviews').withIndex('by_owner', q => q.eq('owner', owner)).order('desc').take(50);
}});
export const approve = mutation({args: {reviewId: v.id('purchaseReviews'), expectedTotalPaise: v.number()}, returns: v.null(), handler: async (ctx, args) => {
 const owner = await requireOwner(ctx);
 const row = await ctx.db.get(args.reviewId);
 if (!row || row.owner !== owner) throw new Error('Purchase review unavailable.');
 if (row.status === 'revoked') throw new Error('Approval was revoked.');
 if (row.quote.expiresAt <= Date.now()) throw new Error('Price needs to be checked again.');
 if (row.quote.totalPaise !== args.expectedTotalPaise) throw new Error('Review the updated total.');
 if (row.status === 'approved') return null;
 await ctx.db.patch(row._id, {status: 'approved', approvedAt: Date.now()});
 return null;
}});
export const revoke = mutation({args: {reviewId: v.id('purchaseReviews')}, returns: v.null(), handler: async (ctx, args) => {
 const owner = await requireOwner(ctx);
 const row = await ctx.db.get(args.reviewId);
 if (!row || row.owner !== owner) throw new Error('Purchase review unavailable.');
 await ctx.db.patch(row._id, {status: 'revoked'});
 return null;
}});
