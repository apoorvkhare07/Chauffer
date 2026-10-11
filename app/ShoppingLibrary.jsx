import React,{useState} from 'react';
import {useQuery,useMutation,useAction} from 'convex/react';
import {api} from '../convex/_generated/api';
import ProductPreview from './ProductPreview.jsx';
export default function ShoppingLibrary(){
 const items=useQuery(api.savedProducts.list),remove=useMutation(api.savedProducts.remove),refresh=useAction(api.productRefresh.refresh);
 const [selected,setSelected]=useState([]),[busy,setBusy]=useState(''),[notice,setNotice]=useState('');
 const compared=(items??[]).filter(item=>selected.includes(item._id));
 const matchChecks=useQuery(api.commerce.compareSaved,{ids:compared.map(item=>item._id)});
 async function act(item,kind){setBusy(item._id);setNotice('');try{if(kind==='remove'){await remove({id:item._id});setSelected(ids=>ids.filter(id=>id!==item._id));}else{const result=await refresh({id:item._id});setNotice(result==='refreshed'?'Store price refreshed. Size, shipping and checkout total still need checking.':'The store could not confirm a fresh price. The previous observation is kept and remains dated.');}}catch(e){setNotice(String(e.message).includes('wait a minute')?'Please wait a minute before checking another price.':'Could not update your shortlist. Try again.');}finally{setBusy('');}}
 function select(id){setSelected(ids=>ids.includes(id)?ids.filter(x=>x!==id):ids.length<3?[...ids,id]:ids);}
 return <section className="shopping-library" aria-labelledby="shortlist-title"><header><div><h2 id="shortlist-title">Your shortlist</h2><p>Save favourites from your chat. Choose up to three to compare.</p></div><span>{items?.length??0}/50 saved</span></header>
 {notice&&<p role="status" className="account-feedback">{notice}</p>}
 {items===undefined?<p role="status">Loading your shortlist…</p>:!items.length?<p className="library-empty">An option catch your eye? Tap “Save” on its product card. Your favourites stay here across chats.</p>:<div className="library-grid">{items.map(item=><article key={item._id} className="library-item"><ProductPreview option={item.option}/><h3>{item.option.title}</h3><p>{item.option.store} · {item.option.priceFrom?'From ':''}₹{item.option.price.toLocaleString('en-IN')}</p><p className="account-note">Observed {new Date(item.option.observedAt).toLocaleString('en-IN')}{Date.now()-item.option.observedAt>900000?' · Needs a fresh check':''}</p><label className="compare-choice"><input type="checkbox" checked={selected.includes(item._id)} disabled={!selected.includes(item._id)&&selected.length>=3} onChange={()=>select(item._id)}/> Compare this option</label><div className="library-actions"><a href={item.option.url} target="_blank" rel="noopener noreferrer">Open store</a><button disabled={Boolean(busy)} onClick={()=>act(item,'refresh')}>{busy===item._id?'Updating…':'Refresh price'}</button><button disabled={Boolean(busy)} onClick={()=>act(item,'remove')}>Remove</button></div><PriceHistory id={item._id}/><OfferStatus id={item._id}/></article>)}</div>}
 {compared.length>0&&<div className="comparison-panel"><h3>Compare your options</h3><p className="account-note">These can be different products. This is a side-by-side view, not proof that the same item is cheaper elsewhere.</p>{matchChecks?.some(pair=>pair.status==='unverified')&&<p className="account-feedback">A cheapest delivered price cannot be confirmed yet: {[...new Set(matchChecks.flatMap(pair=>pair.gaps))].join(' ')}</p>}<div className="comparison-scroll"><table><thead><tr><th scope="col">Detail</th>{compared.map(item=><th key={item._id} scope="col">{item.option.title}</th>)}</tr></thead><tbody>{[
 ['Store',o=>o.store],['Observed item price',o=>`${o.priceFrom?'From ':''}₹${o.price.toLocaleString('en-IN')}`],['Colour',o=>o.colour||'Not confirmed'],['Fabric',o=>o.fabric||'Not confirmed'],['Requested size stock',()=> 'Not verified'],['Shipping and delivered total',()=> 'Not verified'],['Seller and returns',()=> 'Check on store'],['Offers',()=> 'Eligibility not checked'],['Checked',o=>new Date(o.observedAt).toLocaleString('en-IN')],
 ].map(([label,value])=><tr key={label}><th scope="row">{label}</th>{compared.map(item=><td key={item._id}>{value(item.option)}</td>)}</tr>)}</tbody></table></div></div>}
 </section>;
}

function PriceHistory({id}){
 const [open,setOpen]=useState(false),rows=useQuery(api.savedProducts.history,open?{id}:'skip');
 return <details className="price-history" onToggle={event=>setOpen(event.currentTarget.open)}><summary>Recorded prices</summary><p className="account-note">Anonymous store observations; sizes, shipping and account offers may differ. Up to 30 checks are kept.</p>{open&&(!rows?<p>Loading…</p>:<ul>{rows.map((row,i)=><li key={i}>{new Date(row.observedAt).toLocaleString('en-IN')} — {row.priceFrom?'From ':''}₹{row.price.toLocaleString('en-IN')}</li>)}</ul>)}</details>;
}
function OfferStatus({id}){
 const offers=useQuery(api.offerEvidence.forSaved,{id});
 return <details className="price-history"><summary>Offer checks</summary><p className="account-note">Live offer collection is not connected. Advertised offers need full terms and checkout confirmation. Cashback is separate from money off today.</p>{offers?.length?offers.map((offer,i)=><p key={i}>{offer.label}: {offer.status==='unverified'?offer.gaps.join(' '):'Potentially eligible; confirm on the store.'} <a href={offer.sourceUrl} target="_blank" rel="noopener noreferrer">Merchant terms</a></p>):<p>No verified offer terms recorded for this option.</p>}</details>;
}
