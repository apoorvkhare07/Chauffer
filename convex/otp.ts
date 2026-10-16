import {action,mutation,internalMutation,internalAction} from "./_generated/server";
import {internal} from "./_generated/api";
import {v,ConvexError} from "convex/values";
import type {Id} from "./_generated/dataModel";
import {hashSecret,normalizePhone,smsConfigured,mobileSmsConfigured,widgetRequest,verifiedPhone} from "./lib/otp";

export const reserve=internalMutation({args:{phone:v.string()},returns:v.id("otpChallenges"),handler:async(ctx,{phone})=>{
 const now=Date.now();
 const recent=await ctx.db.query("otpChallenges").withIndex("by_phone",q=>q.eq("phone",phone)).order("desc").take(20);
 if(recent[0] && now-recent[0].createdAt<60000)throw new ConvexError("Please wait a minute before requesting another code.");
 if(recent.filter(c=>c.createdAt>now-3600000).length>=5)throw new ConvexError("Too many code requests. Please try again in an hour.");
 const daily=await ctx.db.query("otpChallenges").withIndex("by_created",q=>q.gt("createdAt",now-86400000)).take(100);
 if(daily.length>=100)throw new ConvexError("The daily code limit has been reached. Please try tomorrow.");
 for(const old of recent)if(old.state==="sent"||old.state==="sending")await ctx.db.patch(old._id,{state:"failed"});
 const id=await ctx.db.insert("otpChallenges",{phone,createdAt:now,expiresAt:now+15*60000,attempts:0,state:"sending"});
 await ctx.scheduler.runAfter(86400000,internal.otp.cleanup,{id});return id;
}});
export const sent=internalMutation({args:{id:v.id("otpChallenges"),requestId:v.optional(v.string())},returns:v.null(),handler:async(ctx,{id,requestId})=>{
 const c=await ctx.db.get(id);if(c?.state==="sending")await ctx.db.patch(id,requestId?{requestId,state:"sent"}:{state:"failed"});return null;
}});
export const claim=internalMutation({args:{id:v.id("otpChallenges")},returns:v.any(),handler:async(ctx,{id})=>{
 const c=await ctx.db.get(id),now=Date.now();
 if(!c || c.state!=="sent" || c.expiresAt<now || !c.requestId)throw new ConvexError("This code has expired. Request a new code.");
 
 if(c.attempts>=5)throw new ConvexError("Too many incorrect attempts. Request a new code.");
 if((c.verifyingUntil??0)>now)throw new ConvexError("Code verification is already in progress.");
 await ctx.db.patch(id,{attempts:c.attempts+1,verifyingUntil:now+35000});return c;
}});
export const release=internalMutation({args:{id:v.id("otpChallenges")},returns:v.null(),handler:async(ctx,{id})=>{const c=await ctx.db.get(id);if(c?.state==="sent")await ctx.db.patch(id,{verifyingUntil:undefined});return null;}});
export const grant=internalMutation({args:{id:v.id("otpChallenges"),hash:v.string()},returns:v.null(),handler:async(ctx,{id,hash})=>{
 const c=await ctx.db.get(id);if(!c || c.state!=="sent" || c.expiresAt<Date.now())throw new ConvexError("This code has expired. Request a new code.");
 await ctx.db.patch(id,{state:"verified",grantHash:hash,grantExpiresAt:Date.now()+60000,verifyingUntil:undefined});return null;
}});
export const consume=internalMutation({args:{id:v.id("otpChallenges"),hash:v.string()},returns:v.string(),handler:async(ctx,{id,hash})=>{
 const c=await ctx.db.get(id);
 if(!c || c.state!=="verified" || c.grantHash!==hash || (c.grantExpiresAt??0)<Date.now())throw new ConvexError("Sign-in verification expired. Request a new code.");
 await ctx.db.patch(id,{state:"consumed",grantHash:undefined});return c.phone;
}});
export const cleanup=internalMutation({args:{id:v.id("otpChallenges")},returns:v.null(),handler:async(ctx,{id})=>{await ctx.db.delete(id);return null;}});
// Browser widget completes CAPTCHA; only MSG91's server response proves identity.
// Public browser configuration only; loading the form does not reserve an SMS attempt.
export const widgetConfig=action({args:{},returns:v.object({widgetId:v.string(),tokenAuth:v.string()}),handler:async()=>{
 if(!smsConfigured())throw new ConvexError("Phone sign-in is not configured yet.");
 return {widgetId:process.env.MSG91_WIDGET_ID!,tokenAuth:process.env.MSG91_WIDGET_TOKEN!};
}});
export const beginWidget=action({args:{phone:v.string()},returns:v.object({id:v.id("otpChallenges"),widgetId:v.string(),tokenAuth:v.string()}),handler:async(ctx,{phone}):Promise<{id:Id<"otpChallenges">,widgetId:string,tokenAuth:string}>=>{
 if(!smsConfigured())throw new ConvexError("Phone sign-in is not configured yet.");
 const normalized=normalizePhone(phone);
 const id=await ctx.runMutation(internal.otp.reserve,{phone:normalized});
 return {id,widgetId:process.env.MSG91_WIDGET_ID!,tokenAuth:process.env.MSG91_WIDGET_TOKEN!};
}});
// Native clients get a separate widget so enabling MSG91 Mobile Integration
// does not disable the website's OTP widget.
export const beginMobileWidget=action({args:{phone:v.string()},returns:v.object({id:v.id("otpChallenges"),widgetId:v.string(),tokenAuth:v.string()}),handler:async(ctx,{phone}):Promise<{id:Id<"otpChallenges">,widgetId:string,tokenAuth:string}>=>{
 if(!mobileSmsConfigured())throw new ConvexError("Mobile phone sign-in is not configured yet. Ask the backend owner to set up the mobile MSG91 widget.");
 const normalized=normalizePhone(phone);
 const id=await ctx.runMutation(internal.otp.reserve,{phone:normalized});
 return {id,widgetId:process.env.MSG91_MOBILE_WIDGET_ID!,tokenAuth:process.env.MSG91_MOBILE_WIDGET_TOKEN!};
}});
export const widgetSent=mutation({args:{id:v.id("otpChallenges"),requestId:v.string()},returns:v.null(),handler:async(ctx,{id,requestId})=>{
 const c=await ctx.db.get(id);
 if(!c || c.state!=="sending" || c.expiresAt<Date.now() || !requestId || requestId.length>200)throw new ConvexError("This code has expired. Request a new code.");
 await ctx.db.patch(id,{state:"sent",requestId});return null;
}});
export const verifyWidget=action({args:{id:v.id("otpChallenges"),token:v.string()},returns:v.string(),handler:async(ctx,{id,token}):Promise<string>=>{
 if(!token || token.length>8192)throw new ConvexError("Phone verification did not go through. Please try again.");
 const c=await ctx.runMutation(internal.otp.claim,{id});
 try{
  const verified=await widgetRequest("verifyAccessToken",{"access-token":token});
  if(verifiedPhone(verified)!==c.phone)throw new ConvexError("The verified phone does not match this code request.");
  const secret=crypto.randomUUID()+crypto.randomUUID();
  await ctx.runMutation(internal.otp.grant,{id,hash:await hashSecret(secret)});return secret;
 }finally{await ctx.runMutation(internal.otp.release,{id});}
}});

// Read-only provider check: never sends an SMS and never returns a credential.
export const checkProvider=internalAction({args:{},returns:v.object({configured:v.boolean(),status:v.number(),authorized:v.boolean(),detail:v.string()}),handler:async()=>{
 if(!smsConfigured())return {configured:false,status:0,authorized:false,detail:"Not configured"};
 const response=await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({authkey:process.env.MSG91_AUTHKEY!,'access-token':'chauffeur-invalid-setup-check'}),signal:AbortSignal.timeout(15000)});
 const body=await response.json();const msg=String(body.message??body.code??'');
 return {configured:true,status:response.status,detail:msg.split(process.env.MSG91_AUTHKEY!).join('[redacted]').replace(/https?:\/\/\S+/g,'[url]').slice(0,180),authorized:/access.token|token.*(invalid|expired)|invalid.*token/i.test(msg)&&!/(authkey|IP.*whitelist|unauthorized)/i.test(msg)};
}});
