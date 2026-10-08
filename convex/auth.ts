import { Password } from '@convex-dev/auth/providers/Password';
import { convexAuth } from '@convex-dev/auth/server';
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
 providers: [Password({profile(params) {
  const email = String(params.email ?? '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  return {email};
 }})],
});
