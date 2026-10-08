import { getAuthUserId } from '@convex-dev/auth/server';
import type { QueryCtx, MutationCtx } from './_generated/server';
export async function requireOwner(ctx: QueryCtx | MutationCtx) {
 const userId = await getAuthUserId(ctx);
 if (!userId) throw new Error('Please sign in.');
 // A user ID stays the same across sign-ins; an auth token contains a session ID too.
 return userId;
}
