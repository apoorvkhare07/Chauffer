import {internalAction,query,mutation} from './_generated/server';
import {internal} from './_generated/api';
import {getAuthUserId} from '@convex-dev/auth/server';
import {v} from 'convex/values';
import {cleanUtms,initialEventProperties,firstLandingPersonProperties} from '../analyticsAttribution';
const contextValidator=v.object({origin:v.string(),first:v.record(v.string(),v.string()),current:v.record(v.string(),v.string()),isInternal:v.boolean(),inAppBrowser:v.union(v.literal('instagram'),v.literal('facebook'),v.literal('none'))});
const production='https://chauffer.studio';
export const identity=query({args:{},returns:v.union(v.string(),v.null()),handler:async ctx=>await getAuthUserId(ctx)});
// Auth records new accounts only. Wait for their first production client context,
// so signup is not emitted un-attributed or from a preview deployment.
export const completeSignup=mutation({args:{context:contextValidator},returns:v.null(),handler:async(ctx,{context})=>{
 const owner=await getAuthUserId(ctx);if(!owner||context.origin!==production||process.env.CONVEX_CLOUD_URL!=='https://rare-chameleon-828.convex.cloud')return null;
 const row=await ctx.db.query('signupAnalytics').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 if(!row||row.state!=='pending')return null;
 const safe={...context,first:cleanUtms(context.first),current:cleanUtms(context.current)};
 await ctx.scheduler.runAfter(0,internal.analytics.signup,{userId:owner,context:safe});
 await ctx.db.patch(row._id,{state:'scheduled'});return null;
}});
export const signup=internalAction({args:{userId:v.id('users'),context:v.optional(contextValidator)},returns:v.null(),handler:async(_ctx,{userId,context})=>{
 // Optional only for compatibility with already-scheduled old jobs; they cannot
 // generate new un-attributed signup events after this release.
 if(!context||context.origin!==production||process.env.CONVEX_CLOUD_URL!=='https://rare-chameleon-828.convex.cloud')return null;
 const key=process.env.POSTHOG_KEY,host=process.env.POSTHOG_HOST;
 if(!key||!host||!['https://us.i.posthog.com','https://eu.i.posthog.com'].includes(host))return null;
 const first=cleanUtms(context.first),current=cleanUtms(context.current);
 try{const response=await fetch(`${host}/capture/`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({api_key:key,event:'signup_completed',distinct_id:userId,properties:{method:'phone_otp',$insert_id:`signup:${userId}`,...current,...initialEventProperties(first),is_internal:context.isInternal,in_app_browser:context.inAppBrowser,$set_once:firstLandingPersonProperties(first)}}),signal:AbortSignal.timeout(5000)});if(!response.ok)console.warn('Signup analytics delivery failed',response.status);}catch{console.warn('Signup analytics unavailable');}
 return null;
}});
