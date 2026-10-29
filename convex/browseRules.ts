import {v} from 'convex/values';
import {browseBrand} from './browseBrands';
import {detectAudience} from './fashionRules';
import {allowedImageUrl,type Option} from './discoveryRules';
import {productStore,type Store} from './storeConfig';
export const browseAudience=v.union(v.literal('men'),v.literal('women'),v.literal('unisex'));
export const browseSources:{key:string;store:Store;query:string;category:string;audience:'men'|'women'|'unisex';targetBrand?:string}[]=[
 {key:'myntra-tops',store:'Myntra',query:'women tops',category:'Tops',audience:'women'},
 {key:'snitch-shirts',store:'SNITCH',query:'shirts',category:'Shirts',audience:'men'},
 {key:'newme-dresses',store:'NEWME',query:'dresses',category:'Dresses',audience:'women'},
 {key:'bonkers-tees',store:'Bonkers Corner',query:'oversized t shirt',category:'T-shirts',audience:'unisex'},
 {key:'ajio-jeans',store:'AJIO',query:'women jeans',category:'Jeans',audience:'women'},
 {key:'souled-sneakers',store:'The Souled Store',query:'sneakers',category:'Sneakers',audience:'unisex'},
 {key:'hm-shirts',store:'H&M',query:'men shirts',category:'Shirts',audience:'men'},
 {key:'puma-sneakers',store:'PUMA',query:'sneakers',category:'Sneakers',audience:'unisex'},
 {key:'nike-sneakers',store:'Myntra',query:'nike sneakers',targetBrand:'Nike',category:'Sneakers',audience:'unisex'},
 {key:'adidas-sneakers',store:'Myntra',query:'adidas sneakers',targetBrand:'Adidas',category:'Sneakers',audience:'unisex'},
 {key:'levis-jeans',store:'Myntra',query:'levis jeans',targetBrand:'Levi’s',category:'Jeans',audience:'unisex'},
 {key:'mango-tops',store:'Myntra',query:'mango women tops',targetBrand:'Mango',category:'Tops',audience:'women'},
 {key:'only-jeans',store:'Myntra',query:'only women jeans',targetBrand:'ONLY',category:'Jeans',audience:'women'},
 {key:'vero-moda-dresses',store:'Myntra',query:'vero moda dresses',targetBrand:'Vero Moda',category:'Dresses',audience:'women'},
 {key:'jockey-tops',store:'Myntra',query:'jockey women tops',targetBrand:'Jockey',category:'Tops',audience:'women'},
 {key:'roadster-shirts',store:'Myntra',query:'roadster men shirts',targetBrand:'Roadster',category:'Shirts',audience:'men'},
 {key:'hrx-sneakers',store:'Myntra',query:'hrx sneakers',targetBrand:'HRX',category:'Sneakers',audience:'unisex'},
 {key:'fablestreet-tops',store:'Myntra',query:'fablestreet tops',targetBrand:'FableStreet',category:'Tops',audience:'women'},
];
export const BROWSE_LEASE_MS=12*60*1000;
export const BROWSE_FRESH_MS=6*60*60*1000;
export const BROWSE_MAX_AGE_MS=48*60*60*1000;
export function validBrowseOptions(options:Option[],store:Store,now=Date.now()){
 const seen=new Set<string>();
 return options.filter(o=>{if(productStore(o.url)!==store||!allowedImageUrl(o.imageUrl)||!Number.isFinite(o.price)||o.price<=0||o.observedAt>now+60000||now-o.observedAt>BROWSE_MAX_AGE_MS||seen.has(o.url))return false;seen.add(o.url);return true;}).slice(0,10);
}
export const catalogSourceValidator=v.object({kind:v.literal('catalog'),id:v.id('browseCatalog'),url:v.string()});

export function browseItemAudience(option:Option,fallback:'men'|'women'|'unisex'){let path='';try{path=decodeURIComponent(new URL(option.url).pathname).replace(/[-_]/g,' ');}catch{}return detectAudience(option.title+' '+path)??fallback;}

export function browseSourceOptions(options:Option[],source:typeof browseSources[number],now=Date.now()){
 return validBrowseOptions(options,source.store,now).flatMap(option=>{
  const brand=browseBrand(option);if(source.targetBrand&&brand!==source.targetBrand)return [];
  const {brand:unused,...facts}=option;return [{...facts,store:source.store,...(brand?{brand}:{})}];
 });
}
