"use node";
import {targetValidator,targetErrorMessages} from './tryOnTargetRules';
import {action} from './_generated/server';
import {getAuthUserId} from '@convex-dev/auth/server';
import {internal} from './_generated/api';
import {v,ConvexError} from 'convex/values';
import {createGoogleGenerativeAI} from '@ai-sdk/google';
import {generateObject} from 'ai';
import {z} from 'zod';
import {hashSecret} from './lib/otp';
import {categoryAttributes,wardrobeTitle} from '../shared/wardrobeTags';
import {validateGarment,photoAnalysisValidator} from './wardrobeRules';
import {decodeJpeg,previewDisclaimer} from './stylingRules';
import sharp from 'sharp';
import {readTryOnProduct} from './tryOnProduct';
import {allowedProductUrl} from './discoveryRules';
import {merchantImage,renderTryOn,PreviewError} from './tryOnRenderer';
import type {Id} from './_generated/dataModel';

const tokenValidator=v.string();
const validToken=(token:string)=>/^[a-f0-9-]{72}$/.test(token);
const analysisSchema=z.object({details:z.object({name:z.string().min(1).max(80),category:z.enum(['top','bottom','dress','kurta','saree','outerwear','shoes','accessory']),colour:z.string().min(1).max(60),kind:z.string().max(80),brand:z.string().max(80),cut:z.string().max(80),occasion:z.string().max(80),fabric:z.string().max(40),pattern:z.string().max(40),notes:z.string().max(240),size:z.string().max(40),attributes:z.object({sleeve:z.string().max(60),neckline:z.string().max(60),length:z.string().max(60),fastening:z.string().max(60),heel:z.string().max(60),strap:z.string().max(60)})}),singleItemVisible:z.boolean(),uncertainties:z.array(z.string().max(160)).max(6),brandEvidence:z.string().max(160)});
export const tryOn=action({args:{token:tokenValidator,portraitJpeg:v.string(),garmentJpeg:v.optional(v.string()),productUrl:v.optional(v.string()),target:v.optional(targetValidator),consent:v.optional(v.boolean())},returns:v.object({url:v.string()}),handler:async(ctx,{token,portraitJpeg,garmentJpeg,productUrl,consent,target}):Promise<{url:string}>=>{
 if(!validToken(token))throw new ConvexError('Please reload and try again.');
 if(consent!==true)throw new ConvexError('Agree to use these images for your preview.');
 if(Boolean(garmentJpeg)===Boolean(productUrl))throw new ConvexError('Choose one product link or clothing photo.');
 if(productUrl&&(productUrl.length>2000||!allowedProductUrl(productUrl)))throw new ConvexError('Paste a supported store’s product link, or upload its photo.');
 const portrait=decodeJpeg(portraitJpeg),uploaded=garmentJpeg?decodeJpeg(garmentJpeg):null;
 if(!process.env.GEMINI_API_KEY)throw new ConvexError('Try-on is temporarily unavailable. Please try later.');
 const id=await ctx.runMutation(internal.guestTrials.claim,{tokenHash:await hashSecret(token),kind:'tryon'});
 let outputId:Id<'_storage'>|undefined,previewId:Id<'_storage'>|undefined;
 try{
  let title='My try-on',image:{mimeType:string;data:string};
  if(uploaded)image={mimeType:'image/jpeg',data:Buffer.from(uploaded).toString('base64')};
  else{let product;try{product=await readTryOnProduct(productUrl!);image=await merchantImage(product.imageUrl);}catch{throw new ConvexError('We couldn’t read that product. Check the link or upload the clothing photo.');}title=product.title;}
  const result=await renderTryOn(portrait,image,title,target);
  // Guests see a compact preview. The original is returned only by the authenticated export endpoint.
  const preview=await sharp(Buffer.from(result.bytes),{limitInputPixels:40000000}).rotate().resize({width:640,height:800,fit:'inside',withoutEnlargement:true}).flatten({background:'#ffffff'}).jpeg({quality:78}).toBuffer();
  outputId=await ctx.storage.store(new Blob([result.bytes as BlobPart],{type:result.mime}));
  previewId=await ctx.storage.store(new Blob([new Uint8Array(preview)],{type:'image/jpeg'}));
  const url=await ctx.storage.getUrl(previewId);if(!url)throw new Error('preview unavailable');
  const accepted=await ctx.runMutation(internal.guestTrials.finishTryOn,{id,outputId,previewId,title,note:previewDisclaimer});
  if(!accepted){outputId=undefined;previewId=undefined;throw new ConvexError('This preview expired. Sign in to try again.');}
  return {url};
 }catch(error){
  for(const storageId of [outputId,previewId])if(storageId)await ctx.storage.delete(storageId);
  const note=error instanceof ConvexError?String(error.data):error instanceof PreviewError&&targetErrorMessages[error.code]?targetErrorMessages[error.code]:error instanceof PreviewError&&error.code==='quota'?'The preview service is busy. Please try later.':'We couldn’t create this look. Your photo and link are still here; please try again.';
  await ctx.runMutation(internal.guestTrials.finishTryOn,{id,note});throw new ConvexError(note);
 }
}});

export const wardrobe=action({args:{token:tokenValidator,jpegBase64:v.string()},returns:v.object({analysis:photoAnalysisValidator}),handler:async(ctx,{token,jpegBase64}):Promise<{analysis:any}>=>{
 if(!await getAuthUserId(ctx))throw new ConvexError('Sign in to add clothes to your wardrobe.');
 if(!validToken(token))throw new ConvexError('Please reload and try again.');const bytes=decodeJpeg(jpegBase64),key=process.env.GEMINI_API_KEY;if(!key)throw new ConvexError('Photo analysis is temporarily unavailable. Please try later.');const id=await ctx.runMutation(internal.guestTrials.claim,{tokenHash:await hashSecret(token),kind:'wardrobe'});
 try{const google=createGoogleGenerativeAI({apiKey:key});const result=await generateObject({model:google(process.env.GEMINI_MODEL||'gemini-3.1-flash-lite'),schema:analysisSchema,maxOutputTokens:1400,maxRetries:0,abortSignal:AbortSignal.timeout(30_000),system:'Read one garment in this image, not the person. Return only visible clothing details. Exact size only from a clearly legible label. Never infer body type, measurements, identity, age, ethnicity or attractiveness. Brand only when a logo or label is clearly readable. Fabric composition only from a readable care label. If not one clear garment, set singleItemVisible=false. Keep unknown fields empty; be factual.',prompt:[{role:'user',content:[{type:'text',text:'Describe this clothing item so the owner can review it before saving.'},{type:'file',data:bytes,mediaType:'image/jpeg'}]}]});const {singleItemVisible,...analysis}=result.object;if(!singleItemVisible)throw new Error('Choose a clear photo of just one clothing piece.');analysis.details.name=wardrobeTitle(analysis.details as any);if(!analysis.brandEvidence.trim())analysis.details.brand='';if(!analysis.details.fabric)analysis.uncertainties.push('Material is not confirmed from the photo.');analysis.details.attributes=Object.fromEntries(Object.entries(analysis.details.attributes??{}).filter(([key,value])=>categoryAttributes[analysis.details.category].includes(key)&&value.trim())) as any;validateGarment(analysis.details as any);await ctx.runMutation(internal.guestTrials.finishWardrobe,{id,analysis});await ctx.scheduler.runAfter(30*60_000,internal.guestTrials.cleanup,{id});return {analysis};}
 catch(error){await ctx.runMutation(internal.guestTrials.finishWardrobe,{id});throw new ConvexError(error instanceof Error?error.message.slice(0,240):'The clothing photo could not be read. Please try again.');}
}});
