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
 const conversation=await t.run(ctx=>ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key','wa:919999999999')).unique());
 expect(conversation?.requirements).toMatchObject({category:'kurta',size:'M',budget:1000});
 const messages=await t.run(ctx=>ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',conversation!._id).eq('session',conversation!.session)).order('desc').take(1));
 expect(messages[0].result?.options[0].url).toBe(url);

});
test('product photo sends use trusted links and distinct duplicate-safe claims; uncertain sends are not retried',async()=>{
 vi.stubEnv('GEMINI_API_KEY','');vi.stubEnv('WHATSAPP_TEST_RECIPIENTS','919999999999');vi.stubEnv('WHATSAPP_TOKEN','test-token');vi.stubEnv('WHATSAPP_PHONE_ID','test-phone-id');vi.useFakeTimers();
 const t=convexTest(schema,modules);workflow.register(t);
 await t.mutation(internal.whatsapp.receive,{incoming:[{messageId:'photo-request',phone:'919999999999',text:'hi',timestamp:Date.now()}],statuses:[]});
 const inbox=await t.run(ctx=>ctx.db.query('waInbox').withIndex('by_message',q=>q.eq('messageId','photo-request')).unique());
 const fetcher=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({messages:[{id:'photo-provider'}]})));
 const args={id:inbox!._id,phase:'product_1' as const,text:'Option 1 · price observed, size unverified',imageUrl:'https://rukmini1.flixcart.com/image/item.jpg'};
 await expect(t.action(internal.whatsapp.send,{...args,imageUrl:'https://untrusted.example/image.jpg'})).rejects.toThrow('Untrusted');
 await t.action(internal.whatsapp.send,args);await t.action(internal.whatsapp.send,args);
 expect(fetcher).toHaveBeenCalledTimes(1);
 const body=JSON.parse(String(fetcher.mock.calls[0][1]?.body));expect(body).toMatchObject({type:'image',image:{link:args.imageUrl,caption:args.text}});
 fetcher.mockRejectedValue(new Error('timeout'));
 await t.action(internal.whatsapp.send,{...args,phase:'product_2'});await t.action(internal.whatsapp.send,{...args,phase:'product_2'});
 expect(fetcher).toHaveBeenCalledTimes(2);
 const outbox=await t.run(ctx=>ctx.db.query('waOutbox').withIndex('by_key',q=>q.eq('key',`${inbox!._id}:product_2`)).unique());expect(outbox?.state).toBe('uncertain');
});
