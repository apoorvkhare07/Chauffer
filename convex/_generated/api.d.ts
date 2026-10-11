/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiConversations from "../aiConversations.js";
import type * as aiDecision from "../aiDecision.js";
import type * as auth from "../auth.js";
import type * as commerce from "../commerce.js";
import type * as comparisonRules from "../comparisonRules.js";
import type * as conversationCore from "../conversationCore.js";
import type * as conversationLanguage from "../conversationLanguage.js";
import type * as conversations from "../conversations.js";
import type * as discoveryRules from "../discoveryRules.js";
import type * as discoveryWorkflow from "../discoveryWorkflow.js";
import type * as http from "../http.js";
import type * as identity from "../identity.js";
import type * as liveDiscovery from "../liveDiscovery.js";
import type * as marketplaces from "../marketplaces.js";
import type * as offerEvidence from "../offerEvidence.js";
import type * as offerRules from "../offerRules.js";
import type * as offerValidators from "../offerValidators.js";
import type * as productRefresh from "../productRefresh.js";
import type * as profiles from "../profiles.js";
import type * as purchases from "../purchases.js";
import type * as ranking from "../ranking.js";
import type * as savedProducts from "../savedProducts.js";
import type * as shoppingAI from "../shoppingAI.js";
import type * as storeExtractors from "../storeExtractors.js";
import type * as styleTerms from "../styleTerms.js";
import type * as taste from "../taste.js";
import type * as webDiscovery from "../webDiscovery.js";
import type * as whatsapp from "../whatsapp.js";
import type * as whatsappProtocol from "../whatsappProtocol.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiConversations: typeof aiConversations;
  aiDecision: typeof aiDecision;
  auth: typeof auth;
  commerce: typeof commerce;
  comparisonRules: typeof comparisonRules;
  conversationCore: typeof conversationCore;
  conversationLanguage: typeof conversationLanguage;
  conversations: typeof conversations;
  discoveryRules: typeof discoveryRules;
  discoveryWorkflow: typeof discoveryWorkflow;
  http: typeof http;
  identity: typeof identity;
  liveDiscovery: typeof liveDiscovery;
  marketplaces: typeof marketplaces;
  offerEvidence: typeof offerEvidence;
  offerRules: typeof offerRules;
  offerValidators: typeof offerValidators;
  productRefresh: typeof productRefresh;
  profiles: typeof profiles;
  purchases: typeof purchases;
  ranking: typeof ranking;
  savedProducts: typeof savedProducts;
  shoppingAI: typeof shoppingAI;
  storeExtractors: typeof storeExtractors;
  styleTerms: typeof styleTerms;
  taste: typeof taste;
  webDiscovery: typeof webDiscovery;
  whatsapp: typeof whatsapp;
  whatsappProtocol: typeof whatsappProtocol;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
  workflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"workflow">;
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
};
