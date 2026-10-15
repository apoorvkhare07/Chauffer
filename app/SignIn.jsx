import React,{useEffect,useRef,useState} from 'react';
import {useAuthActions} from '@convex-dev/auth/react';
import {useAction,useMutation} from 'convex/react';
import {api} from '../convex/_generated/api';
import {loadOtpWidget,widgetCall} from './otpWidget';
export default function SignIn(){
 const {signIn}=useAuthActions();
 const begin=useAction(api.otp.beginWidget),sent=useMutation(api.otp.widgetSent),verifyToken=useAction(api.otp.verifyWidget);
 const attempt=useRef(null),providerToken=useRef(null);
 const [phone,setPhone]=useState(''),[code,setCode]=useState(''),[challenge,setChallenge]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[retryAt,setRetryAt]=useState(0),[now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const seconds=Math.max(0,Math.ceil((retryAt-now)/1000));
 function fail(e){setError(typeof e?.data==='string'?e.data: /MSG91|security check|code|verification/i.test(e?.message??'')?e.message.split('\n')[0]:'Could not sign in. Please try again.');}
 async function request(event){event?.preventDefault();setBusy(true);setError('');try{
  if(!attempt.current||attempt.current.phone!==phone||challenge){const config=await begin({phone});attempt.current={...config,phone};providerToken.current=null;setChallenge(null);setCode('');await loadOtpWidget(config);}
  if(!window.isCaptchaVerified?.()){setError('Complete the security check below, then press Send code.');return;}
  const result=await widgetCall('sendOtp','91'+phone),requestId=result.reqId??result.requestId??result.message;
  if(typeof requestId!=='string')throw new Error('MSG91 did not return a code request ID.');
  await sent({id:attempt.current.id,requestId});attempt.current.requestId=requestId;setChallenge(attempt.current.id);setCode('');setRetryAt(Date.now()+60000);
 }catch(e){fail(e);}finally{setBusy(false);}}
 async function verify(event){event.preventDefault();setBusy(true);setError('');try{
  if(!providerToken.current){const result=await widgetCall('verifyOtp',code,attempt.current.requestId);providerToken.current=result['access-token']??result.message;}const token=providerToken.current;
  const secret=await verifyToken({id:challenge,token});await signIn('msg91',{challenge,secret});
 }catch(e){fail(e);}finally{setBusy(false);}}
 return <><h2>{challenge?'Check your messages':'Continue with your phone'}</h2><p className="account-note">{challenge?`Enter the SMS code sent to +91 ${phone}.`:'Sign in or create your account with a one-time SMS code.'}</p>
 <form className="account-form" onSubmit={challenge?verify:request}>
 {!challenge?<label className="account-field">Mobile number (+91)<input type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="10-digit mobile number" required value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} disabled={busy}/></label>:<label className="account-field">SMS code<input type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={8} required value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} disabled={busy}/></label>}
 <button className="button primary" disabled={busy||(challenge?code.length<4:phone.length!==10||seconds>0)}>{busy?'Please wait…':challenge?'Verify and continue':seconds?`Send code in ${seconds}s`:'Send code'}</button>
 </form><div id="chauffeur-captcha" aria-label="Security check"/>
 {challenge&&<><button className="account-switch" disabled={busy||seconds>0} onClick={request}>{seconds?`Resend in ${seconds}s`:'Send a new code'}</button><button className="account-switch" disabled={busy} onClick={()=>{setChallenge(null);attempt.current=null;setCode('');setError('');}}>Change number</button></>}
 {error&&<p className="account-feedback account-error" role="alert">{error}</p>}</>;
}
