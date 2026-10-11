import {matchesOption,type Option,type Requirements} from './discoveryRules';
import {type Taste,cleanTerms} from './taste';
import {styleEvidence,positiveStyleTerms,negativeStyle} from './styleTerms';
export function rankOptions(options:Option[],requirements:Requirements,taste:Taste={prefer:[],avoid:[]}):Option[]{
 const preferred=positiveStyleTerms([...taste.prefer,...[requirements.pattern,requirements.fit,requirements.style,requirements.sleeve,requirements.length].filter((x):x is string=>Boolean(x))]);
 const scored=options.filter(o=>matchesOption(o,requirements)).map(option=>{
  const evidence=[option.title,option.colour,option.fabric,...(option.attributes??[])].join(' ');
  const matched=preferred.filter(term=>styleEvidence(evidence,term));const unknown=preferred.filter(term=>!styleEvidence(evidence,term));
  const avoid=cleanTerms([...taste.avoid,...(requirements.mustHave??[]).map(negativeStyle).filter((x):x is string=>Boolean(x))]);
  const avoided=avoid.filter(term=>styleEvidence(evidence,term));
  const score=matched.length*8-avoided.length*12;
  const reasons=[...matched.map(term=>`Store details match your ${term} preference.`),...(requirements.fabric&&option.fabric?[`Fabric: ${option.fabric}.`]:[]),`Listed price fits your ₹${requirements.budget?.toLocaleString('en-IN')} budget.`].slice(0,4);
  return {avoid:avoided.length>0,option:{...option,reasons,unknownPreferences:[...unknown,...avoid.filter(term=>!styleEvidence(evidence,term)).map(term=>`whether it avoids ${term}`)].slice(0,8)},score};
 });
 return scored.filter(x=>!x.avoid).sort((a,b)=>b.score-a.score||a.option.price-b.option.price).map(x=>x.option);
}
export function chooseBatch(options:Option[],requirements:Requirements,taste:Taste):Option[]{
 const ranked=rankOptions(options,requirements,taste);const counts=new Map<string,number>();
 return ranked.filter(o=>{const store=o.store??'Flipkart';const n=counts.get(store)??0;if(n>=3)return false;counts.set(store,n+1);return true;}).slice(0,6);
}
