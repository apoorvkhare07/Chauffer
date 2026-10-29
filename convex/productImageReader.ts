"use node";
import {allowedImageUrl} from './discoveryRules';
export async function imageBytes(url:string,deadline:number):Promise<Uint8Array>{
 if(!allowedImageUrl(url))throw new Error('Image host unavailable');
 const r=await fetch(url,{headers:{'User-Agent':'ChauffeurImageReader/1.0'},redirect:'error',signal:AbortSignal.timeout(Math.max(1,Math.min(5000,deadline-Date.now())))});
 if(!r.ok||!/^image\/(jpeg|png|webp)(;|$)/i.test(r.headers.get('content-type')??''))throw new Error('Image unavailable');
 const reader=r.body?.getReader();if(!reader)throw new Error('Empty image');const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const x=await reader.read();if(x.done)break;size+=x.value.length;if(size>500000)throw new Error('Large image');chunks.push(x.value);}}finally{await reader.cancel();}
 return new Uint8Array(Buffer.concat(chunks));
}
