import test from 'node:test';
import assert from 'node:assert/strict';
import {trustedProductLink} from '../src/core/links';
const backend='https://sample.convex.cloud';
test('mobile permits only its configured signed affiliate endpoint',()=>{
 assert.equal(trustedProductLink('https://sample.convex.site/go?token=abc.def',backend),'https://sample.convex.site/go?token=abc.def');
 for(const url of ['https://other.convex.site/go?token=abc.def','https://sample.convex.site/other?token=abc.def','https://sample.convex.site/go?url=https://evil.test','https://sample.convex.site/go?token=abc.def&url=https://evil.test','https://sample.convex.site/go?token=abc.def#fragment','http://sample.convex.site/go?token=abc.def'])assert.throws(()=>trustedProductLink(url,backend));
});
test('mobile retains trusted merchant fallback and rejects unknown hosts',()=>{
 assert.equal(trustedProductLink('https://www.amazon.in/dp/B012345678',backend),'https://www.amazon.in/dp/B012345678');
 assert.throws(()=>trustedProductLink('https://evil.test',backend));
});
