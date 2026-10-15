import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { internal } from "./_generated/api";
import { hashSecret } from "./lib/otp";
import { Id } from "./_generated/dataModel";
import { createAccount, convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [ConvexCredentials({id:"msg91",authorize:async(credentials,ctx)=>{
    if(typeof credentials.challenge!=="string" || typeof credentials.secret!=="string" || credentials.secret.length!==72)return null;
    const phone=await ctx.runMutation(internal.otp.consume,{id:credentials.challenge as Id<"otpChallenges">,hash:await hashSecret(credentials.secret)});
    const {user}=await createAccount(ctx,{provider:"msg91",account:{id:phone},profile:{phone:`+${phone}`,phoneVerificationTime:Date.now()},shouldLinkViaPhone:false});
    return {userId:user._id};
  }})],
});
