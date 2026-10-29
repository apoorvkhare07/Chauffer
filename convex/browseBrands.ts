import type {Option} from './discoveryRules';
import {productStore,stores,type Store} from './storeConfig';

// Stable navigation choices; availability only changes products, never these icons.
export const featuredBrowseBrands=['H&M','Nike','Adidas','PUMA','Jockey','Levi’s','Mango','ONLY','Vero Moda','SNITCH','NEWME','The Souled Store','Roadster','HRX','Bonkers Corner','FableStreet'] as const;

// A store sells the item; a brand makes it. Only these shops carry their own label.
const ownLabels:Partial<Record<Store,string>>={SNITCH:'SNITCH',NEWME:'NEWME',PUMA:'PUMA','H&M':'H&M',Uniqlo:'Uniqlo','The Souled Store':'The Souled Store','Bonkers Corner':'Bonkers Corner',Bewakoof:'Bewakoof',FREAKINS:'FREAKINS','Off Duty':'Off Duty'};
const labels=['Nike','Adidas','PUMA',"Levi’s",'Mango','ONLY','Vero Moda','Roadster','HRX','HIGHLANDER','DressBerry','Tokyo Talkies','SASSAFRAS','HERE&NOW','FableStreet','Jockey','Decathlon','Reebok','ASICS','Skechers','Converse','Vans','Zara','Wrangler',...Object.values(ownLabels)];
const key=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]/g,'');
const canonical=new Map(labels.map(name=>[key(name),name]));
canonical.set('levis','Levi’s');canonical.set('handm','H&M');canonical.set('hm','H&M');canonical.set('hrxbyhrithikroshan','HRX');canonical.set('adidasoriginals','Adidas');
const marketplaces=new Set(stores.filter(store=>!ownLabels[store]).map(key));
export function cleanBrowseBrand(raw?:string):string|null{
 if(!raw)return null;const name=raw.replace(/\+/g,' ').replace(/\s+/g,' ').trim();
 if(!name||name.length>60||!/[a-z]/i.test(name)||/[<>/\\@]/.test(name)||marketplaces.has(key(name))||/^(unknown|unbranded|generic|no brand|brand|n\/?a|none|men|women|unisex)$/i.test(name))return null;
 return canonical.get(key(name))??name.toLowerCase().replace(/\b\p{L}/gu,c=>c.toUpperCase());
}
export function browseBrand(option:Option):string|null{
 const store=productStore(option.url);if(!store)return null;
 const declared=cleanBrowseBrand(option.brand);if(declared)return declared;
 if(ownLabels[store])return ownLabels[store]!;
 let path='';try{path=decodeURIComponent(new URL(option.url).pathname);}catch{return null;}
 // Myntra product URLs explicitly separate category / brand / product / id / buy.
 // Search terms and query parameters never supply a brand.
 const parts=path.split('/').filter(Boolean);
 if(store==='Myntra'&&parts.length===5&&parts[4]==='buy'&&/^\d+$/.test(parts[3])){
  const fromPath=cleanBrowseBrand(parts[1].replace(/-/g,' '));if(fromPath)return fromPath;
 }
 const facts=(option.title+' '+path.replace(/[-_/]/g,' '));
 if(/\b(inspired|style of|lookalike|replica)\b/i.test(facts))return null;
 const found=labels.filter(name=>name!=='ONLY'&&new RegExp(`(?:^|[^a-z])${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?:$|[^a-z])`,'i').test(facts));
 const unique=[...new Set(found)];return unique.length===1?unique[0]:null;
}
