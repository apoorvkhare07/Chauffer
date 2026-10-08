import { v } from 'convex/values';

export const requirementsValidator = v.object({
 category: v.optional(v.string()), budget: v.optional(v.number()), size: v.optional(v.string()),
 colour: v.optional(v.string()), fabric: v.optional(v.string()),
});
export type Requirements = {category?: string; budget?: number; size?: string; colour?: string; fabric?: string};
export const optionValidator = v.object({title:v.string(), url:v.string(), price:v.number(), colour:v.string(), fabric:v.string(), observedAt:v.number(), store:v.optional(v.union(v.literal('Flipkart'),v.literal('Amazon'),v.literal('Meesho'))), source:v.optional(v.union(v.literal('product'),v.literal('listing'))), priceFrom:v.optional(v.boolean())});
export type Option = {title:string; url:string; price:number; colour:string; fabric:string; observedAt:number; store?:'Flipkart'|'Amazon'|'Meesho'; source?:'product'|'listing'; priceFrom?:boolean};

export function nextRequest(text: string, previous: Requirements = {}): {requirements:Requirements; reply:string; search:boolean} {
 const trimmed = text.trim().slice(0,1000), lower = trimmed.toLowerCase();
 if (/^(hi|hello|hey|namaste|start|reset)[!.\s]*$/i.test(trimmed)) return {requirements:{},reply:"Hi! I'm Chauffeur. I can find live clothing options, but can't buy anything. What are you looking for: a kurta, dress, top or saree?",search:false};
 if (/\b(checkout|buy it|place.*order|payment)\b/i.test(trimmed)) return {requirements:previous,reply:"This test version only finds clothing options. You can open a product link to shop on the store yourself.",search:false};
 if (/^(thanks|thank you|thankyou)[!.\s]*$/i.test(trimmed))return {requirements:previous,reply:'You’re welcome! Tell me what to change, or say reset for a new search.',search:false};
 const requirements = {...previous};
 if (/\b(any|no preference for) colo[u]?r\b/.test(lower))delete requirements.colour;
 if (/\b(any|no preference for) (fabric|material)\b/.test(lower))delete requirements.fabric;
 const categories: [RegExp,string][] = [[/\b(kurta|kurtas|kurti|kurtis)\b|कुर्ता|कुर्ती/,'kurta'],[/\b(dress|dresses)\b|ड्रेस/,'dress'],[/\b(top|tops)\b/,'top'],[/\b(saree|sarees|sari|saris)\b|साड़ी/,'saree']];
 for (const [pattern,category] of categories) if (pattern.test(lower)) {requirements.category=category;break;}
 const money = lower.match(/(?:under|below|budget|upto|up to|less than|within|₹|rs\.?|inr|तक)\s*(?:₹|rs\.?)?\s*([\d,]+(?:\.\d{1,2})?)\s*(k)?\b/) ?? (/^\s*\d[\d,]*(?:\.\d{1,2})?\s*k?\s*$/.test(lower)?lower.match(/([\d,]+(?:\.\d{1,2})?)\s*(k)?/):null);
 if (money) {const budget=Number(money[1].replaceAll(',',''))*(money[2]?1000:1);if (budget>=100&&budget<=50000) requirements.budget=budget;else return {requirements,reply:'Please give a budget between ₹100 and ₹50,000.',search:false};}
 const size = trimmed.match(/\b(?:size\s*[:=-]?\s*)(XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|[2-4]XL)\b/i) ?? trimmed.match(/\b(XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|[2-4]XL)\b/i);
 if (size) requirements.size=size[1].toUpperCase();
 const colour = lower.match(/\b(navy blue|dark blue|light blue|blue|black|white|red|pink|green|yellow|purple|orange|beige|brown)\b/);
 if (colour) requirements.colour=colour[1];
 const fabric = lower.match(/\b(pure cotton|100% cotton|cotton|linen|silk|rayon|viscose|georgette|chiffon)\b/);
 if (fabric) requirements.fabric=fabric[1];
 if (!requirements.category) return {requirements,reply:'What clothing are you looking for: a kurta, dress, top or saree?',search:false};
 if (!requirements.budget) return {requirements,reply:'What is your maximum budget in rupees? For example: under ₹1,000.',search:false};
 if (!requirements.size && requirements.category!=='saree') return {requirements,reply:'What size do you wear? For example: M or XL.',search:false};
 const query=searchTerms(requirements);
 return {requirements,reply:`I'll check Flipkart, Amazon and Meesho now for ${query}, under ₹${requirements.budget.toLocaleString('en-IN')}${requirements.size?`, requested size ${requirements.size}`:''}. Size availability will need checking on the store.`,search:true};
}
export function searchTerms(r:Requirements): string {return [r.colour,r.fabric,r.category,'women'].filter(Boolean).join(' ');}
export function allowedProductUrl(raw:string): boolean {try {const u=new URL(raw);return u.protocol==='https:'&&((u.hostname==='www.flipkart.com'&&u.pathname.includes('/p/'))||(u.hostname==='www.meesho.com'&&/^\/[^/]+\/p\/[a-z0-9]+\/?$/.test(u.pathname))||(u.hostname==='www.amazon.in'&&/\/(?:dp|gp\/product)\/[A-Z0-9]{10}(?:\/|$)/.test(u.pathname)))&&!u.username&&!u.password;}catch{return false;}}
export function matchesOption(o:Option,r:Requirements): boolean {
 if (!allowedProductUrl(o.url)||!Number.isFinite(o.price)||o.price<=0||o.price>(r.budget??0)) return false;
 const category=r.category==='top'?/\b(top|tops|tunic|tunics)\b/:r.category==='dress'?/\b(dress|dresses)\b/:r.category==='saree'?/\b(saree|sari)\b/:/\b(kurta|kurtas|kurti|kurtis)\b/;
 if (!category.test(o.title.toLowerCase()))return false;
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
 return `Here are ${entries.length} live clothing options:\n\n`+entries.join('\n\n')+`\n\nPrices checked just now without signing in; your account or location may show a different price. Shipping and offers can change. Listing prices are starting prices; product details and variants need checking.${r.size?` Requested size ${r.size}: availability hasn't been verified.`:''} Open the store to check size, price, delivery and returns. I won't place orders.\n\nTell me what to change, or say reset.`;
}
