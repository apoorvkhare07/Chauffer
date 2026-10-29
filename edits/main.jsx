import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowUpRight,ArrowRight,Copy,Check,ScanFace} from 'lucide-react';
import Brand from '../Brand.jsx';
import {editForPath,editTryOnHref} from '../shared/productEdits';
import {initAnalytics,track,campaignLink} from '../analytics';
import '../brand-fonts.css';
import '../brand-header.css';
import './product-edit.css';

const rupees=value=>`₹${value.toLocaleString('en-IN')}`;
function ProductEdit({edit}){
 const [copied,setCopied]=useState(false),[copyError,setCopyError]=useState(false);
 async function copyLink(){try{await navigator.clipboard.writeText(`https://chauffer.studio${edit.path}`);setCopied(true);setCopyError(false);}catch{setCopyError(true);}}
 function event(action,product){track('product_edit_clicked',{edit:edit.slug,piece:product.id,action});}
 return <div className="product-edit"><a className="edit-skip" href="#pieces">Skip to the products</a>
  <header className="edit-nav"><Brand animated={false}/><button onClick={copyLink} aria-label="Copy a link to this edit">{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Copied':'Copy link'}</button></header>
  <main>
   <section className="edit-intro" aria-labelledby="edit-title"><span className="edit-kicker"><span/> {edit.kicker}</span><h1 id="edit-title">{edit.heading}<br/><span>{edit.accent}</span></h1><p>Saw it on Instagram? Here’s every piece.<br/>Pick a favourite. See it on you.</p><div className="edit-total"><span>All {edit.products.length} pieces</span><strong>{rupees(edit.products.reduce((sum,p)=>sum+p.price,0))}</strong><span className="edit-total-note">at the post’s prices</span></div></section>
   {copyError&&<p className="edit-copy-error" role="status">Copy this link: <a href={edit.path}>https://chauffer.studio{edit.path}</a></p>}
   <section id="pieces" aria-label={`Products from ${edit.title}`} className="edit-grid">{edit.products.map((product,index)=><article className="edit-card" key={product.id}>
    <a className="edit-photo" href={product.url} target="_blank" rel="noopener noreferrer" onClick={()=>event('store',product)} aria-label={`View ${product.name} on ${product.store} (opens a new tab)`}><img src={product.image} width="720" height="960" alt={`${product.brand} ${product.description}`} loading={index<2?'eager':'lazy'}/><span className="edit-number">0{index+1}</span><span className="edit-photo-link"><ArrowUpRight size={18}/></span></a>
    <div className="edit-card-info"><div className="edit-brand"><span>{product.brand}</span><span>at {product.store}</span></div><h2>{product.name}</h2><p>{product.description}</p><strong className="edit-price">{rupees(product.price)}</strong>
     <div className="edit-card-actions"><a className="edit-try" href={campaignLink(editTryOnHref(product))} onClick={()=>event('try_on',product)} aria-label={`Try on ${product.name}`}><ScanFace size={17}/> Try it on</a><a className="edit-shop" href={product.url} target="_blank" rel="noopener noreferrer" onClick={()=>event('store',product)}>Shop <ArrowUpRight size={16}/><span className="edit-sr">{product.name} on {product.store} (opens a new tab)</span></a></div>
    </div>
   </article>)}</section>
   <p className="edit-price-note">Prices from our post. Check the store for today’s price, sizes and availability.</p>
   <section className="edit-outro"><div className="edit-outro-icon"><ScanFace size={27}/></div><div><h2>Looks good. But on you?</h2><p>Tap “Try it on” on any piece, then add your photo.<br/>Your first AI preview is free. No login needed.</p></div><a href={campaignLink(editTryOnHref(edit.products[0]))} aria-label={`Try ${edit.products[0].name} on you`}><ArrowRight size={22}/></a></section>
  </main><footer className="edit-footer"><span>A little less guessing. A little more you.</span><a href="/app/#/discover">Discover more with chauffer. <ArrowUpRight size={14}/></a></footer>
 </div>;
}
initAnalytics();
const edit=editForPath(window.location.pathname);
createRoot(document.getElementById('app')).render(<React.StrictMode>{edit?<ProductEdit edit={edit}/>:<main className="product-edit edit-intro"><h1>We couldn’t find that post.</h1><a href="/">Back to chauffer.</a></main>}</React.StrictMode>);
