import {test,expect,vi,afterEach} from 'vitest';
import {discoverWithZyte,zyteListingOptions} from './zyteDiscovery';
const r={category:'shirt',audience:'men' as const,budget:2000,colour:'blue',occasion:'Everyday wear'};
const product=(id:number,extra={})=>({name:'Men blue cotton shirt',url:`https://www.myntra.com/${id}`,price:'999',currency:'INR',mainImage:{url:'https://assets.myntassets.com/shirt.jpg'},...extra});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
test('listing extraction preserves hard constraints, rejects unsafe or unknown facts and excludes rejected items',()=>{
 const products=[product(1),product(1),product(2,{price:'2500'}),product(3,{currency:'USD'}),product(4,{price:undefined}),product(5,{color:'orange'}),product(6,{name:'Women blue cotton shirt'}),product(7,{mainImage:{url:'https://evil.test/image'}}),product(8),product(9,{availability:'OutOfStock'})];
 const options=zyteListingOptions({productList:{products}},'Myntra',r,['https://www.myntra.com/8'],123);
 expect(options).toHaveLength(1);expect(options[0]).toMatchObject({price:999,colour:'blue',fabric:'cotton',source:'listing',observedAt:123});
 expect(zyteListingOptions({productList:{products}},'Myntra',{...r,brand:'Nike'},[],123)).toEqual([]);
});
test('missing extraction is unavailable, while readable nonmatches are no_matches; broad queries omit occasion',async()=>{
 vi.stubEnv('ZYTE_API_KEY','test');const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async(_url,init)=>{const request=JSON.parse(String(init?.body));expect(request.productList).toBe(true);expect(request.url).not.toMatch(/everyday|wear/i);return new Response(JSON.stringify(request.url.includes('myntra')?{}:{productList:{products:[]}}));});
 const found=await discoverWithZyte(r,[],['Myntra','H&M'],Date.now()+60000);
 expect(found.stores.map(s=>s.status)).toEqual(['unavailable','no_matches']);expect(fetch).toHaveBeenCalledTimes(2);
});
test('provider failures do not cascade into browser calls or retries; expired deadline makes no calls',async()=>{
 vi.stubEnv('ZYTE_API_KEY','test');const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('',{status:429}));
 expect((await discoverWithZyte(r,[],['Myntra'],Date.now()+60000)).failed).toBe(true);expect(fetch).toHaveBeenCalledTimes(1);
 await discoverWithZyte(r,[],['Myntra'],Date.now()-1);expect(fetch).toHaveBeenCalledTimes(1);
});
test('listing requests have bounded concurrency',async()=>{
 vi.stubEnv('ZYTE_API_KEY','test');let active=0,max=0;
 vi.spyOn(globalThis,'fetch').mockImplementation(async()=>{active++;max=Math.max(max,active);await new Promise(resolve=>setTimeout(resolve,5));active--;return new Response(JSON.stringify({productList:{products:[]}}));});
 await discoverWithZyte(r,[],undefined,Date.now()+60000);expect(max).toBe(4);
});
test('sparse merchant listings retain brand and colour from product path, never search query',()=>{
 const nike=product(1,{name:'Men Court Royale Sneakers',url:'https://www.myntra.com/casual-shoes/nike/nike-men-navy-solid-court-royale-sneakers/1800830/buy',price:'2248'});
 const request={category:'sneakers',brand:'Nike',colour:'blue',budget:10000};
 const options=zyteListingOptions({productList:{products:[nike]}},'Myntra',request,[],123);
 expect(options).toHaveLength(1);expect(options[0]).toMatchObject({title:'Men Court Royale Sneakers',brand:'Nike',colour:'navy'});
 expect(zyteListingOptions({productList:{products:[{...nike,url:'https://www.myntra.com/123?q=Nike-blue'}]}},'Myntra',request,[],123)).toEqual([]);
});
test('structured brand and material are preserved',()=>{
 const options=zyteListingOptions({productList:{products:[product(1,{name:'Men blue shirt',brand:{name:'Nike'},material:'Pure cotton'})]}},'Myntra',{...r,brand:'Nike',fabric:'pure cotton'},[],123);
 expect(options).toHaveLength(1);expect(options[0].brand).toBe('Nike');
});
test('first response uses HTTP extraction and leaves browser recovery out of its wait',async()=>{
 vi.stubEnv('ZYTE_API_KEY','test');const save=vi.fn();
 const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async(_url,init)=>{const request=JSON.parse(String(init?.body));expect(request.productListOptions).toEqual({extractFrom:'httpResponseBody'});return new Response(JSON.stringify({productList:{products:request.url.includes('myntra')?[]:[{...product(1),url:'https://www.flipkart.com/blue-shirt/p/itm123'}]}}));});
 const found=await discoverWithZyte(r,[],['Myntra','Flipkart'],Date.now()+40000,{entries:[],save},true);
 expect(fetch).toHaveBeenCalledTimes(2);expect(found.stores.find(s=>s.store==='Myntra')?.status).toBe('unavailable');expect(save).toHaveBeenCalledTimes(1);expect(found.options).toHaveLength(1);
});
test('first response does not wait for slow stores after two stores supply enough candidates',async()=>{
 vi.stubEnv('ZYTE_API_KEY','test');let aborted=0;
 vi.spyOn(globalThis,'fetch').mockImplementation(async(_url,init)=>{
  const request=JSON.parse(String(init?.body));
  if(request.url.includes('myntra')||request.url.includes('flipkart'))return new Response(JSON.stringify({productList:{products:Array.from({length:5},(_,i)=>product(i,{url:request.url.includes('myntra')?`https://www.myntra.com/${100+i}`:`https://www.flipkart.com/blue-shirt/p/itm${i}`}))}}));
  return new Promise((_resolve,reject)=>init?.signal?.addEventListener('abort',()=>{aborted++;reject(new Error('aborted'));},{once:true}));
 });
 const found=await discoverWithZyte(r,[],['Myntra','Flipkart','Amazon','AJIO'],Date.now()+40000,undefined,true);
 expect(found.options).toHaveLength(10);expect(aborted).toBe(2);
});
test('relevant purple shades beyond the first ten listings survive the bounded pool',async()=>{
 const {zyteListingPool}=await import('./zyteDiscovery');
 const request={category:'sneakers',budget:10000,colour:'purple'};
 const data={productList:{products:[...Array.from({length:12},(_,i)=>product(i,{name:'Men white sneakers'})),product(99,{name:'Men lavender sneakers'}),product(100,{name:'Men purple sneakers'})]}};
 const pool=zyteListingPool(data,'Myntra',123,request);
 expect(pool).toHaveLength(10);expect(pool.slice(0,2).map(p=>p.colour)).toEqual(['lavender','purple']);
 const {colourMatches}=await import('./discoveryRules');expect(colourMatches('lilac','purple')).toBe(true);expect(colourMatches('purple','lilac')).toBe(false);
});
test('multicolour product titles keep both colour clues for later image judgement',async()=>{
 const {zyteListingPool}=await import('./zyteDiscovery');
 const request={category:'sneakers',budget:10000,colour:'purple'};
 const pool=zyteListingPool({productList:{products:[product(555,{name:'Men white and purple sneakers'})]}},'Myntra',123,request);
 const {matchesCandidate}=await import('./discoveryRules');expect(matchesCandidate(pool[0],request)).toBe(true);
});
test('cotton linen blends retain linen evidence without accepting cotton-only or over-budget products',()=>{
 const products=[product(1,{name:'Men blue cotton linen shirt',price:'899'}),product(2,{name:'Men blue cotton shirt',price:'899'}),product(3,{name:'Men blue linen shirt',price:'1499'}),product(4,{name:'Men orange cotton linen shirt',price:'899'})];
 const options=zyteListingOptions({productList:{products}},'Myntra',{category:'shirt',audience:'men',colour:'blue',fabric:'linen',budget:1000},[],123);
 expect(options).toHaveLength(1);expect(options[0].fabric).toBe('cotton linen');expect(options[0].price).toBe(899);
});
