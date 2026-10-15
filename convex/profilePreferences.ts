import type {Infer} from 'convex/values';
import type {MutationCtx} from './_generated/server';
import {preferences} from './schema';
import {sizeKind} from './fashionRules';
import type {Requirements} from './discoveryRules';
export type Preferences=Infer<typeof preferences>;
export function profileDefaults(p?:Preferences):Requirements{return {...(p?.audience?{audience:p.audience}:{}),...(p?.size?{size:p.size}:{}),...(p?.budgetPaise?{budget:p.budgetPaise/100}:{})};}
export async function savePreferences(ctx:MutationCtx,owner:string,next:Preferences){
 if(next.name!==undefined&&(!next.name.trim()||next.name.length>60))throw new Error('Enter a name under 60 characters.');
 if(next.jeansSize!==undefined&&next.jeansSize.length>40)throw new Error('Keep jeans size under 40 characters.');
 if(next.heightCm!==undefined&&(!Number.isFinite(next.heightCm)||next.heightCm<80||next.heightCm>250))throw new Error('Height must be between 80 and 250 cm.');
 if(next.size&&next.size.length>40)throw new Error('Size is too long.');
 if(next.budgetPaise!==undefined&&(!Number.isSafeInteger(next.budgetPaise)||next.budgetPaise<10000||next.budgetPaise>5000000))throw new Error('Budget must be between ₹100 and ₹50,000.');
 if(next.age!==undefined&&(!Number.isInteger(next.age)||next.age<13||next.age>120))throw new Error('Choose an age between 13 and 120.');
 const row=await ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 const c=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${owner}`)).unique();
 if(c?.pending&&c.updatedAt>Date.now()-120000)throw new Error('Wait for the current search to finish before saving preferences.');
 if(c){
  // A changed shopping audience starts a fresh need, without deleting chat history.
  const changedAudience=next.audience!==row?.preferences.audience;
  const requirements:Requirements=changedAudience?profileDefaults(next):{...c.requirements};
  if(!changedAudience){
   if(next.size!==row?.preferences.size&&sizeKind(requirements.category)==='clothing'){delete requirements.size;if(next.size)requirements.size=next.size;}
   if(next.budgetPaise!==row?.preferences.budgetPaise){delete requirements.budget;if(next.budgetPaise)requirements.budget=next.budgetPaise/100;}
  }
  await ctx.db.patch(c._id,{requirements,language:next.language,revision:c.revision+1,pending:false,aiTurn:false,agentThreadId:undefined,referenceProduct:undefined,updatedAt:Date.now()});
 }
 if(row)await ctx.db.patch(row._id,{preferences:next,updatedAt:Date.now()});else await ctx.db.insert('profiles',{owner,preferences:next,updatedAt:Date.now()});
}
