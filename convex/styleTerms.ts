// Merchant wording varies. Match equivalent clothing details, not imagined suitability.
const groups:Record<string,string[]>={solid:['solid','plain','unpatterned'],embroidered:['embroidered','embroidery'],printed:['printed','print'],floral:['floral','flower'],straight:['straight'],sleeveless:['sleeveless'],striped:['striped','stripes'],sequinned:['sequinned','sequins','sequin']};
export function canonicalStyle(term:string):string{
 const clean=term.toLowerCase().trim().replace(/\s+/g,' ');
 if(/^(simple|minimal|minimalist|understated|plain|unpatterned)$/.test(clean))return 'solid';
 for(const [key,words] of Object.entries(groups))if(words.includes(clean))return key;
 return clean;
}
export function negativeStyle(term:string):string|null{
 const clean=term.toLowerCase().trim();
 const match=clean.match(/^(?:no|not|without|avoid)\s+(.+)$/)||clean.match(/^non[- ](.+)$/)||clean.match(/^(.+?)[- ]free$/);
 return match?canonicalStyle(match[1]):null;
}
export function styleEvidence(evidence:string,term:string):boolean{
 const wanted=canonicalStyle(term),text=evidence.toLowerCase();
 return wanted.split(/\s+/).filter(Boolean).every(word=>(groups[word]??[word]).some(alias=>{
  const literal=alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  // A listing saying "no embroidery" is not evidence of embroidery.
  return new RegExp(`\\b${literal}\\b`,'i').test(text)&&!new RegExp(`\\b(?:no|without|non[- ]?)\\s*${literal}\\b|\\b${literal}[- ]free\\b`,'i').test(text);
 }));
}
export function positiveStyleTerms(terms:(string|undefined)[]):string[]{
 return [...new Set(terms.filter((x):x is string=>Boolean(x)).filter(x=>!negativeStyle(x)).map(canonicalStyle))];
}
