import {v,type Infer} from 'convex/values';
import {requirementsValidator,optionValidator,matchesOption,matchesCandidate,colourTier,type Requirements,type Option} from './discoveryRules';
import {tasteValidator,type Taste} from './taste';
import {positiveStyleTerms,styleEvidence} from './styleTerms';
export const recipientValidator=v.union(v.literal('self'),v.literal('other'),v.literal('unknown'));
export const routeValidator=v.union(v.literal('discover'),v.literal('style'),v.literal('wardrobe'),v.literal('compare'),v.literal('mixed'),v.literal('clarify'));
export const memoryItemValidator=v.object({id:v.string(),text:v.string(),category:v.string(),recipient:recipientValidator,kind:v.union(v.literal('confirmed'),v.literal('tentative'),v.literal('episode')),source:v.string(),updatedAt:v.number()});
export const briefValidator=v.object({version:v.literal(2),route:routeValidator,recipient:recipientValidator,requirements:requirementsValidator,taste:tasteValidator,goal:v.string(),language:v.string(),memoryIds:v.array(v.string()),wardrobeRequested:v.boolean(),excludeShown:v.boolean(),hardFields:v.array(v.string()),sourceMessageId:v.optional(v.id('messages'))});
export type Brief=Infer<typeof briefValidator>;
export const evidenceValidator=v.object({id:v.string(),option:optionValidator,visual:v.array(v.string()),conflicts:v.array(v.string()),unknowns:v.array(v.string()),imageInspected:v.boolean(),colourMatch:v.optional(v.union(v.literal('match'),v.literal('related'),v.literal('mismatch'),v.literal('uncertain'),v.literal('not_requested')))});
export type Evidence=Infer<typeof evidenceValidator>;
export const choiceValidator=v.object({id:v.string(),reason:v.string(),evidenceIds:v.array(v.string()),tradeoff:v.string()});
export const outfitChoiceValidator=v.object({title:v.string(),reason:v.string(),itemIds:v.array(v.string())});
export const reportValidator=v.object({summary:v.string(),choices:v.array(choiceValidator),outfits:v.array(outfitChoiceValidator),needsEvidence:v.array(v.string()),limitations:v.array(v.string())});
export const stepValidator=v.object({name:v.string(),status:v.string(),inputTokens:v.number(),outputTokens:v.number(),elapsedMs:v.number()});
export const taskStatusValidator=v.union(v.literal('planning'),v.literal('needs_input'),v.literal('retrieving'),v.literal('assessing'),v.literal('ready'),v.literal('partial'),v.literal('failed'),v.literal('cancelled'));
export const settingsValidator=v.object({enabled:v.boolean(),revision:v.number()});
export const limits={calls:8,tokens:24000,images:12,imageBytes:6_000_000,deadlineMs:115000};
export function architectureEnabled(owner:string){const value=process.env.RECOMMENDATION_V2_OWNERS??'';return value==='*'||value.split(',').map(s=>s.trim()).includes(owner);}
export function evidencePool(options:Option[],r:Requirements,limit=36):Evidence[]{
 const seen=new Set<string>();const stores=new Map<string,Option[]>();
 for(const o of options){if(!matchesCandidate(o,r)||seen.has(o.url))continue;seen.add(o.url);const key=o.store??'unknown';stores.set(key,[...(stores.get(key)??[]),o]);}
 const result:Option[]=[];for(let n=0;result.length<limit&&n<24;n++)for(const group of stores.values()){if(group[n])result.push(group[n]);if(result.length===limit)break;}
 return result.sort((a,b)=>colourTier(a.colour,r.colour)-colourTier(b.colour,r.colour)).map((option,i)=>({id:`p${i+1}`,option,visual:[],conflicts:[],unknowns:['Size stock, fit and final checkout price are not verified.'],imageInspected:false}));
}
// Spend the existing image allowance on different designs before repeated listings.
// Similar titles only change inspection order; they never delete a product.
function designWords(o:Option){
 return new Set(o.title.toLowerCase().replace(/\b(lo|hi)\b/g,m=>m==='lo'?'low':'high').replace(/[^a-z0-9]+/g,' ').split(' ').filter(w=>(w.length>1||/^\d+$/.test(w))&&!['men','mens','women','womens','unisex','for','the','and','with','sneakers','sneaker','shoes','shoe','shirt','shirts','white','black','blue','navy','purple','pink','red','green','grey','gray','cotton','blend','pure','polycotton'].includes(w)));
}
function designSimilarity(a:Option,b:Option){
 if(a.imageUrl&&b.imageUrl&&a.imageUrl.split('?')[0]===b.imageUrl.split('?')[0])return 1;
 const x=designWords(a),y=designWords(b);if(!x.size||!y.size)return 0;
 return [...x].filter(w=>y.has(w)).length/new Set([...x,...y]).size;
}
export function inspectionCandidates(pool:Evidence[],r:Requirements,taste:Taste={prefer:[],avoid:[]},limit=8){
 const remaining=pool.filter(p=>!p.imageInspected&&p.option.imageUrl&&matchesCandidate(p.option,r));
 const selected:Evidence[]=[];
 const order=new Map(pool.map((p,i)=>[p.id,i]));
 const preferences=positiveStyleTerms([r.fit,r.pattern,r.style,r.sleeve,r.length,...taste.prefer]);
 const preferenceScore=(p:Evidence)=>preferences.filter(term=>styleEvidence([p.option.title,...(p.option.attributes??[])].join(' '),term)).length;
 while(remaining.length&&selected.length<limit){
  const repeated=(p:Evidence)=>Number(selected.some(q=>designSimilarity(p.option,q.option)>=0.6));
  remaining.sort((a,b)=>colourTier(a.option.colour,r.colour)-colourTier(b.option.colour,r.colour)||preferenceScore(b)-preferenceScore(a)||repeated(a)-repeated(b)||(order.get(a.id)!-order.get(b.id)!));
  selected.push(remaining.shift()!);
 }
 return selected;
}
export function evidenceWording(text:string){
 // Price and brand reputation are not evidence of material quality.
 if(/(?:price|pricing|cost|cheaper|expensive|budget.friendly|कीमत|सस्त|महंग)/i.test(text)&&/(?:quality|material|finish|durab|गुणवत्ता|टिकाऊ)/i.test(text)&&/(?:may|might|indicat|impact|expect|better|worse|higher|lower|means|मतलब|बेहतर)/i.test(text))return 'Material quality and durability have not been verified.';
 return text;
}
export function usableEvidence(p:Evidence,r:Requirements){return !p.conflicts.length&&(!r.colour||!p.option.imageUrl||(p.imageInspected&&(p.colourMatch==='match'||(!r.colourStrict&&p.colourMatch==='related'))))&&matchesCandidate(p.option,r);}
export function validateChoices(choices:Infer<typeof choiceValidator>[],pool:Evidence[],r:Requirements){
 const seen=new Set<string>();return choices.flatMap(c=>{const p=pool.find(p=>p.id===c.id);if(!p||seen.has(c.id)||!usableEvidence(p,r)||!c.evidenceIds.length||c.evidenceIds.some(id=>id!==p.id))return [];seen.add(c.id);return [{...p.option,reasons:[...(p.colourMatch==='related'?[`Related colour: ${p.option.colour}; your preference is ${r.colour}.`]:[]),evidenceWording(c.reason).slice(0,400)],unknownPreferences:[...p.unknowns,...(c.tradeoff?[evidenceWording(c.tradeoff).slice(0,250)]:[])].slice(0,8)}];}).sort((a,b)=>colourTier(a.colour,r.colour)-colourTier(b.colour,r.colour)).slice(0,6);
}
export function memoryRelevant(m:{recipient:string;category:string;kind:string;updatedAt:number},recipient:string,category?:string,now=Date.now()){
 return recipient==='self'&&m.recipient==='self'&&(m.category==='all'||Boolean(category&&m.category===category))&&(m.kind==='confirmed'||now-m.updatedAt<90*86400000);
}
export function recipientFromText(text:string,previous:'self'|'other'|'unknown'='self'):'self'|'other'|'unknown'{
 if(/\b(for myself|for me|my own)\b|मेरे लिए|mere liye/i.test(text))return 'self';
 if(/\b(for my (?:brother|sister|wife|husband|mother|father|friend|partner|son|daughter)|gift for|for him|for her)\b|भाई के लिए|बहन के लिए|bhai ke liye|behen ke liye/i.test(text))return 'other';
 return previous;
}
export function excludePreviouslyShown(text:string,intent:string){
 if(/^(?:please )?(?:try again|retry|search again|recheck|check again)[!.\s]*$/i.test(text))return false;
 return isMore(text)||intent==='more';
}
export function isMore(text:string){return /^(?:show (?:me )?more(?: options)?|more(?: options)?|another (?:set|batch))[!.\s]*$/i.test(text);}

export function coverageCheckedReport(report:Infer<typeof reportValidator>,stores:{status:string}[]){
 const empty=!report.choices.length&&!report.outfits.length;
 const limitations=empty?[]:report.limitations;
 return {...report,...(empty?{summary:stores.length&&stores.every(s=>s.status==='unavailable')?'The attempted stores could not be read. Your requirements are unchanged.':'I could not verify suitable choices from the available evidence. Your requirements are unchanged.'}:{}),limitations:stores.some(s=>s.status==='unavailable')?['Some stores could not be read; this is not a complete view of their stock.',...limitations].slice(0,4):limitations};
}
