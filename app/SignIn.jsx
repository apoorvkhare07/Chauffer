import React, {useState} from 'react';
import {useAuthActions} from '@convex-dev/auth/react';
export default function SignIn() {
 const {signIn} = useAuthActions();
 const pendingRequest=new URLSearchParams(window.location.search).get('q')?.trim().slice(0,1000);
 const [flow,setFlow] = useState('signIn');
 const [busy,setBusy] = useState(false);
 const [error,setError] = useState('');
 const [recovery,setRecovery]=useState(false);
 async function submit(event) {
  event.preventDefault(); setError(''); setBusy(true);
  const data = new FormData(event.currentTarget);
  const password = String(data.get('password'));
  if (flow === 'signUp' && password !== data.get('confirmPassword')) {setError('Your passwords do not match.');setBusy(false);return;}
  data.set('email',String(data.get('email')).trim().toLowerCase());
  data.delete('confirmPassword');
  try {await signIn('password',data);}
  catch {setError(flow === 'signIn' ? 'Could not sign in. Check your email and password, then try again.' : 'Could not create your account. If you already have one, try signing in.');}
  finally {setBusy(false);}
 }
 return <>{pendingRequest&&<div className="account-feedback"><strong>Your request is ready</strong><p>{pendingRequest}</p><small>Sign in to review it in chat. New here? We’ll help you set up first.</small></div>}<h2>{flow==='signIn'?'Welcome back':'Create your account'}</h2><p className="account-note">{flow==='signIn'?'Sign in to your saved preferences.':'Save your preferences with Chauffeur.'}</p><form className="account-form" onSubmit={submit} key={flow}>
 <input type="hidden" name="flow" value={flow}/>
 <label className="account-field">Email<input name="email" type="email" autoComplete="email" required maxLength={254} disabled={busy}/></label>
 <label className="account-field">Password<input name="password" type="password" autoComplete={flow==='signUp'?'new-password':'current-password'} minLength={flow==='signUp'?8:undefined} required disabled={busy}/></label>
 {flow==='signUp' && <><label className="account-field">Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} disabled={busy}/></label><p className="account-note">Use at least 8 characters. Email verification and password recovery are not available in this early version; keep your password in a password manager.</p></>}
 {error && <p role="alert" className="account-feedback account-error">{error}</p>}
 <button className="button primary" disabled={busy}>{busy?'Please wait…':flow==='signIn'?'Sign in':'Create account'}</button>
 </form><button type="button" className="account-switch" disabled={busy} onClick={()=>{setFlow(flow==='signIn'?'signUp':'signIn');setError('');}}>{flow==='signIn'?'New here? Create an account':'Already have an account? Sign in'}</button>{flow==='signIn'&&<><button type="button" className="account-switch recovery-link" onClick={()=>setRecovery(!recovery)} aria-expanded={recovery}>Forgot password?</button>{recovery&&<p role="status" className="account-feedback">Password recovery is not connected yet. No reset email has been sent. Use your existing password to sign in; recovery will need a verified email delivery connection.</p>}</>}</>;
}
