import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import workflow from '@convex-dev/workflow/test';
import schema from './schema';
import {api} from './_generated/api';
const modules=import.meta.glob('./**/*.ts');
afterEach(()=>{vi.restoreAllMocks();vi.clearAllTimers();vi.useRealTimers();});
test('every account defaults to Free and monthly conversation allowance is enforced by the backend',async()=>{
 vi.useFakeTimers();const t=convexTest(schema,modules);workflow.register(t);const user=t.withIdentity({subject:'free-user'});
 expect(await user.query(api.planAccess.current,{})).toMatchObject({plan:'free',usage:{conversations:0,stylistSessions:0,wardrobeItems:0},limits:{conversations:10,stylistSessions:3,wardrobeItems:3}});
 for(let i=0;i<10;i++)await user.mutation(api.conversations.post,{text:'reset'});
 expect((await user.query(api.planAccess.current,{})).usage.conversations).toBe(10);
 await expect(user.mutation(api.conversations.post,{text:'reset'})).rejects.toThrow('10 free conversations');
});
test('a full free wardrobe does not block the separate conversation allowance',async()=>{
 vi.useFakeTimers();const t=convexTest(schema,modules);workflow.register(t);const user=t.withIdentity({subject:'wardrobe-full-user'});
 for(let i=0;i<3;i++)await user.mutation(api.wardrobe.add,{details:{name:`Shirt ${i}`,category:'top',colour:'blue'}});
 await expect(user.mutation(api.wardrobe.add,{details:{name:'Another shirt',category:'top',colour:'blue'}})).rejects.toThrow('3 free wardrobe additions this month');
 await expect(user.mutation(api.conversations.post,{text:'Find a blue shirt under 1500'})).resolves.toBeNull();
 expect((await user.query(api.planAccess.current,{})).usage).toMatchObject({wardrobeItems:3,conversations:1});
});
