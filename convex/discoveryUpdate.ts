import type {Requirements} from './discoveryRules';
import type {Taste} from './taste';
// Describe only confirmed changes; a proposed answer never appears here.
export function discoveryUpdate(previous:Requirements,next:Requirements,before:Taste,after:Taste,language="en"){
 const changes:string[]=[];
 const hi:Record<string,string>={category:'कपड़े का प्रकार',audience:'किसके लिए',budget:'बजट',size:'साइज़',brand:'ब्रांड',occasion:'मौका',style:'स्टाइल',fit:'फ़िट',pattern:'पैटर्न',colour:'रंग',fabric:'कपड़ा',sleeve:'बाँह',length:'लंबाई'};
 for(const field of ['category','audience','budget','size','brand','occasion','style','fit','pattern','colour','fabric','sleeve','length'] as const){
  const value=next[field];if(value===previous[field])continue;
  const label=language==='hi'?hi[field]:field==='fabric'?'material':field;
  if(value!==undefined)changes.push(`${label}: ${field==='budget'?language==='hi'?`₹${Number(value).toLocaleString('en-IN')} तक`:`up to ₹${Number(value).toLocaleString('en-IN')}`:value==='any'?(language==='hi'?'कोई भी ब्रांड':'any brand'):value}`);
  else if(previous[field]!==undefined)changes.push(`${label}: ${language==='hi'?'कोई खास पसंद नहीं':'no preference'}`);
 }
 const avoid=after.avoid.filter(term=>!before.avoid.includes(term));if(avoid.length)changes.push(`${language==='hi'?'नहीं चाहिए':'avoid'}: ${avoid.join(', ')}`);
 const prefer=after.prefer.filter(term=>!before.prefer.includes(term)&&!Object.values(next).includes(term));if(prefer.length)changes.push(`${language==='hi'?'पसंद':'prefer'}: ${prefer.join(', ')}`);
 const must=(next.mustHave??[]).filter(term=>!previous.mustHave?.includes(term));if(must.length)changes.push(`${language==='hi'?'ज़रूरी':'must have'}: ${must.join(', ')}`);
 const prefix=language==='hi'?'आपकी पसंद अपडेट की':language==='hinglish'?'Aapki pasand update ki':'Updated';
 return changes.length?`${prefix} — ${changes.join('; ').replace(/[.!]+$/,'')}.`:'';
}
