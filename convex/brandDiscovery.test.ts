import {afterEach,expect,test,vi} from 'vitest';
import {searchTerms,matchesOption} from './discoveryRules';
import {expandedStoreBody} from './liveDiscovery';
import {expandedRetailOptions} from './expandedRetail';
import {storeSearchUrl} from './marketplaces';
const requirements={category:'sneakers',brand:'Nike',colour:'white',budget:7000,audience:'men' as const,size:'UK 8',occasion:'walking',style:'classic'};
afterEach(()=>vi.unstubAllGlobals());
test('brand refinement prioritises the chosen brand without erasing use or hard constraints',()=>{
 expect(searchTerms(requirements)).toBe('Nike white sneakers men');
 expect(searchTerms({...requirements,brand:'any'})).toContain('walking');
 expect(searchTerms({...requirements,mustHave:['walking']})).toContain('walking');
 expect(requirements.occasion).toBe('walking');
 const option={title:'Nike Men White Sneakers',brand:'Nike',price:4995,colour:'White',fabric:'',url:'https://www.tatacliq.com/nike-white-sneakers/p-mp000000000000001',observedAt:1};
 expect(matchesOption(option,requirements)).toBe(true);
 expect(matchesOption({...option,brand:'Puma'},requirements)).toBe(false);
 expect(matchesOption({...option,price:7001},requirements)).toBe(false);
 expect(matchesOption({...option,colour:'Black'},requirements)).toBe(false);
 expect(matchesOption(option,{...requirements,mustHave:['walking']})).toBe(false);
});
test('the public store request and reader recover brand results after a walking refinement',async()=>{
 const rows=[{productname:'Nike Men White Casual Sneakers',brandname:'Nike',productColor:'White',inStockFlag:true,webURL:'https://www.tatacliq.com/nike-white-sneakers/p-mp000000000000001',price:{sellingPrice:{currencyIso:'INR',doubleValue:4995}}}];
 vi.stubGlobal('fetch',vi.fn(async(input:string)=>{
  const query=new URL(input).searchParams.get('searchText');
  // Merchant relevance follows the incidental use word when it is included.
  return new Response(JSON.stringify({searchresult:query==='Nike white sneakers men:relevance'?rows:[]}));
 }));
 const body=await expandedStoreBody('Tata CLiQ',requirements,storeSearchUrl('Tata CLiQ',requirements));
 expect(expandedRetailOptions('Tata CLiQ',body,requirements,1).options).toMatchObject([{brand:'Nike',price:4995,colour:'White'}]);
});
