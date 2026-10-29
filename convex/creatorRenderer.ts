'use node';
import sharp from 'sharp';
import {ConvexError} from 'convex/values';
import {imageMime} from './stylingRules';
import {creatorPrompt} from './creatorRules';
export async function compactCreatorImage(bytes:Uint8Array){
 try{return await sharp(Buffer.from(bytes),{limitInputPixels:40_000_000}).rotate().resize({width:1536,height:1536,fit:'inside',withoutEnlargement:true}).flatten({background:'#ffffff'}).jpeg({quality:88}).toBuffer();}
 catch{throw new ConvexError('This image could not be read. Choose another photo.');}
}
async function bounded(response:Response,max:number){
 if(Number(response.headers.get('content-length')??0)>max)throw new Error('large');
 const reader=response.body?.getReader();if(!reader)throw new Error('empty');let size=0;const chunks:Uint8Array[]=[];
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>max){await reader.cancel();throw new Error('large');}chunks.push(part.value);}return Buffer.concat(chunks,size);
}
export async function renderCreator(settings:{kind:'photo'|'model'|'video';aspect:string;direction:string;scene:string;pose:string},images:Uint8Array[]){
 const key=process.env.GEMINI_API_KEY;if(!key)throw new ConvexError('Creation is unavailable right now. Please try later.');
 const video=settings.kind==='video',model=video?(process.env.GEMINI_CREATOR_VIDEO_MODEL||'gemini-omni-1.1-flash'):(process.env.GEMINI_TRYON_MODEL||'gemini-3.1-flash-image');
 if(!/^gemini-[a-z0-9.-]+$/.test(model))throw new Error('model');
 const refs=await Promise.all(images.map(compactCreatorImage));
 const prompt=creatorPrompt(settings,settings.kind==='photo'&&refs.length>1);
 const body=video?{model,background:false,store:false,stream:false,input:[{type:'text',text:prompt},...refs.map(b=>({type:'image',mime_type:'image/jpeg',data:b.toString('base64')}))],response_format:{type:'video',aspect_ratio:settings.aspect,resolution:'720p'}}:{contents:[{role:'user',parts:[{text:prompt},...refs.map(b=>({inlineData:{mimeType:'image/jpeg',data:b.toString('base64')}}))]}],generationConfig:{responseModalities:['IMAGE'],imageConfig:{aspectRatio:settings.aspect,imageSize:'1K'},...(model==='gemini-3.1-flash-image'?{thinkingConfig:{thinkingLevel:'minimal'}}:{})}};
 const response=await fetch(video?'https://generativelanguage.googleapis.com/v1beta/interactions':`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(body),signal:AbortSignal.timeout(video?240_000:120_000)});
 if(!response.ok){
  let reason='unknown',billingReason='unknown';
  try{const problem=JSON.parse((await bounded(response,16000)).toString());const code=problem.error?.status;if(typeof code==='string'&&/^[A-Z_]{1,60}$/.test(code))reason=code;const message=String(problem.error?.message??'');billingReason=/credit|balance|fund/i.test(message)?'credits':/spend|budget/i.test(message)?'budget':/bill|payment/i.test(message)?'billing':/quota|limit/i.test(message)?'quota':'unknown';}catch{}
  console.warn('Creator provider failure',JSON.stringify({kind:settings.kind,status:response.status,reason,billingReason}));
  if(response.status===402)throw new ConvexError('Google has paused creation because the app’s AI credits or billing allowance are exhausted. The app owner needs to restore the allowance; changing your photo or retrying will not fix it.');if([403,404].includes(response.status))throw new ConvexError(video?'Video generation is not available on this account yet. You can still create and download photos.':'Image generation is unavailable right now. Try again later.');if(response.status===429)throw new ConvexError('The creation service is busy. Please try again later.');throw new Error(`provider ${response.status}`);}
 const data=JSON.parse((await bounded(response,video?48_000_000:12_000_000)).toString());
 const output=video?data.steps?.filter((s:any)=>s.type==='model_output').flatMap((s:any)=>s.content??[]).find((p:any)=>p.type==='video'&&p.data):data.candidates?.[0]?.content?.parts?.find((p:any)=>p.inlineData?.data&&!p.thought)?.inlineData;
 const encoded=output?.data;if(typeof encoded!=='string'||!encoded.length||encoded.length>(video?44_000_000:10_000_000)||!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))throw new ConvexError('No usable result was returned. Try a clearer photo or different direction.');
 const bytes=Buffer.from(encoded,'base64');
 if(video){if(output.mime_type!=='video/mp4'||bytes.length<128||bytes.toString('ascii',4,8)!=='ftyp')throw new Error('invalid video');return {bytes,mime:'video/mp4'};}
 if(bytes.length<128||bytes.length>7_500_000||imageMime(bytes)!==output.mimeType)throw new Error('invalid image');
 // Decode pixels as well as checking the header before making the output available.
 await sharp(Buffer.from(bytes),{limitInputPixels:40_000_000}).metadata();
 return {bytes,mime:output.mimeType as string};
}
