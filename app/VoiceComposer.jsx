import React,{useEffect,useRef,useState} from 'react';
import {useAction} from 'convex/react';
import {Mic,Square} from 'lucide-react';
import {api} from '../convex/_generated/api';

const LIMIT_MS=20000,MAX_BYTES=700000;

export default function VoiceComposer({value='',onText,disabled=false,label='Speak your request',guestToken}){
 const read=useAction(api.shoppingInput.read),readGuest=useAction(api.guestVoice.read);
 const [recording,setRecording]=useState(false),[working,setWorking]=useState(false),[message,setMessage]=useState('');
 const recorder=useRef(null),stream=useRef(null),timer=useRef(null),alive=useRef(true),valueRef=useRef(value);
 valueRef.current=value;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;clearTimeout(timer.current);if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(track=>track.stop());};},[]);

 async function transcribe(file){
  if(file.size>MAX_BYTES)throw new Error('That recording was too large. Try a shorter voice request.');
  const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('Could not read the recording.'));reader.readAsDataURL(file);});
  let mime=file.type.split(';')[0];if(mime==='audio/x-m4a'||mime==='video/mp4')mime='audio/mp4';if(mime==='audio/x-wav')mime='audio/wav';
  const result=guestToken?await readGuest({token:guestToken,base64,mime}):await read({kind:'voice',base64,mime,consent:true});
  if(!alive.current)return;
  if(!result.text?.trim()){setMessage(result.uncertainties?.[0]||'I couldn’t make out the request. Try again or type it instead.');return;}
  const prefix=valueRef.current.trim(),transcript=result.text.trim();onText(prefix?`${prefix} ${transcript}`:transcript);setMessage('Voice added. Review or edit it before sending.');
 }

 async function start(){
  setMessage('');
  try{
   if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw new Error('Voice recording is not supported in this browser. You can type your request instead.');
   const mime=['audio/webm;codecs=opus','audio/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
   if(!mime)throw new Error('Voice recording is not supported in this browser. You can type your request instead.');
   const activeStream=await navigator.mediaDevices.getUserMedia({audio:true});
   if(!alive.current){activeStream.getTracks().forEach(track=>track.stop());return;}
   stream.current=activeStream;const chunks=[];const rec=new MediaRecorder(activeStream,{mimeType:mime,audioBitsPerSecond:32000});recorder.current=rec;
   rec.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
   rec.onstop=async()=>{
    clearTimeout(timer.current);activeStream.getTracks().forEach(track=>track.stop());if(stream.current===activeStream)stream.current=null;
    if(!alive.current)return;setRecording(false);setWorking(true);
    try{await transcribe(new File(chunks,'voice-request',{type:mime.split(';')[0]}));}
    catch(error){if(alive.current)setMessage(error.name==='NotAllowedError'?'Microphone access was declined. You can type your request instead.':String(error.message||'Could not transcribe that recording. Try again or type instead.'));}
    finally{if(alive.current)setWorking(false);}
   };
   rec.onerror=()=>{activeStream.getTracks().forEach(track=>track.stop());if(alive.current){setRecording(false);setMessage('Recording failed. Please try again or type instead.');}};
   rec.start(500);setRecording(true);timer.current=setTimeout(()=>{if(rec.state==='recording')rec.stop();},LIMIT_MS);
  }catch(error){setMessage(error.name==='NotAllowedError'?'Microphone access was declined. You can type your request instead.':String(error.message||'Could not start the microphone.'));}
 }

 function stop(){if(recorder.current?.state==='recording')recorder.current.stop();}
 return <span className="voice-composer"><button type="button" className={`voice-composer-button${recording?' is-recording':''}`} aria-label={recording?'Stop recording':label} title={recording?'Stop recording':`${label}. Voice is transcribed into text for review.`} aria-describedby="voice-processing-note" disabled={disabled||working} onClick={recording?stop:start}>{recording?<Square size={17} fill="currentColor"/>:<Mic size={19}/>}</button><span id="voice-processing-note" className="sr-only">Your recording is transcribed into editable text before it is sent to the assistant.</span>{(recording||working||message)&&<span className="voice-composer-status" role="status">{recording?'Listening…':working?'Transcribing…':message}</span>}</span>;
}
