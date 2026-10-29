// Only explicit campaign tags are retained; never URLs, referrers or search text.
export const UTM_KEYS=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id'];
const FIRST='chauffeur:analytics:first-landing:v1',CURRENT='chauffeur:analytics:campaign:v1',INTERNAL='chauffeur:analytics:internal:v1';
const cookies={[FIRST]:'chauffeur_first_touch',[CURRENT]:'chauffeur_campaign',[INTERNAL]:'chauffeur_internal'};
let firstLanding={},currentCampaign={},internal=false;
export function cleanUtms(value={}){
 const safe={};if(!value||typeof value!=='object')return safe;
 for(const key of UTM_KEYS){const text=value[key];if(typeof text==='string'&&text.trim())safe[key]=text.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,200);}
 return safe;
}
export function utmsFromSearch(search=''){const params=new URLSearchParams(search);return cleanUtms(Object.fromEntries(UTM_KEYS.map(key=>[key,params.get(key)])));}
function read(key,storage,doc){
 let saved;try{saved=JSON.parse(storage?.getItem(key)??'null');}catch{}
 if(saved&&Object.keys(saved).length)return saved;
 try{const raw=doc?.cookie?.split('; ').find(item=>item.startsWith(cookies[key]+'='))?.split('=').slice(1).join('=');return raw?JSON.parse(decodeURIComponent(raw)):null;}catch{return null;}
}
function write(key,value,storage,doc){
 try{storage?.setItem(key,JSON.stringify(value));}catch{}
 // Mirror to a first-party cookie so a later localStorage failure also recovers.
 try{if(doc)doc.cookie=`${cookies[key]}=${encodeURIComponent(JSON.stringify(value))}; Path=/; Max-Age=31536000; SameSite=Lax${globalThis.location?.protocol==='https:'?'; Secure':''}`;}catch{}
}
export function rememberFirstLanding(search,storage,doc=globalThis.document){
 if(!Object.keys(firstLanding).length)firstLanding=cleanUtms(read(FIRST,storage,doc));
 if(!Object.keys(firstLanding).length)firstLanding=utmsFromSearch(search);
 // Ignore legacy {} records; first touch means the first tagged visit.
 if(Object.keys(firstLanding).length)write(FIRST,firstLanding,storage,doc);
 return {...firstLanding};
}
export function rememberAttribution(search,storage,doc=globalThis.document){
 const first=rememberFirstLanding(search,storage,doc),incoming=utmsFromSearch(search);
 currentCampaign=Object.keys(incoming).length?incoming:Object.keys(currentCampaign).length?currentCampaign:cleanUtms(read(CURRENT,storage,doc));
 if(!Object.keys(currentCampaign).length)currentCampaign=first;
 if(Object.keys(currentCampaign).length)write(CURRENT,currentCampaign,storage,doc);
 internal=internal||new URLSearchParams(search).get('internal')==='1'||read(INTERNAL,storage,doc)?.value===true;
 if(internal)write(INTERNAL,{value:true},storage,doc);
 return {first,current:{...currentCampaign},isInternal:internal};
}
export function initialEventProperties(tags){return Object.fromEntries(Object.entries(cleanUtms(tags)).map(([key,value])=>[`initial_${key}`,value]));}
export function firstLandingPersonProperties(tags){
 const safe=cleanUtms(tags);
 return {...safe,...initialEventProperties(safe),...Object.fromEntries(Object.entries(safe).map(([key,value])=>[`$initial_${key}`,value]))};
}
export function cleanAttributionProperties(value){
 const safe=cleanUtms(value);
 for(const prefix of ['initial_','$initial_'])for(const key of UTM_KEYS){const initial=cleanUtms({[key]:value?.[`${prefix}${key}`]});if(initial[key])safe[`${prefix}${key}`]=initial[key];}
 return safe;
}
// Preserve only campaign tags on same-origin links; never decorate merchant URLs.
export function attributedHref(href,search='',tags={},isInternal=false,origin='https://chauffer.studio'){
 try{const url=new URL(href,origin);if(url.origin!==origin||!['http:','https:'].includes(url.protocol))return href;
 const current={...cleanUtms(tags),...utmsFromSearch(search)};
 for(const [key,value] of Object.entries(current))if(!url.searchParams.has(key))url.searchParams.set(key,value);
 if(isInternal)url.searchParams.set('internal','1');
 return url.pathname+url.search+url.hash;
 }catch{return href;}
}
