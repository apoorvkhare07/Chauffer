/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';
import schema from './schema';
import { api, internal } from './_generated/api';
const modules = import.meta.glob('./**/*.ts');
function setup() {
 const t = convexTest(schema, modules);
 const alice = t.withIdentity({subject:'alice', issuer:'https://test.chauffeur'});
 const bob = t.withIdentity({subject:'bob', issuer:'https://test.chauffeur'});
 return {t, alice, bob};
}
const freshQuote = () => ({store:'Test store', productUrl:'https://example.com/kurta', title:'Kurta', variant:'Blue / M', quantity:1, itemPaise:79900, shippingPaise:4000, totalPaise:83900, currency:'INR' as const, addressReference:'test-address', returnTerms:'Test only', observedAt:Date.now(), expiresAt:Date.now()+60000});
test('preferences require sign-in and are private, persistent, editable and removable', async () => {
 const {t,alice,bob} = setup();
 await expect(t.query(api.profiles.get, {})).rejects.toThrow('sign in');
 await alice.mutation(api.profiles.save, {preferences:{language:'hinglish', size:'M'}});
 expect(await alice.query(api.profiles.get, {})).toEqual({language:'hinglish',size:'M'});
 expect(await bob.query(api.profiles.get, {})).toBeNull();
 await expect(alice.mutation(api.profiles.save, {preferences:{language:'en',budgetPaise:-1}})).rejects.toThrow('Budget');
 await alice.mutation(api.profiles.clear, {});
 expect(await alice.query(api.profiles.get, {})).toBeNull();
});
test('only the owner can approve the exact total; repeated approval is harmless and revocation blocks approval', async () => {
 const {t,alice,bob} = setup();
 const reviewId = await t.mutation(internal.purchases.prepare, {owner:'alice',quote:freshQuote()});
 await expect(bob.mutation(api.purchases.approve,{reviewId,expectedTotalPaise:83900})).rejects.toThrow('unavailable');
 expect(await bob.query(api.purchases.list,{})).toEqual([]);
 await expect(alice.mutation(api.purchases.approve,{reviewId,expectedTotalPaise:1})).rejects.toThrow('total');
 await alice.mutation(api.purchases.approve,{reviewId,expectedTotalPaise:83900});
 await alice.mutation(api.purchases.approve,{reviewId,expectedTotalPaise:83900});
 expect((await alice.query(api.purchases.list,{}))[0].status).toBe('approved');
 await alice.mutation(api.purchases.revoke,{reviewId});
 await expect(alice.mutation(api.purchases.approve,{reviewId,expectedTotalPaise:83900})).rejects.toThrow('revoked');
});
test('expired reviews and invalid totals are rejected', async () => {
 const {t,alice} = setup();
 await expect(t.mutation(internal.purchases.prepare,{owner:'owner',quote:{...freshQuote(),totalPaise:1}})).rejects.toThrow('total');
 const reviewId = await t.mutation(internal.purchases.prepare,{owner:'alice',quote:freshQuote()});
 await t.run(async ctx => {const row = await ctx.db.get(reviewId); await ctx.db.patch(reviewId,{quote:{...row!.quote,expiresAt:Date.now()-1}});});
 await expect(alice.mutation(api.purchases.approve,{reviewId,expectedTotalPaise:83900})).rejects.toThrow('checked again');
});

test('preferences follow the user across different sign-in sessions', async () => {
 const {t} = setup();
 const first = t.withIdentity({subject:'alice|session-one',issuer:'https://test.chauffeur'});
 const next = t.withIdentity({subject:'alice|session-two',issuer:'https://test.chauffeur'});
 await first.mutation(api.profiles.save,{preferences:{language:'hi',size:'L'}});
 expect(await next.query(api.profiles.get,{})).toEqual({language:'hi',size:'L'});
});
