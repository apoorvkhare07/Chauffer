// @vitest-environment node
import {afterEach,expect,test,vi} from 'vitest';
import {discoverAcrossStores} from './liveDiscovery';
const r={category:'sneakers',audience:'men' as const,budget:5000,size:'UK 8'};
const ajio=(price=2000)=>`<script>window.__PRELOADED_STATE__=${JSON.stringify({grid:{entities:{one:{name:'Men Sneakers',url:'/men-sneakers/p/123_blue',price:{currencyIso:'INR',value:price}}}}})};</script>`;
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
test('combined discovery preserves direct results and recovers only eligible unreadable stores through Browserless',async()=>{
 vi.stubEnv('BROWSERLESS_API_KEY','invented-test-key');
 let active=0,maxActive=0;
 const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async(input,init)=>{
  const url=new URL(String(input));
  if(url.hostname==='production-sfo.browserless.io'){
   active++;maxActive=Math.max(maxActive,active);await new Promise(resolve=>setTimeout(resolve,1));active--;
   const target=new URL(JSON.parse(init!.body as string).url);
   return new Response(target.hostname==='www.ajio.com'?ajio():'<h1>Access Denied</h1>',{headers:{'x-response-code':'200'}});
  }
  if(url.hostname==='www.amazon.in')return new Response('<div data-component-type="s-search-result" data-asin="B012345678"><h2>Men Sneakers</h2><span class="a-price"><span class="a-offscreen">₹999</span></span></div>');
  return new Response('Unavailable',{status:403});
 });
 const result=await discoverAcrossStores(r);
 expect(result.options.map(o=>o.store)).toEqual(['Amazon','AJIO']);expect(maxActive).toBeLessThanOrEqual(2);
 const calls=fetch.mock.calls.filter(([input])=>new URL(String(input)).hostname==='production-sfo.browserless.io');
 expect(calls).toHaveLength(4);
 const targets=calls.map(([,init])=>new URL(JSON.parse(init!.body as string).url).hostname);
 expect(targets).toEqual(expect.arrayContaining(['www.flipkart.com','www.ajio.com','www.bewakoof.com','www.thesouledstore.com']));
 expect(targets).not.toContain('www.amazon.in');expect(targets).not.toContain('www.meesho.com');
 expect(result.stores.find(s=>s.store==='AJIO')?.status).toBe('matched');
});
test('readable nonmatches, hard constraints and missing provider configuration do not trigger needless browser reads',async()=>{
 vi.stubEnv('BROWSERLESS_API_KEY','invented-test-key');
 const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async input=>new URL(String(input)).hostname==='www.ajio.com'?new Response(ajio(6000)):new Response('Unavailable',{status:403}));
 const result=await discoverAcrossStores(r);expect(result.stores.find(s=>s.store==='AJIO')?.status).toBe('no_matches');
 const targets=fetch.mock.calls.filter(([input])=>new URL(String(input)).hostname==='production-sfo.browserless.io').map(([,init])=>JSON.parse(init!.body as string).url);
 expect(targets.some(url=>url.includes('www.ajio.com'))).toBe(false);
 fetch.mockClear();vi.stubEnv('BROWSERLESS_API_KEY','');await discoverAcrossStores(r);
 expect(fetch.mock.calls.some(([input])=>new URL(String(input)).hostname==='production-sfo.browserless.io')).toBe(false);
});
