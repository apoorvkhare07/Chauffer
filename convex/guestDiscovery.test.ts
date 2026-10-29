import {test,expect,vi,afterEach} from 'vitest';
import * as zyte from './zyteDiscovery';
import {discoverGuestProducts} from './guestDiscovery';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
const requirements={category:'shirt',audience:'men' as const,budget:1000,colour:'blue',fabric:'linen'};
test('guest search recovers unreadable stores with the provider’s automatic extraction and keeps every requested constraint',async()=>{
 vi.stubEnv('ZYTE_API_KEY','fixture');
 const first={options:[],failed:true,stores:['Myntra','Amazon','Flipkart','Nykaa Fashion','AJIO','Meesho'].map(store=>({store:store as any,status:'unavailable' as const,searchUrl:'https://example.test/search'}))};
 const option={title:'Men blue cotton linen shirt',price:899,fabric:'cotton linen',colour:'blue',url:'https://www.myntra.com/123',observedAt:Date.now()};
 const read=vi.spyOn(zyte,'discoverWithZyte').mockResolvedValueOnce(first).mockResolvedValueOnce({options:[option],failed:false,stores:[{...first.stores[0],status:'matched'}]});
 const result=await discoverGuestProducts(requirements);
 expect(read).toHaveBeenCalledTimes(2);expect(read.mock.calls[0][5]).toBe(true);expect(read.mock.calls[1][5]).toBe(false);expect(read.mock.calls[1][2]).toHaveLength(4);expect(read.mock.calls[1][0]).toEqual(requirements);expect(result.options).toEqual([option]);expect(result.failed).toBe(false);
});
test('readable empty results are not sent through browser recovery',async()=>{
 vi.stubEnv('ZYTE_API_KEY','fixture');const result={options:[],failed:false,stores:[{store:'Myntra' as const,status:'no_matches' as const,searchUrl:'https://example.test/search'}]};
 const read=vi.spyOn(zyte,'discoverWithZyte').mockResolvedValue(result);expect(await discoverGuestProducts(requirements)).toEqual(result);expect(read).toHaveBeenCalledTimes(1);
});
