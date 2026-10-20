import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';
import { action } from './_generated/server';
import { internal } from './_generated/api';

const PRICE_PAISE = 9900;
const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
function keys() {
  if (!KEY_ID || !KEY_SECRET) throw new ConvexError('Pro checkout is not configured yet.');
  return { keyId: KEY_ID, keySecret: KEY_SECRET };
}
function authHeader(keyId: string, keySecret: string) { return `Basic ${btoa(`${keyId}:${keySecret}`)}`; }
async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)))].map(x => x.toString(16).padStart(2, '0')).join('');
}
function equal(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function razorpay(path: string, method: 'GET' | 'POST', payload?: unknown) {
  const { keyId, keySecret } = keys();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, { method, headers: { Authorization: authHeader(keyId, keySecret), ...(payload ? { 'Content-Type': 'application/json' } : {}) }, ...(payload ? { body: JSON.stringify(payload) } : {}) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ConvexError('Razorpay could not process this request. Check the billing setup and try again.');
  return body as Record<string, any>;
}
async function ownerId(ctx: Parameters<typeof getAuthUserId>[0]) {
  const owner = await getAuthUserId(ctx);
  if (!owner) throw new ConvexError('Please sign in.');
  return owner;
}

export const createOrder = action({
  args: {},
  returns: v.object({ keyId: v.string(), orderId: v.string(), amount: v.number(), currency: v.literal('INR'), name: v.string() }),
  handler: async (ctx): Promise<{ keyId: string; orderId: string; amount: number; currency: 'INR'; name: string }> => {
    if (process.env.PRO_PURCHASES_ENABLED !== 'true') throw new ConvexError('Chauffer is free for everyone. Pro is no longer on sale.');
    const owner = await ownerId(ctx);
    const { keyId } = keys();
    const existing = await ctx.runQuery(internal.billingCore.pendingOrderForOwner, { owner });
    if (existing && existing.status === 'created' && Date.now() - existing.createdAt < 30 * 60 * 1000) {
      return { keyId, orderId: existing.orderId, amount: PRICE_PAISE, currency: 'INR', name: 'Chauffer Pro' };
    }
    const receipt = `ch_${crypto.randomUUID().replace(/-/g, '').slice(0, 30)}`;
    const result = await razorpay('/orders', 'POST', { amount: PRICE_PAISE, currency: 'INR', receipt, notes: { chauffeur_owner: owner } });
    if (typeof result.id !== 'string' || result.amount !== PRICE_PAISE || result.currency !== 'INR' || result.status !== 'created') throw new ConvexError('Razorpay returned an invalid order.');
    await ctx.runMutation(internal.billingCore.createOrderRecord, { owner, orderId: result.id });
    return { keyId, orderId: result.id, amount: result.amount, currency: 'INR', name: 'Chauffer Pro' };
  },
});

export const verifyCheckout = action({
  args: { orderId: v.string(), paymentId: v.string(), signature: v.string() },
  returns: v.union(v.literal('active'), v.literal('processing')),
  handler: async (ctx, { orderId, paymentId, signature }): Promise<'active' | 'processing'> => {
    const owner = await ownerId(ctx);
    const known = await ctx.runQuery(internal.billingCore.ownedOrder, { owner, orderId });
    if (!known || !/^order_[\w]+$/.test(orderId) || !/^pay_[\w]+$/.test(paymentId) || !/^[a-f0-9]{64}$/i.test(signature)) throw new ConvexError('Payment details could not be matched to your account.');
    const { keySecret } = keys();
    if (!equal(await hmacHex(keySecret, `${orderId}|${paymentId}`), signature.toLowerCase())) throw new ConvexError('Razorpay could not verify this payment.');
    const payment = await razorpay(`/payments/${encodeURIComponent(paymentId)}`, 'GET');
    if (payment.id !== paymentId || payment.order_id !== known.orderId || payment.amount !== PRICE_PAISE || payment.currency !== 'INR') throw new ConvexError('This payment does not match the Chauffer Pro order.');
    if (payment.status !== 'captured' || payment.captured !== true) return 'processing';
    await ctx.runMutation(internal.billingCore.markOrderPaid, { owner, orderId, paymentId, amount: payment.amount, currency: payment.currency });
    return 'active';
  },
});

export async function verifyWebhookSignature(payload: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  return equal(await hmacHex(secret, payload), signature.toLowerCase());
}
