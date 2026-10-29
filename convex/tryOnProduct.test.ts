import {test,expect,vi,afterEach} from 'vitest';
import {productImage,readTryOnProduct} from './tryOnProduct';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
const url='https://www.myntra.com/42488619';
const html='<script type="application/ld+json">{"@type":"Product","name":"Blue shirt","image":{"url":"https://assets.myntassets.com/shirt.jpg"}}</script>';
test('reads structured product images before social thumbnails and rejects unsafe images',()=>{
 expect(productImage(html+'<meta property="og:image" content="https://assets.myntassets.com/logo.jpg">',url)).toEqual({title:'Blue shirt',imageUrl:'https://assets.myntassets.com/shirt.jpg'});
 expect(productImage('<meta property="og:image" content="http://127.0.0.1/private">',url)).toBeNull();
});
test('follows validated same-store product redirects, never private destinations',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValueOnce(new Response(null,{status:302,headers:{location:'/shirts/brand/shirt/42488619/buy'}})).mockResolvedValueOnce(new Response(html));
 expect((await readTryOnProduct(url)).title).toBe('Blue shirt');expect(fetch.mock.calls[1][0]).toBe('https://www.myntra.com/shirts/brand/shirt/42488619/buy');
 fetch.mockReset().mockResolvedValue(new Response(null,{status:302,headers:{location:'http://127.0.0.1/private'}}));vi.stubEnv('BROWSERLESS_API_KEY','');
 await expect(readTryOnProduct(url)).rejects.toThrow();expect(fetch).toHaveBeenCalledTimes(1);
});
test('direct-only proof of concept never invokes Browserless when a store blocks access',async()=>{
 vi.stubEnv('BROWSERLESS_API_KEY','test');const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('<html>App shell</html>'));
 await expect(readTryOnProduct(url)).rejects.toThrow('no image');expect(fetch).toHaveBeenCalledTimes(1);
 fetch.mockReset().mockResolvedValue(new Response('blocked',{status:403}));await expect(readTryOnProduct('https://newme.asia/product/blue-shirt')).rejects.toThrow();expect(fetch).toHaveBeenCalledTimes(1);
});
