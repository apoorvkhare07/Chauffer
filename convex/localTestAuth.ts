import {query} from './_generated/server';
import {v} from 'convex/values';
import {localTestAuthEnabled} from './lib/localTestAuth';
export const availability=query({args:{},returns:v.boolean(),handler:()=>localTestAuthEnabled()});
