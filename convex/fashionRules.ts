// Shared vocabulary for conversation, search, price checks and daily picks.
export const fashionCategories = ['hoodie','sweatshirt','cardigan','blazer','coat','suit','co-ord','jumpsuit','leggings','joggers','tracksuit','kurta-set','lehenga','salwar','sleepwear','activewear','socks','flats','kurta','dress','top','saree','shirt','t-shirt','jeans','trousers','shorts','skirt','jacket','sweater','shoes','sneakers','boots','loafers','heels','sandals','bag','belt','watch','sunglasses'] as const;
export const categoryPatterns: Record<string,RegExp> = {
 hoodie:/\bhoodies?\b/i, sweatshirt:/\bsweatshirts?\b/i, cardigan:/\bcardigans?\b/i,
 blazer:/\bblazers?\b/i, coat:/\bcoats?\b/i, suit:/\bsuits?\b/i,
 'co-ord':/\b(co[ -]?ords?|coordinated sets?)\b/i,jumpsuit:/\b(jumpsuits?|playsuits?|rompers?)\b/i,
 leggings:/\b(leggings?|tights?)\b/i,joggers:/\b(joggers?|track pants?|sweatpants?)\b/i,tracksuit:/\btracksuits?\b/i,
 'kurta-set':/\b(kurta|kurti)\b.*\b(set|sets)\b/i,lehenga:/\b(lehengas?|lenghas?)\b/i,salwar:/\b(salwars?|sharara|palazzo)\b/i,
 sleepwear:/\b(sleepwear|nightwear|pyjamas?|pajamas?|night suits?)\b/i,activewear:/\b(activewear|sportswear|gym wear|workout wear)\b/i,
 socks:/\bsocks?\b/i,flats:/\b(flats|ballerinas?|ballet flats|juttis?|mojaris?)\b/i,
 kurta:/\b(kurta|kurtas|kurti|kurtis)\b|कुर्ता|कुर्ती/i,
 saree:/\b(saree|sarees|sari|saris)\b|साड़ी/i,
 't-shirt':/\b(t[ -]?shirts?|tees?|polo)\b/i,
 shirt:/\bshirts?\b/i, jeans:/\bjeans?|denim pants?\b/i,
 trousers:/\b(trousers?|pants?|chinos?)\b/i,shorts:/\bshorts\b/i,
 skirt:/\bskirts?\b/i,jacket:/\b(jackets?|blazers?|coats?)\b/i,
 sweater:/\b(sweaters?|sweatshirts?|hoodies?|cardigans?)\b/i,
 sneakers:/\b(sneakers?|trainers?)\b/i,boots:/\bboots?\b/i,loafers:/\bloafers?\b/i,heels:/\bheels?\b/i,
 shoes:/\b(shoes?|sneakers?|trainers?|loafers?|boots?|heels?)\b/i,
 sandals:/\b(sandals?|slippers?|flip flops?)\b/i,
 bag:/\b(bags?|handbags?|backpacks?|totes?|clutches?)\b/i,
 belt:/\bbelts?\b/i,watch:/\b(watch|watches)\b/i,sunglasses:/\b(sunglasses|shades)\b/i,
 dress:/\b(dress|dresses|gowns?)\b|ड्रेस/i,top:/\b(tops?|tunics?|blouses?)\b/i,
};
export function detectCategory(text:string){return [...new Set(['sleepwear','salwar','kurta-set','tracksuit',...Object.keys(categoryPatterns)])].find(c=>categoryPatterns[c].test(text));}
export function sizeKind(category?:string){return ['shoes','sneakers','boots','loafers','heels','sandals','flats'].includes(category??'')?'shoe':['saree','bag','watch','sunglasses'].includes(category??'')?'none':['jeans','trousers','shorts','belt','joggers','leggings'].includes(category??'')?'waist':'clothing';}
export function validSize(category:string|undefined,size?:string){if(sizeKind(category)==='none')return true;if(!size)return false;return sizeKind(category)==='shoe'?/^(UK|US|EU)\s*\d{1,2}(?:\.5)?$/i.test(size):sizeKind(category)==='waist'?/^(?:XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|[2-4]XL|(?:waist\s*)?\d{2}(?:\s*(?:in|inches|cm))?)$/i.test(size):/^(?:XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|[2-4]XL|\d{2})$/i.test(size);}
export function sizeQuestion(category?:string){return sizeKind(category)==='shoe'?'What shoe size and system do you wear—for example UK 8, US 9 or EU 42?':sizeKind(category)==='waist'?'What waist size should I look for—for example 32 inches or M?':'What clothing size should I look for—for example M, XL or 40?';}
export function detectAudience(text:string):'men'|'women'|'unisex'|undefined{return /\bunisex\b/i.test(text)?'unisex':/\b(women|woman|womens|women’s|ladies|female)\b/i.test(text)?'women':/\b(men|man|mens|men’s|male)\b/i.test(text)?'men':undefined;}

export function requestedAudience(text:string):ReturnType<typeof detectAudience>{
 if(/\bfor (?:my |a |the )?(wife|girlfriend|mother|mum|mom|sister|daughter)\b/i.test(text))return 'women';
 if(/\bfor (?:my |a |the )?(husband|boyfriend|father|dad|brother|son)\b/i.test(text))return 'men';
 return detectAudience(text);
}
