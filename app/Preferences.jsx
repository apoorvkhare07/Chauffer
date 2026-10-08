import React, {useState} from 'react';
import {useQuery, useMutation} from 'convex/react';
import {useAuthActions} from '@convex-dev/auth/react';
import {api} from '../convex/_generated/api';
export default function Preferences() {
 const saved = useQuery(api.profiles.get, {});
 const save = useMutation(api.profiles.save);
 const {signOut} = useAuthActions();
 const [busy,setBusy] = useState(false);
 const [message,setMessage] = useState('');
 const [error,setError] = useState('');
 if (saved === undefined) return <p role="status">Loading your preferences…</p>;
 async function submit(event) {
  event.preventDefault(); setBusy(true); setMessage(''); setError('');
  const data = new FormData(event.currentTarget);
  const budget = data.get('budget');
  try {
   await save({preferences:{language:data.get('language'), ...(data.get('size') ? {size:data.get('size')} : {}), ...(budget ? {budgetPaise:Math.round(Number(budget)*100)} : {})}});
   setMessage('Your preferences are saved.');
  } catch {setError('Could not save your preferences. Please try again.');}
  finally {setBusy(false);}
 }
 return <><h2>Your preferences</h2><p className="account-note">You’re signed in. These preferences stay saved when you return.</p><form className="account-form" onSubmit={submit} key={JSON.stringify(saved)}>
 <label className="account-field">Language<select name="language" defaultValue={saved?.language ?? 'en'}><option value="en">English</option><option value="hi">Hindi</option><option value="hinglish">Hinglish</option></select></label>
 <label className="account-field">Usual size<select name="size" defaultValue={saved?.size ?? ''}><option value="">No preference</option>{['XS','S','M','L','XL','XXL'].map(s=><option key={s}>{s}</option>)}</select></label>
 <label className="account-field">Shopping budget (₹)<input name="budget" type="number" min="1" max="10000000" step="1" defaultValue={saved?.budgetPaise ? saved.budgetPaise/100 : ''} placeholder="Optional" /></label>
 <button className="button primary" disabled={busy}>{busy?'Saving…':'Save preferences'}</button>
 </form>{message && <p className="account-feedback" role="status">{message}</p>}{error && <p className="account-feedback account-error" role="alert">{error}</p>}
 <div className="account-actions"><button className="account-switch" disabled={busy} onClick={async()=>{setBusy(true);try{await signOut();}catch{setError('Could not sign out. Please try again.');setBusy(false);}}}>Sign out</button><a className="account-switch" href="/demo/">Explore the sample demo</a></div></>;
}
