import React,{useState} from 'react';
import {useAction} from 'convex/react';
import {api} from '../convex/_generated/api';
import {ArrowUpRight,LoaderCircle} from 'lucide-react';

let checkoutLoader;
function loadRazorpay(){
 if(window.Razorpay)return Promise.resolve(true);
 if(!checkoutLoader)checkoutLoader=new Promise(resolve=>{const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.async=true;script.onload=()=>resolve(true);script.onerror=()=>{checkoutLoader=undefined;resolve(false);};document.head.append(script);});
 return checkoutLoader;
}

export default function ProCheckout({plan}){
 const start=useAction(api.billing.createOrder),verify=useAction(api.billing.verifyCheckout);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function upgrade(){
  if(busy)return;setBusy(true);setMessage('');
  try{
   const ready=await loadRazorpay();if(!ready)throw new Error('Secure checkout could not load. Check your connection and try again.');
   const checkout=await start({});
   const modal=new window.Razorpay({key:checkout.keyId,order_id:checkout.orderId,amount:checkout.amount,currency:checkout.currency,name:'Chauffer',description:'Pro · 30 days',image:'/favicon.svg',theme:{color:'#2950B8'},handler:async response=>{
    try{const result=await verify({orderId:response.razorpay_order_id,paymentId:response.razorpay_payment_id,signature:response.razorpay_signature});setMessage(result==='active'?'Pro is active for 30 days.':'Payment received. We’re confirming it; this page will update automatically.');}
    catch(error){setMessage(error?.data||'We could not confirm this payment yet. If you were charged, contact support before trying again.');}
    finally{setBusy(false);}
   },modal:{ondismiss:()=>setBusy(false)}});
   modal.on('payment.failed',event=>{setMessage(event?.error?.description||'Payment was not completed. You can try again.');setBusy(false);});
   modal.open();
  }catch(error){setMessage(error?.data||error?.message||'Checkout could not start. Please try again.');setBusy(false);}
 }
 return <div className="billing-actions">
  <button className={plan?.plan==='pro'?'button secondary':'button primary'} type="button" disabled={busy} onClick={upgrade}>{busy?<><LoaderCircle size={16} className="spin"/> Connecting…</>:plan?.plan==='pro'?'Renew Pro · ₹99 for 30 days':'Get Pro · ₹99 for 30 days'} {!busy&&<ArrowUpRight size={16}/>}</button>
  {message&&<p className="account-feedback" role="status">{message}</p>}
  <p className="account-note">One-time payment through Razorpay. No automatic renewal.</p>
 </div>;
}
