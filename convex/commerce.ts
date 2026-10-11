import {query} from './_generated/server';
import {v} from 'convex/values';
import {requireOwner} from './identity';
import {comparison,type PriceObservation} from './comparisonRules';
export const compareSaved=query({args:{ids:v.array(v.id('savedProducts'))},returns:v.array(v.object({left:v.id('savedProducts'),right:v.id('savedProducts'),status:v.union(v.literal('unverified'),v.literal('comparable')),gaps:v.array(v.string()),cheaperUrl:v.union(v.string(),v.null()),savingPaise:v.union(v.number(),v.null())})),handler:async(ctx,{ids})=>{
 const owner=await requireOwner(ctx);if(ids.length>3)throw new Error('Compare up to three products.');
 const unique=[...new Set(ids)];const rows=await Promise.all(unique.map(id=>ctx.db.get(id)));
 if(rows.some(row=>!row||row.owner!==owner))throw new Error('Choose your own saved products.');
 const options=rows.map(row=>({row:row!,observation:{store:row!.option.store??'Unknown',url:row!.option.url,brand:row!.option.brand,manufacturerCode:row!.option.manufacturerCode,colour:row!.option.colour,quantity:1,itemPaise:Math.round(row!.option.price*100),observedAt:row!.option.observedAt,stock:'unknown',variantVerified:false,priceFrom:row!.option.priceFrom??false} as PriceObservation}));
 const pairs=[];
 for(let i=0;i<options.length;i++)for(let j=i+1;j<options.length;j++){
  const result=comparison(options[i].observation,options[j].observation);
  pairs.push({left:options[i].row._id,right:options[j].row._id,status:result.status,gaps:result.gaps,cheaperUrl:result.cheaperUrl,savingPaise:result.savingPaise});
 }
 return pairs;
}});
