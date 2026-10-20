"use node";
import {v,ConvexError} from 'convex/values';
import {action} from './_generated/server';
import {internal} from './_generated/api';
import {hashSecret} from './lib/otp';
import {readInputForOwner} from './shoppingInput';

const validToken=(token:string)=>/^[a-f0-9-]{72}$/.test(token);

export const read=action({args:{token:v.string(),base64:v.string(),mime:v.string()},returns:v.object({text:v.string(),uncertainties:v.array(v.string())}),handler:async(ctx,{token,base64,mime})=>{
 if(!validToken(token))throw new ConvexError('Please reload and try again.');
 const owner=`guest:${await hashSecret(token)}`;
 const globalRun=await ctx.runMutation(internal.webDiscovery.claimGuestVoice,{});
 try{return await readInputForOwner(ctx,owner,{kind:'voice',base64,mime,consent:true});}
 finally{await ctx.runMutation(internal.webDiscovery.finish,{id:globalRun});}
}});
