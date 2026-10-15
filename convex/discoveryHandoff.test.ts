import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import {Agent} from '@convex-dev/agent';
import schema from './schema';
import {api,internal} from './_generated/api';
import {buildDiscoveryHandoff} from './discoveryHandoff';
import {safeDiscoveryStyling} from './discoveryStylingRules';
import {wardrobeIntent,loadShoppingContext} from './shoppingContext';
import {emptyStyle} from './wardrobeRules';
const modules=import.meta.glob('./**/*.ts');
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
const product={title:'Men blue jeans',url:'https://example.com/jeans',price:2400,colour:'Blue',fabric:'Cotton',observedAt:123,source:'product' as const};
async function setup(){const t=convexTest(schema,modules);const ids=await t.run(async ctx=>{
 const conversationId=await ctx.db.insert('conversations',{key:'web:alice',requirements:{category:'jeans',budget:3000,size:'32'},revision:1,session:0,pending:true,updatedAt:Date.now(),shownUrls:[],rejectedUrls:[],wardrobeContextRequested:true,inputText:'jeans with my wardrobe'});
 const id=await ctx.db.insert('wardrobeItems',{owner:'alice',details:{name:'Cream sweater',category:'top',colour:'Cream'},available:true,createdAt:1});
 await ctx.db.insert('wardrobeItems',{owner:'bob',details:{name:'Private shirt',category:'top',colour:'Blue'},available:true,createdAt:1});
 await ctx.db.insert('wardrobeItems',{owner:'alice',details:{name:'Unavailable shirt',category:'top',colour:'Blue'},available:false,createdAt:1});
 return {conversationId,id};});return {t,...ids,user:t.withIdentity({subject:'alice'})};}
test('handoff preserves source facts, units, unknowns and revision; pairing rejects invented references',async()=>{
 const {t,conversationId,id}=await setup();const context=(await t.query(internal.discoveryCoordinator.context,{conversationId,revision:1}))!;
 expect(context.wardrobe.items.map(i=>i.details.name)).toEqual(['Cream sweater']);
 const packet=buildDiscoveryHandoff({conversationId,session:0,revision:1,requirements:context.requirements,taste:context.taste,result:{options:[product],stores:[],failed:false}});
 expect(packet).toMatchObject({currency:'INR',priceUnit:'rupees',request:{revision:1}});expect(packet.products[0].facts).toEqual(product);expect(packet.products[0].unknowns.length).toBeGreaterThan(0);
 const safe=safeDiscoveryStyling(packet,context.wardrobe,{matches:[{productId:product.url,wardrobeItemIds:[id],reason:'Possible casual combination.'},{productId:'invented',wardrobeItemIds:[id],reason:'bad'},{productId:product.url,wardrobeItemIds:['invented'],reason:'bad'}]});
 expect(safe.matches).toHaveLength(1);expect(safe.matches[0].items[0].name).toBe('Cream sweater');
 await t.mutation(internal.conversations.complete,{conversationId,revision:1,result:{options:[product],stores:[],failed:false},styling:safe,stylingSourceKey:context.wardrobe.sourceKey});
 expect((await t.query(internal.discoveryCoordinator.handoff,{conversationId,revision:1}))?.styling.state).toBe('ready');
 await t.run(ctx=>ctx.db.patch(id,{available:false}));
 const current=await t.withIdentity({subject:'alice'}).query(api.conversations.current,{});
 expect(current.messages.at(-1)?.handoff?.styling).toMatchObject({state:'stale',matches:[]});expect(current.messages.at(-1)?.result?.options).toEqual([product]);
 expect(await t.query(internal.discoveryCoordinator.handoff,{conversationId,revision:0})).toBeNull();
 const other=await t.withIdentity({subject:'bob'}).query(api.conversations.current,{});expect(other.messages.some(m=>m.handoff)).toBe(false);
});
test('ordinary search skips wardrobe access and styling calls; empty wardrobe and model failure have explicit states',async()=>{
 const {t,conversationId}=await setup();const c=(await t.run(ctx=>ctx.db.get(conversationId)))!;
 const getDB=vi.fn();const plain=await loadShoppingContext({db:getDB} as any,{...c,wardrobeContextRequested:false});expect(getDB).not.toHaveBeenCalled();expect(plain.requested).toBe(false);
 const packet=buildDiscoveryHandoff({conversationId,session:0,revision:1,requirements:c.requirements,taste:{prefer:[],avoid:[]},result:{options:[product],stores:[],failed:false}});
 const generate=vi.spyOn(Agent.prototype,'generateObject').mockRejectedValue(new Error('private provider diagnostic'));
 expect((await t.action(internal.discoveryStyling.review,{packet,context:plain,deadlineAt:Date.now()+20000})).state).toBe('not_requested');
 expect(generate).not.toHaveBeenCalled();
 expect((await t.action(internal.discoveryStyling.review,{packet,context:{...plain,requested:true},deadlineAt:Date.now()+20000})).state).toBe('needs_wardrobe');
 vi.stubEnv('GEMINI_API_KEY','test-key');const context=(await t.query(internal.discoveryCoordinator.context,{conversationId,revision:1}))!;
 const failed=await t.action(internal.discoveryStyling.review,{packet,context:context.wardrobe,deadlineAt:Date.now()+20000});expect(failed.state).toBe('unavailable');expect(JSON.stringify(failed)).not.toContain('private provider');
 expect(wardrobeIntent('with my wardrobe')).toBe(true);expect(wardrobeIntent('sneakers with my dark blue jeans')).toBe(true);expect(wardrobeIntent('help with my budget')).toBe(false);expect(wardrobeIntent('blue instead',true)).toBe(true);expect(wardrobeIntent("don't use my wardrobe",true)).toBe(false);
});
test('an inventory change during styling invalidates the pairing before publication',async()=>{
 const {t,conversationId,id}=await setup();const context=(await t.query(internal.discoveryCoordinator.context,{conversationId,revision:1}))!;
 const packet=buildDiscoveryHandoff({conversationId,session:0,revision:1,requirements:context.requirements,taste:context.taste,result:{options:[product],stores:[],failed:false}});
 const styling=safeDiscoveryStyling(packet,context.wardrobe,{matches:[{productId:product.url,wardrobeItemIds:[id],reason:'Possible combination.'}]});
 await t.run(ctx=>ctx.db.patch(id,{details:{name:'Changed sweater',category:'top',colour:'Red'}}));
 await t.mutation(internal.conversations.complete,{conversationId,revision:1,result:{options:[product],stores:[],failed:false},styling,stylingSourceKey:context.wardrobe.sourceKey});
 const row=await t.run(ctx=>ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',conversationId).eq('session',0)).first());
 expect(row?.handoff?.styling).toMatchObject({state:'stale',matches:[]});expect(row?.result?.options).toHaveLength(1);
});
