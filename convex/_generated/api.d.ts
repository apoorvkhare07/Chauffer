/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as discoveryRules from "../discoveryRules.js";
import type * as discoveryWorkflow from "../discoveryWorkflow.js";
import type * as http from "../http.js";
import type * as identity from "../identity.js";
import type * as liveDiscovery from "../liveDiscovery.js";
import type * as marketplaces from "../marketplaces.js";
import type * as profiles from "../profiles.js";
import type * as purchases from "../purchases.js";
import type * as storeExtractors from "../storeExtractors.js";
import type * as webDiscovery from "../webDiscovery.js";
import type * as whatsapp from "../whatsapp.js";
import type * as whatsappProtocol from "../whatsappProtocol.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  discoveryRules: typeof discoveryRules;
  discoveryWorkflow: typeof discoveryWorkflow;
  http: typeof http;
  identity: typeof identity;
  liveDiscovery: typeof liveDiscovery;
  marketplaces: typeof marketplaces;
  profiles: typeof profiles;
  purchases: typeof purchases;
  storeExtractors: typeof storeExtractors;
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
};
