import { ConvexError, v } from 'convex/values';
import { internalMutation, internalQuery, type MutationCtx } from './_generated/server';

const paymentStatus = v.union(v.literal('created'), v.literal('failed'), v.literal('paid'));
const ACCESS_DAYS = 30;
const ACCESS_MS = ACCESS_DAYS * 24 * 60 * 60 * 1000;

export const pendingOrderForOwner = internalQuery({ args: { owner: v.string() }, handler: async (ctx, { owner }) => ctx.db.query('razorpayOrders').withIndex('by_owner_created', q => q.eq('owner', owner)).order('desc').first() });
export const ownedOrder = internalQuery({ args: { owner: v.string(), orderId: v.string() }, handler: async (ctx, { owner, orderId }) => { const row = await ctx.db.query('razorpayOrders').withIndex('by_order', q => q.eq('orderId', orderId)).unique(); return row?.owner === owner ? row : null; } });
export const createOrderRecord = internalMutation({ args: { owner: v.string(), orderId: v.string() }, handler: async (ctx, { owner, orderId }) => { const now = Date.now(); return ctx.db.insert('razorpayOrders', { owner, orderId, amount: 9900, currency: 'INR', status: 'created', createdAt: now, updatedAt: now }); } });

async function grantThirtyDays(ctx: MutationCtx, owner: string) {
  const now = Date.now();
  const existing = await ctx.db.query('userPlans').withIndex('by_owner', q => q.eq('owner', owner)).unique();
  const paidThrough = Math.max(now, existing?.plan === 'pro' && existing.status === 'active' ? (existing.periodEndsAt ?? now) : now) + ACCESS_MS;
  const details = { plan: 'pro' as const, status: 'active' as const, source: 'razorpay', updatedAt: now, periodEndsAt: paidThrough };
  if (existing) await ctx.db.patch(existing._id, details);
  else await ctx.db.insert('userPlans', { owner, ...details });
}

export const markOrderPaid = internalMutation({
  args: { owner: v.string(), orderId: v.string(), paymentId: v.string(), amount: v.number(), currency: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.query('razorpayOrders').withIndex('by_order', q => q.eq('orderId', args.orderId)).unique();
    if (!row || row.owner !== args.owner || row.amount !== args.amount || row.currency !== args.currency || args.amount !== 9900 || args.currency !== 'INR') throw new ConvexError('Payment does not match a valid Chauffer Pro order.');
    if (row.status === 'paid') {
      if (row.paymentId !== args.paymentId) throw new ConvexError('This order has already been paid.');
      return null;
    }
    const now = Date.now();
    await ctx.db.patch(row._id, { status: 'paid', paymentId: args.paymentId, paidAt: now, updatedAt: now });
    await grantThirtyDays(ctx, args.owner);
    return null;
  },
});

export const markOrderFailed = internalMutation({
  args: { orderId: v.string() }, returns: v.null(),
  handler: async (ctx, { orderId }) => {
    const row = await ctx.db.query('razorpayOrders').withIndex('by_order', q => q.eq('orderId', orderId)).unique();
    if (row && row.status === 'created') await ctx.db.patch(row._id, { status: 'failed', updatedAt: Date.now() });
    return null;
  },
});

// Retain processing of any legacy subscriptions created before one-time billing.
const subscriptionStatus = v.union(v.literal('created'),v.literal('authenticated'),v.literal('active'),v.literal('pending'),v.literal('halted'),v.literal('cancelled'),v.literal('completed'),v.literal('expired'));
async function updateLegacyPlan(ctx: MutationCtx, owner: string, status: 'active'|'cancelled', currentEnd?: number) {
  const plan = await ctx.db.query('userPlans').withIndex('by_owner', q => q.eq('owner', owner)).unique();
  const details = { plan: 'pro' as const, status, source: 'razorpay', updatedAt: Date.now(), ...(currentEnd ? { periodEndsAt: currentEnd } : {}) };
  if (plan) { if (plan.source === 'razorpay' || status === 'active') await ctx.db.patch(plan._id, details); }
  else if (status === 'active') await ctx.db.insert('userPlans', { owner, ...details });
}
export const receiveWebhook = internalMutation({
  args: { eventId: v.string(), payload: v.string() }, returns: v.null(),
  handler: async (ctx, { eventId, payload }) => {
    if (await ctx.db.query('razorpayWebhookEvents').withIndex('by_event', q => q.eq('eventId', eventId)).unique()) return null;
    let data: any; try { data = JSON.parse(payload); } catch { return null; }
    const kind = data?.event;
    if (kind === 'payment.captured') {
      const payment = data?.payload?.payment?.entity;
      if (typeof payment?.order_id === 'string' && typeof payment?.id === 'string' && payment.status === 'captured' && payment.captured === true) {
        const row = await ctx.db.query('razorpayOrders').withIndex('by_order', q => q.eq('orderId', payment.order_id)).unique();
        if (row && row.status !== 'paid' && row.amount === payment.amount && row.currency === payment.currency) {
          const now = Date.now();
          await ctx.db.patch(row._id, { status: 'paid', paymentId: payment.id, paidAt: now, updatedAt: now });
          await grantThirtyDays(ctx, row.owner);
        }
      }
    } else if (kind === 'payment.failed') {
      const payment = data?.payload?.payment?.entity;
      if (typeof payment?.order_id === 'string') {
        const row = await ctx.db.query('razorpayOrders').withIndex('by_order', q => q.eq('orderId', payment.order_id)).unique();
        if (row?.status === 'created') await ctx.db.patch(row._id, { status: 'failed', updatedAt: Date.now() });
      }
    }
    // Keep legacy subscription webhook behavior for paid-through access already granted.
    const entity = data?.payload?.subscription?.entity;
    if (typeof entity?.id === 'string') {
      const row = await ctx.db.query('razorpaySubscriptions').withIndex('by_subscription', q => q.eq('subscriptionId', entity.id)).unique();
      if (row && entity.plan_id === row.planId) {
        const status = kind === 'subscription.activated' || kind === 'subscription.charged' || kind === 'subscription.resumed' ? 'active' : kind === 'subscription.authenticated' ? 'authenticated' : kind === 'subscription.pending' || kind === 'subscription.paused' ? 'pending' : kind === 'subscription.halted' ? 'halted' : kind === 'subscription.cancelled' ? 'cancelled' : kind === 'subscription.completed' ? 'completed' : undefined;
        if (status) {
          const currentEnd = typeof entity.current_end === 'number' ? entity.current_end * 1000 : undefined;
          await ctx.db.patch(row._id, { status, updatedAt: Date.now(), ...(currentEnd ? { currentEnd } : {}) });
          if (status === 'active') await updateLegacyPlan(ctx, row.owner, 'active', currentEnd);
          else if (status === 'halted' || status === 'cancelled' || status === 'completed') await updateLegacyPlan(ctx, row.owner, 'cancelled', currentEnd);
        }
      }
    }
    await ctx.db.insert('razorpayWebhookEvents', { eventId, processedAt: Date.now() });
    return null;
  },
});
