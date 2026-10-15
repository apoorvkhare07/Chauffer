import {afterEach,describe,expect,it,vi} from "vitest";
import {convexTest} from "convex-test";
import schema from "./schema";
import {api,internal} from "./_generated/api";
import {normalizePhone,verifiedPhone,hashSecret} from "./lib/otp";
const modules=import.meta.glob("./**/*.ts");
const phone="919876543210";
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
function configured(){vi.stubEnv("MSG91_WIDGET_ID","test-widget");vi.stubEnv("MSG91_WIDGET_TOKEN","test-widget-token");vi.stubEnv("MSG91_AUTHKEY","test-server-key");}
describe("Phone OTP sign-in protections",()=>{
 it("normalizes Indian phones and rejects malformed numbers",()=>{
  expect(normalizePhone("98765 43210")).toBe(phone);expect(normalizePhone("+919876543210")).toBe(phone);
  expect(()=>normalizePhone("1234567890")).toThrow();
 });
 it("enforces resend cooldown and caps verification guesses",async()=>{
  configured();const t=convexTest(schema,modules);
  const id=await t.mutation(internal.otp.reserve,{phone});
  await expect(t.mutation(internal.otp.reserve,{phone})).rejects.toThrow("wait a minute");
  await t.mutation(internal.otp.sent,{id,requestId:"sample-request"});
  for(let i=0;i<5;i++){await t.mutation(internal.otp.claim,{id});await t.mutation(internal.otp.release,{id});}
  await expect(t.mutation(internal.otp.claim,{id})).rejects.toThrow("Too many incorrect");
 });
 it("issues a real Convex Auth session and returns to the same phone account",async()=>{
  configured();
  const {generateKeyPair,exportPKCS8,exportJWK}=await import("jose");
  const keys=await generateKeyPair("RS256",{extractable:true});
  vi.stubEnv("JWT_PRIVATE_KEY",(await exportPKCS8(keys.privateKey)).trimEnd().replace(/\n/g," "));
  vi.stubEnv("JWKS",JSON.stringify({keys:[{use:"sig",...await exportJWK(keys.publicKey)}]}));
  vi.stubEnv("CONVEX_SITE_URL","https://sample.convex.site");
  const t=convexTest(schema,modules);
  async function verifiedChallenge(){
   const id=await t.run(ctx=>ctx.db.insert("otpChallenges",{phone,createdAt:Date.now(),expiresAt:Date.now()+60000,attempts:1,state:"sent",requestId:"test-request"}));
   const secret=crypto.randomUUID()+crypto.randomUUID();
   await t.mutation(internal.otp.grant,{id,hash:await hashSecret(secret)});
   return {challenge:id,secret};
  }
  const params=await verifiedChallenge();
  const result=await t.action(api.auth.signIn,{provider:"msg91",params});
  expect(result.tokens?.token).toBeTruthy();
  const first=await t.run(ctx=>ctx.db.query("users").first());
  expect(first?.phone).toBe("+"+phone);
  await expect(t.action(api.auth.signIn,{provider:"msg91",params})).rejects.toThrow("expired");
  await t.action(api.auth.signIn,{provider:"msg91",params:await verifiedChallenge()});
  const users=await t.run(ctx=>ctx.db.query("users").take(2));expect(users).toHaveLength(1);expect(users[0]._id).toBe(first?._id);
 });
 it("verifies browser widget tokens on the server and rejects a forged or different phone",async()=>{
  configured();const t=convexTest(schema,modules);
  const attempt=await t.action(api.otp.beginWidget,{phone});
  expect(attempt).not.toHaveProperty("authkey");
  await t.mutation(api.otp.widgetSent,{id:attempt.id,requestId:"browser-request"});
  vi.stubGlobal("fetch",vi.fn(async()=>new Response(JSON.stringify({type:"error",message:"invalid access-token"}),{status:200})));
  await expect(t.action(api.otp.verifyWidget,{id:attempt.id,token:"forged"})).rejects.toThrow("verification");
  vi.stubGlobal("fetch",vi.fn(async()=>new Response(JSON.stringify({type:"success",message:"919876543211"}),{status:200})));
  await expect(t.action(api.otp.verifyWidget,{id:attempt.id,token:"other-phone-token"})).rejects.toThrow("does not match");
  vi.stubGlobal("fetch",vi.fn(async(url,options)=>{
    expect(String(url)).toContain("verifyAccessToken");expect(JSON.parse(options.body).authkey).toBe("test-server-key");
    return new Response(JSON.stringify({type:"success",message:phone}),{status:200});
  }));
  const secret=await t.action(api.otp.verifyWidget,{id:attempt.id,token:"provider-token"});
  expect(await t.mutation(internal.otp.consume,{id:attempt.id,hash:await hashSecret(secret)})).toBe(phone);
  await expect(t.action(api.otp.verifyWidget,{id:attempt.id,token:"provider-token"})).rejects.toThrow("expired");
 });
 it("expires grants and blocks simultaneous verification",async()=>{
  configured();const t=convexTest(schema,modules);const id=await t.mutation(internal.otp.reserve,{phone});
  await t.mutation(internal.otp.sent,{id,requestId:"sample-request"});await t.mutation(internal.otp.claim,{id});
  await expect(t.mutation(internal.otp.claim,{id})).rejects.toThrow("already in progress");
  await t.mutation(internal.otp.grant,{id,hash:"test-hash"});
  await t.run(ctx=>ctx.db.patch(id,{grantExpiresAt:Date.now()-1}));
  await expect(t.mutation(internal.otp.consume,{id,hash:"test-hash"})).rejects.toThrow("expired");
 });
});
