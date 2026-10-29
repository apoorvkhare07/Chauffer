import {afterEach,expect,test,vi} from 'vitest';
import {convexTest} from 'convex-test';
import schema from './schema';
import {api} from './_generated/api';
import {localTestAuthEnabled,validLocalTestCredentials} from './lib/localTestAuth';
const modules=import.meta.glob('./**/*.ts');
afterEach(()=>vi.unstubAllEnvs());
test('test auth fails closed outside the exact enabled development deployment',()=>{
 vi.stubEnv('LOCAL_TEST_AUTH_ENABLED','true');
 for(const url of ['', 'https://rare-chameleon-828.convex.cloud','https://mellow-spaniel-636.convex.cloud.evil.test']){vi.stubEnv('CONVEX_CLOUD_URL',url);expect(localTestAuthEnabled()).toBe(false);expect(validLocalTestCredentials({phone:'0000000000',code:'123456'})).toBe(false);}
 vi.stubEnv('CONVEX_CLOUD_URL','https://mellow-spaniel-636.convex.cloud');vi.stubEnv('LOCAL_TEST_AUTH_ENABLED','false');expect(localTestAuthEnabled()).toBe(false);
});
test('local provider issues a real session, reuses a separate fake account, rejects wrong credentials and production',async()=>{
 const {generateKeyPair,exportPKCS8,exportJWK}=await import('jose');const keys=await generateKeyPair('RS256',{extractable:true});
 vi.stubEnv('JWT_PRIVATE_KEY',(await exportPKCS8(keys.privateKey)).trimEnd().replace(/\n/g,' '));vi.stubEnv('JWKS',JSON.stringify({keys:[{use:'sig',...await exportJWK(keys.publicKey)}]}));vi.stubEnv('CONVEX_SITE_URL','https://sample.convex.site');
 vi.stubEnv('CONVEX_CLOUD_URL','https://mellow-spaniel-636.convex.cloud');vi.stubEnv('LOCAL_TEST_AUTH_ENABLED','true');
 const t=convexTest(schema,modules);expect(await t.query(api.localTestAuth.availability,{})).toBe(true);
 for(const params of [{phone:'0000000000',code:'000000'},{phone:'9876543210',code:'123456'}])expect((await t.action(api.auth.signIn,{provider:'local-test',params})).tokens).toBeNull();
 const params={phone:'0000000000',code:'123456'};expect((await t.action(api.auth.signIn,{provider:'local-test',params})).tokens?.token).toBeTruthy();await t.action(api.auth.signIn,{provider:'local-test',params});
 const users=await t.run(ctx=>ctx.db.query('users').take(2));expect(users).toHaveLength(1);expect(users[0].phone).toBeUndefined();expect(users[0].name).toBe('Local development test');
 vi.stubEnv('CONVEX_CLOUD_URL','https://rare-chameleon-828.convex.cloud');expect(await t.query(api.localTestAuth.availability,{})).toBe(false);expect((await t.action(api.auth.signIn,{provider:'local-test',params})).tokens).toBeNull();
});
