import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';
import { requirementsValidator } from './discoveryRules';
export const preferences = v.object({language: v.union(v.literal('en'), v.literal('hi'), v.literal('hinglish')), size: v.optional(v.string()), budgetPaise: v.optional(v.number())});
export const quote = v.object({store: v.string(), productUrl: v.string(), title: v.string(), variant: v.string(), quantity: v.number(), itemPaise: v.number(), shippingPaise: v.number(), totalPaise: v.number(), currency: v.literal('INR'), addressReference: v.string(), returnTerms: v.string(), observedAt: v.number(), expiresAt: v.number()});
export default defineSchema({
 ...authTables,
 profiles: defineTable({owner: v.string(), preferences, updatedAt: v.number()}).index('by_owner', ['owner']),
 purchaseReviews: defineTable({owner: v.string(), quote, status: v.union(v.literal('review'), v.literal('approved'), v.literal('revoked')), approvedAt: v.optional(v.number())}).index('by_owner', ['owner']),
 webSearchRuns: defineTable({owner:v.string(),startedAt:v.number(),finishedAt:v.optional(v.number())}).index('by_owner',['owner']),
 waConversations: defineTable({phone:v.string(),requirements:requirementsValidator,revision:v.number(),lastInboundAt:v.number()}).index('by_phone',['phone']),
 waInbox: defineTable({messageId:v.string(),phone:v.string(),timestamp:v.number(),conversationId:v.id('waConversations'),revision:v.number(),reply:v.string(),search:v.boolean(),requirements:requirementsValidator}).index('by_message',['messageId']).index('by_phone',['phone']),
 waOutbox: defineTable({key:v.string(),inboxId:v.id('waInbox'),state:v.union(v.literal('sending'),v.literal('sent'),v.literal('delivered'),v.literal('read'),v.literal('failed'),v.literal('uncertain')),providerMessageId:v.optional(v.string()),reason:v.optional(v.string())}).index('by_key',['key']).index('by_provider',['providerMessageId']),
});
