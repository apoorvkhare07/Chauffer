"use node";
import {Agent} from '@convex-dev/agent';
import {createGoogleGenerativeAI} from '@ai-sdk/google';
import {z} from 'zod';
import {v} from 'convex/values';
import {internalAction} from './_generated/server';
import {internal,components} from './_generated/api';
import {stylePrinciples} from './stylistRules';
import {localClock} from './wardrobeContextRules';
const schema=z.object({
 summary:z.string().max(1200),contextUsed:z.array(z.string().max(180)).max(6),
 sections:z.array(z.object({title:z.string().max(90),advice:z.string().max(1200),reason:z.string().max(600)})).max(6),
 looks:z.array(z.object({title:z.string().max(90),occasion:z.string().max(160),pieces:z.array(z.string().max(140)).max(6),why:z.string().max(800),styling:z.string().max(600),alternative:z.string().max(400),search:z.string().max(300),references:z.array(z.string().max(2200)).max(8).optional()})).max(3),
 palette:z.array(z.object({name:z.string().max(60),hex:z.string().max(7),use:z.string().max(240)})).max(5),
 trends:z.array(z.object({sourceId:z.string().max(60),adaptation:z.string().max(500)})).max(3),
 caveats:z.array(z.string().max(300)).max(5),question:z.string().max(240).optional()
});
export const generate=internalAction({args:{id:v.id('stylistSessions')},returns:v.null(),handler:async(ctx,{id}):Promise<null>=>{
 try{
 const plan=await ctx.runQuery(internal.stylist.plan,{id});if(!plan)throw new Error('changed');const key=process.env.GEMINI_API_KEY;if(!key)throw new Error('unconfigured');
 const agent=new Agent(components.agent,{name:'Chauffeur personal stylist',languageModel:createGoogleGenerativeAI({apiKey:key})(process.env.GEMINI_MODEL||'gemini-3.1-flash-lite'),
 instructions:stylePrinciples+`
You are a practical personal fashion stylist for Indian shoppers of any chosen audience. The supplied context.references are the only confirmed owned garments and real saved/recently discovered products. Do not invent ownership, products, product URLs or availability. For each look, cite the exact key of every supplied reference actually used in the new references field. Do not cite a source that is not in context. You have no raw portrait. Only the supplied confirmed description is available; never claim to have looked at their photo. No automatic profile writes or shopping calls.
Write a substantial, specific style brief (roughly 500–900 words for a broad request; less for a focused correction), in the requested language or saved en/hi/hinglish. Explain decisions rather than repeating generic compliments. Use natural paragraph prose. contextUsed lists only supplied relevant facts, not guessed data. Address silhouettes/fit and lengths, colour combinations, fabrics/texture, occasion and finishing details in 3–6 useful sections. Each section has concrete advice and why. Tie proportion suggestions to the wearer's goals and confirmed context; if absent, say so briefly and offer preference-led alternatives without blocking.
Provide up to three distinct head-to-toe outfit formulas: pieces (including optional shoes/accessories), why it meets this specific brief, how to wear it, a useful swap, and a short product-search brief for ONE main garment in that look. Prefer the supplied real sources when they fit; label concepts honestly when none fit. Do not add brand or budget not requested. For a focused question, fewer looks is appropriate.
Palette has up to five named colours with approximate display hex and a specific role, never an inferred skin assessment. If needed, one focused follow-up question at most.
Trends: only use supplied dated editorial notes, citing exact sourceId. Explain your adaptation separately. Notes are curated runway reporting, not live search, sales data or proof of Indian relevance. Never invent a current trend, source or URL; if notes empty, say current trend evidence is unavailable and provide timeless advice. Do not force an unsuitable trend onto the brief. Do not quote source text.
Previous advice is one bounded refinement context; retain its occasion and explicit constraints unless the user changes them. It is not a permanent preference. Current event controls are defaults if the prompt doesn't override them. No live weather is supplied; use user-reported conditions or state assumptions as conditional. Detailed caveats should be relevant and brief, not repetitive boilerplate.`,
 storageOptions:{saveMessages:'none'},contextOptions:{recentMessages:0,searchOtherThreads:false,searchOptions:{textSearch:false,vectorSearch:false,limit:0}}});
 const result=await agent.generateObject(ctx,{userId:plan.owner},{prompt:JSON.stringify({...plan,owner:undefined,clock:localClock(Date.now(),plan.event.timeZone)}),schema,maxOutputTokens:6500,maxRetries:0,abortSignal:AbortSignal.timeout(65000)});
 await ctx.runMutation(internal.stylist.finish,{id,advice:result.object});
 }catch(error){console.warn('Stylist failed',{name:error instanceof Error?error.name:'Unknown'});await ctx.runMutation(internal.stylist.finish,{id,error:'unavailable'});}return null;
}});
