import {track,inAppBrowser,tryOnAnalyticsContext} from '../analytics';
import {trackTryOnExport} from './creationAnalytics';
const messages={AbortError:'The save was cancelled.',NotAllowedError:'The browser did not allow saving this file.',SecurityError:'The browser blocked file access.',NetworkError:'The file could not be downloaded.',TypeError:'The file could not be downloaded.',QuotaExceededError:'There is not enough space to save the file.'};
export function exportFailure(error){return {reason:error?.name==='AbortError'?'cancelled':error?.name==='NotAllowedError'||error?.name==='SecurityError'?'blocked':'export_failed',error_message:messages[error?.name]??'The file could not be saved. Please try again.'};}
export function mediaBlob(url){
 // Generated previews already contain the file. Decode locally so opening the
 // phone share sheet does not wait for a fetch and lose the user's tap.
 const match=typeof url==='string'&&url.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\r\n]+)$/);
 if(match){const binary=atob(match[2]);return new Blob([Uint8Array.from(binary,char=>char.charCodeAt(0))],{type:match[1]});}
 return fetch(url).then(response=>{if(!response.ok)throw new DOMException('File request failed','NetworkError');return response.blob();});
}
export function exportUserMessage(error){
 if(error?.name==='AbortError')return 'Save cancelled. Your preview is still here.';
 if(inAppBrowser()!=='none'&&['NotSupportedError','NotAllowedError','SecurityError'].includes(error?.name))return 'This in-app browser could not save the file. Try pressing and holding the preview to save the image. Keep this page open: an unsaved preview will not follow you into another browser.';
 return 'Could not save this preview. Please try again.';
}
// A download anchor gives no completion callback. Only a successfully closed file
// write produces *_export_downloaded; fallback handoffs never masquerade as saves.
export async function exportMedia({loadBlob,filename='chauffer-try-on',kind='download',properties={},family='tryon'}){
 const context=family==='tryon'?tryOnAnalyticsContext(properties):properties;
 const confirmed=typeof window.showSaveFilePicker==='function'&&inAppBrowser()==='none';
 const embedded=inAppBrowser()!=='none';
 const metadata={...context,kind,export_method:embedded?'web_share':confirmed?'file_system':'browser_download',completion_verifiable:confirmed||embedded};
 if(family==='tryon')trackTryOnExport(kind,metadata);else track(`${family}_exported`,metadata);
 let writable;
 try{
  const loading=loadBlob();
  const blob=loading instanceof Blob?loading:await loading;
  const extension=blob.type==='video/mp4'?'mp4':blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg';
  const name=`${filename}.${extension}`;
  if(inAppBrowser()!=='none'){
   const file=new File([blob],name,{type:blob.type});
   metadata.export_method='web_share';metadata.completion_verifiable=true;
   if(typeof navigator.share!=='function'||!navigator.canShare?.({files:[file]}))throw new DOMException('File sharing unavailable','NotSupportedError');
   await navigator.share({files:[file]});
   // This confirms the share handoff, not a write to the user's photo library.
   track(`${family}_export_downloaded`,{...metadata,completion_type:'share_handoff'});return 'shared';
  }
  if(confirmed){
   const handle=await window.showSaveFilePicker({suggestedName:name});
   writable=await handle.createWritable();await writable.write(blob);await writable.close();writable=null;
   track(`${family}_export_downloaded`,{...metadata,completion_type:'file_saved'});return 'saved';
  }
  const href=URL.createObjectURL(blob),anchor=document.createElement('a');
  try{anchor.href=href;anchor.download=name;document.body.appendChild(anchor);anchor.click();}finally{anchor.remove();setTimeout(()=>URL.revokeObjectURL(href),60000);}
  return 'handed_off';
 }catch(error){if(writable)try{await writable.abort();}catch{}track(`${family}_export_failed`,{...metadata,...exportFailure(error)});throw error;}
}
