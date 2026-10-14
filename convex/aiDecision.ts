import {fashionCategories,validSize,sizeQuestion,sizeKind} from './fashionRules';
import {z} from 'zod';
import {v,type Infer} from 'convex/values';
import {requirementsValidator,type Requirements} from './discoveryRules';
import {tasteValidator,cleanTerms,type Taste} from './taste';
import {canonicalStyle,negativeStyle,positiveStyleTerms} from './styleTerms';
const nullable=z.string().max(80).nullable();
export const decisionSchema=z.object({
 intent:z.enum(['search','refine','more','feedback','chat','remember','forget']),
 reply:z.string().min(1).max(600),
 requirements:z.object({category:z.enum(fashionCategories).nullable(),audience:z.enum(['men','women','unisex']).nullable().optional(),budget:z.number().min(100).max(50000).nullable(),size:z.string().max(30).nullable(),colour:nullable,fabric:nullable,occasion:nullable,style:nullable,fit:nullable,pattern:nullable,sleeve:nullable,length:nullable,mustHave:z.array(z.string().min(2).max(40)).max(5)}),
 taste:z.object({prefer:z.array(z.string().min(2).max(40)).max(10),avoid:z.array(z.string().min(2).max(40)).max(10)}),
 referenceOption:z.number().int().min(1).max(6).nullable(),
 feedbackKind:z.enum(['like','dislike','refine']).nullable(),
});
export const decisionValidator=v.object({intent:v.union(v.literal('search'),v.literal('refine'),v.literal('more'),v.literal('feedback'),v.literal('chat'),v.literal('remember'),v.literal('forget')),reply:v.string(),requirements:requirementsValidator,taste:tasteValidator,referenceOption:v.optional(v.number()),feedbackKind:v.optional(v.union(v.literal('like'),v.literal('dislike'),v.literal('refine')))});
export type Decision=Infer<typeof decisionValidator>;
export function normalizeDecision(raw:unknown,previous:Requirements,taste:Taste,text=""):Decision{
 const value=decisionSchema.parse(raw);const requirements=Object.fromEntries(Object.entries(value.requirements).filter(([,v])=>v!==null)) as Requirements;
 if(requirements.category&&sizeKind(requirements.category)!==sizeKind(previous.category)&&requirements.size===previous.size)delete requirements.size;
 if(requirements.audience&&previous.audience&&requirements.audience!==previous.audience&&requirements.size===previous.size&&!/\bsize\b/i.test(text))delete requirements.size;
 const avoid=cleanTerms([...value.taste.avoid,...value.taste.prefer.map(negativeStyle).filter((x):x is string=>Boolean(x)),...(requirements.mustHave??[]).map(negativeStyle).filter((x):x is string=>Boolean(x)),...[requirements.style,requirements.pattern].map(x=>x?negativeStyle(x):null).filter((x):x is string=>Boolean(x))].map(term=>negativeStyle(term)??canonicalStyle(term)));
 const explicitMust=/\b(only|must|has to|needs to|compulsory|sirf)\b|सिर्फ|केवल|ज़रूर/i.test(text.replace(/not (?:a )?must|not mandatory|not compulsory|don.t have to|do not have to/gi,''));
 const onlyCotton=/(?:only|sirf|सिर्फ|केवल)\s+(?:cotton\b|कॉटन|कपास|सूती)(?!\s*(?:blend|mix))|\bcotton only\b/i.test(text);
 const notOnlyCotton=/not only cotton|sirf cotton nahi|सिर्फ\s*कॉटन\s*नहीं/i.test(text);
 if(onlyCotton&&!notOnlyCotton)requirements.fabric='pure cotton';
 requirements.mustHave=positiveStyleTerms(requirements.mustHave??[]).filter(term=>explicitMust||positiveStyleTerms(previous.mustHave??[]).includes(term));
 for(const field of ['style','pattern','fit','sleeve','length'] as const){const term=requirements[field];if(term){if(negativeStyle(term))delete requirements[field];else requirements[field]=canonicalStyle(term);}}
 const nextTaste={prefer:cleanTerms(positiveStyleTerms(value.taste.prefer).filter(term=>!avoid.includes(term))),avoid};
 // An explicit broad request for prints is not permission to pick a new print subtype.
 const broadPrint=/(?:show|prefer|want)\s+(?:me\s+)?printed\b|printed\s+(?:kurtas?|tops?|dresses|instead)/i.test(text);
 const rejectsPrint=/(?:no|not|avoid|without|don't want|do not want)\s+(?:\w+\s+){0,2}print(?:ed|s)?\b/i.test(text);
 if(broadPrint&&!rejectsPrint&&!/\b(floral|flowers?|striped|stripes|polka|checked|checks|geometric|abstract)\b/i.test(text)){
  requirements.pattern='printed';
  if(/\btoo (?:plain|solid)\b/i.test(text)){
   nextTaste.prefer=nextTaste.prefer.filter(term=>term!=='solid');
   if(requirements.style==='solid')delete requirements.style;
  }
  const subtypes=new Set(['floral','striped','polka dot','checked','geometric','abstract']);
  nextTaste.prefer=nextTaste.prefer.filter(term=>!subtypes.has(term)||positiveStyleTerms(taste.prefer).includes(term));
 }

 for(const field of ['style','pattern','fit','sleeve','length'] as const){
  if(requirements[field]&&nextTaste.avoid.includes(requirements[field]!))delete requirements[field];
 }
 // A shopper can describe preferences while asking us to wait before searching.
 // Greetings with null fields preserve existing requirements rather than clearing them.
 const planned=value.intent==='chat'?{...previous,...requirements,mustHave:requirements.mustHave?.length?requirements.mustHave:previous.mustHave??[]}:requirements;
 const plannedTaste=value.intent==='chat'&&!nextTaste.prefer.length&&!nextTaste.avoid.length?taste:nextTaste;
 return {intent:value.intent,reply:value.reply,requirements:planned,taste:plannedTaste,...(value.referenceOption!==null?{referenceOption:value.referenceOption}:{}),...(value.feedbackKind?{feedbackKind:value.feedbackKind}:{})};
}
export function missingQuestion(r:Requirements):string|null{
 if(!r.category)return 'What would you like: clothing, shoes or accessories?';
 if(!r.budget)return 'What is your maximum budget in rupees?';
 if(!validSize(r.category,r.size))return sizeQuestion(r.category);
 return null;
}
export function memoryConsent(text:string,intent:string):boolean{
 if(intent==='remember'&&/(?:do not|don't|dont|never|not)\s+(?:save|remember)|nahi\s*(?:save|yaad)|याद\s*मत|मत\s*(?:रख|याद)/i.test(text))return false;
 if(intent==='forget'&&/(?:do not|don't|dont|never|not)\s+(?:forget|clear|remove|delete)|भूलना\s*मत|मत\s*भूल/i.test(text))return false;
 return intent==='remember'?/\bremember\b|\bsave\s+(?:my|these|this|the|current)\s+(?:preferences?|taste|size|budget)|\byaad\s+rakh|याद\s*(?:रख|रखो)/i.test(text):intent==='forget'?/\b(forget|clear|remove|delete)\b.*\b(preferences?|taste|memory|remembered)\b|भूल/i.test(text):false;
}
