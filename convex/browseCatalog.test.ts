import {browseBrand,cleanBrowseBrand} from './browseBrands';
import {test,expect} from 'vitest';
import {convexTest} from 'convex-test';
import schema from './schema';
import {api,internal} from './_generated/api';
import {validBrowseOptions,BROWSE_MAX_AGE_MS,browseSources,browseSourceOptions} from './browseRules';
const modules=import.meta.glob('./**/*.ts');
const option={title:'Women Blue Top',url:'https://www.myntra.com/123456',price:999,colour:'blue',fabric:'cotton',observedAt:Date.now(),imageUrl:'https://assets.myntassets.com/top.jpg',store:'Myntra' as const};
async function setup(){const t=convexTest(schema,modules),user=t.withIdentity({subject:'browse-owner'}),other=t.withIdentity({subject:'browse-other'});const id=await t.run(ctx=>ctx.db.insert('browseCatalog',{key:'myntra-tops',store:'Myntra',category:'Tops',audience:'women',options:[option],updatedAt:Date.now(),attemptedAt:1,leaseUntil:0,retryAt:Date.now()+3600000,state:'ready'}));return {t,user,other,id};}
test('catalogue rejects stale, unsafe, unpriced and duplicate evidence',()=>{
 expect(validBrowseOptions([option,option,{...option,url:'https://evil.example/product'},{...option,url:'https://www.myntra.com/9999',imageUrl:'http://localhost/private'},{...option,url:'https://www.myntra.com/8888',price:0},{...option,url:'https://www.myntra.com/7777',observedAt:Date.now()-BROWSE_MAX_AGE_MS-1000}], 'Myntra')).toEqual([option]);
});
test('shared browsing requires sign-in while saves remain private and use server prices',async()=>{
 const {t,user,other,id}=await setup();await expect(t.query(api.browseCatalog.list,{})).rejects.toThrow('sign in');
 expect((await user.query(api.browseCatalog.list,{})).items[0].option.price).toBe(999);
 await user.mutation(api.browseCatalog.save,{id,url:option.url});await user.mutation(api.browseCatalog.save,{id,url:option.url});
 expect(await user.query(api.savedProducts.list,{})).toHaveLength(1);expect(await other.query(api.savedProducts.list,{})).toHaveLength(0);
 await expect(other.mutation(api.browseCatalog.save,{id,url:'https://www.myntra.com/999'})).rejects.toThrow('no longer');
});
test('catalogue try-on resolves stored evidence without a save or another extraction',async()=>{
 const {t,user,id}=await setup();expect(await user.query(internal.quickTryOn.source,{source:{kind:'catalog',id,url:option.url}})).toEqual({title:option.title,imageUrl:option.imageUrl});
 await expect(user.query(internal.quickTryOn.source,{source:{kind:'catalog',id,url:'https://www.myntra.com/999'}})).rejects.toThrow('available piece');
 expect(await user.query(api.savedProducts.list,{})).toHaveLength(0);await expect(t.query(internal.quickTryOn.source,{source:{kind:'catalog',id,url:option.url}})).rejects.toThrow('sign in');
});
test('catalogue affiliate links cannot accept substituted URLs or unauthenticated requests',async()=>{
 const {t,user,id}=await setup();expect(await t.query(api.affiliate.link,{reference:{kind:'catalog',id,url:option.url},source:'catalog'})).toBeNull();
 expect(await user.query(api.affiliate.link,{reference:{kind:'catalog',id,url:option.url},source:'catalog'})).toMatchObject({href:option.url});
 expect(await user.query(api.affiliate.link,{reference:{kind:'catalog',id,url:'https://www.myntra.com/999'},source:'catalog'})).toBeNull();
});
test('failed refresh keeps recent products and late workers cannot overwrite a newer refresh',async()=>{
 const {t,user,id}=await setup();await t.mutation(internal.browseCatalog.finish,{key:'myntra-tops',attemptedAt:0,options:[]});expect((await user.query(api.browseCatalog.list,{})).items).toHaveLength(1);
 await t.mutation(internal.browseCatalog.finish,{key:'myntra-tops',attemptedAt:1,options:[]});expect((await user.query(api.browseCatalog.list,{})).items).toHaveLength(1);
 await t.run(ctx=>ctx.db.patch(id,{options:[{...option,observedAt:Date.now()-BROWSE_MAX_AGE_MS-1000}]}));expect((await user.query(api.browseCatalog.list,{})).items).toHaveLength(0);
 await expect(user.mutation(api.browseCatalog.save,{id,url:option.url})).rejects.toThrow('no longer');
});

test('multiple visitors share one refresh reservation rather than starting duplicate store calls',async()=>{
 const {t,user,other}=await setup();await user.mutation(api.browseCatalog.ensure,{});await other.mutation(api.browseCatalog.ensure,{});
 const jobs=await t.run(ctx=>ctx.db.system.query('_scheduled_functions').take(10));
 expect(jobs).toHaveLength(2);const keys=jobs.flatMap(j=>(j.args[0] as {keys:string[]}).keys);expect(keys).toHaveLength(browseSources.length-1);expect(new Set(keys).size).toBe(browseSources.length-1);
});


test('brand identity comes from product evidence, never a marketplace or search query',()=>{
 expect(browseBrand({...option,brand:'Myntra'})).toBeNull();
 expect(browseBrand({...option,url:option.url+'?q=nike',brand:undefined})).toBeNull();
 expect(browseBrand({...option,url:'https://www.myntra.com/tops/fable+street/boat-neck-top/11552708/buy'})).toBe('FableStreet');
 expect(browseBrand({...option,url:'https://www.myntra.com/jeans/levis/blue-jeans/11552709/buy'})).toBe('Levi’s');
 expect(browseBrand({...option,title:'Nike inspired sneakers'})).toBeNull();
 expect(browseBrand({...option,brand:'Adidas',title:'Nike sneakers'})).toBe('Adidas');
 expect(browseBrand({...option,url:'https://in.puma.com/in/en/pd/sneakers/123456'})).toBe('PUMA');
 expect(cleanBrowseBrand('puma')).toBe('PUMA');expect(cleanBrowseBrand('AJIO')).toBeNull();expect(cleanBrowseBrand('Amazon')).toBeNull();
});
test('targeted brand batches reject unrelated products and store normalized evidence',()=>{
 const source=browseSources.find(s=>s.key==='nike-sneakers')!;
 const rows=browseSourceOptions([{...option,brand:'Nike'},{...option,brand:'Adidas',url:'https://www.myntra.com/3456'},{...option,url:'https://www.myntra.com/5678?q=nike'}],source);
 expect(rows).toHaveLength(1);expect(rows[0]).toMatchObject({brand:'Nike',store:'Myntra'});
});
test('brands span stores while merchant counts stay separate and deduplicated',async()=>{
 const {t,user,id}=await setup();
 await t.run(async ctx=>{
  await ctx.db.patch(id,{options:[{...option,brand:'Puma'}]});
  await ctx.db.insert('browseCatalog',{key:'puma-sneakers',store:'PUMA',category:'Sneakers',audience:'unisex',options:[{...option,brand:undefined,url:'https://in.puma.com/in/en/pd/sneakers/123456',store:'PUMA'}],updatedAt:Date.now(),attemptedAt:1,leaseUntil:0,retryAt:Date.now()+3600000,state:'ready'});
 });
 const result=await user.query(api.browseCatalog.list,{});
 expect(result.brands).toEqual([{name:'PUMA',count:2}]);expect(result.items.every(i=>i.brand==='PUMA')).toBe(true);
 expect(result.stores.filter(s=>s.name==='Myntra')).toHaveLength(1);expect(result.stores.find(s=>s.name==='Myntra')?.count).toBe(1);
 expect(result.stores.find(s=>s.name==='PUMA')?.count).toBe(1);
});
