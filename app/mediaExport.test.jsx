import {test,expect,vi,beforeEach,afterEach} from 'vitest';
import {exportMedia,mediaBlob,exportUserMessage} from './mediaExport';
import {track} from '../analytics';
vi.mock('../analytics',()=>({track:vi.fn(),inAppBrowser:()=>globalThis.navigator?.userAgent?.includes('Instagram')?'instagram':'none',tryOnAnalyticsContext:p=>({source_page:'diwali-post-1',product_id:'kurta',is_guest:false,in_app_browser:'none',...p})}));
let write,close,abort,click;
beforeEach(()=>{vi.clearAllMocks();write=vi.fn().mockResolvedValue(undefined);close=vi.fn().mockResolvedValue(undefined);abort=vi.fn();click=vi.fn();vi.stubGlobal('window',{showSaveFilePicker:vi.fn().mockResolvedValue({createWritable:async()=>({write,close,abort})})});vi.stubGlobal('navigator',{userAgent:'Chrome'});vi.stubGlobal('document',{body:{appendChild:vi.fn()},createElement:()=>({click,remove:vi.fn()})});vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:test');vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});vi.useFakeTimers();});
afterEach(()=>{vi.runOnlyPendingTimers();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
const blob=()=>Promise.resolve(new Blob(['test'],{type:'image/png'}));
test('only a completed file write emits downloaded, with the same product context',async()=>{
 close.mockImplementation(async()=>{expect(track.mock.calls.map(c=>c[0])).toEqual(['tryon_exported']);});
 expect(await exportMedia({loadBlob:blob})).toBe('saved');expect(write).toHaveBeenCalledOnce();expect(close).toHaveBeenCalledOnce();expect(track.mock.calls.map(c=>c[0])).toEqual(['tryon_exported','tryon_export_downloaded']);expect(track.mock.calls[1][1]).toMatchObject({source_page:'diwali-post-1',product_id:'kurta',is_guest:false,export_method:'file_system'});
});
test.each(['AbortError','NotAllowedError','SecurityError'])('cancelled or blocked save (%s) emits failure, never success',async name=>{
 window.showSaveFilePicker.mockRejectedValue(new DOMException('secret file path',name));await expect(exportMedia({loadBlob:blob})).rejects.toThrow();expect(track.mock.calls.map(c=>c[0])).toEqual(['tryon_exported','tryon_export_failed']);expect(JSON.stringify(track.mock.calls)).not.toContain('secret');expect(track.mock.calls[1][1].error_message).toBeTruthy();
});
test('failed write is aborted and never counted as downloaded',async()=>{
 write.mockRejectedValue(new DOMException('private','QuotaExceededError'));await expect(exportMedia({loadBlob:blob})).rejects.toThrow();expect(abort).toHaveBeenCalledOnce();expect(close).not.toHaveBeenCalled();expect(track.mock.calls.at(-1)[0]).toBe('tryon_export_failed');
});
test('ordinary browser fallback is a handoff, not a confirmed save',async()=>{
 window.showSaveFilePicker=undefined;expect(await exportMedia({loadBlob:blob})).toBe('handed_off');expect(click).toHaveBeenCalledOnce();expect(track.mock.calls.map(c=>c[0])).toEqual(['tryon_exported']);expect(track.mock.calls[0][1].completion_verifiable).toBe(false);
});
test('Instagram hands the actual file to share and only counts a resolved handoff',async()=>{
 navigator.userAgent='Instagram';navigator.canShare=vi.fn(()=>true);navigator.share=vi.fn(async()=>{expect(track.mock.calls.map(c=>c[0])).toEqual(['tryon_exported']);});
 expect(await exportMedia({loadBlob:blob})).toBe('shared');expect(window.showSaveFilePicker).not.toHaveBeenCalled();expect(click).not.toHaveBeenCalled();
 expect(navigator.share.mock.calls[0][0].files[0]).toMatchObject({name:'chauffer-try-on.png',type:'image/png'});
 expect(track.mock.calls.at(-1)).toEqual(['tryon_export_downloaded',expect.objectContaining({export_method:'web_share',completion_type:'share_handoff'})]);
});
test('unsupported Instagram file sharing reports failure rather than silently clicking a download link',async()=>{
 navigator.userAgent='Instagram';navigator.canShare=()=>false;navigator.share=vi.fn();
 await expect(exportMedia({loadBlob:blob})).rejects.toMatchObject({name:'NotSupportedError'});
 expect(click).not.toHaveBeenCalled();expect(navigator.share).not.toHaveBeenCalled();expect(track.mock.calls.map(c=>c[0])).toEqual(['tryon_exported','tryon_export_failed']);
 expect(exportUserMessage({name:'NotSupportedError'})).toContain('Keep this page open');
});
test('cancelled phone sharing never emits a completion',async()=>{
 navigator.userAgent='Instagram';navigator.canShare=()=>true;navigator.share=vi.fn().mockRejectedValue(new DOMException('cancel','AbortError'));
 await expect(exportMedia({loadBlob:blob})).rejects.toThrow();expect(track.mock.calls.map(c=>c[0])).toEqual(['tryon_exported','tryon_export_failed']);
});
test('generated data is decoded synchronously and opens sharing within the same click',async()=>{
 navigator.userAgent='Instagram';navigator.canShare=()=>true;navigator.share=vi.fn().mockResolvedValue(undefined);
 const url='data:image/png;base64,aGVsbG8=';const file=mediaBlob(url);expect(file).toBeInstanceOf(Blob);expect(await file.text()).toBe('hello');
 const pending=exportMedia({loadBlob:()=>mediaBlob(url)});expect(navigator.share).toHaveBeenCalledOnce();await pending;
});
test('failed file fetch emits a safe error and no save',async()=>{
 await expect(exportMedia({loadBlob:async()=>{throw new TypeError('Failed https://private.test/image');}})).rejects.toThrow();expect(track.mock.calls.at(-1)[0]).toBe('tryon_export_failed');expect(JSON.stringify(track.mock.calls)).not.toContain('private');expect(click).not.toHaveBeenCalled();
});
