import {beforeEach,afterEach,test,expect,vi} from 'vitest';
import {track} from '../analytics';
import {startCreationAttempt,tryOnProperties,creationFailureReason,createAttemptObserver,trackTryOnExport} from './creationAnalytics';
vi.mock('../analytics',()=>({track:vi.fn(),tryOnAnalyticsContext:properties=>properties}));
beforeEach(()=>vi.clearAllMocks());
afterEach(()=>vi.restoreAllMocks());

test('sources and stores use bounded names without URLs or user data',()=>{
 expect(tryOnProperties('upload',{url:'https://www.myntra.com/private'})).toEqual({source:'upload',product_id:'unknown'});
 expect(tryOnProperties('wardrobe',{store:'Myntra'})).toEqual({source:'wardrobe',product_id:'unknown'});
 expect(tryOnProperties('link',{url:'https://www2.hm.com/en_in/productpage.1350457001.html?private=secret'})).toEqual({source:'product_link',store:'H&M',product_id:'1350457001'});
 expect(tryOnProperties('link',{url:'https://myntra.com/private'})).toEqual({source:'product_link',store:'Myntra',product_id:'unknown'});
 expect(tryOnProperties('saved',{store:'NEWME'})).toEqual({source:'product_link',store:'NEWME',product_id:'unknown'});
 expect(tryOnProperties('catalog',{store:'Nike',url:'https://www.myntra.com/x'})).toEqual({source:'product_link',store:'Myntra',product_id:'unknown'});
 for(const url of ['https://myntra.com.evil.test/private','javascript:alert(1)','broken'])expect(tryOnProperties('link',{url})).toEqual({source:'product_link',store:'other',product_id:'unknown'});
});

test('one attempt has one start and terminal event, with elapsed duration',()=>{
 const time=vi.spyOn(performance,'now').mockReturnValue(100);
 const attempt=startCreationAttempt('tryon',{source:'product_link',store:'H&M',product_id:'1350457001'});
 time.mockReturnValue(1350);attempt.complete();attempt.complete();attempt.fail(new Error('late error'));
 expect(track.mock.calls).toEqual([
  ['tryon_started',{source:'product_link',store:'H&M',product_id:'1350457001'}],
  ['tryon_completed',{source:'product_link',store:'H&M',product_id:'1350457001',duration_ms:1250}],
 ]);
});

test('failed attempts use safe reason codes, and deliberate retry is a new attempt',()=>{
 const a=startCreationAttempt('tryon',{source:'upload',product_id:'unknown'});
 a.fail(new Error('Network failed fetching https://private.test/person'));a.fail('another error');a.complete();
 startCreationAttempt('tryon',{source:'wardrobe'},{remixed:true}).complete();
 expect(track.mock.calls.map(([event])=>event)).toEqual(['tryon_started','tryon_failed','tryon_started','tryon_remixed','tryon_completed']);
 expect(track.mock.calls[1][1]).toEqual({source:'upload',product_id:'unknown',reason:'network_error'});
 expect(JSON.stringify(track.mock.calls)).not.toContain('private');
});

test('state observation ignores historical rows and repeated polls',()=>{
 const observer=createAttemptObserver();
 observer.observe([{id:'old',state:'ready'}]);expect(track).not.toHaveBeenCalled();
 observer.add('one',startCreationAttempt('tryon',{source:'wardrobe'}));
 observer.observe([{id:'one',state:'building'}]);observer.observe([{id:'one',state:'building'}]);
 expect(track).toHaveBeenCalledTimes(1);
 observer.observe([{id:'one',state:'ready'}]);observer.observe([{id:'one',state:'ready'}]);
 observer.add('two',startCreationAttempt('tryon',{source:'upload'}));
 observer.observe([{id:'one',state:'ready'},{id:'two',state:'failed',note:'Your preview took too long.'}]);
 observer.observe([{id:'two',state:'failed',note:'Your preview took too long.'}]);
 expect(track.mock.calls.map(([event])=>event)).toEqual(['tryon_started','tryon_completed','tryon_started','tryon_failed']);
 expect(track.mock.calls[3][1].reason).toBe('timeout');
});

test('ready query arriving before registration can be observed after registration',()=>{
 const observer=createAttemptObserver(),rows=[{id:'fast',state:'ready'}];
 const attempt=startCreationAttempt('tryon',{source:'upload',product_id:'unknown'});
 observer.observe(rows);observer.add('fast',attempt);observer.observe(rows);observer.observe(rows);
 expect(track.mock.calls.map(([event])=>event)).toEqual(['tryon_started','tryon_completed']);
});

test.each([
 [{data:'AI credits or billing allowance are exhausted'},'billing_exhausted'],
 [{name:'AbortError'},'cancelled'],[{name:'TimeoutError'},'timeout'],
 [new Error('Please sign in'),'authentication_required'],
 [new Error('Provider says secret private prompt'),'generation_failed'],
])('failure reason is bounded', (error,reason)=>expect(creationFailureReason(error)).toBe(reason));

test('exports support the requested kinds and reject arbitrary values',()=>{
 for(const kind of ['download','share','video','private filename'])trackTryOnExport(kind);
 expect(track.mock.calls).toEqual(['download','share','video'].map(kind=>['tryon_exported',{kind}]));
});

test('creator lifecycle uses the same helper and stays separate from try-on',()=>{
 startCreationAttempt('creator',{kind:'video',input_source:'generated_photo'}).complete();
 expect(track.mock.calls.map(([event])=>event)).toEqual(['creator_started','creator_completed']);
});
