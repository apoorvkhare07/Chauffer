"use node";
import {discoverySourceValidator,catalogSourceValidator,basketSourceValidator} from './quickTryOnRules';
import {targetValidator,targetErrorMessages} from './tryOnTargetRules';
import {v,ConvexError} from 'convex/values';
import {getAuthUserId} from '@convex-dev/auth/server';
import {readTryOnProduct,productImage,directPage} from './tryOnProduct';
import {action,internalAction} from './_generated/server';
import {productStore} from './storeConfig';
import {browserPage} from './browserPages';
import {internal} from './_generated/api';
import {decodeJpeg,imageMime,previewSourceValidator} from './stylingRules';
import {allowedProductUrl,allowedImageUrl} from './discoveryRules';
import {merchantImage,renderTryOn,PreviewError} from './tryOnRenderer';
const garmentValidator=v.union(v.object({kind:v.literal('upload'),jpeg:v.string()}),discoverySourceValidator,catalogSourceValidator,basketSourceValidator,previewSourceValidator,v.object({kind:v.literal('link'),imageUrl:v.string(),title:v.string()}));
export const generate=action({args:{portraitJpeg:v.string(),garment:garmentValidator,consent:v.boolean(),target:v.optional(targetValidator)},returns:v.object({base64:v.string(),mime:v.string(),title:v.string(),target:v.string()}),handler:async(ctx,{portraitJpeg,garment,consent,target}):Promise<{base64:string;mime:string;title:string;target:string}>=>{
 if(!await getAuthUserId(ctx))throw new ConvexError('Please sign in.');
 const portrait=decodeJpeg(portraitJpeg);let image:{mimeType:string;data:string},title='Uploaded clothing';
 // No portrait, garment or output is stored in Convex. Only the attempt limit is recorded.
 const id=await ctx.runMutation(internal.quickTryOn.claim,{consent});
 try{
  if(garment.kind==='upload'){image={mimeType:'image/jpeg',data:Buffer.from(decodeJpeg(garment.jpeg)).toString('base64')};}
  else if(garment.kind==='link'){if(!allowedImageUrl(garment.imageUrl))throw new ConvexError('Upload a product image instead.');title=garment.title.slice(0,160);image=await merchantImage(garment.imageUrl);}
  else{const item=await ctx.runQuery(internal.quickTryOn.source,{source:garment});title=item.title;if(item.photoId){const blob=await ctx.storage.get(item.photoId);if(!blob||blob.size>3000000)throw new ConvexError('This clothing photo is unavailable.');const bytes=new Uint8Array(await blob.arrayBuffer());image={mimeType:imageMime(bytes),data:Buffer.from(bytes).toString('base64')};}else image=await merchantImage(item.imageUrl!);}
  const result=await renderTryOn(portrait,image,title,target);return {base64:Buffer.from(result.bytes).toString('base64'),mime:result.mime,title,target:result.target};
 }catch(error){if(error instanceof ConvexError)throw error;if(error instanceof PreviewError&&targetErrorMessages[error.code])throw new ConvexError(targetErrorMessages[error.code]);throw new ConvexError(error instanceof PreviewError&&error.code==='quota'?'The preview service is busy. Please try later.':'Could not create this preview. Your photos are still here; try again or choose a clearer image.');}
 finally{await ctx.runMutation(internal.quickTryOn.release,{id});}
}});
export const importProduct=action({args:{url:v.string()},returns:v.object({title:v.string(),imageUrl:v.string()}),handler:async(ctx,{url}):Promise<{title:string;imageUrl:string}>=>{
 const owner=await getAuthUserId(ctx);if(!owner)throw new ConvexError('Please sign in.');
 if(url.length>2000||!allowedProductUrl(url))throw new ConvexError('Use a supported store’s product link, or upload the product image.');
 const claimId=await ctx.runMutation(internal.webDiscovery.claim,{owner});
 try{return await readTryOnProduct(url);
 }catch(error){console.warn('Try-on product import failed:',error instanceof Error&&/^(store HTTP [0-9]{3}|no image|image host|large|unavailable)$/.test(error.message)?error.message:'request failed');throw new ConvexError('This store’s product image could not be read. Upload its photo instead.');}finally{await ctx.runMutation(internal.webDiscovery.finish,{id:claimId});}
}});

// Manual development check: no private photos or conversation data.
export const probeProduct=internalAction({args:{url:v.string()},returns:v.object({title:v.string(),imageUrl:v.string()}),handler:async(_ctx,{url})=>{
 if(!allowedProductUrl(url)||url.length>2000)throw new Error('Unsupported product');
 const store=productStore(url)!;
 const page=await browserPage(store,url,process.env.BROWSERLESS_API_KEY,30000,'product');
 const result=productImage(page.html,url);if(!result)throw new Error('No product image in browser response');return result;
}});

export const probeDirectProduct=internalAction({args:{url:v.string()},returns:v.object({ok:v.boolean(),elapsedMs:v.number(),title:v.optional(v.string()),imageUrl:v.optional(v.string()),imageMime:v.optional(v.string()),failure:v.optional(v.string())}),handler:async(_ctx,{url})=>{
 const start=Date.now();try{const item=await directPage(url);if(!item)return {ok:false,elapsedMs:Date.now()-start,failure:'No product image in direct response'};const image=await merchantImage(item.imageUrl);return {ok:true,elapsedMs:Date.now()-start,...item,imageMime:image.mimeType};}catch{return {ok:false,elapsedMs:Date.now()-start,failure:'Direct product page or image unavailable'};}
}});
