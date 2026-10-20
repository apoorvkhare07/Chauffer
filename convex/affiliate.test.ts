import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import schema from './schema';
import {api,internal} from './_generated/api';
import {affiliateRules,validProduct,signLink,verifyLink} from './affiliateRules';
import {destination,convertCuelinks,safeTrackingUrl} from './affiliateProviders';
import {stores} from './storeConfig';
import {hashSecret} from './lib/otp';
const modules=import.meta.glob('./**/*.ts');
const secret='test-only-redirect-key-not-a-real-secret-1234567890';
const amazon='https://www.amazon.in/dp/B012345678?size=M&tag=old';
const flipkart='https://www.flipkart.com/blue-shirt/p/itm123';
const souled='https://www.thesouledstore.com/product/blue-shirt';
const option=(url=amazon,store:'Amazon'|'Flipkart'='Amazon')=>({title:'Blue shirt',url,store,price:999,colour:'blue',fabric:'cotton',observedAt:Date.now()});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.restoreAllMocks();});
function setup(){vi.stubEnv('AFFILIATE_REDIRECT_SECRET',secret);vi.stubEnv('CONVEX_SITE_URL','https://test.convex.site');vi.stubEnv('AMAZON_ASSOCIATE_TAG',undefined);vi.stubEnv('CUELINKS_ENABLED',undefined);vi.stubEnv('CUELINKS_API_KEY',undefined);return convexTest(schema,modules);}
async function seed(t:ReturnType<typeof convexTest>,url=amazon,store:'Amazon'|'Flipkart'='Amazon'){
 return t.run(ctx=>ctx.db.insert('savedProducts',{owner:'alice',option:option(url,store),savedAt:Date.now()}));
}
const plainConvert={convert:async()=>null};
const response=(url=flipkart,source='saved',affiliated=true)=>({data:{original_url:url,affiliated,tracking_url:`https://linksredirect.com/?cid=123&subid=${source}&url=${encodeURIComponent(url)}`}});
function provider(){vi.stubEnv('CUELINKS_ENABLED','true');vi.stubEnv('CUELINKS_API_KEY','fake-cuelinks-key');}

test('every configured store has a rule; exact merchant hosts and product paths are required',()=>{
 expect(Object.keys(affiliateRules).sort()).toEqual([...stores].sort());
 expect(validProduct(amazon,'Amazon')).toBe(true);
 for(const bad of ['https://www.amazon.in.evil.test/dp/B012345678','https://www.amazon.in@evil.test/dp/B012345678','https://evil.test/dp/B012345678','http://www.amazon.in/dp/B012345678','https://www.amazon.in:444/dp/B012345678','https://www.amazon.in/redirect?url=https://evil.test','javascript:alert(1)'])expect(validProduct(bad,'Amazon')).toBe(false);
 expect(validProduct(amazon,'Flipkart')).toBe(false);
});
test('signed links require owner evidence and carry no shopper identity',async()=>{
 const t=setup(),id=await seed(t);
 const args={reference:{kind:'saved' as const,id},source:'saved' as const};
 expect(await t.query(api.affiliate.link,args)).toBeNull();
 expect(await t.withIdentity({subject:'bob'}).query(api.affiliate.link,args)).toBeNull();
 const result=await t.withIdentity({subject:'alice'}).query(api.affiliate.link,args);
 const token=new URL(result!.href).searchParams.get('token')!;
 const claims=await verifyLink(token,secret);
 expect(claims).toMatchObject({url:amazon,store:'Amazon',source:'saved'});
 expect(claims).not.toHaveProperty('owner');
 expect(await t.withIdentity({subject:'alice'}).query(api.affiliate.link,{...args,source:'guest-search'})).toBeNull();
});
test('message reference must belong to the shopper and contain the exact shown product',async()=>{
 const t=setup();const id=await t.run(async ctx=>{
  const conversationId=await ctx.db.insert('conversations',{key:'web:alice',requirements:{},revision:0,session:0,pending:false,updatedAt:Date.now(),shownUrls:[amazon],rejectedUrls:[]});
  return ctx.db.insert('messages',{conversationId,session:0,role:'assistant',text:'Options',result:{options:[option()],failed:false,stores:[]}});
 });
 const args={reference:{kind:'message' as const,id,url:amazon},source:'search' as const};
 expect(await t.withIdentity({subject:'alice'}).query(api.affiliate.link,args)).not.toBeNull();
 expect(await t.withIdentity({subject:'bob'}).query(api.affiliate.link,args)).toBeNull();
 expect(await t.withIdentity({subject:'alice'}).query(api.affiliate.link,{...args,reference:{...args.reference,url:flipkart}})).toBeNull();
});
test('guest references require the guest secret; expired results cannot mint links',async()=>{
 const t=setup(),token='a'.repeat(72);
 const id=await t.run(async ctx=>ctx.db.insert('guestSearches',{tokenHash:await hashSecret(token),text:'shirt',state:'ready',result:{options:[option()],failed:false,stores:[]},createdAt:Date.now()}));
 const args={reference:{kind:'guest' as const,token,url:amazon},source:'guest-search' as const};
 const link=await t.query(api.affiliate.link,args);expect(link).not.toBeNull();
 expect(link!.href).not.toContain(token);
 expect(await t.query(api.affiliate.link,{...args,reference:{...args.reference,token:'b'.repeat(72)}})).toBeNull();
 await t.run(ctx=>ctx.db.patch(id,{result:undefined}));expect(await t.query(api.affiliate.link,args)).toBeNull();
});
test('missing signing setup falls back to the verified original, never an arbitrary client URL',async()=>{
 const t=setup(),id=await seed(t);vi.stubEnv('AFFILIATE_REDIRECT_SECRET',undefined);
 expect(await t.withIdentity({subject:'alice'}).query(api.affiliate.link,{reference:{kind:'saved',id},source:'wardrobe-review'})).toEqual({href:amazon,affiliate:false,amazon:false});
 const bad=await seed(t,'https://evil.test/');expect(await t.withIdentity({subject:'alice'}).query(api.affiliate.link,{reference:{kind:'saved',id:bad},source:'saved'})).toBeNull();
});
test('tampering, expiry, wrong key and signed disallowed targets are rejected',async()=>{
 setup();const claims={v:1 as const,url:amazon,store:'Amazon' as const,source:'saved' as const,exp:Date.now()+60_000};
 const token=await signLink(claims,secret);
 expect(await verifyLink(token,secret)).not.toBeNull();
 expect(await verifyLink(token+'a',secret)).toBeNull();
 expect(await verifyLink(token,secret+'wrong')).toBeNull();
 expect(await verifyLink(await signLink({...claims,exp:Date.now()-1},secret),secret)).toBeNull();
 expect(await verifyLink(await signLink({...claims,url:'https://evil.test'},secret),secret)).toBeNull();
});
test('/go rejects arbitrary URLs, missing/duplicate/invalid tokens without recording clicks',async()=>{
 const t=setup();for(const path of ['/go','/go?url=https://evil.test','/go?token=bad','/go?token=bad&token=bad','/go?token=bad&url=https://evil.test'])expect((await t.fetch(path)).status).toBe(400);
 expect(await t.run(ctx=>ctx.db.query('affiliateClicks').collect())).toEqual([]);
});
test('/go records plain and Amazon-tag clicks and sends a no-store redirect',async()=>{
 const t=setup(),id=await seed(t);
 const link=await t.withIdentity({subject:'alice'}).query(api.affiliate.link,{reference:{kind:'saved',id},source:'saved'});
 const path=new URL(link!.href).pathname+new URL(link!.href).search;
 let r=await t.fetch(path);expect(r.status).toBe(302);expect(r.headers.get('location')).toBe(amazon);
 vi.stubEnv('AMAZON_ASSOCIATE_TAG','chauffer-test-21');r=await t.fetch(path);
 const url=new URL(r.headers.get('location')!);expect(url.searchParams.get('tag')).toBe('chauffer-test-21');expect(url.searchParams.getAll('tag')).toHaveLength(1);expect(url.searchParams.get('size')).toBe('M');
 expect(r.headers.get('cache-control')).toBe('no-store');expect(r.headers.get('referrer-policy')).toBe('no-referrer');
 const clicks=await t.run(ctx=>ctx.db.query('affiliateClicks').collect());expect(clicks.map(c=>c.linkType)).toEqual(['plain','amazon-tag']);
 expect(clicks[1]).toMatchObject({store:'Amazon',productUrl:amazon,source:'saved'});
 expect(Object.keys(clicks[1]).sort()).toEqual(['_creationTime','_id','createdAt','linkType','productUrl','source','store'].sort());
});
test('deep-link restriction wins and Cuelinks is opt-in, including when a key exists',async()=>{
 setup();vi.stubEnv('CUELINKS_API_KEY','fake');const convert=vi.fn(async()=>response().data.tracking_url);
 expect(await destination('Flipkart',flipkart,'saved',{convert})).toEqual({url:flipkart,linkType:'plain'});expect(convert).not.toHaveBeenCalled();
 provider();expect(await destination('The Souled Store',souled,'saved',{convert})).toEqual({url:souled,linkType:'plain'});expect(convert).not.toHaveBeenCalled();
});
test('Cuelinks uses documented JSON fields, authorization, source-only sub-ID and affiliated status',async()=>{
 setup();provider();const fetcher=vi.fn(async()=>new Response(JSON.stringify(response()),{headers:{'content-type':'application/json'}}));
 expect((await convertCuelinks(flipkart,'saved',fetcher)).url).toBe(response().data.tracking_url);
 const [url,request]=fetcher.mock.calls[0] as unknown as [string,RequestInit];expect(url).toBe('https://developers.cuelinks.com/pub_api/v3/links/convert');expect(request.headers).toMatchObject({Authorization:'Token fake-cuelinks-key'});expect(JSON.parse(request.body as string)).toEqual({url:flipkart,subid:'saved',shorten:false});expect(request.redirect).toBe('error');
 expect((await convertCuelinks(flipkart,'saved',async()=>new Response(JSON.stringify(response(flipkart,'saved',false))))).url).toBeNull();
});
test('provider failures, unsafe tracking hosts and different target URLs fall back to plain',async()=>{
 setup();provider();
 for(const fetcher of [async()=>{throw new Error('timeout');},async()=>new Response('',{status:403}),async()=>new Response('bad JSON'),async()=>new Response('x'.repeat(33000)),async()=>new Response(JSON.stringify({data:{...response().data,tracking_url:'https://evil.test'}})),async()=>new Response(JSON.stringify(response(amazon)))])expect((await convertCuelinks(flipkart,'saved',fetcher)).url).toBeNull();
 expect(safeTrackingUrl('https://linksredirect.com.evil.test/?url='+encodeURIComponent(flipkart),flipkart)).toBeNull();
 expect(await destination('Flipkart',flipkart,'saved',{convert:async()=>{throw new Error('down');}})).toEqual({url:flipkart,linkType:'plain'});
});
test('/go caches conversions per product AND source, logs each click and honours disabling after cache',async()=>{
 const t=setup();provider();const fetcher=vi.fn(async(_url:unknown,request?:RequestInit)=>{
  const body=JSON.parse(request!.body as string);return new Response(JSON.stringify(response(body.url,body.subid)));
 });vi.stubGlobal('fetch',fetcher);
 const id=await seed(t,flipkart,'Flipkart');
 const saved=await t.withIdentity({subject:'alice'}).query(api.affiliate.link,{reference:{kind:'saved',id},source:'saved'});
 const review=await t.withIdentity({subject:'alice'}).query(api.affiliate.link,{reference:{kind:'saved',id},source:'wardrobe-review'});
 const path=(href:string)=>new URL(href).pathname+new URL(href).search;
 expect((await t.fetch(path(saved!.href))).headers.get('location')).toBe(response().data.tracking_url);
 await t.fetch(path(saved!.href));expect(fetcher).toHaveBeenCalledTimes(1);
 expect((await t.fetch(path(review!.href))).headers.get('location')).toBe(response(flipkart,'wardrobe-review').data.tracking_url);expect(fetcher).toHaveBeenCalledTimes(2);
 vi.stubEnv('CUELINKS_ENABLED','false');expect((await t.fetch(path(saved!.href))).headers.get('location')).toBe(flipkart);expect(fetcher).toHaveBeenCalledTimes(2);
 expect((await t.run(ctx=>ctx.db.query('affiliateClicks').collect())).map(c=>c.linkType)).toEqual(['cuelinks','cuelinks','cuelinks','plain']);
});
test('concurrent cache reservations allow only one provider refresh',async()=>{
 const t=setup(),args={productUrl:flipkart,source:'saved' as const,config:'test'};
 const first=await t.mutation(internal.affiliateCore.reserve,args),second=await t.mutation(internal.affiliateCore.reserve,args);
 expect(first.convert).toBe(true);expect(second).toEqual({convert:false,url:null});
});

test('comparison evidence remains owner-bound and only matches in the saved report can be signed',async()=>{
 const t=setup(),id=await seed(t);
 await t.run(ctx=>ctx.db.insert('priceIntelligence',{owner:'alice',savedId:id,report:{checkedAt:Date.now(),status:'checked',note:'Fixture',offers:[],matches:[{option:option(flipkart,'Flipkart'),identity:'alternative'}],gaps:[]}}));
 const args={reference:{kind:'comparison' as const,id,url:flipkart},source:'price-comparison' as const};
 expect(await t.withIdentity({subject:'alice'}).query(api.affiliate.link,args)).not.toBeNull();
 expect(await t.withIdentity({subject:'bob'}).query(api.affiliate.link,args)).toBeNull();
 expect(await t.withIdentity({subject:'alice'}).query(api.affiliate.link,{...args,reference:{...args.reference,url:amazon}})).toBeNull();
});
test('cached conversion expiry and key changes require a refresh; negative results are cached briefly',async()=>{
 const t=setup(),args={productUrl:flipkart,source:'saved' as const,config:'key-one'};
 await t.mutation(internal.affiliateCore.reserve,args);
 await t.mutation(internal.affiliateCore.cache,{...args,url:null,ttl:60_000});
 expect(await t.mutation(internal.affiliateCore.reserve,args)).toEqual({convert:false,url:null});
 expect((await t.mutation(internal.affiliateCore.reserve,{...args,config:'key-two'})).convert).toBe(true);
 await t.mutation(internal.affiliateCore.cache,{...args,config:'key-two',url:response().data.tracking_url,ttl:0});
 expect((await t.mutation(internal.affiliateCore.reserve,{...args,config:'key-two'})).convert).toBe(true);
});
