"use node";
// Development-only visual regression check. Fixed public test assets, no user data.
import {internalAction} from './_generated/server';
import {v} from 'convex/values';
import sharp from 'sharp';
import {identifyTryOnTarget} from './tryOnTarget';
import {renderTryOn} from './tryOnRenderer';
export const run=internalAction({args:{sample:v.union(v.literal('dupatta'),v.literal('kurta'),v.literal('shoes'))},returns:v.object({base64:v.string(),mime:v.string(),target:v.string(),elapsedMs:v.number()}),handler:async(_ctx,{sample})=>{
 if(process.env.CONVEX_CLOUD_URL!=='https://mellow-spaniel-636.convex.cloud')throw Error('Development only');
 const cases={dupatta:{file:'edits/diwali/dupatta.webp',title:'Muffly maroon Banarasi dupatta with zari'},kurta:{file:'edits/diwali/kurta.webp',title:'Libas mustard embroidered silk-blend straight kurta'},shoes:{file:'wardrobe-brown-loafers.jpg',title:'Brown leather loafers'}};
 const get=async(path:string)=>{const response=await fetch('https://chauffer.studio/images/'+path,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Test asset unavailable');const bytes=await response.arrayBuffer();if(bytes.byteLength>3000000)throw Error('Test asset too large');return sharp(Buffer.from(bytes)).flatten({background:'#fff'}).jpeg({quality:85}).toBuffer();};
 const [portrait,product]=await Promise.all([get('creator-walking.webp'),get(cases[sample].file)]),start=Date.now();
 const output=await renderTryOn(portrait,{mimeType:'image/jpeg',data:product.toString('base64')},cases[sample].title);
 return {base64:Buffer.from(output.bytes).toString('base64'),mime:output.mime,target:output.target,elapsedMs:Date.now()-start};
}});

export const inspect=internalAction({args:{sample:v.union(v.literal('dupatta'),v.literal('shoes'),v.literal('accessory'),v.literal('cropped_shoes'),v.literal('ambiguous'))},returns:v.any(),handler:async(_ctx,{sample})=>{
 if(process.env.CONVEX_CLOUD_URL!=='https://mellow-spaniel-636.convex.cloud')throw Error('Development only');
 const get=async(path:string)=>{const response=await fetch('https://chauffer.studio/images/'+path,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Test asset unavailable');const bytes=await response.arrayBuffer();if(bytes.byteLength>3000000)throw Error('Test asset too large');return sharp(Buffer.from(bytes)).jpeg().toBuffer();};
 const portrait=await get(sample==='cropped_shoes'?'tryon-black-jacket-before.webp':'creator-walking.webp'),product=await get(sample==='dupatta'?'edits/diwali/dupatta.webp':sample==='accessory'?'edits/diwali/jhumkas.webp':sample==='ambiguous'?'creator-walking.webp':'wardrobe-brown-loafers.jpg');let raw:unknown=null,accepted=false,failure='';
 try{await identifyTryOnTarget(portrait,{mimeType:'image/jpeg',data:product.toString('base64')},sample==='dupatta'?'Muffly maroon Banarasi dupatta with zari':sample==='accessory'?'Zaveri Pearls gold-toned jhumkas earrings':sample==='ambiguous'?'Uploaded clothing':'Brown leather loafers','auto',value=>{raw=value;});accepted=true;}catch(error){failure=error instanceof Error?error.message:'failed';}return {analysis:raw,accepted,failure};
}});
