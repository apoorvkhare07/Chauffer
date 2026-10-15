import {occasionTerms} from './discoveryQuestions';
import {budgetTier,budgetFloor} from './discoveryPolicy';
import {matchesOption,type Option,type Requirements} from './discoveryRules';
import {type Taste,cleanTerms} from './taste';
import {styleEvidence,positiveStyleTerms,negativeStyle} from './styleTerms';
function intentTier(option:Option,r:Requirements){
 const evidence=[option.title,option.colour,option.fabric,...(option.attributes??[])].join(' ');
 const terms=positiveStyleTerms([r.fit,r.pattern,r.style]);
 const occasion=occasionTerms(r);
 return terms.filter(term=>!styleEvidence(evidence,term)).length+(occasion.length&&!occasion.some(term=>styleEvidence(evidence,term))?1:0);
}
function selectionTier(option:Option,r:Requirements){return budgetTier(option,r)*5+intentTier(option,r);}
export function rankOptions(options:Option[],requirements:Requirements,taste:Taste={prefer:[],avoid:[]}):Option[]{
 const preferred=positiveStyleTerms([...taste.prefer,...[requirements.pattern,requirements.fit,requirements.style,requirements.sleeve,requirements.length].filter((x):x is string=>Boolean(x))]);
 const scored=options.filter(o=>matchesOption(o,requirements)).map(option=>{
  const evidence=[option.title,option.colour,option.fabric,...(option.attributes??[])].join(' ');
  const occasionMatches=occasionTerms(requirements).filter(term=>styleEvidence(evidence,term));
  const matched=preferred.filter(term=>styleEvidence(evidence,term));const unknown=preferred.filter(term=>!styleEvidence(evidence,term));
  const avoid=cleanTerms([...taste.avoid,...(requirements.mustHave??[]).map(negativeStyle).filter((x):x is string=>Boolean(x))]);
  const avoided=avoid.filter(term=>styleEvidence(evidence,term));
  const score=occasionMatches.length*8+matched.length*8-avoided.length*12;
  const reasons=[...(requirements.brand&&requirements.brand!=='any'?[`Listed brand matches ${requirements.brand}.`]:[]),...(budgetFloor(requirements)&&option.price>=budgetFloor(requirements)?['Within your preferred spending range.']:[]),...(occasionMatches.length?[`Listing details mention ${occasionMatches.join(', ')} for your ${requirements.occasion} search.`]:[]),...matched.map(term=>`Store details match your ${term} preference.`),...(requirements.fabric&&option.fabric?[`Fabric: ${option.fabric}.`]:[]),`Listed price fits your ₹${requirements.budget?.toLocaleString('en-IN')} budget.`].slice(0,4);
  return {avoid:avoided.length>0,option:{...option,reasons,unknownPreferences:[...unknown,...avoid.filter(term=>!styleEvidence(evidence,term)).map(term=>`whether it avoids ${term}`)].slice(0,8)},score};
 });
 return scored.filter(x=>!x.avoid).sort((a,b)=>selectionTier(a.option,requirements)-selectionTier(b.option,requirements)||b.score-a.score||(requirements.pricePreference==='lowest_price'||!requirements.budget||budgetTier(a.option,requirements)===1?a.option.price-b.option.price:Math.abs(a.option.price-requirements.budget*.8)-Math.abs(b.option.price-requirements.budget*.8))).map(x=>x.option);
}
export function chooseBatch(options:Option[],requirements:Requirements,taste:Taste,perStoreLimit=3,priorityUrls:string[]=[]):Option[]{
 const ranked=rankOptions(options,requirements,taste).sort((a,b)=>Number(priorityUrls.includes(b.url))-Number(priorityUrls.includes(a.url)));const counts=new Map<string,number>();const seen=new Set<string>();
 // A first page should not be monopolised by the cheapest stores. Interleave
 // each store's best evidence-ranked option, then its second/third, max six.
 const hasIntent=Boolean(positiveStyleTerms([requirements.fit,requirements.pattern,requirements.style]).length||occasionTerms(requirements).length);
 const unique=ranked.filter(o=>{const store=o.store??'Flipkart';const n=counts.get(store)??0;const key=[store,o.title,o.colour,o.fabric].map(x=>x.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()).join('|');const limit=hasIntent&&intentTier(o,requirements)===0?Math.max(6,perStoreLimit):perStoreLimit;if(n>=limit||seen.has(key))return false;seen.add(key);counts.set(store,n+1);return true;});
 const groups=new Map<string,Option[]>();for(const o of unique){const key=o.store??'Flipkart';groups.set(key,[...(groups.get(key)??[]),o]);}
 const result:Option[]=unique.filter(o=>priorityUrls.includes(o.url)).slice(0,6);
 for(const tier of [...new Set(unique.map(o=>selectionTier(o,requirements)))].sort((a,b)=>a-b)){const pools=[...groups.values()].map(group=>group.filter(o=>selectionTier(o,requirements)===tier&&!priorityUrls.includes(o.url)));for(let i=0;i<Math.max(6,perStoreLimit)&&result.length<6;i++)for(const group of pools){if(group[i])result.push(group[i]);if(result.length===6)break;}}
 return result;
}
