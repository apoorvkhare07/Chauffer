import {z} from 'zod';
import {v,type Infer} from 'convex/values';
import {requirementsValidator,type Requirements} from './discoveryRules';
import {tasteValidator,cleanTerms,type Taste} from './taste';
const nullable=z.string().max(80).nullable();
export const decisionSchema=z.object({
 intent:z.enum(['search','refine','more','feedback','chat','remember','forget']),
 reply:z.string().min(1).max(600),
 requirements:z.object({category:z.enum(['kurta','dress','top','saree']).nullable(),budget:z.number().min(100).max(50000).nullable(),size:z.enum(['XXXS','XXS','XS','S','M','L','XL','XXL','XXXL','2XL','3XL','4XL']).nullable(),colour:nullable,fabric:nullable,occasion:nullable,style:nullable,fit:nullable,pattern:nullable,sleeve:nullable,length:nullable,mustHave:z.array(z.string().min(2).max(40)).max(5)}),
 taste:z.object({prefer:z.array(z.string().min(2).max(40)).max(10),avoid:z.array(z.string().min(2).max(40)).max(10)}),
 referenceOption:z.number().int().min(1).max(6).nullable(),
 feedbackKind:z.enum(['like','dislike','refine']).nullable(),
});
export const decisionValidator=v.object({intent:v.union(v.literal('search'),v.literal('refine'),v.literal('more'),v.literal('feedback'),v.literal('chat'),v.literal('remember'),v.literal('forget')),reply:v.string(),requirements:requirementsValidator,taste:tasteValidator,referenceOption:v.optional(v.number()),feedbackKind:v.optional(v.union(v.literal('like'),v.literal('dislike'),v.literal('refine')))});
export type Decision=Infer<typeof decisionValidator>;
export function normalizeDecision(raw:unknown,previous:Requirements,taste:Taste):Decision{
 const value=decisionSchema.parse(raw);const requirements=Object.fromEntries(Object.entries(value.requirements).filter(([,v])=>v!==null)) as Requirements;
 // Greetings / feedback must not silently erase a completed search or stored taste.
 if(value.intent==='chat')return {intent:'chat',reply:value.reply,requirements:previous,taste};
 return {intent:value.intent,reply:value.reply,requirements,taste:{prefer:cleanTerms(value.taste.prefer),avoid:cleanTerms(value.taste.avoid)},...(value.referenceOption!==null?{referenceOption:value.referenceOption}:{}),...(value.feedbackKind?{feedbackKind:value.feedbackKind}:{})};
}
export function missingQuestion(r:Requirements):string|null{
 if(!r.category)return 'What would you like: a kurta, dress, top or saree?';
 if(!r.budget)return 'What is your maximum budget in rupees?';
 if(!r.size&&r.category!=='saree')return 'What size should I look for?';
 return null;
}
export function memoryConsent(text:string,intent:string):boolean{
 return intent==='remember'?/\b(remember|save|always|usually|usual|hamesha|yaad)\b|याद|हमेशा/i.test(text):intent==='forget'?/\b(forget|clear|remove|delete)\b.*\b(preferences?|taste|memory|remembered)\b|भूल/i.test(text):false;
}
