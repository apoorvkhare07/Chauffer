import posthog from 'posthog-js';
import {editForPath,selectedEditProduct} from './shared/productEdits';
import {rememberAttribution,initialEventProperties,firstLandingPersonProperties,cleanAttributionProperties,attributedHref,UTM_KEYS} from './analyticsAttribution';
let enabled=false,lastPage='',lastIdentified='',identified=false,attribution={first:{},current:{},isInternal:false};
const appPages=new Set(['home','discover','creator','guest-tryon','guest-wardrobe','search','chat','wardrobe','daily','saved','try-on','history','settings','more','setup','signin']);
export function analyticsPage(location=window.location){
 const path=location.pathname.replace(/\/index\.html$/,'/');
 if(path.startsWith('/app')){const route=location.hash.replace('#/','');return `/app/${appPages.has(route)?route:'home'}`;}
 return editForPath(path)?.path??(['/','/faq/','/roadmap/','/demo/'].includes(path)?path:'/other');
}
export function isProductionAnalyticsHost(host=globalThis.window?.location?.hostname){return host==='chauffer.studio';}
export function inAppBrowser(ua=globalThis.navigator?.userAgent??''){return /Instagram/i.test(ua)?'instagram':/FBAN|FBAV/i.test(ua)?'facebook':'none';}
function refreshAttribution(){let storage;try{storage=window.localStorage;}catch{}attribution=rememberAttribution(window.location.search,storage);}
function campaignProperties(){return {...attribution.current,...initialEventProperties(attribution.first),...(attribution.isInternal?{is_internal:true}:{})};}
function registerAttribution(){
 if(!enabled)return;
 posthog.register_once(initialEventProperties(attribution.first));
 for(const key of UTM_KEYS)if(!attribution.current[key])posthog.unregister(key);
 posthog.register(campaignProperties());
}
export function analyticsSignupContext(){return {origin:window.location.origin,first:attribution.first,current:attribution.current,isInternal:attribution.isInternal,inAppBrowser:inAppBrowser()};}
export function campaignLink(href){return attributedHref(href,window.location.search,attribution.current,attribution.isInternal,window.location.origin);}
export function tryOnAnalyticsContext(properties={}){
 const product=selectedEditProduct(globalThis.window?.location?.search??'');
 return {source_page:product?.editSlug??analyticsPage(),product_id:product?.id??'unknown',is_guest:!identified,in_app_browser:inAppBrowser(),...properties};
}
export function cleanEvent(event){
 if(!event)return null;
 const p={...(event.properties??{}),...campaignProperties()};
 for(const key of Object.keys(p)){
  if(key==='$set_once'){const safe=cleanAttributionProperties(p[key]);if(Object.keys(safe).length)p[key]=safe;else delete p[key];}
  else if(/url|referr|pathname|search|query|\$set|\$initial|\$elements/i.test(key))delete p[key];
 }
 // Intentionally query-free: explicit UTM properties carry attribution safely.
 p.$current_url=window.location.origin+analyticsPage();p.$pathname=analyticsPage();
 return {...event,properties:p};
}
export function track(event,properties={}){if(enabled)try{
 const context=event.startsWith('tryon_')?tryOnAnalyticsContext(properties):properties;
 const person=['login_completed','signup_completed'].includes(event)?{$set_once:firstLandingPersonProperties(attribution.first)}:{};
 posthog.capture(event,{...context,...campaignProperties(),...person});
}catch{/* Analytics must never block shopping. */}}
export function trackOnce(event,key,properties={}){
 if(!enabled)return;
 try{const storageKey=`chauffeur:analytics:${event}:${key}`;if(localStorage.getItem(storageKey))return;localStorage.setItem(storageKey,'1');}catch{}
 track(event,properties);
}
export function analyticsIdentity(id){
 identified=Boolean(id);
 if(!enabled)return;
 try{if(id){if(lastIdentified===id)return;const properties=firstLandingPersonProperties(attribution.first);if(posthog.get_distinct_id()!==id)posthog.identify(id,undefined,properties);else if(Object.keys(properties).length)posthog.setPersonProperties({},properties);lastIdentified=id;}
 else{lastIdentified='';if(posthog.get_property('$user_id')){posthog.reset();registerAttribution();}}}catch{}
}
export function initAnalytics(){
 // Read before rendering or SDK init, on every entry point (including edits).
 refreshAttribution();
 // Link fallback also works when storage or the analytics SDK is blocked.
 const decorate=e=>{const el=e.target.closest?.('a');if(!el||el.hasAttribute('download'))return;const raw=el.getAttribute('href');if(raw&&!raw.startsWith('#'))el.setAttribute('href',campaignLink(raw));};
 document.addEventListener('click',decorate,true);document.addEventListener('auxclick',decorate,true);
 const key=import.meta.env.VITE_POSTHOG_KEY,host=import.meta.env.VITE_POSTHOG_HOST;
 if(enabled||!isProductionAnalyticsHost()||!key||!['https://us.i.posthog.com','https://eu.i.posthog.com'].includes(host))return;
 enabled=true;
 posthog.init(key,{api_host:host,autocapture:false,save_campaign_params:false,save_referrer:false,capture_pageview:false,capture_pageleave:false,disable_session_recording:false,session_recording:{maskAllInputs:true,maskTextSelector:'*',blockSelector:'img, video, canvas'},loaded:ph=>ph.startSessionRecording(),ip:false,capture_heatmaps:false,capture_performance:false,capture_exceptions:false,disable_surveys:true,advanced_disable_feature_flags:true,person_profiles:'identified_only',persistence:'localStorage+cookie',before_send:cleanEvent});
 registerAttribution();
 const view=()=>{refreshAttribution();registerAttribution();const page=analyticsPage();if(lastPage===page)return;lastPage=page;track('$pageview',{page});if(page==='/')track('landing_page_viewed',{page});};
 view();window.addEventListener('hashchange',view);window.addEventListener('popstate',view);
 document.addEventListener('click',e=>{const el=e.target.closest?.('button,a');if(!el||el.disabled)return;track('button_clicked',{page:analyticsPage(),action:el.dataset.analytics??(el.tagName==='A'?'link':'button'),placement:el.closest('footer')?'footer':el.closest('header')?'header':'content'});});
 document.addEventListener('submit',e=>track('form_submitted',{page:analyticsPage(),action:e.target.dataset.analytics??'form'}));
}
