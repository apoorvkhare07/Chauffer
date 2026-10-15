import {describe,it,expect} from 'vitest';
import {convexTest} from 'convex-test';
import schema from './schema';
import {api,internal} from './_generated/api';
const modules=import.meta.glob('./**/*.ts');
const token=()=>crypto.randomUUID()+crypto.randomUUID();
describe('Guest preview boundaries',()=>{
 it('allows one request, deduplicates reloads, rejects another turn and isolates results',async()=>{
  const t=convexTest(schema,modules),key=token();
  await t.mutation(api.guestSearch.start,{token:key,text:'Blue shirts under 2000'});
  await t.mutation(api.guestSearch.start,{token:key,text:'Blue shirts under 2000'});
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
});
