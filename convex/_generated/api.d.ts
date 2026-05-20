/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as access from "../access.js";
import type * as admin from "../admin.js";
import type * as applications from "../applications.js";
import type * as authz from "../authz.js";
import type * as clerkSync from "../clerkSync.js";
import type * as debug from "../debug.js";
import type * as email from "../email.js";
import type * as http from "../http.js";
import type * as users from "../users.js";
import type * as ventures from "../ventures.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  access: typeof access;
  admin: typeof admin;
  applications: typeof applications;
  authz: typeof authz;
  clerkSync: typeof clerkSync;
  debug: typeof debug;
  email: typeof email;
  http: typeof http;
  users: typeof users;
  ventures: typeof ventures;
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

export declare const components: {};
