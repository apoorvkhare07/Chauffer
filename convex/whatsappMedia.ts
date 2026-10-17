"use node";
import sharp from 'sharp';
import {v} from 'convex/values';
import {internalAction} from './_generated/server';
import {internal} from './_generated/api';
import {mediaPurpose} from './whatsappUi';
import {readInputForOwner} from './shoppingInput';
import {analysePhotoForOwner} from './wardrobePhoto';

// Metadata and bytes come from Meta only. Never fetch a URL from a chat message.
async function downloadMedia(mediaId:string,token:string,kind:'image'|'voice'){
 const limit=kind==='image'?5_000_000:700000;
 if(!/^\d{1,100}$/.test(mediaId))throw new Error('Invalid media');
 const headers={Authorization:`Bearer ${token}`};
 const metadata=await fetch(`https://graph.facebook.com/v25.0/${mediaId}?phone_number_id=${encodeURIComponent(process.env.WHATSAPP_PHONE_ID??'')}`,{headers,signal:AbortSignal.timeout(15000),redirect:'error'});
 if(!metadata.ok)throw new Error('Media unavailable');
 const data=await metadata.json();const url=new URL(data.url),mime=String(data.mime_type??'').split(';')[0].trim();
 if(url.protocol!=='https:'||url.username||url.password||url.port||!(url.hostname==='lookaside.fbsbx.com'||url.hostname.endsWith('.fbcdn.net'))||!(kind==='image'?['image/jpeg','image/png']:['audio/ogg','audio/webm','audio/mpeg','audio/mp4','audio/wav']).includes(mime)||!Number.isFinite(data.file_size)||data.file_size>limit)throw new Error('Unsupported media');
 const response=await fetch(url,{headers,signal:AbortSignal.timeout(15000),redirect:'error'});
 if(!response.ok||!response.body)throw new Error('Media unavailable');
 const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw new Error('Photo too large');chunks.push(value);}}finally{await reader.cancel();}
 return {bytes:Buffer.concat(chunks),mime};
}
export async function downloadImage(mediaId:string,token:string):Promise<string>{
 const {bytes}=await downloadMedia(mediaId,token,'image');
 const jpeg=await sharp(bytes,{limitInputPixels:25000000}).rotate().resize({width:1200,height:1600,fit:'inside',withoutEnlargement:true}).jpeg({quality:75}).toBuffer();
 if(jpeg.length>700000)throw new Error('Photo too large');return jpeg.toString('base64');
}
export const analyse=internalAction({args:{id:v.id('waInbox'),purpose:mediaPurpose},returns:v.null(),handler:async(ctx,{id,purpose}):Promise<null>=>{
 const input=await ctx.runMutation(internal.whatsappChannel.claimMedia,{id,purpose});if(!input)return null;
 try{
  const voice=purpose==='voice'?await downloadMedia(input.mediaId,process.env.WHATSAPP_TOKEN??'','voice'):null;
  const jpegBase64=voice?'':await downloadImage(input.mediaId,process.env.WHATSAPP_TOKEN??'');
  // Recheck after download before sending private content to AI.
  if(!await ctx.runQuery(internal.whatsappChannel.mediaCurrent,{id}))return null;
  if(purpose==='voice'||purpose==='search'){
   const result=await readInputForOwner(ctx,input.owner,{kind:voice?'voice':'photo',base64:voice?voice.bytes.toString('base64'):jpegBase64,mime:voice?.mime??'image/jpeg',consent:true});
   await ctx.runMutation(internal.whatsappChannel.inputReady,{id,text:result.text,uncertainties:result.uncertainties});
  }else if(purpose==='wardrobe'){
   const result=await analysePhotoForOwner(ctx,input.owner,jpegBase64);
   await ctx.runMutation(internal.whatsappChannel.photoReady,{id,draftId:result.id});
  }else{
   const bytes=Buffer.from(jpegBase64,'base64');
   await ctx.runMutation(internal.styling.claimPhoto,{owner:input.owner});
   const photoId=await ctx.storage.store(new Blob([bytes],{type:'image/jpeg'}));
   const attached=await ctx.runMutation(internal.whatsappChannel.attachBody,{id,photoId});if(!attached){await ctx.storage.delete(photoId);return null;}
   await ctx.runAction(internal.stylingPhoto.analyse,{owner:input.owner,photoId});
   await ctx.runMutation(internal.whatsappChannel.bodyReady,{id,photoId});
  }
 }catch{await ctx.runMutation(internal.whatsappChannel.mediaFailed,{id});}
 return null;
}});
