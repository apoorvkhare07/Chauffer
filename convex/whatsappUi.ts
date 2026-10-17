import {v} from 'convex/values';
export const waButton=v.object({id:v.string(),title:v.string()});
export const waMedia=v.object({id:v.string(),mime:v.string(),kind:v.union(v.literal('image'),v.literal('audio'),v.literal('document'))});
export const waIncoming=v.object({messageId:v.string(),phone:v.string(),text:v.string(),timestamp:v.number(),media:v.optional(waMedia)});
export const appUrl=(page='home')=>`https://rare-chameleon-828.convex.site/app/index.html#/${page}`;
export const menuButtons=[{id:'menu:shop',title:'Find products'},{id:'menu:style',title:'Ask my stylist'},{id:'menu:wardrobe',title:'My wardrobe'}];
export const menuText='What would you like help with?\n\nFind products, ask your stylist, or use your wardrobe. You can also type “try on”, “saved”, “daily picks”, “settings” or “help”.';
export function messagePayload(phone:string,text:string,buttons?:{id:string;title:string}[],imageUrl?:string){
 if(buttons?.length){if(buttons.length>3||text.length>1024||buttons.some(b=>!b.id||b.id.length>256||!b.title||b.title.length>20))throw new Error('Invalid WhatsApp buttons');return {messaging_product:'whatsapp',to:phone,type:'interactive',interactive:{type:'button',body:{text},action:{buttons:buttons.map(reply=>({type:'reply',reply}))}}};}
 return {messaging_product:'whatsapp',to:phone,...(imageUrl?{type:'image',image:{link:imageUrl,caption:text.slice(0,1024)}}:{type:'text',text:{preview_url:false,body:text.slice(0,4000)}})};
}
export function channelCommand(text:string){
 const t=text.trim().toLowerCase();
 const aliases:Record<string,string>={'hi':'menu','hello':'menu','help':'menu','menu':'menu','shop':'shop','find products':'shop','stylist':'style','ask my stylist':'style','wardrobe':'wardrobe','my wardrobe':'wardrobe','style my wardrobe':'outfit','try on':'tryon','try-on':'tryon','saved':'saved','daily picks':'daily','settings':'settings','stop':'stop','start':'menu'};
 return t.startsWith('menu:')?t.slice(5):aliases[t]??null;
}

export const mediaPurpose=v.union(v.literal('wardrobe'),v.literal('body'),v.literal('search'),v.literal('voice'));
