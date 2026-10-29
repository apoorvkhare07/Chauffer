import {beforeEach,afterEach,test,expect,vi} from 'vitest';
const sdk=vi.hoisted(()=>({init:vi.fn(),capture:vi.fn(),identify:vi.fn(),get_distinct_id:vi.fn(()=> 'anonymous'),get_property:vi.fn(),setPersonProperties:vi.fn(),reset:vi.fn(),register:vi.fn(),register_once:vi.fn(),unregister:vi.fn()}));
vi.mock('posthog-js',()=>({default:sdk}));
let storage,doc,cookies;
const campaign='?utm_source=instagram&utm_medium=dm&utm_campaign=linkcheck';
const tags={utm_source:'instagram',utm_medium:'dm',utm_campaign:'linkcheck'};
function location(search='',hostname='chauffer.studio',pathname='/edits/diwali-post-1/',hash=''){
 vi.stubGlobal('window',{location:{origin:`https://${hostname}`,hostname,pathname,hash,search},localStorage:storage,addEventListener:vi.fn()});
 vi.stubGlobal('document',doc);
}
beforeEach(()=>{
 vi.resetModules();vi.clearAllMocks();cookies=new Map();
 const values=new Map();storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 doc={addEventListener:vi.fn(),get cookie(){return [...cookies].map(([k,v])=>`${k}=${v}`).join('; ');},set cookie(value){const [pair]=value.split(';');const index=pair.indexOf('=');cookies.set(pair.slice(0,index),pair.slice(index+1));}};
 sdk.get_distinct_id.mockReturnValue('anonymous');sdk.get_property.mockReturnValue(undefined);
 vi.stubGlobal('navigator',{userAgent:'Instagram iOS'});
 vi.stubEnv('VITE_POSTHOG_KEY','phc_test');vi.stubEnv('VITE_POSTHOG_HOST','https://us.i.posthog.com');location();
});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});

test('edits → app → login → export carries campaign on EVERY event, including identify',async()=>{
 location(campaign);let analytics=await import('../analytics');analytics.initAnalytics();
 analytics.track('product_edit_clicked',{edit:'diwali-post-1',piece:'kurta'});
 const href=analytics.campaignLink('/app/?edit=diwali-post-1&piece=kurta#/try-on');
 const link=new URL(href,'https://chauffer.studio');expect(link.searchParams.get('utm_campaign')).toBe('linkcheck');
 vi.resetModules();location(link.search,'chauffer.studio','/app/',link.hash);
 analytics=await import('../analytics');analytics.initAnalytics();
 for(const event of ['tryon_started','tryon_completed','tryon_signin_prompted','login_completed'])analytics.track(event);
 analytics.analyticsIdentity('opaque-user');analytics.track('tryon_exported',{kind:'download'});analytics.track('tryon_export_downloaded',{kind:'download'});
 for(const [,properties] of sdk.capture.mock.calls)expect(properties).toMatchObject({...tags,initial_utm_source:'instagram',initial_utm_campaign:'linkcheck'});
 expect(sdk.register_once).toHaveBeenCalledWith({initial_utm_source:'instagram',initial_utm_medium:'dm',initial_utm_campaign:'linkcheck'});
 expect(sdk.identify.mock.calls[0][2]).toMatchObject({...tags,initial_utm_source:'instagram',$initial_utm_source:'instagram'});
 const config=sdk.init.mock.calls.at(-1)[1];
 expect(config.before_send({event:'$identify',properties:{$set_once:sdk.identify.mock.calls[0][2],$current_url:'private?q=secret'}}).properties).toMatchObject({...tags,$current_url:'https://chauffer.studio/app/try-on'});
 const events=Object.fromEntries(sdk.capture.mock.calls);
 expect(events.login_completed.$set_once).toMatchObject(tags);
 expect(events.tryon_started).toMatchObject({source_page:'diwali-post-1',product_id:'kurta',is_guest:true,in_app_browser:'instagram'});
 expect(events.tryon_exported).toMatchObject({source_page:'diwali-post-1',product_id:'kurta',is_guest:false,in_app_browser:'instagram'});
});

test('empty legacy first-touch records do not block the first tagged visit; later campaigns never overwrite it',async()=>{
 storage.setItem('chauffeur:analytics:first-landing:v1','{}');
 location(campaign);let a=await import('../analytics');a.initAnalytics();
 vi.resetModules();location('?utm_source=google&utm_campaign=later');a=await import('../analytics');a.initAnalytics();a.analyticsIdentity('user');a.track('login_completed');
 expect(sdk.identify.mock.calls[0][2]).toMatchObject(tags);
 expect(sdk.capture.mock.calls.at(-1)[1]).toMatchObject({utm_source:'google',utm_campaign:'later',initial_utm_source:'instagram'});
 expect(sdk.unregister).toHaveBeenCalledWith('utm_medium');
});

test('cookie fallback survives localStorage failure and subsequent page load',async()=>{
 storage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};location(campaign);
 let a=await import('../analytics');a.initAnalytics();expect(cookies.size).toBeGreaterThan(0);
 vi.resetModules();location('', 'chauffer.studio','/app/','#/try-on');a=await import('../analytics');a.initAnalytics();a.track('tryon_started');
 expect(sdk.capture.mock.calls.at(-1)[1]).toMatchObject(tags);
});

test('link fallback survives both stores being blocked; external URLs remain exact',async()=>{
 storage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 doc={addEventListener:vi.fn(),get cookie(){throw Error('blocked');},set cookie(_value){throw Error('blocked');}};
 location(campaign);let a=await import('../analytics');a.initAnalytics();
 const href=a.campaignLink('/app/?edit=diwali-post-1&piece=kurta#/try-on');
 expect(a.campaignLink('https://www.myntra.com/a/1/buy')).toBe('https://www.myntra.com/a/1/buy');
 const url=new URL(href,'https://chauffer.studio');vi.resetModules();location(url.search,'chauffer.studio','/app/',url.hash);a=await import('../analytics');a.initAnalytics();
 a.track('login_completed');expect(sdk.capture.mock.calls.at(-1)[1].$set_once).toMatchObject(tags);
 expect(a.campaignLink('/app/#/guest-tryon')).toContain('utm_campaign=linkcheck');
});

test.each(['localhost','127.0.0.1','chauffer-test.vercel.app','chauffer.studio.evil.test','www.chauffer.studio'])('%s never initialises production PostHog',async host=>{
 location(campaign,host);const a=await import('../analytics');a.initAnalytics();a.track('tryon_started');a.analyticsIdentity('test');expect(sdk.init).not.toHaveBeenCalled();expect(sdk.capture).not.toHaveBeenCalled();expect(sdk.identify).not.toHaveBeenCalled();
});

test('internal traffic persists and is registered on every later event, including after logout',async()=>{
 location('?internal=1');let a=await import('../analytics');a.initAnalytics();
 vi.resetModules();location(campaign);a=await import('../analytics');a.initAnalytics();sdk.get_property.mockReturnValue('user');a.analyticsIdentity(null);a.track('button_clicked');
 expect(sdk.capture.mock.calls.at(-1)[1].is_internal).toBe(true);expect(sdk.register.mock.calls.at(-1)[0].is_internal).toBe(true);expect(a.campaignLink('/app/#/try-on')).toContain('internal=1');
});

test('privacy filter keeps explicit attribution but removes URLs, private fields and raw referrers',async()=>{
 location(campaign);const a=await import('../analytics');a.initAnalytics();const event=a.cleanEvent({event:'$identify',properties:{$set_once:{utm_source:'instagram',$initial_utm_source:'instagram',initial_utm_source:'instagram',email:'secret'},$set:{name:'secret'},$referrer:'secret',$current_url:'secret'}});
 expect(JSON.stringify(event)).not.toContain('secret');expect(event.properties.$set_once).toEqual({utm_source:'instagram',initial_utm_source:'instagram',$initial_utm_source:'instagram'});
});

test('browser recognition and analytics failures do not break the product',async()=>{
 const a=await import('../analytics');a.initAnalytics();expect(a.inAppBrowser('FBAN/FBIOS')).toBe('facebook');expect(a.inAppBrowser('FBAV/123')).toBe('facebook');expect(a.inAppBrowser('Mozilla Chrome')).toBe('none');sdk.capture.mockImplementationOnce(()=>{throw Error('offline');});expect(()=>a.track('tryon_failed')).not.toThrow();
});
