'use node';
import {v,ConvexError,type Infer} from 'convex/values';
import {getAuthUserId} from '@convex-dev/auth/server';
import {action} from './_generated/server';
import type {ActionCtx} from './_generated/server';
import type {Id} from './_generated/dataModel';
import {internal} from './_generated/api';
import {creatorInput,creatorSettings,validateDirection} from './creatorRules';
import {decodeJpeg} from './stylingRules';
import {renderCreator} from './creatorRenderer';
async function readInput(ctx:ActionCtx,source:Infer<typeof creatorInput>){
 if(source.kind==='upload')return decodeJpeg(source.jpeg);
 const id=await ctx.runQuery(internal.creator.source,{source});const blob=await ctx.storage.get(id);
 if(!blob||blob.size>7_500_000)throw new ConvexError('This image is unavailable. Choose another.');return new Uint8Array(await blob.arrayBuffer());
}
export const generate=action({args:{...creatorSettings,primary:v.optional(creatorInput),model:v.optional(creatorInput),consent:v.boolean()},returns:v.id('creatorDrafts'),handler:async(ctx,args):Promise<Id<'creatorDrafts'>>=>{
 if(!await getAuthUserId(ctx))throw new ConvexError('Please sign in.');
 validateDirection(args);if(!args.consent)throw new ConvexError('Agree to send these images to Google for generation.');
 if(args.kind!=='model'&&!args.primary)throw new ConvexError('Add a product photo or a finished look first.');
 if(args.kind!=='photo'&&args.model)throw new ConvexError('Use one reference photo for this creation.');
 // Ownership and image size checks precede the paid model request. Inputs are never saved.
 const images:Uint8Array[]=[];if(args.primary)images.push(await readInput(ctx,args.primary));if(args.model)images.push(await readInput(ctx,args.model));
 const id=await ctx.runMutation(internal.creator.claim,{kind:args.kind,consent:args.consent});let outputId:Id<'_storage'>|undefined;
 try{const result=await renderCreator(args,images);outputId=await ctx.storage.store(new Blob([new Uint8Array(result.bytes)],{type:result.mime}));await ctx.runMutation(internal.creator.finish,{id,outputId,mime:result.mime,note:''});return id;}
 catch(error){if(!(error instanceof ConvexError))console.warn('Creator generation failure',JSON.stringify({kind:args.kind,stage:outputId?'save':'render',reason:error instanceof Error&&/^(provider [0-9]{3}|large|empty|model|invalid video|invalid image)$/.test(error.message)?error.message:error instanceof Error?error.name:'unknown'}));if(outputId)await ctx.storage.delete(outputId);const note=error instanceof ConvexError?String(error.data):'This creation could not finish. Your inputs are still here; try again.';await ctx.runMutation(internal.creator.finish,{id,note});throw new ConvexError(note);}
}});
