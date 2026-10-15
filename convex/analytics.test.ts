import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import schema from './schema';
import {internal} from './_generated/api';
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
 await t.action(internal.analytics.signup,{userId:id});
 const body=JSON.parse(String(fetch.mock.calls[0][1].body));
 expect(body.event).toBe('signup_completed');expect(body.distinct_id).toBe(id);
 expect(JSON.stringify(body)).not.toMatch(/9999999999|Private name/);
 expect(body.properties.$insert_id).toBe(`signup:${id}`);
});
