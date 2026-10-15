/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accountSupport from "../accountSupport.js";
import type * as aiConversations from "../aiConversations.js";
import type * as aiDecision from "../aiDecision.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as browserPages from "../browserPages.js";
import type * as commerce from "../commerce.js";
import type * as comparisonRules from "../comparisonRules.js";
import type * as conversationCore from "../conversationCore.js";
import type * as conversationLanguage from "../conversationLanguage.js";
import type * as conversations from "../conversations.js";
import type * as crons from "../crons.js";
import type * as dailyFeed from "../dailyFeed.js";
import type * as dailyFeedWorker from "../dailyFeedWorker.js";
import type * as dailyFeedWorkflow from "../dailyFeedWorkflow.js";
import type * as discoveryPolicy from "../discoveryPolicy.js";
import type * as discoveryQuestions from "../discoveryQuestions.js";
import type * as discoveryRules from "../discoveryRules.js";
import type * as discoveryUpdate from "../discoveryUpdate.js";
import type * as discoveryWorkflow from "../discoveryWorkflow.js";
import type * as expandedRetail from "../expandedRetail.js";
import type * as fashionRules from "../fashionRules.js";
import type * as feedRules from "../feedRules.js";
import type * as feedValidators from "../feedValidators.js";
import type * as guestSearch from "../guestSearch.js";
import type * as guestSearchWorker from "../guestSearchWorker.js";
import type * as http from "../http.js";
import type * as identity from "../identity.js";
import type * as lib_otp from "../lib/otp.js";
import type * as liveDiscovery from "../liveDiscovery.js";
import type * as marketplaces from "../marketplaces.js";
import type * as offerEvidence from "../offerEvidence.js";
import type * as offerRules from "../offerRules.js";
import type * as offerValidators from "../offerValidators.js";
import type * as otp from "../otp.js";
import type * as priceIntelligence from "../priceIntelligence.js";
import type * as priceIntelligenceRules from "../priceIntelligenceRules.js";
import type * as priceIntelligenceWorker from "../priceIntelligenceWorker.js";
import type * as productRefresh from "../productRefresh.js";
import type * as profilePreferences from "../profilePreferences.js";
import type * as profiles from "../profiles.js";
import type * as purchases from "../purchases.js";
import type * as ranking from "../ranking.js";
import type * as renderedRetail from "../renderedRetail.js";
import type * as retailExtractors from "../retailExtractors.js";
import type * as savedProducts from "../savedProducts.js";
import type * as shoppingAI from "../shoppingAI.js";
import type * as shoppingInput from "../shoppingInput.js";
import type * as storeBrowserProbe from "../storeBrowserProbe.js";
import type * as storeConfig from "../storeConfig.js";
import type * as storeExpansionProbe from "../storeExpansionProbe.js";
import type * as storeExtractors from "../storeExtractors.js";
import type * as styleTerms from "../styleTerms.js";
import type * as styling from "../styling.js";
import type * as stylingPhoto from "../stylingPhoto.js";
import type * as stylingRules from "../stylingRules.js";
import type * as taste from "../taste.js";
import type * as tryOn from "../tryOn.js";
import type * as tryOnAI from "../tryOnAI.js";
import type * as tryOnWorkflow from "../tryOnWorkflow.js";
import type * as wardrobe from "../wardrobe.js";
import type * as wardrobeAI from "../wardrobeAI.js";
import type * as wardrobeBuying from "../wardrobeBuying.js";
import type * as wardrobeBuyingAI from "../wardrobeBuyingAI.js";
import type * as wardrobeImageAI from "../wardrobeImageAI.js";
import type * as wardrobeImages from "../wardrobeImages.js";
import type * as wardrobeMetadata from "../wardrobeMetadata.js";
import type * as wardrobePhoto from "../wardrobePhoto.js";
import type * as wardrobeRules from "../wardrobeRules.js";
import type * as wardrobeWorkflow from "../wardrobeWorkflow.js";
import type * as webDiscovery from "../webDiscovery.js";
import type * as whatsapp from "../whatsapp.js";
import type * as whatsappProtocol from "../whatsappProtocol.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accountSupport: typeof accountSupport;
  aiConversations: typeof aiConversations;
  aiDecision: typeof aiDecision;
  analytics: typeof analytics;
  auth: typeof auth;
  browserPages: typeof browserPages;
  commerce: typeof commerce;
  comparisonRules: typeof comparisonRules;
  conversationCore: typeof conversationCore;
  conversationLanguage: typeof conversationLanguage;
  conversations: typeof conversations;
  crons: typeof crons;
  dailyFeed: typeof dailyFeed;
  dailyFeedWorker: typeof dailyFeedWorker;
  dailyFeedWorkflow: typeof dailyFeedWorkflow;
  discoveryPolicy: typeof discoveryPolicy;
  discoveryQuestions: typeof discoveryQuestions;
  discoveryRules: typeof discoveryRules;
  discoveryUpdate: typeof discoveryUpdate;
  discoveryWorkflow: typeof discoveryWorkflow;
  expandedRetail: typeof expandedRetail;
  fashionRules: typeof fashionRules;
  feedRules: typeof feedRules;
  feedValidators: typeof feedValidators;
  guestSearch: typeof guestSearch;
  guestSearchWorker: typeof guestSearchWorker;
  http: typeof http;
  identity: typeof identity;
  "lib/otp": typeof lib_otp;
  liveDiscovery: typeof liveDiscovery;
  marketplaces: typeof marketplaces;
  offerEvidence: typeof offerEvidence;
  offerRules: typeof offerRules;
  offerValidators: typeof offerValidators;
  otp: typeof otp;
  priceIntelligence: typeof priceIntelligence;
  priceIntelligenceRules: typeof priceIntelligenceRules;
  priceIntelligenceWorker: typeof priceIntelligenceWorker;
  productRefresh: typeof productRefresh;
  profilePreferences: typeof profilePreferences;
  profiles: typeof profiles;
  purchases: typeof purchases;
  ranking: typeof ranking;
  renderedRetail: typeof renderedRetail;
  retailExtractors: typeof retailExtractors;
  savedProducts: typeof savedProducts;
  shoppingAI: typeof shoppingAI;
  shoppingInput: typeof shoppingInput;
  storeBrowserProbe: typeof storeBrowserProbe;
  storeConfig: typeof storeConfig;
  storeExpansionProbe: typeof storeExpansionProbe;
  storeExtractors: typeof storeExtractors;
  styleTerms: typeof styleTerms;
  styling: typeof styling;
  stylingPhoto: typeof stylingPhoto;
  stylingRules: typeof stylingRules;
  taste: typeof taste;
  tryOn: typeof tryOn;
  tryOnAI: typeof tryOnAI;
  tryOnWorkflow: typeof tryOnWorkflow;
  wardrobe: typeof wardrobe;
  wardrobeAI: typeof wardrobeAI;
  wardrobeBuying: typeof wardrobeBuying;
  wardrobeBuyingAI: typeof wardrobeBuyingAI;
  wardrobeImageAI: typeof wardrobeImageAI;
  wardrobeImages: typeof wardrobeImages;
  wardrobeMetadata: typeof wardrobeMetadata;
  wardrobePhoto: typeof wardrobePhoto;
  wardrobeRules: typeof wardrobeRules;
  wardrobeWorkflow: typeof wardrobeWorkflow;
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
