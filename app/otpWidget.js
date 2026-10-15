let scriptReady;
export async function loadOtpWidget({widgetId,tokenAuth}) {
 if(!scriptReady)scriptReady=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://verify.msg91.com/otp-provider.js';script.async=true;
  const fail=()=>{clearTimeout(timer);script.remove();scriptReady=undefined;reject(new Error('MSG91 verification could not load. Reload and try again.'));};
  const timer=setTimeout(fail,20000);script.onerror=fail;script.onload=()=>{clearTimeout(timer);resolve();};document.head.append(script);
 });
 await scriptReady;
 window.initSendOTP({widgetId,tokenAuth,exposeMethods:true,captchaRenderId:'chauffeur-captcha',success:()=>{},failure:()=>{}});
 await new Promise((resolve,reject)=>{
  const started=Date.now();const timer=setInterval(()=>{if(typeof window.sendOtp==='function'&&window.getWidgetData?.()?.widgetId){clearInterval(timer);resolve();}else if(Date.now()-started>20000){clearInterval(timer);reject(new Error('MSG91 verification could not load. Reload and try again.'));}},100);
 });
}
export function widgetCall(method,...args){return new Promise((resolve,reject)=>{
 const timeout=setTimeout(()=>reject(new Error('MSG91 verification timed out. Please try again.')),30000);
 window[method](...args.slice(0,1),data=>{clearTimeout(timeout);resolve(data);},()=>{clearTimeout(timeout);reject(new Error(method==='verifyOtp'?'That code is incorrect or expired. Please check it or request a new one.':'MSG91 could not send the code. Check the verification and try again.'));},...args.slice(1));
});}
