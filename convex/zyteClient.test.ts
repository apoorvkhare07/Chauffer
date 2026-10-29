import {test,expect,vi,afterEach} from 'vitest';
import {zyteProduct,zyteExtract,normalizeZyteProduct} from './zyteClient';
const url='https://www.myntra.com/42488619';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
test('one common product request uses India and only sends the public URL',async()=>{
 vi.stubEnv('ZYTE_API_KEY','test-secret');const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({product:{name:'Blue kurta',url,mainImage:{url:'https://assets.myntassets.com/kurta.jpg'},price:'999',currency:'INR'}})));
 expect(await zyteProduct(url)).toEqual({title:'Blue kurta',imageUrl:'https://assets.myntassets.com/kurta.jpg'});
 expect(fetch).toHaveBeenCalledTimes(1);expect(fetch.mock.calls[0][0]).toBe('https://api.zyte.com/v1/extract');expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual({url,product:true,geolocation:'IN'});
});
test('unsafe input URLs never reach the provider',async()=>{
 vi.stubEnv('ZYTE_API_KEY','test');const fetch=vi.spyOn(globalThis,'fetch');
 for(const input of ['http://127.0.0.1/private','https://www.myntra.com.evil.example/42488619','https://user:pass@www.myntra.com/42488619'])await expect(zyteExtract(input,'product')).rejects.toThrow();expect(fetch).not.toHaveBeenCalled();
});
test('wrong-store products and unsafe images are rejected',async()=>{
 vi.stubEnv('ZYTE_API_KEY','test');const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValueOnce(new Response(JSON.stringify({product:{name:'Other',url:'https://www2.hm.com/en_in/productpage.1350457001.html',mainImage:{url:'https://image.hm.com/coat.jpg'}}}))).mockResolvedValueOnce(new Response(JSON.stringify({product:{name:'Blue kurta',url,mainImage:{url:'https://127.0.0.1/private'}}})));
 await expect(zyteProduct(url)).rejects.toThrow('no_product');await expect(zyteProduct(url)).rejects.toThrow('unsafe_image');expect(fetch).toHaveBeenCalledTimes(2);
});
test('credentials and quota errors do not retry or expose provider response bodies',async()=>{
 vi.stubEnv('ZYTE_API_KEY','test');const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValueOnce(new Response('private provider message',{status:401})).mockResolvedValueOnce(new Response('private provider message',{status:429}));
 await expect(zyteProduct(url)).rejects.toThrow('credentials');await expect(zyteProduct(url)).rejects.toThrow('limit');expect(fetch).toHaveBeenCalledTimes(2);
});
test('listing records keep unknown prices unknown and bound text',()=>{
 expect(normalizeZyteProduct({name:'a'.repeat(300),url,price:'free',currency:'INR'},'Myntra')).toEqual({title:'a'.repeat(160),url,currency:'INR'});
});
