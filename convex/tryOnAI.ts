"use node";
import {v} from 'convex/values';
import {internalAction} from './_generated/server';
import {internal} from './_generated/api';
import {PreviewError,merchantImage,renderTryOn} from './tryOnRenderer';
import {imageMime} from './stylingRules';
import type {Id} from './_generated/dataModel';
export const generate=internalAction({args:{id:v.id('tryOnPreviews')},returns:v.null(),handler:async(ctx,{id}):Promise<null>=>{
 let outputId:Id<'_storage'>|undefined;
 try{
 const plan=await ctx.runQuery(internal.tryOn.plan,{id});if(!plan)throw new PreviewError('changed');const key=process.env.GEMINI_API_KEY;if(!key)throw new PreviewError('model_unavailable');const portrait=await ctx.storage.get(plan.photoId);if(!portrait)throw new PreviewError('changed');
 let garment;if(plan.garmentPhotoId){const blob=await ctx.storage.get(plan.garmentPhotoId);if(!blob)throw new PreviewError('changed');const bytes=new Uint8Array(await blob.arrayBuffer());garment={mimeType:imageMime(bytes),data:Buffer.from(bytes).toString('base64')};}else if(plan.garmentImageUrl)garment=await merchantImage(plan.garmentImageUrl);else throw new PreviewError('image_unavailable');
 const {bytes,mime}=await renderTryOn(new Uint8Array(await portrait.arrayBuffer()),garment,plan.title,plan.target);
 outputId=await ctx.storage.store(new Blob([new Uint8Array(bytes)],{type:mime}));await ctx.runMutation(internal.tryOn.finish,{id,outputId});
 }catch(error){if(outputId)await ctx.storage.delete(outputId);await ctx.runMutation(internal.tryOn.finish,{id,failureCode:error instanceof PreviewError?error.code:'provider_error'});}return null;
}});
