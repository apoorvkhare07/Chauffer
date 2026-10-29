import {test,expect,vi,afterEach} from 'vitest';
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();});
test('try-on keeps its own allowance token when guest discovery starts another session',async()=>{
 const values=new Map();vi.stubGlobal('localStorage',{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)});
 let session=await import('./guestTryOnSession');const first=session.guestTryOnToken();expect(first).toMatch(/^[a-f0-9-]{72}$/);
 values.set('chauffeur-guest-search',crypto.randomUUID()+crypto.randomUUID());vi.resetModules();session=await import('./guestTryOnSession');expect(session.guestTryOnToken()).toBe(first);
});
test('storage being blocked does not issue a new token on each render',async()=>{
 vi.stubGlobal('localStorage',{getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}});
 const {guestTryOnToken}=await import('./guestTryOnSession');expect(guestTryOnToken()).toBe(guestTryOnToken());
});
