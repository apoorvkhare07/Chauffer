import {browseBrand} from './browseBrands';
import {v,ConvexError} from 'convex/values';
import {query,mutation,internalQuery,internalMutation,type MutationCtx} from './_generated/server';
import {internal} from './_generated/api';
import {requireOwner} from './identity';
import {optionValidator} from './discoveryRules';
import {browseSources,browseAudience,browseItemAudience,BROWSE_FRESH_MS,BROWSE_LEASE_MS,validBrowseOptions,browseSourceOptions} from './browseRules';
import {storeValidator} from './storeConfig';
import {saveKnownOption} from './savedProducts';
const item=v.object({id:v.id('browseCatalog'),option:optionValidator,category:v.string(),audience:browseAudience,brand:v.union(v.string(),v.null())});
export const list=query({args:{},returns:v.object({items:v.array(item),loading:v.boolean(),updatedAt:v.union(v.number(),v.null()),brands:v.array(v.object({name:v.string(),count:v.number()})),stores:v.array(v.object({name:storeValidator,count:v.number(),loading:v.boolean()}))}),handler:async ctx=>{
 await requireOwner(ctx);const now=Date.now();
 const rows=await Promise.all(browseSources.map(s=>ctx.db.query('browseCatalog').withIndex('by_key',q=>q.eq('key',s.key)).unique()));
 const pools=rows.map((row,i)=>row?browseSourceOptions(row.options,browseSources[i],now).map(option=>({id:row._id,option,brand:browseBrand(option),category:row.category,audience:browseItemAudience(option,row.audience)})):[]);
 // Round-robin stores, so the first screen is a mix rather than ten copies of one label.
 const items:(typeof pools)[number]=[];const seen=new Set<string>();for(let i=0;i<10;i++)for(const pool of pools){const p=pool[i];if(p&&!seen.has(p.option.url)){items.push(p);seen.add(p.option.url);}}
 const stamps=items.map(i=>i.option.observedAt);
 const brands=[...new Set(items.map(i=>i.brand).filter((b):b is string=>Boolean(b)))].map(name=>({name,count:items.filter(i=>i.brand===name).length}));
 const stores=[...new Set(browseSources.map(s=>s.store))].map(name=>({name,count:items.filter(i=>i.option.store===name).length,loading:rows.some((r,i)=>browseSources[i].store===name&&(!r||r.leaseUntil>now))}));
 return {items,loading:rows.some(r=>!r||r.leaseUntil>now),updatedAt:stamps.length?Math.min(...stamps):null,brands,stores};
}});
async function reserve(ctx:MutationCtx,retryFailed=false){
 const now=Date.now(),keys:string[]=[];
 for(const source of browseSources){
  const row=await ctx.db.query('browseCatalog').withIndex('by_key',q=>q.eq('key',source.key)).unique();
  if(row&&(row.leaseUntil>now||(row.retryAt>now&&!(retryFailed&&row.state==='unavailable'))))continue;
  const fields={attemptedAt:now,leaseUntil:now+BROWSE_LEASE_MS,retryAt:now+BROWSE_LEASE_MS,state:'loading' as const};
  if(row)await ctx.db.patch(row._id,fields);else await ctx.db.insert('browseCatalog',{key:source.key,store:source.store,category:source.category,audience:source.audience,options:[],updatedAt:0,...fields});
  keys.push(source.key);
 }
 // Two bounded background workers across all visitors; page loads only read the shared cache.
 for(let i=0;i<Math.min(2,keys.length);i++)await ctx.scheduler.runAfter(0,internal.browseRefresh.run,{keys:keys.filter((_,j)=>j%2===i),attemptedAt:now});
 return null;
}
export const ensure=mutation({args:{},returns:v.null(),handler:async ctx=>{await requireOwner(ctx);return reserve(ctx);}});
export const warm=internalMutation({args:{retryFailed:v.optional(v.boolean())},returns:v.null(),handler:(ctx,args)=>reserve(ctx,args.retryFailed)});
export const finish=internalMutation({args:{key:v.string(),attemptedAt:v.number(),options:v.array(optionValidator)},returns:v.null(),handler:async(ctx,args)=>{
 const row=await ctx.db.query('browseCatalog').withIndex('by_key',q=>q.eq('key',args.key)).unique();if(!row||row.attemptedAt!==args.attemptedAt)return null;
 const source=browseSources.find(s=>s.key===args.key);if(!source)return null;
 const now=Date.now(),options=browseSourceOptions(args.options,source,now),old=browseSourceOptions(row.options,source,now);
 await ctx.db.patch(row._id,{options:options.length?options:old,updatedAt:options.length?now:row.updatedAt,state:options.length?'ready':'unavailable',leaseUntil:0,retryAt:now+(options.length?BROWSE_FRESH_MS:30*60000)});return null;
}});
export const read=internalQuery({args:{id:v.id('browseCatalog'),url:v.string()},returns:v.union(optionValidator,v.null()),handler:async(ctx,{id,url})=>{const row=await ctx.db.get(id);return row?validBrowseOptions(row.options,row.store).find(o=>o.url===url)??null:null;}});
export const save=mutation({args:{id:v.id('browseCatalog'),url:v.string()},returns:v.null(),handler:async(ctx,{id,url})=>{
 const owner=await requireOwner(ctx),row=await ctx.db.get(id),option=row&&validBrowseOptions(row.options,row.store).find(o=>o.url===url);
 if(!option)throw new ConvexError('This piece is no longer in the edit. Refresh and choose another.');
 return saveKnownOption(ctx,owner,option);
}});
