import {track} from '../analytics';
import React,{useEffect,useRef,useState} from 'react';
import {useAuthActions} from '@convex-dev/auth/react';
import {useAction,useMutation,useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
import {loadOtpWidget,widgetCall} from './otpWidget';
export default function SignIn(){
 const local=import.meta.env.DEV&&['localhost','127.0.0.1','[::1]'].includes(window.location.hostname)&&import.meta.env.VITE_CONVEX_URL==='https://mellow-spaniel-636.convex.cloud';
 const enabled=useQuery(api.localTestAuth.availability,local?{}:'skip');
 if(local&&enabled===undefined)return <p role="status">Checking local sign-in…</p>;
 return local&&enabled?<LocalTestSignIn/>:<PhoneSignIn/>;
}
function LocalTestSignIn(){
 const {signIn}=useAuthActions();
 const [phone,setPhone]=useState(''),[code,setCode]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <><h2>Log in</h2><p className="account-note">Local test sign-in. Use number <strong>0000000000</strong> and code <strong>123456</strong>. No SMS or security puzzle is needed. This shared test account uses development data only; do not add private information.</p>
 <form className="account-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const result=await signIn('local-test',{phone,code});if(!result.signingIn)throw new Error('Invalid test credentials');}catch{setError('The test number or code is incorrect, or local test sign-in is disabled.');}finally{setBusy(false);}}}>
 <label className="account-field">Test mobile number<input inputMode="numeric" autoComplete="off" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} maxLength={10} required disabled={busy}/></label>
 <label className="account-field">Test code<input inputMode="numeric" autoComplete="off" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} maxLength={6} required disabled={busy}/></label>
 <button className="button primary" disabled={busy||phone.length!==10||code.length!==6}>{busy?'Signing in…':'Sign in to test account'}</button>
 </form>{error&&<p role="alert" className="account-feedback account-error">{error}</p>}</>;
}
function PhoneSignIn(){
 const {signIn}=useAuthActions();
 const config=useAction(api.otp.widgetConfig);
 const [widgetReady,setWidgetReady]=useState(false);
 const initialized=useRef(false);
 const begin=useAction(api.otp.beginWidget),sent=useMutation(api.otp.widgetSent),verifyToken=useAction(api.otp.verifyWidget);
 const attempt=useRef(null),providerToken=useRef(null);
 const [phone,setPhone]=useState(''),[code,setCode]=useState(''),[challenge,setChallenge]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[retryAt,setRetryAt]=useState(0),[now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{if(initialized.current)return;initialized.current=true;config({}).then(loadOtpWidget).then(()=>setWidgetReady(true)).catch(fail);},[config]);
 const seconds=Math.max(0,Math.ceil((retryAt-now)/1000));
 function fail(e){setError(typeof e?.data==='string'?e.data: /MSG91|security check|code|verification/i.test(e?.message??'')?e.message.split('\n')[0]:'Could not sign in. Please try again.');}
 async function request(event){event?.preventDefault();setBusy(true);setError('');try{
  if(!widgetReady)throw new Error('The security check is still loading. Please wait.');
  if(!window.isCaptchaVerified?.()){setError('Complete the security check, then press Send code.');return;}
  if(!attempt.current||attempt.current.phone!==phone||challenge){const config=await begin({phone});attempt.current={...config,phone};providerToken.current=null;setChallenge(null);setCode('');}
  const result=await widgetCall('sendOtp','91'+phone),requestId=result.reqId??result.requestId??result.message;
  if(typeof requestId!=='string')throw new Error('MSG91 did not return a code request ID.');
  await sent({id:attempt.current.id,requestId});attempt.current.requestId=requestId;setChallenge(attempt.current.id);setCode('');setRetryAt(Date.now()+60000);
 }catch(e){fail(e);}finally{setBusy(false);}}
 async function verify(event){event.preventDefault();setBusy(true);setError('');try{
  if(!providerToken.current){const result=await widgetCall('verifyOtp',code,attempt.current.requestId);providerToken.current=result['access-token']??result.message;}const token=providerToken.current;
  const secret=await verifyToken({id:challenge,token});await signIn('msg91',{challenge,secret});track('login_completed',{method:'phone_otp'});
 }catch(e){fail(e);}finally{setBusy(false);}}
 return <><h2>Log in</h2><p className="account-note">{challenge?`Enter the SMS code sent to +91 ${phone}.`:'Use your mobile number to log in or create an account. We’ll send you a one-time SMS code.'}</p>
 <form data-analytics={challenge?'verify_otp':'send_otp'} className="account-form" onSubmit={challenge?verify:request}>
 {!challenge?<label className="account-field">Mobile number (+91)<input type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="10-digit mobile number" required value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} disabled={busy}/></label>:<label className="account-field">SMS code<input type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={8} required value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} disabled={busy}/></label>}
 <div id="chauffeur-captcha" aria-label="Security check" hidden={!!challenge}/>
 {!challenge&&!widgetReady&&<p className="account-note" role="status">Loading security check…</p>}
 <button className="button primary" disabled={busy||!widgetReady||(challenge?code.length<4:phone.length!==10||seconds>0)}>{busy?'Please wait…':challenge?'Verify and continue':seconds?`Send code in ${seconds}s`:'Send code'}</button>
 </form>
 {challenge&&<><button className="account-switch" disabled={busy||seconds>0} onClick={request}>{seconds?`Resend in ${seconds}s`:'Send a new code'}</button><button className="account-switch" disabled={busy} onClick={()=>{setChallenge(null);attempt.current=null;setCode('');setError('');}}>Change number</button></>}
 {error&&<p className="account-feedback account-error" role="alert">{error}</p>}</>;
}
