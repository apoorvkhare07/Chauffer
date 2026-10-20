import {Agent} from '@convex-dev/agent';
import sharp from 'sharp';
import {convexTest} from 'convex-test';
import workflow from '@convex-dev/workflow/test';
import {test,expect,vi,afterEach} from 'vitest';
import schema from './schema';
import {internal} from './_generated/api';
import {parsePayload} from './whatsappProtocol';
import {messagePayload} from './whatsappUi';
import {emptyStyle} from './wardrobeRules';
const modules=import.meta.glob('./**/*.ts');
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();vi.clearAllTimers();vi.useRealTimers();});
async function fixture(complete=true){
 vi.useFakeTimers();vi.stubEnv('WHATSAPP_TEST_RECIPIENTS','919999999999');vi.stubEnv('GEMINI_API_KEY','');
 const t=convexTest(schema,modules);workflow.register(t);
 const owner=await t.run(async ctx=>{const id=await ctx.db.insert('users',{phone:'+919999999999',phoneVerificationTime:Date.now()});if(complete){await ctx.db.insert('profiles',{owner:id,preferences:{name:'Test Shopper',age:28,gender:'male',audience:'men',language:'en'},updatedAt:Date.now()});await ctx.db.insert('wardrobeStyles',{owner:id,details:{...emptyStyle,stylePreferences:'minimal'},updatedAt:Date.now()});}return id;});
 let n=0;
 const send=async(text:string,media?:{id:string,mime:string,kind:'image'|'audio'})=>{
  const messageId=`incoming-${++n}`;
  await t.mutation(internal.whatsappChannel.receive,{incoming:[{messageId,phone:'919999999999',text,timestamp:Date.now(),...(media?{media}:{})}],statuses:[]});
  const row=await t.run(ctx=>ctx.db.query('waInbox').withIndex('by_message',q=>q.eq('messageId',messageId)).unique());
  await t.mutation(internal.whatsappChannel.route,{id:row!._id,owner});return (await t.run(ctx=>ctx.db.get(row!._id)))!;
 };
 return {t,owner,send};
}
test('parses signed-webhook button/list IDs and image metadata, isolates the recipient number',()=>{
 const value={metadata:{phone_number_id:'ours'},messages:[{id:'a',from:'919999999999',timestamp:'100',type:'interactive',interactive:{type:'button_reply',button_reply:{id:'menu:style',title:'Untrusted title'}}},{id:'b',from:'919999999999',timestamp:'100',type:'image',image:{id:'123',mime_type:'image/jpeg'}}]};
 const p={object:'whatsapp_business_account',entry:[{changes:[{field:'messages',value}]}]};
 expect(parsePayload(p,'ours').incoming[0].text).toBe('menu:style');expect(parsePayload(p,'ours').incoming[1].media).toEqual({id:'123',mime:'image/jpeg',kind:'image'});expect(parsePayload(p,'other').incoming).toEqual([]);
 expect(messagePayload('91','Choose',[{id:'x',title:'Pick'}])).toMatchObject({type:'interactive',interactive:{action:{buttons:[{type:'reply',reply:{id:'x',title:'Pick'}}]}}});
 expect(()=>messagePayload('91','x'.repeat(1025),[{id:'x',title:'Pick'}])).toThrow();
});
test('consent, minimal setup, stale buttons and same-account preferences',async()=>{
 const {t,owner,send}=await fixture(false);
 expect((await send('hi')).reply).toContain('May I save');
 expect((await send('wa:0:consent:yes')).reply).toContain('earlier');
 expect((await send('consent:yes')).reply).toContain('call you');
 await send('Aarav');expect((await send('28')).reply).toContain('profile');
 await send('audience:men');await send('language:en');expect((await send('minimal')).reply).toContain('You’re ready');
 const profile=await t.run(ctx=>ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner',owner)).unique());expect(profile?.preferences).toMatchObject({name:'Aarav',age:28,audience:'men',language:'en'});
});
test('owner isolation, shared web conversation and monthly limits',async()=>{
 vi.stubEnv('PLAN_LIMITS_ENABLED','true');
 const {t,owner,send}=await fixture();await send('consent:yes');
 const row=await send('blue shirt');
 const shared=await t.run(ctx=>ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${owner}`)).unique());expect(shared?.requirements.audience).toBe('men');expect(row.sharedRevision).toBe(shared?.revision);
 const wrong=await t.run(ctx=>ctx.db.insert('users',{phone:'+918888888888',phoneVerificationTime:Date.now()}));
 const other=await t.run(async ctx=>{const id=await ctx.db.insert('waInbox',{messageId:'wrong',phone:'919999999999',text:'hello',timestamp:Date.now(),conversationId:row.conversationId,revision:row.revision,requirements:{},reply:'',search:false,state:'queued'});return id;});
 await expect(t.mutation(internal.whatsappChannel.route,{id:other,owner:wrong})).rejects.toThrow('mismatch');
 const usage=await t.run(ctx=>ctx.db.query('planUsage').withIndex('by_owner_month',q=>q.eq('owner',owner)).first());expect(usage?.conversations).toBe(1);
 await t.run(ctx=>ctx.db.patch(usage!._id,{conversations:10}));await expect(send('reset')).rejects.toThrow('10 free conversations');
});
test('attachments are not downloaded before purpose consent; stale and stopped media are rejected',async()=>{
 const {t,send}=await fixture();await send('consent:yes');
 const photo=await send('[unsupported message]',{id:'123',mime:'image/jpeg',kind:'image'});expect(photo.reply).toContain('Choosing an option');
 expect(await t.mutation(internal.whatsappChannel.claimMedia,{id:photo._id,purpose:'body'})).toBeNull();
 const consent=await send('photo:wardrobe');
 expect(await t.mutation(internal.whatsappChannel.claimMedia,{id:consent._id,purpose:'body'})).toBeNull();
 expect(await t.mutation(internal.whatsappChannel.claimMedia,{id:consent._id,purpose:'wardrobe'})).toMatchObject({mediaId:'123'});
 expect(await t.mutation(internal.whatsappChannel.claimMedia,{id:consent._id,purpose:'wardrobe'})).toBeNull();
 await send('stop');expect(await t.query(internal.whatsappChannel.mediaCurrent,{id:consent._id})).toBe(false);
});
test('duplicate callbacks are ignored and web updates suppress stale WhatsApp sends',async()=>{
 const {t,owner,send}=await fixture();await send('consent:yes');const row=await send('blue shirt');
 expect(await t.mutation(internal.whatsappChannel.receive,{incoming:[{messageId:row.messageId,phone:row.phone,text:'blue shirt',timestamp:row.timestamp}],statuses:[]})).toBe(0);
 const c=await t.run(ctx=>ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${owner}`)).unique());await t.run(ctx=>ctx.db.patch(c!._id,{revision:c!.revision+1}));
 expect(await t.mutation(internal.whatsapp.claimSend,{id:row._id,phase:'options'})).toBeNull();
});

test('signed sender is mapped to the existing MSG91 account without creating a second owner',async()=>{
 const {t,owner}=await fixture();
 await t.run(ctx=>ctx.db.insert('authAccounts',{userId:owner,provider:'msg91',providerAccountId:'919999999999'}));
 await t.mutation(internal.whatsappChannel.receive,{incoming:[{messageId:'account-link',phone:'919999999999',text:'hi',timestamp:Date.now()}],statuses:[]});
 const m=await t.run(ctx=>ctx.db.query('waInbox').withIndex('by_message',q=>q.eq('messageId','account-link')).unique());
 await t.action(internal.whatsappChannel.process,{id:m!._id});
 const channel=await t.run(ctx=>ctx.db.get(m!.conversationId));expect(channel?.owner).toBe(owner);
 expect((await t.run(ctx=>ctx.db.get(m!._id)))?.reply).toContain('May I save');
});
test('confirmed wardrobe photo uses existing capacity checks and cannot confirm another owner’s draft',async()=>{
 const {t,owner,send}=await fixture();await send('consent:yes');
 const draft=await t.run(async ctx=>{
  const photoId=await ctx.storage.store(new Blob(['fixture'],{type:'image/jpeg'}));
  return ctx.db.insert('wardrobePhotoDrafts',{owner:'other-user',photoId,state:'ready',analysis:{details:{name:'Shirt',category:'top',colour:'Blue'},uncertainties:[],brandEvidence:''},createdAt:Date.now()});
 });
 const c=await t.run(ctx=>ctx.db.query('waConversations').withIndex('by_phone',q=>q.eq('phone','919999999999')).unique());await t.run(ctx=>ctx.db.patch(c!._id,{draftId:draft}));
 expect((await send('wardrobe:confirm')).reply).toContain('new clothing photo');
 expect(await t.run(ctx=>ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).take(1))).toEqual([]);
});

test('photo → AI draft → corrected tags → confirmed wardrobe item shares web storage and quota',async()=>{
 vi.stubEnv('PLAN_LIMITS_ENABLED','true');
 const {t,owner,send}=await fixture();await send('consent:yes');vi.stubEnv('GEMINI_API_KEY','test');
 const jpeg=await sharp({create:{width:8,height:8,channels:3,background:'#2950b8'}}).jpeg().toBuffer();
 vi.spyOn(globalThis,'fetch').mockResolvedValueOnce(new Response(JSON.stringify({url:'https://lookaside.fbsbx.com/image',mime_type:'image/jpeg',file_size:jpeg.length}))).mockResolvedValueOnce(new Response(jpeg));
 vi.spyOn(Agent.prototype,'generateObject').mockResolvedValue({object:{singleItemVisible:true,details:{name:'Shirt',category:'top',colour:'Blue',kind:'shirt',brand:'',fabric:'',size:'',attributes:{}},uncertainties:[],brandEvidence:''}} as any);
 await send('[unsupported message]',{id:'123',mime:'image/jpeg',kind:'image'});const consent=await send('photo:wardrobe');
 await t.action(internal.whatsappMedia.analyse,{id:consent._id,purpose:'wardrobe'});
 expect(await t.run(ctx=>ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).take(1))).toEqual([]);
 await send('brand: Test label');expect((await send('wardrobe:confirm')).reply).toContain('Added to your wardrobe');
 const items=await t.run(ctx=>ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).take(2));expect(items).toHaveLength(1);expect(items[0].details.brand).toBe('Test label');expect(items[0].photoId).toBeTruthy();expect(items[0].cleanPhotoState).toBe('building');
 expect((await send('wardrobe:confirm')).reply).toContain('new clothing photo');
 const usage=await t.run(ctx=>ctx.db.query('planUsage').withIndex('by_owner_month',q=>q.eq('owner',owner)).first());expect(usage?.wardrobeItems).toBe(1);
});
test('voice is transcribed as a draft and never searches before the user confirms',async()=>{
 const {t,owner,send}=await fixture();await send('consent:yes');vi.stubEnv('GEMINI_API_KEY','test');
 const ogg=Buffer.alloc(200);ogg.write('OggS');
 vi.spyOn(globalThis,'fetch').mockResolvedValueOnce(new Response(JSON.stringify({url:'https://lookaside.fbsbx.com/audio',mime_type:'audio/ogg; codecs=opus',file_size:ogg.length}))).mockResolvedValueOnce(new Response(ogg));
 vi.spyOn(Agent.prototype,'generateObject').mockResolvedValue({object:{text:'blue shirt under 1500',uncertainties:[]}} as any);
 await send('[unsupported message]',{id:'456',mime:'audio/ogg',kind:'audio'});const consent=await send('photo:voice');
 await t.action(internal.whatsappMedia.analyse,{id:consent._id,purpose:'voice'});
 const before=await t.run(ctx=>ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${owner}`)).unique());expect(before).toBeNull();
 vi.stubEnv('GEMINI_API_KEY','');await send('input:confirm');
 const conversation=await t.run(ctx=>ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${owner}`)).unique());expect(conversation?.inputText).toBe('blue shirt under 1500');
});
