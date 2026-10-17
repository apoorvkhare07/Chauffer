import {describe,it,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import schema from './schema';
import {api,internal} from './_generated/api';
import {hashSecret} from './lib/otp';
import {needsAudience} from './fashionRules';
const modules=import.meta.glob('./**/*.ts');
const token=()=>crypto.randomUUID()+crypto.randomUUID();
afterEach(()=>vi.unstubAllEnvs());
describe('Guest preview boundaries',()=>{
 it('allows one request, deduplicates reloads, rejects another turn and isolates results',async()=>{
  const t=convexTest(schema,modules),key=token();
  expect(await t.mutation(api.guestSearch.start,{token:key,text:'Blue shirts under 2000'})).toBe(true);
  expect(await t.mutation(api.guestSearch.start,{token:key,text:'Blue shirts under 2000'})).toBe(false);
  await expect(t.mutation(api.guestSearch.start,{token:key,text:'Show more'})).rejects.toThrow('Sign in');
  expect((await t.query(api.guestSearch.current,{token:key}))?.text).toBe('Blue shirts under 2000');
  expect(await t.query(api.guestSearch.current,{token:token()})).toBeNull();
  expect(await t.run(ctx=>ctx.db.query('guestSearches').collect())).toHaveLength(1);
 });
 it('expires private preview content without restoring its quota',async()=>{
  const t=convexTest(schema,modules),key=token();await t.mutation(api.guestSearch.start,{token:key,text:'Sneakers'});
  const row=await t.run(ctx=>ctx.db.query('guestSearches').first());await t.mutation(internal.guestSearch.clearContent,{id:row!._id});
  expect((await t.query(api.guestSearch.current,{token:key}))?.text).toBe('');
  await expect(t.mutation(api.guestSearch.start,{token:key,text:'Sneakers'})).rejects.toThrow('Sign in');
 });
 it('asks for a shopping audience before searching guest apparel and continues with the answer',async()=>{
  vi.stubEnv('GEMINI_API_KEY','');
  const t=convexTest(schema,modules),key=token(),tokenHash=await hashSecret(key);
  const id=await t.run(ctx=>ctx.db.insert('guestSearches',{tokenHash,text:'Blue denim shirt under 1500',state:'pending',createdAt:Date.now()}));
  await t.action(internal.guestSearchWorker.run,{id});
  let preview=await t.query(api.guestSearch.current,{token:key});
  expect(preview?.state).toBe('clarifying');expect(preview?.reply).toContain('Who are you shopping for');expect(preview?.result).toBeUndefined();
  await t.mutation(api.guestSearch.answerAudience,{token:key,audience:'men'});
  const row=await t.run(ctx=>ctx.db.get(id));expect(row?.state).toBe('pending');expect(row?.requirements?.audience).toBe('men');
  expect(needsAudience('shirt')).toBe(true);expect(needsAudience('shirt','women')).toBe(false);expect(needsAudience('bag')).toBe(false);
 });
 it('keeps private features and legacy password login unavailable to guests',async()=>{
  const t=convexTest(schema,modules);
  await expect(t.query(api.conversations.current,{})).rejects.toThrow('sign in');
  await expect(t.query(api.savedProducts.list,{})).rejects.toThrow('sign in');
  await expect(t.action(api.auth.signIn,{provider:'password',params:{email:'sample@example.com',password:'not-a-real-password',flow:'signIn'}})).rejects.toThrow();
 });
 it('rejects invalid capability tokens and limits newly created guest sessions globally',async()=>{
  const t=convexTest(schema,modules);
  await expect(t.mutation(api.guestSearch.start,{token:'short',text:'shirt'})).rejects.toThrow('reload');
  await t.run(async ctx=>{for(let i=0;i<30;i++)await ctx.db.insert('guestSearches',{tokenHash:String(i),text:'',state:'ready',createdAt:Date.now()});});
  await expect(t.mutation(api.guestSearch.start,{token:token(),text:'shirt'})).rejects.toThrow('busy');
 });
 it('gives a guest one successful try-on and one reviewed wardrobe analysis, then gates more',async()=>{
  const t=convexTest(schema,modules),key=token();await t.mutation(api.guestSearch.start,{token:key,text:'A blue shirt'});
  let row=await t.run(ctx=>ctx.db.query('guestTrials').first());expect(row?.chatUsed).toBe(true);
  await t.mutation(internal.guestTrials.claim,{tokenHash:row!.tokenHash,kind:'tryon'});
  row=await t.run(ctx=>ctx.db.query('guestTrials').first());expect(row?.tryOnBusy).toBe(true);
  await expect(t.mutation(internal.guestTrials.claim,{tokenHash:row!.tokenHash,kind:'tryon'})).rejects.toThrow('already being prepared');
  const outputId=await t.run(ctx=>ctx.storage.store(new Blob(['temporary image'])));
  await t.mutation(internal.guestTrials.finishTryOn,{id:row!._id,outputId,note:'Visual preview only.'});
  await expect(t.mutation(internal.guestTrials.claim,{tokenHash:row!.tokenHash,kind:'tryon'})).rejects.toThrow('first try-on is ready');
  await t.mutation(internal.guestTrials.claim,{tokenHash:row!.tokenHash,kind:'wardrobe'});
  const claimed=await t.run(ctx=>ctx.db.query('guestTrials').first());expect(claimed?.wardrobeBusy).toBe(true);
  await expect(t.mutation(internal.guestTrials.claim,{tokenHash:row!.tokenHash,kind:'wardrobe'})).rejects.toThrow('already being read');
  const analysis={details:{name:'Blue cotton shirt',category:'top' as const,colour:'blue',fabric:'',pattern:'solid',kind:'shirt',brand:'',cut:'regular',occasion:'',notes:'',size:'',attributes:{}},uncertainties:[],brandEvidence:''};
  await t.mutation(internal.guestTrials.finishWardrobe,{id:row!._id,analysis});
  await expect(t.mutation(internal.guestTrials.claim,{tokenHash:row!.tokenHash,kind:'wardrobe'})).rejects.toThrow('first wardrobe piece is ready');
 });
});
