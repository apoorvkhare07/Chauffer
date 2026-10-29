import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import schema from './schema';
import {internal,api} from './_generated/api';
import {analyticsPage,cleanEvent} from '../analytics';
const modules=import.meta.glob('./**/*.ts');
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
test('page events strip shopping queries and unknown hashes',()=>{
 const location={origin:'https://chauffer.studio',pathname:'/app/index.html',hash:'#/wardrobe',search:'?q=private'};
 vi.stubGlobal('window',{location});
 expect(analyticsPage(location as Location)).toBe('/app/wardrobe');
 expect(analyticsPage({...location,hash:'#/private-text'} as Location)).toBe('/app/home');
 const event=cleanEvent({event:'$pageview',properties:{$current_url:'https://x?q=private',$referrer:'https://x?secret=1',$set_once:{$initial_current_url:'secret'},page:'/app/wardrobe',action:'wardrobe_add'}});
 expect(JSON.stringify(event)).not.toMatch(/private|secret/);
 expect(event.properties.action).toBe('wardrobe_add');
});
test('signup analytics contains only opaque account id and event metadata',async()=>{
 const t=convexTest(schema,modules);const id=await t.run(ctx=>ctx.db.insert('users',{phone:'+919999999999',name:'Private name'}));
 vi.stubEnv('POSTHOG_KEY','phc_test');vi.stubEnv('POSTHOG_HOST','https://us.i.posthog.com');
 const fetch=vi.fn(async(_url:string,_init:RequestInit)=>new Response('{}'));vi.stubGlobal('fetch',fetch);
 vi.stubEnv('CONVEX_CLOUD_URL','https://rare-chameleon-828.convex.cloud');
 await t.action(internal.analytics.signup,{userId:id,context:{origin:'https://chauffer.studio',first:{utm_source:'instagram',utm_medium:'dm',utm_campaign:'linkcheck'},current:{utm_source:'instagram',utm_medium:'dm',utm_campaign:'linkcheck'},isInternal:true,inAppBrowser:'instagram'}});
 const body=JSON.parse(String(fetch.mock.calls[0][1].body));
 expect(body.event).toBe('signup_completed');expect(body.distinct_id).toBe(id);
 expect(JSON.stringify(body)).not.toMatch(/9999999999|Private name/);
 expect(body.properties.$insert_id).toBe(`signup:${id}`);
 expect(body.properties).toMatchObject({utm_source:'instagram',utm_medium:'dm',utm_campaign:'linkcheck',initial_utm_source:'instagram',is_internal:true,$set_once:{utm_source:'instagram',initial_utm_source:'instagram'}});
});

test('signup context is owner-bound, one-time, and cannot count returning users or previews',async()=>{
 const t=convexTest(schema,modules);
 vi.stubEnv('CONVEX_CLOUD_URL','https://rare-chameleon-828.convex.cloud');
 const [owner,other]=await t.run(async ctx=>[await ctx.db.insert('users',{}),await ctx.db.insert('users',{})]);
 await t.run(ctx=>ctx.db.insert('signupAnalytics',{owner,state:'pending',createdAt:Date.now()}));
 const context={origin:'https://chauffer.studio',first:{utm_source:'instagram'},current:{utm_source:'instagram'},isInternal:false,inAppBrowser:'instagram' as const};
 await t.mutation(api.analytics.completeSignup,{context});
 await t.withIdentity({subject:other}).mutation(api.analytics.completeSignup,{context});
 await t.withIdentity({subject:owner}).mutation(api.analytics.completeSignup,{context:{...context,origin:'https://chauffer-preview.vercel.app'}});
 expect((await t.run(ctx=>ctx.db.query('signupAnalytics').withIndex('by_owner',q=>q.eq('owner',owner)).unique()))?.state).toBe('pending');
 await t.withIdentity({subject:owner}).mutation(api.analytics.completeSignup,{context});
 await t.withIdentity({subject:owner}).mutation(api.analytics.completeSignup,{context});
 expect(await t.run(ctx=>ctx.db.system.query('_scheduled_functions').take(10))).toHaveLength(1);
});
test('preview and legacy signup jobs cannot send production events',async()=>{
 const t=convexTest(schema,modules),id=await t.run(ctx=>ctx.db.insert('users',{}));
 const send=vi.fn();vi.stubGlobal('fetch',send);vi.stubEnv('POSTHOG_KEY','phc_test');vi.stubEnv('POSTHOG_HOST','https://us.i.posthog.com');vi.stubEnv('CONVEX_CLOUD_URL','https://rare-chameleon-828.convex.cloud');
 await t.action(internal.analytics.signup,{userId:id});
 await t.action(internal.analytics.signup,{userId:id,context:{origin:'https://chauffer-preview.vercel.app',first:{},current:{},isInternal:false,inAppBrowser:'none'}});
 expect(send).not.toHaveBeenCalled();
});
