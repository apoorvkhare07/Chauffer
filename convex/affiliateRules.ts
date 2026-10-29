import {v} from 'convex/values';
import {productStore, type Store} from './storeConfig';
export type LinkType = 'amazon-tag' | 'cuelinks' | 'plain';
export const linkTypeValidator=v.union(v.literal('amazon-tag'),v.literal('cuelinks'),v.literal('plain'));
export const sources=['search','saved','wardrobe-review','history','daily','guest-search','price-comparison','catalog','basket'] as const;
export type AffiliateSource=typeof sources[number];
export const sourceValidator=v.union(...sources.map(s=>v.literal(s)));
// Opt-in routing is separate from discovery/ranking. Deep-link restrictions win.
export const affiliateRules:Record<Store,{provider:LinkType;deepLinkAllowed:boolean}>={
 Amazon:{provider:'amazon-tag',deepLinkAllowed:true},
 Flipkart:{provider:'cuelinks',deepLinkAllowed:true}, Myntra:{provider:'cuelinks',deepLinkAllowed:true},
 AJIO:{provider:'cuelinks',deepLinkAllowed:true}, Bewakoof:{provider:'cuelinks',deepLinkAllowed:true},
 SNITCH:{provider:'cuelinks',deepLinkAllowed:true}, NEWME:{provider:'cuelinks',deepLinkAllowed:true},
 'Nykaa Fashion':{provider:'cuelinks',deepLinkAllowed:true}, 'Tata CLiQ':{provider:'cuelinks',deepLinkAllowed:true},
 Westside:{provider:'cuelinks',deepLinkAllowed:true}, PUMA:{provider:'cuelinks',deepLinkAllowed:true},
 'The Souled Store':{provider:'plain',deepLinkAllowed:false},
 'Bonkers Corner':{provider:'plain',deepLinkAllowed:true}, Meesho:{provider:'plain',deepLinkAllowed:true},
 'H&M':{provider:'plain',deepLinkAllowed:true}, Uniqlo:{provider:'plain',deepLinkAllowed:true},
 FREAKINS:{provider:'plain',deepLinkAllowed:true}, 'Off Duty':{provider:'plain',deepLinkAllowed:true},
 Superkicks:{provider:'plain',deepLinkAllowed:true}, VegNonVeg:{provider:'plain',deepLinkAllowed:true},
};
export function validProduct(url:string,store:string){
 const detected=productStore(url);
 return detected!==undefined && url.length<=4096 && !/[\r\n\\]/.test(url) && detected===store;
}
export const referenceValidator=v.union(
 v.object({kind:v.literal('basket'),id:v.id('tryOnBasket')}),
 v.object({kind:v.literal('catalog'),id:v.id('browseCatalog'),url:v.string()}),
 v.object({kind:v.literal('message'),id:v.id('messages'),url:v.string()}),
 v.object({kind:v.literal('saved'),id:v.id('savedProducts')}),
 v.object({kind:v.literal('daily'),id:v.id('dailyFeeds'),url:v.string()}),
 v.object({kind:v.literal('comparison'),id:v.id('savedProducts'),url:v.string()}),
 v.object({kind:v.literal('guest'),token:v.string(),url:v.string()}),
);
export type Claims={v:1;url:string;store:Store;source:AffiliateSource;exp:number};
const encoder=new TextEncoder();
function base64url(bytes:Uint8Array){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(s:string){return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
async function key(secret:string){return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
export async function signLink(claims:Claims,secret:string){
 const payload=base64url(encoder.encode(JSON.stringify(claims)));
 return payload+'.'+base64url(new Uint8Array(await crypto.subtle.sign('HMAC',await key(secret),encoder.encode(payload))));
}
export async function verifyLink(token:string,secret:string,now=Date.now()):Promise<Claims|null>{
 try{
  if(token.length>8192||! /^[\w-]+\.[\w-]+$/.test(token))return null;
  const [payload,signature]=token.split('.');
  if(!await crypto.subtle.verify('HMAC',await key(secret),decode(signature),encoder.encode(payload)))return null;
  const c=JSON.parse(new TextDecoder().decode(decode(payload)));
  if(c.v!==1||typeof c.url!=='string'||!validProduct(c.url,c.store)||!sources.includes(c.source)||!Number.isFinite(c.exp)||c.exp<=now||c.exp>now+25*60*60*1000)return null;
  return c;
 }catch{return null;}
}
export function signingSecret(){const s=process.env.AFFILIATE_REDIRECT_SECRET;return s&&s.length>=32?s:null;}
