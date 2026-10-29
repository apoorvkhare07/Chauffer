"use node";
import sharp from 'sharp';
// A veto only: blue pixels never prove that the garment is blue (the model checks
// the object/background). Their absence prevents a hallucinated blue match.
export async function lacksBluePixels(data:Uint8Array):Promise<boolean>{
 const {data:pixels,info}=await sharp(data).rotate().resize(160,160,{fit:'inside'}).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
 let blue=0;const count=info.width*info.height;
 for(let i=0;i<pixels.length;i+=info.channels){const r=pixels[i],g=pixels[i+1],b=pixels[i+2];if(b>25&&b>r*1.2&&b>g*1.04&&b-r>12)blue++;}
 return blue/count<0.005;
}
