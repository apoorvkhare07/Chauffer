import posthog from 'posthog-js';
let enabled=false,lastPage='';
const appPages=new Set(['home','search','chat','wardrobe','daily','saved','try-on','history','settings','more','setup','signin']);
export function analyticsPage(location=window.location){
 const path=location.pathname.replace(/\/index\.html$/,'/');
 if(path.startsWith('/app')){const route=location.hash.replace('#/','');return `/app/${appPages.has(route)?route:'home'}`;}
 return ['/','/faq/','/roadmap/','/demo/'].includes(path)?path:'/other';
}
export function cleanEvent(event){
 if(!event)return null;
 const p=event.properties??{};
 for(const key of Object.keys(p))if(/url|referr|pathname|search|query|\$set|\$initial|\$elements/i.test(key))delete p[key];
 p.$current_url=window.location.origin+analyticsPage();p.$pathname=analyticsPage();
 return {...event,properties:p};
}
export function track(event,properties={}){if(enabled)try{posthog.capture(event,properties);}catch{/* Analytics must never block shopping. */}}
export function trackOnce(event,key,properties={}){
 if(!enabled)return;
 try{const storageKey=`chauffeur:analytics:${event}:${key}`;if(localStorage.getItem(storageKey))return;localStorage.setItem(storageKey,'1');}catch{/* Keep analytics best-effort when storage is unavailable. */}
 track(event,properties);
}
export function analyticsIdentity(id){if(!enabled)return;if(id){if(posthog.get_distinct_id()!==id)posthog.identify(id);}else if(posthog.get_property('$user_id'))posthog.reset();}
export function initAnalytics(){
 const key=import.meta.env.VITE_POSTHOG_KEY,host=import.meta.env.VITE_POSTHOG_HOST;
 if(enabled||!key||!['https://us.i.posthog.com','https://eu.i.posthog.com'].includes(host))return;
 // Local development stays out of production metrics.
 if(['localhost','127.0.0.1'].includes(window.location.hostname))return;
 enabled=true;
 posthog.init(key,{api_host:host,autocapture:false,capture_pageview:false,capture_pageleave:false,disable_session_recording:false,session_recording:{maskAllInputs:true,maskTextSelector:'*',blockSelector:'img, video, canvas'},loaded:ph=>ph.startSessionRecording(),ip:false,capture_heatmaps:false,capture_performance:false,capture_exceptions:false,disable_surveys:true,advanced_disable_feature_flags:true,person_profiles:'identified_only',persistence:'localStorage',before_send:cleanEvent});
 const view=()=>{const page=analyticsPage();if(lastPage===page)return;lastPage=page;track('$pageview',{page});if(page==='/')track('landing_page_viewed',{page});};
 view();window.addEventListener('hashchange',view);window.addEventListener('popstate',view);
 document.addEventListener('click',e=>{const el=e.target.closest?.('button,a');if(!el||el.disabled)return;track('button_clicked',{page:analyticsPage(),action:el.dataset.analytics??(el.tagName==='A'?'link':'button'),placement:el.closest('footer')?'footer':el.closest('header')?'header':'content'});});
 document.addEventListener('submit',e=>track('form_submitted',{page:analyticsPage(),action:e.target.dataset.analytics??'form'}));
}
