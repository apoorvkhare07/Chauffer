export const PHOTO_ACCEPT='image/jpeg,image/png,image/webp,image/heic,image/heif,image/heic-sequence,image/heif-sequence,.heic,.heif';
export const PHOTO_FORMATS='JPEG, PNG, WebP or HEIC';
const webTypes=['image/jpeg','image/png','image/webp'];
const heicTypes=['image/heic','image/heif','image/heic-sequence','image/heif-sequence'];
const prepared=new WeakMap();
export function validatePhoto(file){
 if(!file||file.size>12000000)throw new Error(`Choose a ${PHOTO_FORMATS} photo smaller than 12 MB.`);
 if(![...webTypes,...heicTypes].includes(file.type)&&!(/\.(heic|heif|jpe?g|png|webp)$/i.test(file.name||'')&&['','application/octet-stream'].includes(file.type)))throw new Error(`Choose a ${PHOTO_FORMATS} photo.`);
}
function loadImage(blob){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(blob),image=new Image();image.onload=()=>{URL.revokeObjectURL(url);resolve(image);};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('That photo could not be read.'));};image.src=url;});}
export async function viewablePhoto(file){
 validatePhoto(file);
 if(prepared.has(file))return prepared.get(file);
 const task=(async()=>{
  const header=new Uint8Array(await file.slice(0,64).arrayBuffer());
  const brands=String.fromCharCode(...header);
  const isHeic=heicTypes.includes(file.type)||(!webTypes.includes(file.type)&&/\.(heic|heif)$/i.test(file.name||''))||(brands.slice(4,8)==='ftyp'&&/heic|heix|hevc|hevx|heim|heis|hevm|hevs|mif1|msf1/.test(brands));
  if(!isHeic)return file;
  // Safari may already decode HEIC; other browsers load the converter only when needed.
  try{await loadImage(file);return file;}catch{}
  try{const {heicTo}=await import('heic-to/csp');return await heicTo({blob:file,type:'image/jpeg',quality:.85});}
  catch{throw new Error('This HEIC photo could not be converted. Try another photo or export it as JPEG.');}
 })();
 prepared.set(file,task);
 try{return await task;}catch(error){prepared.delete(file);throw error;}
}
export async function jpegPhoto(file){
 const image=await loadImage(await viewablePhoto(file));
 const scale=Math.min(1,1000/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);
 const context=canvas.getContext('2d');if(!context)throw new Error('Photo conversion is unavailable. Please try another browser.');
 context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
 let base64=canvas.toDataURL('image/jpeg',.75).split(',')[1];if(base64.length>930000)base64=canvas.toDataURL('image/jpeg',.45).split(',')[1];if(base64.length>930000)throw new Error('Choose a smaller photo.');return base64;
}
