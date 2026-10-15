import type {Option,Requirements} from './discoveryRules';
import {sizeKind} from './fashionRules';
// This is a preference, never a minimum-price restriction or a quality rating.
export function budgetFloor(r:Requirements){return r.budget&&r.pricePreference!=='lowest_price'?Math.round(r.budget*.6):0;}
export function budgetTier(o:Option,r:Requirements){return o.price<budgetFloor(r)?1:0;}
export function comparePrices(a:number,b:number,r:Requirements){const floor=budgetFloor(r);return Number(a<floor)-Number(b<floor)||(floor&&a>=floor?Math.abs(a-r.budget!*.8)-Math.abs(b-r.budget!*.8):a-b);}
export function brandQuestion(r:Requirements){return r.pricePreference!=='lowest_price'&&!r.brand&&r.budget&&r.budget>=3000&&sizeKind(r.category)==='shoe'?'Any preferred brand: Nike, Adidas, Puma, or open to all brands?':null;}
const aliases:Record<string,string>={nike:'Nike',adidas:'Adidas',adidias:'Adidas',puma:'Puma',reebok:'Reebok',asics:'ASICS',skechers:'Skechers',converse:'Converse',vans:'Vans',zara:'Zara','h&m':'H&M',uniqlo:'Uniqlo',levis:"Levi’s",'levi’s':"Levi’s",'levi\'s':"Levi’s",snitch:'SNITCH'};
export function namedBrands(text:string){return [...new Set(Object.entries(aliases).filter(([alias])=>new RegExp(`(?:^|[^a-z])${alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?:$|[^a-z])`,'i').test(text)).map(([,name])=>name))];}
export function explicitDiscovery(text:string,previous:Requirements,proposed:Requirements={}):Pick<Requirements,'brand'|'pricePreference'>{
 const lower=text.toLowerCase();const result:Pick<Requirements,'brand'|'pricePreference'>={};
 const changed=proposed.category&&previous.category&&proposed.category!==previous.category;
 if(!changed&&previous.brand)result.brand=previous.brand;
 if(previous.pricePreference)result.pricePreference=previous.pricePreference;
 if(/\b(any brand|all brands|no brand preference|open to all|no questions|don.t ask)\b/i.test(text))result.brand='any';
 else{
  const found=namedBrands(lower);
  if(found.length===1)result.brand=found[0];
  else if(proposed.brand&&proposed.brand!=='any'&&lower.includes(proposed.brand.toLowerCase())&&!found.length)result.brand=proposed.brand.trim().slice(0,60);
 }
 if(/\b(cheapest|lowest pric|lower pric|save money|budget finds)\w*\b/i.test(text))result.pricePreference='lowest_price';
 else if(/\b(closer to (?:my |the )?budget|use (?:my |the )?budget|better options|better quality|premium|spend more|best within budget)\b/i.test(text))result.pricePreference='best_within_budget';
 return result;
}
export function brandMatches(o:Option,brand?:string){
 if(!brand||brand==='any')return true;
 const normalize=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
 if(o.brand)return normalize(o.brand)===normalize(brand);
 const escaped=brand.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return new RegExp(`\\b${escaped}\\b`,'i').test(o.title)&&!new RegExp(`${escaped}[ -]*(?:inspired|style|like)|(?:inspired by|style of|like)\\s+${escaped}`,'i').test(o.title);
}
export function discoverySummary(options:Option[],r:Requirements){
 const floor=budgetFloor(r),inRange=options.filter(o=>o.price>=floor).length;
 const money=(n:number)=>'₹'+n.toLocaleString('en-IN');
 const budgetNote=floor?(inRange?`I prioritised ${money(floor)}–${money(r.budget!)} picks.${inRange<options.length?' Lower-priced alternatives follow.':''}`:`I couldn’t verify picks around ${money(floor)}–${money(r.budget!)}; these are lower-priced alternatives.`):'Lower-priced picks come first.';
 const question=brandQuestion(r)??(!r.occasion&&!r.style?'Is this for everyday wear, work, or an occasion?':'What would you change about these picks?');
 return `I found ${options.length} new options. ${budgetNote} ${question}`;
}
