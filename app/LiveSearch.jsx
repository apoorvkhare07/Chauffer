import React,{useState} from 'react';
import {useAction} from 'convex/react';
import {api} from '../convex/_generated/api';

export default function LiveSearch(){
 const search=useAction(api.liveDiscovery.webSearch);
 const [pending,setPending]=useState(false),[result,setResult]=useState(null),[error,setError]=useState('');
 async function submit(event){
  event.preventDefault();if(pending)return;
  const data=new FormData(event.currentTarget);
  const requirements={category:String(data.get('category')),budget:Number(data.get('budget'))};
  for(const key of ['size','colour','fabric'])if(data.get(key))requirements[key]=String(data.get(key));
  setPending(true);setResult(null);setError('');
  try{setResult(await search({requirements}));}catch{setError('Search could not start. Please wait a minute and try again, or sign in again.');}finally{setPending(false);}
 }
 return <section className="live-search" aria-labelledby="live-search-title">
  <span className="account-kicker">Live discovery · Flipkart</span><h2 id="live-search-title">Find something your style.</h2>
  <p className="account-note">This searches the store now, rather than the fictional demo. No checkout or orders.</p>
  <form className="account-form" onSubmit={submit} aria-busy={pending}>
   <div className="search-fields">
    <label className="account-field">Clothing<select name="category" defaultValue="kurta"><option value="kurta">Kurta</option><option value="dress">Dress</option><option value="top">Top</option><option value="saree">Saree</option></select></label>
    <label className="account-field">Maximum budget (₹)<input name="budget" type="number" min="100" max="50000" step="1" defaultValue="1000" required/></label>
    <label className="account-field">Requested size<select name="size" defaultValue="M"><option value="">No size preference</option>{['XS','S','M','L','XL','XXL','3XL'].map(x=><option key={x}>{x}</option>)}</select></label>
    <label className="account-field">Colour<select name="colour" defaultValue="blue"><option value="">Any colour</option>{['blue','black','white','red','pink','green','yellow','purple','beige'].map(x=><option key={x} value={x}>{x[0].toUpperCase()+x.slice(1)}</option>)}</select></label>
    <label className="account-field">Fabric<select name="fabric" defaultValue="cotton"><option value="">Any fabric</option><option value="cotton">Cotton, including blends</option><option value="pure cotton">Pure cotton</option>{['linen','silk','rayon','georgette'].map(x=><option key={x}>{x}</option>)}</select></label>
   </div>
   <button className="button primary" type="submit" disabled={pending}>{pending?'Checking live products…':'Search live products'}</button>
  </form>
  {pending&&<p className="account-feedback" role="status">Opening search results and checking product details. This may take up to a minute.</p>}
  {error&&<p className="account-feedback account-error" role="alert">{error}</p>}
  {result&&<div className="search-results" aria-live="polite">
   <h3>{result.failed?'The store could not be reached':result.options.length?`${result.options.length} live options`:'No verified matches this time'}</h3>
   {!result.options.length&&<p className="account-note">{result.failed?'Live store access can fail. Please try again later.':'Try a different colour, fabric or budget.'} No sample products were substituted.</p>}
   {result.options.map(option=><article className="search-product" key={option.url}><span className="account-kicker">Flipkart</span><h4>{option.title}</h4><p className="search-price">₹{option.price.toLocaleString('en-IN')}</p><p>{option.colour||'Colour not confirmed'} · {option.fabric||'Fabric not confirmed'}</p><p className="account-note">Checked {new Date(option.observedAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p><a className="button" href={option.url} target="_blank" rel="noopener noreferrer">View on Flipkart ↗</a></article>)}
   {result.options.length>0&&<p className="account-note">Prices were checked without signing in to Flipkart. Your account or location may show different prices; delivery charges and offers can change. Requested size availability is not verified. Confirm size, price, delivery and returns on the store.</p>}
  </div>}
 </section>;
}
