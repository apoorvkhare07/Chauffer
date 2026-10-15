import {load} from 'cheerio';
import {detectAudience} from './fashionRules';
import {storeConfig,productStore,type Store} from './storeConfig';
import {allowedImageUrl,matchesOption,type Option,type Requirements} from './discoveryRules';
import {comparePrices} from './discoveryPolicy';
const text=(v:unknown):string=>typeof v==='string'?v:'';
const colour=(s:string)=>s.match(/\b(navy blue|dark blue|light blue|black|white|blue|grey|gray|red|pink|green|beige|brown|yellow|purple|orange)\b/i)?.[0]??'';
const fabric=(s:string)=>s.match(/\b(pure cotton|100% cotton|cotton blend|cotton|linen|silk|rayon|viscose|leather|suede|mesh|canvas|polyester)\b/i)?.[0]??'';
function json(s:string){try{return JSON.parse(s);}catch{return null;}}
function tagAudience(tags:unknown){
 const values=Array.isArray(tags)?tags.filter(t=>typeof t==='string'):[];
 // Only this product's tags, never navigation or recommendations.
 const women=values.some(t=>/(?:^|[^a-z])women(?:s)?(?:[^a-z]|$)/i.test(t));
 const men=values.some(t=>/(?:^|[^a-z])men(?:s)?(?:[^a-z]|$)/i.test(t));
 if(values.some(t=>/\b(kids?|boys?|girls?|toddlers?)\b/i.test(t)))return 'Kids';
 return women&&men?'Unisex':women?'Women':men?'Men':'';
}
export function expandedRetailOptions(store:Store,body:string,r:Requirements,observedAt:number,excludeUrls:string[]=[]):{options:Option[];readable:boolean}{
 const $=load(body),options:Option[]=[];let products:any[]|undefined;
 const add=(p:{title:string;url:unknown;price:unknown;colour?:string;fabric?:string;image?:unknown;brand?:string;attributes?:string[]})=>{
  let url:URL;try{url=new URL(text(p.url),storeConfig[store].origin);}catch{return;}
  if(productStore(url.href)!==store)return;
  // PUMA's swatch identifies the priced colour. Remove tracking, keep that choice.
  const uniqloColour=store==='Uniqlo'?url.searchParams.get('colorDisplayCode'):null;const swatch=store==='PUMA'?url.searchParams.get('swatch'):null;url.search='';url.hash='';if(swatch&&/^\d{2}$/.test(swatch))url.searchParams.set('swatch',swatch);if(uniqloColour&&/^\d{2}$/.test(uniqloColour))url.searchParams.set('colorDisplayCode',uniqloColour);
  const price=typeof p.price==='number'?p.price:/^\d+(?:\.\d{1,2})?$/.test(text(p.price))?Number(p.price):NaN;
  if(!p.title||!Number.isFinite(price)||price<=0)return;
  if(['Nykaa Fashion','Tata CLiQ'].includes(store)&&r.audience&&r.audience!=='unisex'&&!detectAudience(p.title))return;
  const rawImage=text(p.image),image=rawImage.startsWith('//')?'https:'+rawImage:rawImage;
  const option:Option={store,title:p.title.slice(0,200),url:url.href,price,colour:(p.colour??colour(p.title)).slice(0,80),fabric:(p.fabric??fabric(p.title)).slice(0,80),observedAt,source:'listing',priceFrom:true,...(allowedImageUrl(image)?{imageUrl:image}:{}),...(p.brand?{brand:p.brand.slice(0,80)}:{}),...(p.attributes?{attributes:p.attributes.slice(0,15)}:{})};
  if(!excludeUrls.includes(option.url)&&matchesOption(option,r)&&!options.some(o=>o.url===option.url))options.push(option);
 };
 const next=json($('#__NEXT_DATA__').text());
 if(['FREAKINS','Off Duty','Superkicks'].includes(store)){
  products=json(body)?.resources?.results?.products;
  if(Array.isArray(products))for(const p of products.slice(0,10)){
   if(p.available!==true)continue;
   const description=load(text(p.body)).text();
   add({title:[tagAudience(p.tags),p.title,p.type].filter(Boolean).join(' '),url:p.url,price:p.price,brand:text(p.vendor),image:p.image,fabric:fabric(description)||undefined});
  }
 }else if(store==='Nykaa Fashion'){
  products=json($('#__PRELOADED_STATE__').text())?.listingV2?.products;
  if(Array.isArray(products))for(const p of products.slice(0,48)){
   if(p.isOutOfStock!==0&&p.isOutOfStock!==false)continue;
   const ownColour=p.plp_pdp_bridge?.siblings_colour?.find((c:any)=>c.action_url===p.actionUrl)?.color_name;
   add({title:[p.title,p.subTitle].filter(Boolean).join(' '),url:p.actionUrl,price:p.discountedPrice,brand:text(p.title),image:p.imageUrl,colour:typeof ownColour==='string'?ownColour:undefined});
  }
 }else if(store==='H&M'){
  const props=next?.props?.pageProps;products=props?.srpProps?.hits;
  if(Array.isArray(products))for(const p of products.slice(0,48)){
   if(p.isOutOfStock!==false||p.isComingSoon===true||p.locale!=='en_in')continue;
   const publicPrices=Array.isArray(p.prices)?p.prices.filter((v:any)=>['redPrice','whitePrice'].includes(v.priceType)&&typeof v.price==='number'&&v.price>0):[];
   if(!publicPrices.length)continue;
   const audience=/^(ladies|women)/i.test(p.category)?'Women':/^men(?:_|$)/i.test(p.category)?'Men':/^(kids|baby|boy|girl)/i.test(p.category)?'Kids':'';
   const ownColour=p.swatches?.find((c:any)=>c.colorLink===p.pdpUrl)?.colorName;
   add({title:[audience,p.title].filter(Boolean).join(' '),url:p.pdpUrl,price:Math.min(...publicPrices.map((v:any)=>v.price)),brand:text(p.brandName),image:p.imageProductSrc,colour:typeof ownColour==='string'?ownColour:undefined});
  }
 }else if(store==='PUMA'){
  const states=next?.props?.country==='IN'?next?.props?.urqlState:null;
  const result=states&&Object.values(states).map((s:any)=>typeof s.data==='string'?json(s.data):s.data).find((s:any)=>s?.searchProducts)?.searchProducts;
  products=result?.itemsSection?.items;
  if(Array.isArray(products))for(const item of products.slice(0,48)){
   const hit=item.productSearchHit,p=hit?.variantProduct;
   if(p?.orderable!==true||p.isAppExclusive===true)continue;
   const link=$('a[href*="/pd/"]').toArray().map(a=>$(a).attr('href')!).find(raw=>{try{const u=new URL(raw,storeConfig.PUMA.origin);return u.pathname.endsWith('/'+hit.id)&&u.searchParams.get('swatch')===hit.color;}catch{return false;}});
   if(!link)continue;
   const price=p.productPrice;add({title:text(p.name),url:link,price:!price?.isSalePriceElapsed&&price?.salePrice>0?price.salePrice:price?.price,colour:text(p.colorName),brand:text(hit.masterProduct?.brand)||'PUMA',image:p.preview});
  }
 }else if(store==='Tata CLiQ'){
  const data=json(body);products=data?.status==='Error'?undefined:data?.searchresult;
  if(Array.isArray(products))for(const p of products.slice(0,40)){
   if(p.inStockFlag!==true||p.price?.sellingPrice?.currencyIso!=='INR')continue;
   add({title:text(p.productname),url:p.webURL,price:p.price.sellingPrice.doubleValue,colour:text(p.productColor)||undefined,brand:text(p.brandname),image:p.imageURL});
  }
 }else if(store==='Westside'){
  const data=json(body);products=data?.statusCode===200?data?.payload?.result:undefined;
  if(Array.isArray(products))for(const p of products.slice(0,24)){
   if(p.inStock!==true)continue;
   let url:URL;try{url=new URL(p.url);if(!['checkout.westside.com','www.westside.com'].includes(url.hostname)||url.protocol!=='https:')continue;url.hostname='www.westside.com';}catch{continue;}
   const attrs=Array.isArray(p.attributes)?p.attributes:[];
   // Only row attributes belong to this priced variant; ignore other colour options.
   add({title:[p.gender,p.name].filter(Boolean).join(' '),url:url.href,price:p.sellingPrice,brand:text(p.brand),image:p.mainImage,fabric:fabric(attrs.map((a:any)=>text(a.value)).join(' '))||undefined});
  }
 }else if(store==='VegNonVeg'){
  const cards=$('a.gt-product-click[href*="/products/"]');
  const categories=new Map<string,string>();for(const el of $('script').toArray()){const data=json($(el).text().match(/var products\s*=\s*(\[[^;]+\])\s*;/)?.[1]??'');if(Array.isArray(data))for(const p of data)if(Array.isArray(p.category))categories.set(String(p.id),p.category.filter((v:unknown)=>typeof v==='string').join(' '));}
  if(cards.length||/no (?:products|results) found/i.test($('main').text()))products=[];
  cards.slice(0,24).each((_,el)=>{
   const row=$(el),data=json(row.attr('data-product')??'');if(!data)return;
   const name=row.find('.p-name').text().trim();if(/\b(TD|PS|GS)\b|kids?|toddlers?/i.test(name))return;
   const brand=row.find('.info p').first().text().trim();
   const rowText=row.find('.info').text().replace(/\s+/g,' '),matches=[...rowText.matchAll(/₹\s*([\d,]+(?:\.\d{1,2})?)/g)];
   const values=matches.map(m=>Number(m[1].replaceAll(',',''))).filter(n=>n>0);
   if(!values.length||/sold out|out of stock/i.test(rowText))return;
   // No guessed model-to-category mapping: a title must actually match the requested item.
   add({title:[brand,name,categories.get(String(data.id))].filter(Boolean).join(' '),url:row.attr('href'),price:Math.min(...values),image:row.find('img').first().attr('data-src')||row.find('img').first().attr('src'),brand});
  });
 }else if(store==='Uniqlo'){
  // Search grid only: exclude the unrelated Best Sellers carousel.
  const cards=$('.fr-ec-product-collection--type-grid a.product-tile__link');
  if(cards.length)products=[];
  cards.slice(0,48).each((_,el)=>{const row=$(el),label=row.attr('aria-label')??'',price=label.match(/\bRs\.\s*([\d,]+\.\d{2})/i),content=row.find('.product-tile__content-area');if(!price||/out of stock|sold out/i.test(content.text()))return;
   const audience=content.children().first().text().trim().split(',')[0];
   add({title:[/\bunisex\b/i.test(label)?'Unisex':audience,row.find('h2').text().trim()].filter(Boolean).join(' '),url:row.attr('href'),price:Number(price[1].replaceAll(',','')),image:row.find('img').first().attr('src'),brand:'Uniqlo'});
  });
  // A readable structured catalogue can also be used; a denied/JS-only shell cannot.
  for(const el of $('script[type="application/ld+json"]').toArray()){
   const data=json($(el).text());for(const list of (Array.isArray(data)?data:[data])){
    if(list?.['@type']!=='ItemList'||!Array.isArray(list.itemListElement))continue;products=list.itemListElement;
    for(const entry of products!.slice(0,24)){const p=entry.item??entry,o=p.offers;if(o?.priceCurrency==='INR'&&String(o.availability).endsWith('/InStock'))add({title:text(p.name),url:p.url,price:o.price,image:p.image,colour:text(p.color)||undefined});}
   }
  }
 }
 return {options:options.sort((a,b)=>comparePrices(a.price,b.price,r)).slice(0,24),readable:Array.isArray(products)};
}
