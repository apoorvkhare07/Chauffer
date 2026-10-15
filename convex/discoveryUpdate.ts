import type {Requirements} from './discoveryRules';
import type {Taste} from './taste';
// Describe only confirmed changes; a proposed answer never appears here.
export function discoveryUpdate(previous:Requirements,next:Requirements,before:Taste,after:Taste){
 const changes:string[]=[];
 for(const field of ['category','audience','budget','size','brand','occasion','style','fit','pattern','colour','fabric','sleeve','length'] as const){
  const value=next[field];if(value===previous[field])continue;
  const label=field==='fabric'?'material':field;
  if(value!==undefined)changes.push(`${label}: ${field==='budget'?`up to ₹${Number(value).toLocaleString('en-IN')}`:value==='any'?'any brand':value}`);
  else if(previous[field]!==undefined)changes.push(`${label}: no preference`);
 }
 const avoid=after.avoid.filter(term=>!before.avoid.includes(term));if(avoid.length)changes.push(`avoid: ${avoid.join(', ')}`);
 const prefer=after.prefer.filter(term=>!before.prefer.includes(term)&&!Object.values(next).includes(term));if(prefer.length)changes.push(`prefer: ${prefer.join(', ')}`);
 const must=(next.mustHave??[]).filter(term=>!previous.mustHave?.includes(term));if(must.length)changes.push(`must have: ${must.join(', ')}`);
 return changes.length?`Updated — ${changes.join('; ').replace(/[.!]+$/,'')}.`:'';
}
