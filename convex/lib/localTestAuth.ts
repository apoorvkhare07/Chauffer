// Public test credentials, never a real phone identity. Only this development
// deployment can enable the provider; a client-supplied hostname is not trusted.
export const localTestNumber='0000000000';
export const localTestCode='123456';
export function localTestAuthEnabled(){
 return process.env.LOCAL_TEST_AUTH_ENABLED==='true'&&process.env.CONVEX_CLOUD_URL==='https://mellow-spaniel-636.convex.cloud';
}
export function validLocalTestCredentials(credentials:Record<string,unknown>){
 return localTestAuthEnabled()&&credentials.phone===localTestNumber&&credentials.code===localTestCode;
}
