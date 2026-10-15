import {load} from 'cheerio';
import {allowedImageUrl,matchesOption,type Option,type Requirements} from './discoveryRules';
import {productStore,storeConfig,type Store} from './storeConfig';

// Parse JSON only. Never execute a merchant's scripts to get its public page state.
export function jsonAssignment(html:string,name:string):any{
 const $=load(html);for(const el of $('script').toArray()){
  const text=$(el).text(),match=new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*=\\s*').exec(text);if(!match)continue;
  const start=match.index+match[0].length;if(text[start]!=='{')continue;
  let depth=0,quoted=false,escaped=false;
  for(let i=start;i<text.length;i++){const c=text[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){try{return JSON.parse(text.slice(start,i+1));}catch{break;}}}
 }return null;
}
function nextData(html:string){try{return JSON.parse(load(html)('#__NEXT_DATA__').text());}catch{return null;}}
function asText(value:unknown){return typeof value==='string'?value:'';}
function image(raw:unknown){if(typeof raw!=='string')return undefined;const url=raw.startsWith('//')?'https:'+raw:raw.replace(/^http:\/\//,'https://');return allowedImageUrl(url)?url:undefined;}
function colour(text:string){return text.match(/\b(navy blue|dark blue|light blue|blue|black|white|red|pink|green|yellow|purple|orange|beige|brown|grey|gray)\b/i)?.[0]??'';}
function fabric(text:string){return text.match(/\b(pure cotton|100% cotton|cotton blend|cotton|linen|silk|rayon|viscose|georgette|chiffon|leather|suede|mesh|canvas)\b/i)?.[0]??'';}
export function retailOptions(store:Store,html:string,r:Requirements,observedAt:number,excludeUrls:string[]=[]):{options:Option[];readable:boolean}{
 const options:Option[]=[];let products:any[]|undefined;
 const add=(p:{title:string;url:string;price:unknown;colour?:string;fabric?:string;image?:unknown;brand?:string;attributes?:string[]})=>{
  const price=typeof p.price==='number'?p.price:typeof p.price==='string'&&/^\d+(?:\.\d{1,2})?$/.test(p.price)?Number(p.price):NaN;
  let url;try{url=new URL(p.url,storeConfig[store].origin);url.search='';url.hash='';}catch{return;}
  if(productStore(url.href)!==store||!p.title||!Number.isFinite(price)||price<=0)return;
  const imageUrl=image(p.image);
  const option:Option={title:p.title.slice(0,200),url:url.href,price,colour:(p.colour||colour(p.title)).slice(0,80),fabric:(p.fabric||fabric(p.title)).slice(0,80),store,source:'listing',priceFrom:true,observedAt,...(imageUrl?{imageUrl}:{}),...(p.brand?{brand:p.brand.slice(0,80)}:{}),...(p.attributes?{attributes:p.attributes.slice(0,15)}:{})};
  if(!excludeUrls.includes(option.url)&&matchesOption(option,r)&&!options.some(o=>o.url===option.url))options.push(option);
 };
 if(store==='Myntra'){
  products=jsonAssignment(html,'window.__myx')?.searchData?.results?.products;
  if(Array.isArray(products))for(const p of products.slice(0,60)){
   if(p.inventoryInfo?.length&&p.inventoryInfo.every((i:any)=>i.available===false))continue;
   add({title:[p.gender,p.productName].filter(Boolean).join(' '),url:p.landingPageUrl,price:p.price,colour:p.primaryColour,image:p.searchImage,brand:p.brand});
  }
 }else if(store==='AJIO'){
  const state=jsonAssignment(html,'window.__PRELOADED_STATE__');
  if(state?.grid?.entities&&typeof state.grid.entities==='object')products=Object.values(state.grid.entities);
  if(Array.isArray(products))for(const p of products.slice(0,60)){
   if(p.price?.currencyIso!=='INR')continue;
   add({title:[p.segmentNameText,p.fnlColorVariantData?.brandName,p.name].filter(Boolean).join(' '),url:p.url,price:p.price.value,image:p.fnlColorVariantData?.outfitPictureURL,brand:p.fnlColorVariantData?.brandName});
  }
 }else if(store==='Bewakoof'){
  products=nextData(html)?.props?.pageProps?.data?.products;
  if(Array.isArray(products))for(const p of products.slice(0,60)){
   if(p.active===false||p.stock_status===false||p.in_stock===0)continue;
   const attrs=p.product_attributes??{};
   add({title:asText(p.name)||asText(p.title),url:'/p/'+(p.productUrl||p.url),price:p.sellingPrice??p.price,colour:Array.isArray(p.color)?p.color.join(', '):asText(attrs.color),fabric:asText(attrs.fabric),image:p.productImage,brand:asText(p.brand),attributes:['fit','design','sleeve','occasion','type'].filter(k=>typeof attrs[k]==='string').map(k=>`${k}: ${attrs[k]}`)});
  }
 }else if(store==='NEWME'){
  products=nextData(html)?.props?.pageProps?.productsData?.data?.products;
  if(Array.isArray(products))for(const p of products.slice(0,60)){
   // Public web variant sale price, never the app/member/coupon “best price”.
   const prices=Array.isArray(p.variations)?p.variations.filter((v:any)=>v.stock_status==='instock').map((v:any)=>Number(v.sale_price)).filter((n:number)=>Number.isFinite(n)&&n>0):[];
   if(!prices.length||p.post_status==='trash')continue;
   add({title:'Women '+asText(p.name),url:'/product/'+p.slug,price:Math.min(...prices),fabric:asText(p.fabric_quality),image:p.image_url});
  }
 }else if(store==='Bonkers Corner'){
  let data;try{data=JSON.parse(html);}catch{/* An HTML challenge is not product data. */}
  products=data?.resources?.results?.products;
  if(Array.isArray(products))for(const p of products.slice(0,20)){
   if(p.available!==true)continue;
   const text=load(asText(p.body)).text();const gender=Array.isArray(p.tags)?p.tags.filter((t:string)=>/^(men|women|unisex)$/i.test(t)).join(' '):'';
   add({title:[gender,p.title].filter(Boolean).join(' '),url:p.url,price:p.price,colour:text.match(/Colou?r:\s*([^\n]+)/i)?.[1]?.split(/Country|Wash care|Sizing/)[0]?.trim().slice(0,60),fabric:fabric(text),image:p.image,brand:p.vendor});
  }
 }else{
  // JS-only stores can later expose structured product lists. Without readable
  // product evidence, report unavailable instead of turning a shell into no stock.
  const $=load(html);for(const el of $('script[type="application/ld+json"]').toArray()){
   let data;try{data=JSON.parse($(el).text());}catch{continue;}
   const records=(Array.isArray(data)?data:[data]).flatMap((x:any)=>x?.['@graph']??[x]);
   for(const record of records){if(record?.['@type']!=='ItemList')continue;products=record.itemListElement;
    if(Array.isArray(products))for(const entry of products.slice(0,48)){const p=entry.item??entry;const offer=Array.isArray(p.offers)?p.offers[0]:p.offers;if(offer?.priceCurrency!=='INR'||(offer.availability&&!String(offer.availability).endsWith('/InStock')))continue;add({title:asText(p.name),url:asText(p.url),price:offer.price,colour:asText(p.color),image:Array.isArray(p.image)?p.image[0]:p.image});}
   }
  }
 }
 return {options:options.slice(0,24),readable:Array.isArray(products)};
}
