import { convexTest } from 'convex-test';
import workflow from '@convex-dev/workflow/test';
import { expect,test,vi,afterEach } from 'vitest';
import schema from './schema';
import { internal } from './_generated/api';
const modules=import.meta.glob('./**/*.ts');
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();vi.clearAllTimers();vi.useRealTimers();});
test('test recipient gate, duplicate delivery, stale suppression and at-most-once send claims',async()=>{
 vi.useFakeTimers();
 vi.stubEnv('WHATSAPP_TEST_RECIPIENTS','919999999999');
 const t=convexTest(schema,modules);workflow.register(t);
 const timestamp=Date.now();const message={messageId:'hello-1',phone:'919999999999',text:'hi',timestamp};
 expect(await t.mutation(internal.whatsapp.receive,{incoming:[{...message,phone:'918888888888'}],statuses:[]})).toBe(0);
 expect(await t.mutation(internal.whatsapp.receive,{incoming:[message,message],statuses:[]})).toBe(1);
 const rows=await t.run(ctx=>ctx.db.query('waInbox').withIndex('by_message',q=>q.eq('messageId',message.messageId)).collect());
 const id=rows[0]._id;
 const claim=await t.mutation(internal.whatsapp.claimSend,{id,phase:'reply'});expect(claim?.phone).toBe(message.phone);
 expect(await t.mutation(internal.whatsapp.claimSend,{id,phase:'reply'})).toBeNull();
 await t.mutation(internal.whatsapp.sendResult,{id:claim!.outboxId,state:'sent',providerMessageId:'provider-1'});
 await t.mutation(internal.whatsapp.receive,{incoming:[{...message,messageId:'requirements-1',text:'blue cotton kurta M under 1000',timestamp:timestamp+1}],statuses:[{messageId:'provider-1',status:'read'},{messageId:'provider-1',status:'sent'}]});
 expect(await t.query(internal.whatsapp.plan,{id})).toBeNull();expect(await t.mutation(internal.whatsapp.claimSend,{id,phase:'options'})).toBeNull();
 expect((await t.run(ctx=>ctx.db.get(claim!.outboxId)))?.state).toBe('read');
 expect(await t.mutation(internal.whatsapp.receive,{incoming:[{...message,messageId:'older',timestamp:timestamp-1}],statuses:[]})).toBe(0);
});

test('hi → requirements → live options completes through the workflow and outgoing messages',async()=>{
 vi.useFakeTimers();vi.stubEnv('WHATSAPP_TEST_RECIPIENTS','919999999999');vi.stubEnv('WHATSAPP_TOKEN','test-token');vi.stubEnv('WHATSAPP_PHONE_ID','test-phone-id');
 const sent:string[]=[];const url='https://www.flipkart.com/test-kurta/p/test?pid=TEST';
 vi.spyOn(globalThis,'fetch').mockImplementation(async(input,init)=>{
  if(String(input).startsWith('https://graph.facebook.com/')){sent.push(JSON.parse(String(init?.body)).text.body);return new Response(JSON.stringify({messages:[{id:`sent-${sent.length}`}]}));}
  if(String(input).includes('/search?'))return new Response(`<script type="application/ld+json">${JSON.stringify([{'@type':'ItemList',itemListElement:[{url}]}])}</script>`);
  return new Response(`<script type="application/ld+json">${JSON.stringify([{'@type':'Product',name:'Women Cotton Straight Kurta',color:'Blue',offers:{price:500,priceCurrency:'INR',availability:'https://schema.org/InStock'}}])}</script><table><tr><td>Fabric</td><td>Pure Cotton</td></tr></table>`);
 });
 const t=convexTest(schema,modules);workflow.register(t);
 await t.mutation(internal.whatsapp.receive,{incoming:[{messageId:'flow-hi',phone:'919999999999',text:'hi',timestamp:Date.now()}],statuses:[]});
 await t.finishAllScheduledFunctions(vi.runAllTimers);expect(sent[0]).toContain("I'm Chauffeur");
 await t.mutation(internal.whatsapp.receive,{incoming:[{messageId:'flow-request',phone:'919999999999',text:'blue cotton kurta size M under 1000',timestamp:Date.now()}],statuses:[]});
 await t.finishAllScheduledFunctions(vi.runAllTimers);
 expect(sent).toHaveLength(3);expect(sent[1]).toContain("I'll check Flipkart");expect(sent[2]).toContain('₹500');expect(sent[2]).toContain(url);expect(sent[2]).toContain("won't place orders");
});
