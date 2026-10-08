import {load} from 'cheerio';
import {allowedImageUrl,allowedProductUrl,matchesOption,type Option,type Requirements} from './discoveryRules';

// Amazon search cards keep each title, link and price inside one result row.
// Missing prices or access-challenge pages produce no invented options.
export function amazonOptions(html:string,r:Requirements,observedAt:number,excludeUrls:string[]=[],limit=3):Option[]{
 const $=load(html),options:Option[]=[];
 $('[data-component-type="s-search-result"]').each((_i,el)=>{
  const row=$(el),asin=row.attr('data-asin');if(!asin||!/^[A-Z0-9]{10}$/.test(asin))return;
  const title=row.find('h2').map((_i,h)=>$(h).text().trim()).get().sort((a,b)=>b.length-a.length)[0]??'';
  const rawPrice=row.find('.a-price:not(.a-text-price) .a-offscreen').first().text().trim();
  if(!/^₹\s*[\d,]+(?:\.\d{1,2})?$/.test(rawPrice))return;
  const price=Number(rawPrice.slice(1).replaceAll(',',''));
  const text=title.toLowerCase(),colour=text.match(/\b(navy blue|dark blue|light blue|blue|black|white|red|pink|green|yellow|purple|orange|beige|brown)\b/)?.[0]??'';
  const fabric=text.match(/\b(pure cotton|100% cotton|cotton blend|cotton|linen|silk|rayon|viscose|georgette|chiffon)\b/)?.[0]??'';
  const image=row.find('img.s-image').first().attr('src');
  const option:Option={...(allowedImageUrl(image)?{imageUrl:image}:{}),title:title.slice(0,200),url:`https://www.amazon.in/dp/${asin}`,price,colour,fabric,observedAt,store:'Amazon',source:'listing',priceFrom:true};
  if(!excludeUrls.includes(option.url)&&matchesOption(option,r)&&!options.some(x=>x.url===option.url))options.push(option);
 });
 return options.sort((a,b)=>a.price-b.price).slice(0,limit);
}
export function meeshoOptions(data:unknown,r:Requirements,observedAt:number):Option[]{
 if(!data||typeof data!=='object'||!Array.isArray((data as any).catalogs))throw new Error('No readable Meesho search');
 const options:Option[]=[];
 for(const c of (data as any).catalogs.slice(0,24)){
  if(c.valid!==true||c.pre_booking===true||typeof c.hero_product_name!=='string'||!c.hero_pid||c.original_product_id!==c.hero_pid||typeof c.slug!=='string'||typeof c.product_id!=='string'||!/^[-a-z0-9]+$/.test(c.slug)||!/^[a-z0-9]+$/.test(c.product_id))continue;
  const url=`https://www.meesho.com/${c.slug}/p/${c.product_id}`;if(!allowedProductUrl(url))continue;
  // Catalogues may contain multiple products. Use the price for this exact hero
  // product, not min_catalog_price or a discounted offer for a different variant.
  const pricing=c.app_event_data?.competitive_pricing;
  if(pricing?.input_product_id!==c.hero_pid||typeof pricing.input_product_price!=='number')continue;
  const details=typeof c.full_details==='string'?c.full_details:'';
  const attributes=Array.isArray(c.product_attributes)?c.product_attributes.filter((x:unknown)=>typeof x==='string').join('\n'):'';
  const spec=(key:string)=>(details+'\n'+attributes).match(new RegExp(`(?:^|\\n)(?:Kurta |Top |Dress |Saree )?${key}\\s*:\\s*([^\\n]+)`,'i'))?.[1]?.trim()??'';
  const title=c.hero_product_name.slice(0,200),colour=spec('Color')||spec('Colour')||title.toLowerCase().match(/\b(navy blue|dark blue|light blue|blue|black|white|red|pink|green|yellow|purple|orange|beige|brown)\b/)?.[0]||'';
  const option:Option={title,url,price:pricing.input_product_price,colour,fabric:spec('Fabric').slice(0,80),observedAt,store:'Meesho',source:'listing',priceFrom:true};
  if(matchesOption(option,r)&&!options.some(x=>x.url===url))options.push(option);
 }
 return options.sort((a,b)=>a.price-b.price).slice(0,3);
}
