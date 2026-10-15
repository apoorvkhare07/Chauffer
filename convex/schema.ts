import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';
import { discoveryResultValidator,storeResultValidator } from './marketplaces';
import { tasteValidator } from './taste';
import { requirementsValidator,optionValidator } from './discoveryRules';
import {garmentValidator,outfitValidator,styleValidator,photoAnalysisValidator} from './wardrobeRules';
import {bodyAnalysisValidator,previewSourceValidator} from './stylingRules';
import {priceDropValidator} from './feedValidators';
import {intelligenceValidator} from './priceIntelligenceRules';
import {offerValidator} from './offerValidators';
export const preferences = v.object({name:v.optional(v.string()),gender:v.optional(v.union(v.literal('male'),v.literal('female'),v.literal('nonbinary'),v.literal('undisclosed'))),jeansSize:v.optional(v.string()),heightCm:v.optional(v.number()),audience:v.optional(v.union(v.literal('men'),v.literal('women'),v.literal('unisex'))),age:v.optional(v.number()),language: v.union(v.literal('en'), v.literal('hi'), v.literal('hinglish')), size: v.optional(v.string()), budgetPaise: v.optional(v.number())});
export const quote = v.object({store: v.string(), productUrl: v.string(), title: v.string(), variant: v.string(), quantity: v.number(), itemPaise: v.number(), shippingPaise: v.number(), totalPaise: v.number(), currency: v.literal('INR'), addressReference: v.string(), returnTerms: v.string(), observedAt: v.number(), expiresAt: v.number()});
export default defineSchema({
 ...authTables,
  otpChallenges: defineTable({
    phone:v.string(), createdAt:v.number(), expiresAt:v.number(),
    requestId:v.optional(v.string()), attempts:v.number(),
    state:v.union(v.literal("sending"),v.literal("sent"),v.literal("failed"),v.literal("verified"),v.literal("consumed")),
    verifyingUntil:v.optional(v.number()), grantHash:v.optional(v.string()), grantExpiresAt:v.optional(v.number()),
  }).index("by_phone",["phone"]).index("by_created",["createdAt"]),
 guestSearches: defineTable({tokenHash:v.string(),text:v.string(),state:v.union(v.literal('pending'),v.literal('ready'),v.literal('failed')),reply:v.optional(v.string()),result:v.optional(discoveryResultValidator),createdAt:v.number()}).index('by_token',['tokenHash']).index('by_created',['createdAt']),

 priceIntelligence: defineTable({owner:v.string(),savedId:v.id('savedProducts'),report:intelligenceValidator}).index('by_saved',['savedId']),
 stylingRequests: defineTable({owner:v.string(),purpose:v.union(v.literal('body'),v.literal('tryon'))}).index('by_owner_purpose',['owner','purpose']),
 stylingProfiles: defineTable({owner:v.string(),onboarding:v.union(v.literal('active'),v.literal('complete'),v.literal('skipped')),photoId:v.optional(v.id('_storage')),photoState:v.union(v.literal('empty'),v.literal('building'),v.literal('ready'),v.literal('failed')),analysis:v.optional(bodyAnalysisValidator),confirmedDescription:v.optional(v.string()),updatedAt:v.number()}).index('by_owner',['owner']),
 tryOnPreviews: defineTable({owner:v.string(),source:previewSourceValidator,title:v.string(),photoId:v.id('_storage'),garmentPhotoId:v.optional(v.id('_storage')),garmentImageUrl:v.optional(v.string()),state:v.union(v.literal('building'),v.literal('ready'),v.literal('failed')),outputId:v.optional(v.id('_storage')),note:v.string(),failureCode:v.optional(v.string()),createdAt:v.number(),expiresAt:v.number()}).index('by_owner',['owner']).index('by_expiry',['expiresAt']),
 wardrobeStyles: defineTable({owner:v.string(),details:styleValidator,updatedAt:v.number()}).index('by_owner',['owner']),
 wardrobePhotoDrafts: defineTable({owner:v.string(),photoId:v.optional(v.id('_storage')),analysis:v.optional(photoAnalysisValidator),state:v.union(v.literal('building'),v.literal('ready'),v.literal('failed')),createdAt:v.number()}).index('by_owner',['owner']).index('by_created',['createdAt']),
 wardrobeItems: defineTable({owner:v.string(),details:garmentValidator,analysis:v.optional(photoAnalysisValidator),photoId:v.optional(v.id('_storage')),available:v.boolean(),lastWornAt:v.optional(v.number()),createdAt:v.number()}).index('by_owner',['owner']),
 wardrobeOutfits: defineTable({owner:v.string(),request:v.string(),wardrobeKey:v.string(),styleKey:v.optional(v.string()),threadId:v.string(),state:v.union(v.literal('building'),v.literal('ready'),v.literal('failed')),outfits:v.array(outfitValidator),note:v.string(),createdAt:v.number(),completedAt:v.optional(v.number()),wornIndex:v.optional(v.number()),inputTokens:v.optional(v.number()),outputTokens:v.optional(v.number())}).index('by_owner',['owner']),
 dailySubscriptions: defineTable({owner:v.string(),enabled:v.boolean(),nextAt:v.number(),updatedAt:v.number()}).index('by_owner',['owner']).index('by_due',['enabled','nextAt']),
 dailyFeeds: defineTable({owner:v.string(),day:v.string(),subscriptionId:v.id('dailySubscriptions'),needKey:v.string(),requirements:requirementsValidator,taste:tasteValidator,state:v.union(v.literal('building'),v.literal('ready'),v.literal('failed'),v.literal('paused')),options:v.array(optionValidator),drops:v.array(priceDropValidator),stores:v.array(storeResultValidator),note:v.string(),startedAt:v.number(),completedAt:v.optional(v.number())}).index('by_owner_day',['owner','day']),
 conversations: defineTable({key:v.string(),referenceProduct:v.optional(optionValidator),taste:v.optional(tasteValidator),agentThreadId:v.optional(v.string()),aiTurn:v.optional(v.boolean()),inputText:v.optional(v.string()),language:v.optional(v.string()),requirements:requirementsValidator,revision:v.number(),session:v.number(),pending:v.boolean(),updatedAt:v.number(),shownUrls:v.array(v.string()),rejectedUrls:v.array(v.string())}).index('by_key',['key']),
 messages: defineTable({conversationId:v.id('conversations'),session:v.number(),role:v.union(v.literal('user'),v.literal('assistant')),text:v.string(),result:v.optional(discoveryResultValidator),ai:v.optional(v.boolean())}).index('by_conversation_session',['conversationId','session']),
 profiles: defineTable({owner: v.string(), taste:v.optional(tasteValidator),preferences, updatedAt: v.number()}).index('by_owner', ['owner']),
 savedProducts: defineTable({owner:v.string(),option:optionValidator,savedAt:v.number()}).index('by_owner',['owner']).index('by_owner_url',['owner','option.url']),
 savedPriceHistory: defineTable({owner:v.string(),url:v.string(),price:v.number(),observedAt:v.number(),source:v.optional(v.string()),priceFrom:v.optional(v.boolean())}).index('by_owner_url',['owner','url']),
 offerEvidence: defineTable({owner:v.string(),productUrl:v.string(),label:v.string(),offer:offerValidator}).index('by_owner_url',['owner','productUrl']),
 purchaseReviews: defineTable({owner: v.string(), quote, status: v.union(v.literal('review'), v.literal('approved'), v.literal('revoked')), approvedAt: v.optional(v.number())}).index('by_owner', ['owner']),
 feedback: defineTable({conversationId:v.id('conversations'),session:v.number(),url:v.optional(v.string()),kind:v.union(v.literal('like'),v.literal('dislike'),v.literal('refine'),v.literal('remember'),v.literal('forget')),text:v.string(),taste:tasteValidator}).index('by_conversation',['conversationId']),
 aiUsage: defineTable({conversationId:v.id('conversations'),model:v.string(),inputTokens:v.number(),outputTokens:v.number(),createdAt:v.number()}).index('by_conversation',['conversationId']),
 webSearchRuns: defineTable({kind:v.optional(v.union(v.literal('ai'),v.literal('search'))),owner:v.string(),startedAt:v.number(),finishedAt:v.optional(v.number())}).index('by_owner',['owner']),
 waConversations: defineTable({conversationId:v.optional(v.id('conversations')),phone:v.string(),requirements:requirementsValidator,revision:v.number(),lastInboundAt:v.number()}).index('by_phone',['phone']),
 waInbox: defineTable({messageId:v.string(),phone:v.string(),timestamp:v.number(),conversationId:v.id('waConversations'),revision:v.number(),reply:v.string(),search:v.boolean(),requirements:requirementsValidator}).index('by_message',['messageId']).index('by_phone',['phone']),
 waOutbox: defineTable({key:v.string(),inboxId:v.id('waInbox'),state:v.union(v.literal('sending'),v.literal('sent'),v.literal('delivered'),v.literal('read'),v.literal('failed'),v.literal('uncertain')),providerMessageId:v.optional(v.string()),reason:v.optional(v.string())}).index('by_key',['key']).index('by_provider',['providerMessageId']),
});
