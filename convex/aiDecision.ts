import {discoveryFields,discoveryQuestionValidator} from './discoveryQuestions';
import {explicitDiscovery,namedBrands} from './discoveryPolicy';
import {requestedAudience,fashionCategories,validSize,sizeQuestion,sizeKind,unsupportedFashionRequest} from './fashionRules';
import {z} from 'zod';
import {v,type Infer} from 'convex/values';
import {requirementsValidator,type Requirements} from './discoveryRules';
import {tasteValidator,cleanTerms,type Taste} from './taste';
import {canonicalStyle,negativeStyle,positiveStyleTerms} from './styleTerms';
const nullable=z.string().max(80).nullable();
export const decisionSchema=z.object({
 intent:z.enum(['search','refine','more','feedback','chat','out_of_scope','remember','forget']),
 reply:z.string().min(1).max(600),
 question:z.object({field:z.enum(['occasion','style','pattern','fit','colour','fabric','brand']),question:z.string().min(1).max(240),choices:z.array(z.object({label:z.string().min(1).max(40),text:z.string().min(1).max(100),value:z.string().min(1).max(60)})).min(2).max(4)}).nullable().optional(),
 requirements:z.object({brand:z.string().max(60).nullable().optional(),pricePreference:z.enum(['best_within_budget','lowest_price']).nullable().optional(),category:z.enum(fashionCategories).nullable(),audience:z.enum(['men','women','unisex']).nullable().optional(),budget:z.number().min(100).max(50000).nullable(),size:z.string().max(30).nullable(),colour:nullable,fabric:nullable,occasion:nullable,style:nullable,fit:nullable,pattern:nullable,sleeve:nullable,length:nullable,mustHave:z.array(z.string().min(2).max(40)).max(5)}),
 taste:z.object({prefer:z.array(z.string().min(2).max(40)).max(10),avoid:z.array(z.string().min(2).max(40)).max(10)}),
 referenceOption:z.number().int().min(1).max(6).nullable(),
 feedbackKind:z.enum(['like','dislike','refine']).nullable(),
});
export const decisionValidator=v.object({intent:v.union(v.literal('search'),v.literal('refine'),v.literal('more'),v.literal('feedback'),v.literal('chat'),v.literal('out_of_scope'),v.literal('remember'),v.literal('forget')),reply:v.string(),question:v.optional(discoveryQuestionValidator),requirements:requirementsValidator,taste:tasteValidator,referenceOption:v.optional(v.number()),feedbackKind:v.optional(v.union(v.literal('like'),v.literal('dislike'),v.literal('refine')))});
export type Decision=Infer<typeof decisionValidator>;
function clearOpenAttributes(requirements:Requirements){
 for(const field of ['colour','fabric','occasion','style','fit','pattern','sleeve','length'] as const){
  if(/^(?:any(?: (?:brand|fabric|material|colou?r|style|fit|pattern|occasion|sleeve|length))?|none|n\/a|not applicable|unspecified|null)$/i.test(requirements[field]?.trim()??''))delete requirements[field];
 }
}
export function normalizeDecision(raw:unknown,previous:Requirements,taste:Taste,text="",language='en'):Decision{
 if(unsupportedFashionRequest(text))return {intent:'out_of_scope',reply:outOfScopeReply(language),requirements:previous,taste};
 const value=decisionSchema.parse(raw);
 if(value.intent==='out_of_scope')return {intent:'out_of_scope',reply:outOfScopeReply(language),requirements:previous,taste};
 const named=namedBrands(text);if(named.length>1){value.intent='chat';value.reply=`Which brand should I search first: ${named.join(' or ')}?`;value.question={field:'brand',question:value.reply,choices:named.map(brand=>({label:brand,text:brand,value:brand}))};}const requirements=Object.fromEntries(Object.entries(value.requirements).filter(([,v])=>v!==null)) as Requirements;
 // Open/empty model values are not merchant attributes. In particular, “any brand” is never a fabric.
 clearOpenAttributes(requirements);
 // Carry the active chat's confirmed attributes when a short refinement omits them.
 const sameItem=!requirements.category||requirements.category===previous.category;
 for(const field of ['category','budget','size','colour','fabric','occasion','style','fit','pattern','sleeve','length'] as const){if(requirements[field]===undefined&&previous[field]!==undefined&&(sameItem||field==='budget'))(requirements as any)[field]=previous[field];}
 // A new category is a new item: stale shirt fabric/cut must not filter shoes.
 // Explicitly restated values (or “keep/same”) can carry over.
 if(previous.category&&requirements.category&&requirements.category!==previous.category){
  for(const field of ['colour','fabric','occasion','style','fit','pattern','sleeve','length'] as const){
   const value=requirements[field];
   const label=field==='colour'?'colou?r':field;
   const keepField=new RegExp(`\\b(?:keep|same|retain)\\b[^.!?]{0,20}\\b${label}\\b`,'i').test(text);
   if(value&&value===previous[field]&&!keepField&&!value.split(/\s+/).every(word=>text.toLowerCase().includes(word.toLowerCase())))delete requirements[field];
  }
  requirements.mustHave=(requirements.mustHave??[]).filter(term=>!(previous.mustHave??[]).includes(term)||text.toLowerCase().includes(term.toLowerCase()));
 }
 if(previous.askedDiscoveryFields&&(!requirements.category||requirements.category===previous.category))requirements.askedDiscoveryFields=previous.askedDiscoveryFields;
 if(/no (?:more )?questions|don.t ask (?:me )?(?:any |more )?questions/i.test(text))requirements.askedDiscoveryFields=discoveryFields;
 delete requirements.brand;delete requirements.pricePreference;Object.assign(requirements,explicitDiscovery(text,previous,value.requirements as Requirements));
 const explicitAudience=requestedAudience(text);
 if(explicitAudience)requirements.audience=explicitAudience;else if(previous.audience)requirements.audience=previous.audience;
 if(requirements.category&&sizeKind(requirements.category)!==sizeKind(previous.category)&&requirements.size===previous.size)delete requirements.size;
 if(requirements.audience&&previous.audience&&requirements.audience!==previous.audience&&requirements.size===previous.size&&!/\bsize\b/i.test(text))delete requirements.size;
 if(sameItem&&!/\b(?:drop|clear|remove|relax) (?:all |my |the )?(?:must.haves|constraints|requirements)\b/i.test(text))requirements.mustHave=[...new Set([...(requirements.mustHave??[]),...(previous.mustHave??[])])];
 const inherited=sameItem&&value.intent!=='forget'?taste:{prefer:[],avoid:[]};
 const explicitPositive=positiveStyleTerms([...value.taste.prefer,requirements.colour]).filter(term=>text.toLowerCase().includes(term));
 const avoid=cleanTerms([...value.taste.avoid,...inherited.avoid.filter(term=>!explicitPositive.includes(term)),...value.taste.prefer.map(negativeStyle).filter((x):x is string=>Boolean(x)),...(requirements.mustHave??[]).map(negativeStyle).filter((x):x is string=>Boolean(x)),...[requirements.style,requirements.pattern].map(x=>x?negativeStyle(x):null).filter((x):x is string=>Boolean(x))].map(term=>negativeStyle(term)??canonicalStyle(term)));
 const explicitMust=/\b(only|must|has to|needs to|compulsory|sirf)\b|सिर्फ|केवल|ज़रूर/i.test(text.replace(/not (?:a )?must|not mandatory|not compulsory|don.t have to|do not have to/gi,''));
 const onlyCotton=/(?:only|sirf|सिर्फ|केवल)\s+(?:cotton\b|कॉटन|कपास|सूती)(?!\s*(?:blend|mix))|\bcotton only\b/i.test(text);
 const notOnlyCotton=/not only cotton|sirf cotton nahi|सिर्फ\s*कॉटन\s*नहीं/i.test(text);
 if(onlyCotton&&!notOnlyCotton)requirements.fabric='pure cotton';
 requirements.mustHave=positiveStyleTerms(requirements.mustHave??[]).filter(term=>explicitMust||positiveStyleTerms(previous.mustHave??[]).includes(term));
 for(const field of ['style','pattern','fit','sleeve','length'] as const){const term=requirements[field];if(term){if(negativeStyle(term))delete requirements[field];else requirements[field]=canonicalStyle(term);}}
 // Strict colour needs an explicit instruction; a new colour resets the old strictness.
 const preferredColour=text.match(/\bprefer(?:red colou?r is|red colou?r:|ably)?\s+(blue|purple|pink|red|orange|yellow|green|teal|black|grey|gray|white|beige|brown)\b/i)?.[1];
 if(preferredColour)requirements.colour=preferredColour.toLowerCase();
 const colour=requirements.colour;
 const colourMentioned=Boolean(colour&&text.toLowerCase().includes(colour.toLowerCase()));
 requirements.colourStrict=colour===previous.colour?previous.colourStrict??false:false;
 if(colourMentioned){
  const escaped=colour!.replace(/[^a-z -]/gi,'');
  requirements.colourStrict=new RegExp(`(?:only|strictly|sirf|सिर्फ|केवल)\\s+(?:in\\s+)?${escaped}|${escaped}\\s+only`,'i').test(text);
 }
 if(/related colou?rs?|similar colou?rs?|other colou?rs? (?:are )?(?:okay|ok|fine)/i.test(text))requirements.colourStrict=false;
 const nextTaste={prefer:cleanTerms(positiveStyleTerms([...value.taste.prefer,...inherited.prefer]).filter(term=>!avoid.includes(term))),avoid};
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
 const changedCategory=Boolean(previous.category&&requirements.category&&previous.category!==requirements.category);
 const chatDefaults=changedCategory?{...(previous.audience?{audience:previous.audience}:{}),...(previous.budget?{budget:previous.budget}:{})}:previous;
 const planned=value.intent==='chat'?{...chatDefaults,...requirements,mustHave:requirements.mustHave?.length?requirements.mustHave:changedCategory?[]:previous.mustHave??[]}:requirements;
 const selectedTaste=value.intent==='chat'&&!nextTaste.prefer.length&&!nextTaste.avoid.length?taste:nextTaste;
 const plannedTaste={prefer:[...selectedTaste.prefer],avoid:[...selectedTaste.avoid]};
 // “Any colour” must also stop yesterday's colour preference biasing ranking.
 for(const [field,label,terms] of [
  ['colour','colou?r',/\b(blue|black|white|red|pink|green|yellow|purple|orange|beige|brown|grey|gray|navy|multicolou?r)\b/i],
  ['fabric','(?:fabric|material)',/\b(cotton|linen|silk|rayon|viscose|georgette|chiffon|leather|suede|mesh|canvas|polyester)\b/i],
 ] as const){
  if(new RegExp(`\\b(?:any ${label}|no preference for ${label}|no ${label} preference)\\b`,'i').test(text)){
   delete planned[field];planned.mustHave=planned.mustHave?.filter(term=>!terms.test(term)||text.toLowerCase().includes(term.toLowerCase()));
   plannedTaste.prefer=plannedTaste.prefer.filter(term=>!terms.test(term)||text.toLowerCase().includes(term.toLowerCase()));
   plannedTaste.avoid=plannedTaste.avoid.filter(term=>!terms.test(term)||text.toLowerCase().includes(term.toLowerCase()));
  }
 }
 for(const field of ['fit','pattern','style','occasion'] as const){if(new RegExp(`\\b(?:any ${field}|no ${field} preference|no preference for ${field})\\b`,'i').test(text)){const old=previous[field];delete planned[field];if(old){planned.mustHave=planned.mustHave?.filter(term=>term!==old);plannedTaste.prefer=plannedTaste.prefer.filter(term=>term!==old);}}}
 // A brand clarification is unresolved: do not silently select a named brand.
 if(value.intent==='chat'&&value.question?.field==='brand')delete planned.brand;
 if(sizeKind(planned.category)==='shoe'){
  const explicit=text.match(/\b(UK|US|EU)\s*(\d{1,2}(?:\.5)?)\b/i);
  const reversed=text.match(/\b(\d{1,2}(?:\.5)?)\s*(UK|US|EU)\b/i);
  if(explicit)planned.size=explicit[1].toUpperCase()+' '+explicit[2];
  else if(reversed)planned.size=reversed[2].toUpperCase()+' '+reversed[1];
  else if(sizeKind(previous.category)!=='shoe'||!validSize(previous.category,previous.size)){
   delete planned.size;value.reply=sizeQuestion(planned.category);
  }
 }
 clearOpenAttributes(planned);
 return {intent:value.intent,reply:value.reply,...(value.intent==='chat'&&value.question?{question:value.question}:{}),requirements:planned,taste:plannedTaste,...(value.referenceOption!==null?{referenceOption:value.referenceOption}:{}),...(value.feedbackKind?{feedbackKind:value.feedbackKind}:{})};
}
export function outOfScopeReply(language='en'){
 if(language==='hi')return 'मैं फैशन शॉपिंग और स्टाइलिंग में मदद के लिए बना हूँ—कपड़े, जूते, एक्सेसरीज़ और आपकी वॉर्डरोब। मैं इस अनुरोध में मदद नहीं कर सकता। फैशन से जुड़ी किस चीज़ में मदद चाहिए?';
 if(language==='hinglish')return 'Main fashion shopping aur styling—kapde, shoes, accessories aur wardrobe—mein help karta hoon. Is request mein help nahi kar sakta. Fashion se judi kis cheez mein help chahiye?';
 return 'I’m designed for fashion shopping and styling: clothing, shoes, accessories and your wardrobe. I can’t help with that request. What fashion-related help do you need?';
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
