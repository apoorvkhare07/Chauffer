import {load} from 'cheerio';
import {allowedImageUrl,matchesOption,type Option,type Requirements} from './discoveryRules';
import {productStore,storeConfig,type Store} from './storeConfig';
import {retailOptions} from './retailExtractors';
import {amazonOptions} from './storeExtractors';
function canonical(raw:string,store:Store){try{const url=new URL(raw,storeConfig[store].origin);if(productStore(url.href)!==store)return;const pid=store==='Flipkart'?url.searchParams.get('pid'):null;url.search='';url.hash='';if(pid&&/^[A-Z0-9]{8,30}$/.test(pid))url.searchParams.set('pid',pid);return url.href;}catch{return;}}
const rupees=(text:string)=>/^₹\s*[\d,]+(?:\.\d{1,2})?$/.test(text.trim())?Number(text.trim().slice(1).replaceAll(',','')):NaN;
export function renderedOptions(store:Store,html:string,r:Requirements,observedAt:number,excludeUrls:string[]=[]):{options:Option[];readable:boolean}{
 if(store==='AJIO'||store==='Bewakoof'||store==='Myntra')return retailOptions(store,html,r,observedAt,excludeUrls);
 if(store==='Amazon')return {options:amazonOptions(html,r,observedAt,excludeUrls,12),readable:load(html)('[data-component-type="s-search-result"]').length>0};
 const $=load(html),options:Option[]=[],seen=new Set<string>(),excluded=new Set(excludeUrls.map(url=>canonical(url,store)));let pricedProducts=0;
 const add=(title:string,url:string|undefined,rawPrice:string,rawImage:string|undefined,soldOut:boolean)=>{
  const price=rupees(rawPrice);if(!title||!url||seen.has(url)||!Number.isFinite(price)||price<=0)return;seen.add(url);pricedProducts++;
  if(soldOut||excluded.has(url))return;
  const image=rawImage?.replace(/^http:\/\//,'https://');
  const option:Option={store,title:title.slice(0,200),url,price,colour:title.match(/\b(navy blue|dark blue|light blue|blue|black|white|red|pink|green|yellow|purple|orange|beige|brown|grey|gray)\b/i)?.[0]??'',fabric:title.match(/\b(pure cotton|100% cotton|cotton blend|cotton|linen|leather|suede|mesh|canvas)\b/i)?.[0]??'',source:'listing',priceFrom:true,observedAt,...(allowedImageUrl(image)?{imageUrl:image}:{})};
  if(matchesOption(option,r))options.push(option);
 };
 if(store==='Flipkart')for(const el of $('[data-id]').toArray().slice(0,60)){
  const card=$(el),links=card.find('a[href]');
  const titleLink=links.filter((_i,a)=>Boolean($(a).attr('title'))&&Boolean(canonical($(a).attr('href')??'',store))).first();
  const url=canonical(titleLink.attr('href')??'',store);if(!url||new URL(url).searchParams.get('pid')!==card.attr('data-id'))continue;
  // Known current-price element inside an anchor for THIS product. Never use
  // the crossed-out MRP or an unscoped coupon/member price elsewhere in a card.
  const priceLink=links.filter((_i,a)=>canonical($(a).attr('href')??'',store)===url&&$(a).find('.hZ3P6w').length>0).first();
  add(titleLink.attr('title')??'',url,priceLink.find('.hZ3P6w').first().text(),card.find('img[src]').first().attr('src'),/\b(out of stock|sold out)\b/i.test(card.text()));
 }
 if(store==='The Souled Store')for(const el of $('a[href*="/product/"]').toArray().slice(0,60)){
  const card=$(el),title=[card.find('.product-name-text').first().text(),card.find('.listprice span').first().text()].map(s=>s.trim()).filter(Boolean).join(' ');
  add(title,canonical(card.attr('href')??'',store),card.find('.price-block .offer').first().text(),card.find('img[src]').first().attr('src'),/\b(out of stock|sold out)\b/i.test(card.text()));
 }
 if(store==='Meesho')for(const el of $('a[href*="/p/"]').toArray().slice(0,60)){
  const card=$(el);
  // Meesho's current card title and price row are stable styled components.
  // The h5 is the listed price; adjacent p is MRP, not the payable price.
  add(card.find('[class*="ProductTitle-"]').first().text().trim(),canonical(card.attr('href')??'',store),card.find('[class*="PriceRow-"] h5').first().text(),card.find('img[src]').first().attr('src'),/(out of stock|sold out)\b/i.test(card.text()));
 }
 return {options:options.slice(0,24),readable:pricedProducts>0};
}
