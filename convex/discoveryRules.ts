import {storeValidator,productStore,merchantImageHosts} from './storeConfig';
import {categoryPatterns,detectCategory,detectAudience,requestedAudience,sizeKind,validSize,sizeQuestion} from './fashionRules';
import { v } from 'convex/values';
import {brandMatches,brandQuestion,explicitDiscovery,namedBrands} from './discoveryPolicy';
import {positiveStyleTerms,negativeStyle,styleEvidence} from './styleTerms';

export const requirementsValidator = v.object({
 brand:v.optional(v.string()),pricePreference:v.optional(v.union(v.literal('best_within_budget'),v.literal('lowest_price'))),
 audience:v.optional(v.union(v.literal('men'),v.literal('women'),v.literal('unisex'))), category: v.optional(v.string()), budget: v.optional(v.number()), size: v.optional(v.string()),
 colour: v.optional(v.string()), fabric: v.optional(v.string()),
 occasion:v.optional(v.string()),style:v.optional(v.string()),fit:v.optional(v.string()),pattern:v.optional(v.string()),sleeve:v.optional(v.string()),length:v.optional(v.string()),mustHave:v.optional(v.array(v.string())),
});
export type Requirements = import('convex/values').Infer<typeof requirementsValidator>;
export const optionValidator = v.object({title:v.string(), url:v.string(), price:v.number(), colour:v.string(), fabric:v.string(), observedAt:v.number(),brand:v.optional(v.string()),manufacturerCode:v.optional(v.string()), store:v.optional(storeValidator), source:v.optional(v.union(v.literal('product'),v.literal('listing'))), priceFrom:v.optional(v.boolean()),imageUrl:v.optional(v.string()),attributes:v.optional(v.array(v.string())),reasons:v.optional(v.array(v.string())),unknownPreferences:v.optional(v.array(v.string()))});
export type Option = import('convex/values').Infer<typeof optionValidator>;

export function nextRequest(text: string, previous: Requirements = {}): {requirements:Requirements; reply:string; search:boolean} {
 const trimmed = text.trim().slice(0,1000), lower = trimmed.toLowerCase();
 if (/^(hi|hello|hey|namaste|start|reset)[!.\s]*$/i.test(trimmed)) return {requirements:/^(reset|start)[!.\s]*$/i.test(trimmed)?{}:previous,reply:"Hi! I'm Chauffeur. I can find live fashion options, but can't buy anything. What are you looking for: clothing, shoes or accessories?",search:false};
 if (/\b(checkout|buy it|place.*order|payment)\b/i.test(trimmed)) return {requirements:previous,reply:"This test version only finds fashion options. You can open a product link to shop on the store yourself.",search:false};
 if (/^(thanks|thank you|thankyou)[!.\s]*$/i.test(trimmed))return {requirements:previous,reply:'You’re welcome! Tell me what to change, or say reset for a new search.',search:false};
 if (/^(none of these|don.t like (any|these)|not interested|no thanks)[!.\s]*$/i.test(trimmed)) return {requirements:previous,reply:'What should I change? Tell me what felt wrong about the style, fit or price, and I’ll adjust the next picks.',search:false};
 if (/\b(not|no|don.t (like|want)|avoid)\s+(navy blue|dark blue|light blue|blue|black|white|red|pink|green|yellow|purple|orange|beige|brown|cotton|silk|rayon|linen|printed|plain)\b/.test(lower))return {requirements:previous,reply:'What would you prefer instead? Tell me a colour or fabric, or ask for more options.',search:false};
 const requirements = {...previous};
 if (/\b(any|no preference for) colo[u]?r\b/.test(lower))delete requirements.colour;
 if (/\b(any|no preference for) (fabric|material)\b/.test(lower))delete requirements.fabric;
 const category=detectCategory(lower), audience=requestedAudience(lower);
 if(category){if(previous.category&&category!==previous.category){for(const key of ['brand','colour','fabric','style','fit','pattern','sleeve','length','mustHave'] as const)delete requirements[key];}if(sizeKind(category)!==sizeKind(previous.category))delete requirements.size;requirements.category=category;}
 if(audience){if(previous.audience&&audience!==previous.audience)delete requirements.size;requirements.audience=audience;}
 Object.assign(requirements,explicitDiscovery(trimmed,requirements,requirements));
 const money = lower.match(/(?:under|below|budget|upto|up to|less than|within|₹|rs\.?|inr|तक)\s*(?:₹|rs\.?)?\s*([\d,]+(?:\.\d{1,2})?)\s*(k)?\b/) ?? (/^\s*\d[\d,]*(?:\.\d{1,2})?\s*k?\s*$/.test(lower)?lower.match(/([\d,]+(?:\.\d{1,2})?)\s*(k)?/):null);
 if (money) {const budget=Number(money[1].replaceAll(',',''))*(money[2]?1000:1);if (budget>=100&&budget<=50000) requirements.budget=budget;else return {requirements,reply:'Please give a budget between ₹100 and ₹50,000.',search:false};}
 const shoeSize=trimmed.match(/\b(UK|US|EU)\s*(\d{1,2}(?:\.5)?)\b/i);
 const numericSize=trimmed.match(/\b(?:size|waist)\s*(\d{2})(?:\s*(inches|in|cm))?\b/i);
 const size = trimmed.match(/\b(?:size\s*[:=-]?\s*)(XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|[2-4]XL)\b/i) ?? trimmed.match(/\b(XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|[2-4]XL)\b/i);
 if (shoeSize) requirements.size=`${shoeSize[1].toUpperCase()} ${shoeSize[2]}`; else if(numericSize)requirements.size=numericSize[1]+(numericSize[2]?` ${numericSize[2]}`:''); else if (size) requirements.size=size[1].toUpperCase();
 const colour = lower.match(/\b(navy blue|dark blue|light blue|blue|black|white|red|pink|green|yellow|purple|orange|beige|brown)\b/);
 if (colour) requirements.colour=colour[1];
 const fabric = lower.match(/\b(pure cotton|100% cotton|cotton|linen|silk|rayon|viscose|georgette|chiffon)\b/);
 if (fabric) requirements.fabric=fabric[1];
 if (/\b(too expensive|cheaper|costs? too much)\b/.test(lower)&&!money)return {requirements,reply:'What maximum price would work better? For example: under ₹700.',search:false};
 const understood=Boolean(namedBrands(trimmed).length||requirements.brand!==previous.brand||requirements.pricePreference!==previous.pricePreference||money||size||shoeSize||numericSize||colour||fabric||category||audience||/\bany (colo[u]?r|fabric|material)\b/.test(lower));
 const more=/^(show (me )?more( options)?|more( options)?|try again|search again|another (set|batch))[!.\s]*$/i.test(trimmed);
 if (!understood&&!more)return {requirements,reply:'Tell me a colour, fabric, size or maximum price to change. You can also say “show more options”. Occasion and style requests aren’t understood yet.',search:false};
 if (!requirements.category) return {requirements,reply:'What clothing are you looking for: clothing, shoes or accessories?',search:false};
 if (!requirements.budget) return {requirements,reply:'What is your maximum budget in rupees? For example: under ₹1,000.',search:false};
 if (!validSize(requirements.category,requirements.size)) return {requirements,reply:sizeQuestion(requirements.category),search:false};
 const named=namedBrands(trimmed);if(named.length>1)return {requirements,reply:`Which brand should I search first: ${named.join(' or ')}?`,search:false};
 const brandPrompt=brandQuestion(requirements);if(brandPrompt)return {requirements,reply:brandPrompt,search:false};
 const query=searchTerms(requirements);
 return {requirements,reply:`I'll check Flipkart and Amazon plus the other supported fashion stores now for ${query}, under ₹${requirements.budget.toLocaleString('en-IN')}${requirements.size?`, requested size ${requirements.size}`:''}. Size availability will need checking on the store.`,search:true};
}
export function searchTerms(r:Requirements,includeSoft=true): string {
 const hard=positiveStyleTerms(r.mustHave??[]);
 // Broad search keeps every hard constraint. Style words only guide candidate retrieval.
 const soft=includeSoft&&(!r.brand||r.brand==='any')?positiveStyleTerms([r.pattern,r.fit,r.sleeve,r.length,r.style]).filter(term=>!hard.includes(term)).slice(0,2):[];
 return [...new Set([r.brand&&r.brand!=='any'?r.brand:undefined,r.colour,r.fabric,...hard,...soft,r.category,r.audience].filter(Boolean))].join(' ');
}
export function allowedProductUrl(raw:string): boolean {return Boolean(productStore(raw));}
export function matchesOption(o:Option,r:Requirements): boolean {
 if(!brandMatches(o,r.brand))return false;
 if (!allowedProductUrl(o.url)||!Number.isFinite(o.price)||o.price<=0||o.price>(r.budget??0)) return false;
 if (!r.category||!categoryPatterns[r.category]?.test(o.title))return false;
 // A dress shirt is a shirt, not a dress; a T-shirt is not a formal shirt.
 if(r.category==='dress'&&/dress shirts?|dress shoes?/i.test(o.title))return false;
 if(r.category==='shirt'&&categoryPatterns['t-shirt'].test(o.title))return false;
 if(sizeKind(r.category)==='shoe'&&/\b(t[ -]?shirts?|tees?|shirts?|hoodies?|sweatshirts?|socks?)\b/i.test(o.title))return false;
 if(r.audience&&r.audience!=='unisex'&&/\b(kids?|children|boys?|girls?|toddlers?|infants?)\b/i.test(o.title))return false;
 if(/\b(shoe cleaner|shoe rack|shoe bag|shoelaces?|insoles?|shoe polish|shoe cover)\b/i.test(o.title)&&sizeKind(r.category)==='shoe')return false;
 const audience=detectAudience(o.title);
 if(r.audience&&audience&&audience!==r.audience&&audience!=='unisex')return false;
 const evidence=[o.title,o.colour,o.fabric,...(o.attributes??[])].join(' ');
 if(r.mustHave?.some(term=>{const negative=negativeStyle(term);return negative?styleEvidence(evidence,negative):!styleEvidence(evidence,term);} ))return false;
 if(r.colour&&!o.colour.toLowerCase().includes(r.colour))return false;
 if(r.fabric){const wanted=r.fabric.toLowerCase();const actual=o.fabric.toLowerCase();if(wanted==='pure cotton'||wanted==='100% cotton'){if(!/pure cotton|100% cotton/.test(actual))return false;}else if(!actual.includes(wanted))return false;}
 return true;
}
export function optionsReply(options:Option[],r:Requirements): string {
 if (!options.length)return "I couldn't verify matching options just now. I haven't substituted sample products. Try another colour, material or budget, or say reset to start again.";
 const entries:string[]=[];let length=0;
 for(const o of options){
  const entry=`${entries.length+1}. ${o.store??'Flipkart'} · ${o.title.slice(0,100)}\n${o.priceFrom?'From ':''}₹${o.price.toLocaleString('en-IN')} · ${o.colour.slice(0,40)||'Colour not confirmed'} · ${o.fabric.slice(0,40)||'Fabric not confirmed'}\n${o.url}`;
  if(length+entry.length>2700)break;
  entries.push(entry);length+=entry.length+2;
 }
 return `Here are ${entries.length} live fashion options:\n\n`+entries.join('\n\n')+`\n\nPrices checked just now without signing in; your account or location may show a different price. Shipping and offers can change. Listing prices are starting prices; product details and variants need checking.${r.size?` Requested size ${r.size}: availability hasn't been verified.`:''} Open the store to check size, price, delivery and returns. I won't place orders.\n\nTell me what to change, or say reset.`;
}

export function allowedImageUrl(raw:unknown): raw is string {if(typeof raw!=='string')return false;try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&merchantImageHosts.includes(u.hostname)&&!u.port;}catch{return false;}}
