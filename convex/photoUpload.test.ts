import {test,expect,vi,afterEach} from 'vitest';
import {validatePhoto,viewablePhoto,PHOTO_ACCEPT} from '../app/photoUpload';
afterEach(()=>vi.restoreAllMocks());
test('all photo pickers share HEIC/HEIF support including empty iPhone MIME types',()=>{
 for(const type of ['image/heic','image/heif','image/heic-sequence','image/heif-sequence',''])expect(()=>validatePhoto(new File(['test'],'photo.HEIC',{type}))).not.toThrow();
 expect(PHOTO_ACCEPT).toContain('.heif');
 expect(()=>validatePhoto(new File(['test'],'photo.heif',{type:'application/octet-stream'}))).not.toThrow();
 expect(()=>validatePhoto({type:'image/heic',name:'photo.heic',size:12000001})).toThrow('12 MB');
 expect(()=>validatePhoto(new File(['test'],'photo.svg',{type:'image/svg+xml'}))).toThrow('HEIC');
});
test('browser-transcoded JPEG keeps working even when its filename ends in HEIC',async()=>{
 const file=new File([new Uint8Array([255,216,255,0,0,0,0,0])],'photo.HEIC',{type:'image/jpeg'});
 expect(await viewablePhoto(file)).toBe(file);
});
