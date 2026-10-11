import React, {useState} from 'react';
import {useQuery, useMutation} from 'convex/react';
import {useAuthActions} from '@convex-dev/auth/react';
import {api} from '../convex/_generated/api';
export default function Preferences() {
 const saved = useQuery(api.profiles.get, {});
 const save = useMutation(api.profiles.save);
 const taste=useQuery(api.profiles.taste),forgetTaste=useMutation(api.profiles.forgetTaste),clear=useMutation(api.profiles.clear);
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
 <label className="account-field">Shopping budget (₹100–₹50,000)<input name="budget" type="number" min="100" max="50000" step="1" defaultValue={saved?.budgetPaise ? saved.budgetPaise/100 : ''} placeholder="Optional" /></label>
 <button className="button primary" disabled={busy}>{busy?'Saving…':'Save preferences'}</button>
 </form>{message && <p className="account-feedback" role="status">{message}</p>}{error && <p className="account-feedback account-error" role="alert">{error}</p>}
 <div className="taste-summary"><h3>Your remembered taste</h3><p className="account-note">Only preferences you asked Chauffeur to remember are saved here. Changes apply to new chats.</p><p>Prefer: {taste?.prefer.join(', ')||'Nothing remembered yet'}</p><p>Avoid: {taste?.avoid.join(', ')||'Nothing remembered yet'}</p><button className="account-switch" disabled={busy||taste===undefined} onClick={async()=>{setBusy(true);setError('');try{await forgetTaste();setMessage('Remembered taste cleared. Your size and budget stay saved.');}catch{setError('Finish your current search, then try again.');}finally{setBusy(false);}}}>Forget remembered taste</button></div>
 <div className="account-actions"><button className="account-switch" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await clear();setMessage('Saved size, budget, language and taste cleared. Start a new chat to use the defaults.');}catch(e){setError(String(e.message).includes('current request')?'Finish or stop your current request, then clear your preferences.':'Could not clear preferences. Please try again.');}finally{setBusy(false);}}}>Clear saved preferences</button><button className="account-switch" disabled={busy} onClick={async()=>{setBusy(true);try{await signOut();}catch{setError('Could not sign out. Please try again.');setBusy(false);}}}>Sign out</button><a className="account-switch" href="/demo/">Explore the sample demo</a></div></>;
}
