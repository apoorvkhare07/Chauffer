// @vitest-environment node
import {afterEach,expect,test,vi} from 'vitest';
import {browserAccessProbe} from './storeBrowserProbe';
afterEach(()=>vi.restoreAllMocks());
test('browser experiment requires a server key and sends only a fixed test request',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('<a href="/test-sneakers/p/abc123">Men sneakers ₹499</a><a href="https://evil.test/p/abc123">Fake</a>'));
 expect((await browserAccessProbe('Meesho')).status).toBe('not_configured');expect(fetch).not.toHaveBeenCalled();
 const result=await browserAccessProbe('Meesho','invented-test-token');expect(result).toMatchObject({status:'page_read',productLinks:1});expect(result.samples[0].url).toBe('https://www.meesho.com/test-sneakers/p/abc123');
 const body=JSON.parse(fetch.mock.calls[0][1]!.body as string);expect(body.url).toBe('https://www.meesho.com/search?q=sneakers+men');expect(body.gotoOptions.timeout).toBe(15000);expect(body.waitForSelector.selector).toBe('a[href*="/p/"]');
});
test('provider failure never exposes its token and a rendered shell is not product evidence',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch').mockRejectedValue(new Error('https://provider.test?token=invented-secret'));
 const result=await browserAccessProbe('Meesho','invented-secret');expect(result.status).toBe('provider_unavailable');expect(JSON.stringify(result)).not.toContain('invented-secret');
 fetch.mockResolvedValue(new Response('<title>Access Denied</title><h1>Access refused</h1>',{headers:{'x-response-code':'403'}}));expect(await browserAccessProbe('Meesho','invented-secret')).toMatchObject({status:'no_product_evidence',targetHttpStatus:403,pageTitle:'Access Denied'});
 fetch.mockResolvedValue(new Response('Timeout',{status:408}));expect(await browserAccessProbe('Meesho','invented-secret')).toMatchObject({status:'provider_unavailable',httpStatus:408,failure:'navigation_timeout'});
});
