import {test,expect,vi,afterEach} from 'vitest';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {useQuery} from 'convex/react';
import AffiliateLink,{AffiliateDisclosure} from './AffiliateLink.jsx';
import ProductPreview from './ProductPreview.jsx';
vi.mock('convex/react',()=>({useQuery:vi.fn()}));
afterEach(()=>vi.resetAllMocks());
const query=vi.mocked(useQuery);
test('web links preserve new-tab protections and use the signed URL once available',()=>{
 query.mockReturnValue({href:'https://test.convex.site/go?token=signed.proof'});
 const html=renderToStaticMarkup(React.createElement(AffiliateLink,{reference:{kind:'saved',id:'test'},source:'saved',href:'https://www.amazon.in/dp/B012345678'},'Open store'));
 expect(html).toContain('href="https://test.convex.site/go?token=signed.proof"');expect(html).toContain('target="_blank"');expect(html).toContain('rel="noopener noreferrer"');
 expect(query.mock.calls[0][1]).toEqual({reference:{kind:'saved',id:'test'},source:'saved'});
});
test('preview fallback photos use the same protected product reference',()=>{
 query.mockReturnValue({href:'https://test.convex.site/go?token=signed.proof'});
 const html=renderToStaticMarkup(React.createElement(ProductPreview,{option:{title:'Shirt',url:'https://www.amazon.in/dp/B012345678',store:'Amazon'},reference:{kind:'saved',id:'test'},source:'saved'}));
 expect(html).toContain('/go?token=signed.proof');expect(html).toContain('See photos on Amazon');
});
test('loading and unconfigured links retain the original store URL',()=>{
 query.mockReturnValue(undefined);
 const html=renderToStaticMarkup(React.createElement(AffiliateLink,{reference:{kind:'saved',id:'test'},source:'saved',href:'https://www.amazon.in/dp/B012345678'},'Open'));
 expect(html).toContain('href="https://www.amazon.in/dp/B012345678"');
});
test('commission disclosure appears only when affiliate setup is enabled',()=>{
 query.mockReturnValue({enabled:false,amazon:false});expect(renderToStaticMarkup(React.createElement(AffiliateDisclosure))).toBe('');
 query.mockReturnValue({enabled:true,amazon:true});const html=renderToStaticMarkup(React.createElement(AffiliateDisclosure));expect(html).toContain('may earn Chauffeur a commission');expect(html).toContain('As an Amazon Associate');
});
test('rejected references and unsafe raw fallback URLs do not become clickable',()=>{
 query.mockReturnValue(null);
 expect(renderToStaticMarkup(React.createElement(AffiliateLink,{reference:{kind:'saved',id:'test'},source:'saved',href:'https://www.amazon.in/dp/B012345678'},'Open'))).not.toContain('href=');
 query.mockReturnValue(undefined);
 expect(renderToStaticMarkup(React.createElement(AffiliateLink,{href:'https://evil.test'},'Open'))).not.toContain('href=');
});
