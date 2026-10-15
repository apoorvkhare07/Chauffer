import {internalAction,query} from './_generated/server';
import {getAuthUserId} from '@convex-dev/auth/server';
import {v} from 'convex/values';
export const identity=query({args:{},returns:v.union(v.string(),v.null()),handler:async ctx=>await getAuthUserId(ctx)});
export const signup=internalAction({args:{userId:v.id('users')},returns:v.null(),handler:async(_ctx,{userId})=>{
 const key=process.env.POSTHOG_KEY,host=process.env.POSTHOG_HOST;
 if(!key||!host||!['https://us.i.posthog.com','https://eu.i.posthog.com'].includes(host))return null;
 try{const response=await fetch(`${host}/capture/`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({api_key:key,event:'signup_completed',distinct_id:userId,properties:{method:'phone_otp',$insert_id:`signup:${userId}`,$process_person_profile:false}}),signal:AbortSignal.timeout(5000)});if(!response.ok)console.warn('Signup analytics delivery failed',response.status);}catch{console.warn('Signup analytics unavailable');}
 return null;
}});
