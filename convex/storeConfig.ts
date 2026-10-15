import {v} from 'convex/values';
// Keep merchant names, trusted destinations and public search routes in one place.
export const stores=['Flipkart','Amazon','Myntra','AJIO','Bonkers Corner','Bewakoof','Meesho','The Souled Store','SNITCH','NEWME'] as const;
export type Store=typeof stores[number];
export const storeValidator=v.union(...stores.map(store=>v.literal(store)));
export const storeConfig:Record<Store,{origin:string;path:string;param:string;product:RegExp}>={
 Flipkart:{origin:'https://www.flipkart.com',path:'/search',param:'q',product:/\/p\/[\w-]+/},
 Amazon:{origin:'https://www.amazon.in',path:'/s',param:'k',product:/\/(?:dp|gp\/product)\/[A-Z0-9]{10}(?:\/|$)/},
 Myntra:{origin:'https://www.myntra.com',path:'/',param:'',product:/\/\d+\/buy\/?$/},
 AJIO:{origin:'https://www.ajio.com',path:'/search/',param:'text',product:/\/p\/[\w-]+$/},
 'Bonkers Corner':{origin:'https://www.bonkerscorner.com',path:'/search',param:'q',product:/^\/products\/[a-z0-9-]+\/?$/},
 Bewakoof:{origin:'https://www.bewakoof.com',path:'/search',param:'q',product:/^\/p\/[a-z0-9-]+\/?$/},
 Meesho:{origin:'https://www.meesho.com',path:'/search',param:'q',product:/^\/[^/]+\/p\/[a-z0-9]+\/?$/},
 'The Souled Store':{origin:'https://www.thesouledstore.com',path:'/search',param:'q',product:/^\/product\/[a-z0-9-]+\/?$/},
 SNITCH:{origin:'https://www.snitch.com',path:'/search',param:'',product:/^\/men-[a-z0-9-]+\/[a-z0-9-]+\/\d+\/buy\/?$/},
 NEWME:{origin:'https://newme.asia',path:'/shop',param:'search_term',product:/^\/product\/[a-z0-9-]+\/?$/},
};
export function productStore(raw:string):Store|undefined{try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port)return;return stores.find(store=>{const c=storeConfig[store];return u.hostname===new URL(c.origin).hostname&&c.product.test(u.pathname);});}catch{return;}}
export function merchantSearchUrl(store:Store,query:string,budget?:number){const c=storeConfig[store];const u=new URL(c.path,c.origin);if(store==='Myntra')u.pathname='/'+query.trim().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'');else if(store==='SNITCH')u.pathname='/search/'+encodeURIComponent(query.trim());else u.searchParams.set(c.param||'q',query);if(store==='Amazon'&&budget)u.searchParams.set('rh',`p_36:-${Math.floor(budget*100)}`);return u.href;}
export const merchantImageHosts=['rukmini1.flixcart.com','rukmini2.flixcart.com','rukminim1.flixcart.com','rukminim2.flixcart.com','m.media-amazon.com','images-eu.ssl-images-amazon.com','images-na.ssl-images-amazon.com','assets.myntassets.com','assets.ajio.com','cdn.shopify.com','www.bonkerscorner.com','images.bewakoof.com','images.meesho.com','prod-img.thesouledstore.com','assets.newme.asia'];
