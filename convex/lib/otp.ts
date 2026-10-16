import {ConvexError} from "convex/values";
export function normalizePhone(value: string) {
  const compact=value.replace(/[\s()-]/g,"");
  const digits=compact.replace(/^\+/,"");
  const phone=/^[6-9]\d{9}$/.test(digits)?`91${digits}`:digits;
  if(!/^91[6-9]\d{9}$/.test(phone))throw new ConvexError("Enter a valid 10-digit Indian mobile number.");
  return phone;
}
export function smsConfigured(){return Boolean(process.env.MSG91_WIDGET_ID && process.env.MSG91_WIDGET_TOKEN && process.env.MSG91_AUTHKEY);}
// Keep the native-only MSG91 widget separate: enabling Mobile Integration on a
// widget disables that widget on the web, per MSG91's dashboard guidance.
export function mobileSmsConfigured(){return Boolean(process.env.MSG91_MOBILE_WIDGET_ID && process.env.MSG91_MOBILE_WIDGET_TOKEN && process.env.MSG91_AUTHKEY);}
export async function hashSecret(value:string){
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,"0")).join("");
}
export async function widgetRequest(method:string,body:Record<string,string>){
  const response=await fetch(`https://control.msg91.com/api/v5/widget/${method}`,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({...body,...(method==="verifyAccessToken"?{authkey:process.env.MSG91_AUTHKEY || ""}:{})}),signal:AbortSignal.timeout(15000),
  });
  const data=await response.json();
  if(!response.ok || data.type!=="success") {
    if(response.status===418 || /IP.*(whitelist|allow)|whitelist.*IP/i.test(String(data.message)))throw new ConvexError("MSG91 needs the Convex server IP allowed in its Authkey settings.");
    if(/captcha/i.test(String(data.message)))throw new ConvexError("This MSG91 widget requires browser captcha. Its API configuration needs checking.");
    if(/invalid.*otp|incorrect.*otp|otp.*(invalid|incorrect|expired)/i.test(String(data.message)))throw new ConvexError("That code is incorrect or expired. Please check it or request a new one.");
    throw new ConvexError("Phone verification did not go through. Please try again.");
  }
  return data;
}
// Only a phone returned by MSG91's authenticated verification response is trusted.
export function verifiedPhone(data:unknown){
 const response=data as {type?:unknown,message?:unknown};
 if(response?.type!=="success")throw new ConvexError("Phone verification did not go through. Please try again.");
 const info=response.message;
 const value=typeof info==="string"?info:(info as {identifier?:unknown} | null)?.identifier;
 if(typeof value!=="string")throw new ConvexError("MSG91 did not return a verified phone number.");
 return normalizePhone(value);
}
