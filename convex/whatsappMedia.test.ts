import {test,expect,vi,afterEach} from 'vitest';
import sharp from 'sharp';
import {downloadImage} from './whatsappMedia';
afterEach(()=>vi.restoreAllMocks());
test('media is downloaded only from Meta, bounded and converted to a small JPEG',async()=>{
 const png=await sharp({create:{width:8,height:8,channels:3,background:'#2950b8'}}).png().toBuffer();
 const fetcher=vi.spyOn(globalThis,'fetch').mockResolvedValueOnce(new Response(JSON.stringify({url:'https://lookaside.fbsbx.com/whatsapp_business/attachments/test',mime_type:'image/png',file_size:png.length}))).mockResolvedValueOnce(new Response(png));
 const jpeg=Buffer.from(await downloadImage('123','fake-token'),'base64');expect(jpeg.subarray(0,2)).toEqual(Buffer.from([255,216]));expect(jpeg.length).toBeLessThan(700000);
 expect(fetcher).toHaveBeenCalledTimes(2);expect(fetcher.mock.calls[1][1]?.redirect).toBe('error');
});
test('media metadata cannot leak the token to another host or bypass the byte limit',async()=>{
 const fetcher=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({url:'https://attacker.example/image',mime_type:'image/jpeg',file_size:100})));
 await expect(downloadImage('123','fake-token')).rejects.toThrow('Unsupported');expect(fetcher).toHaveBeenCalledTimes(1);
 fetcher.mockResolvedValue(new Response(JSON.stringify({url:'https://lookaside.fbsbx.com/image',mime_type:'image/jpeg',file_size:6000000})));
 await expect(downloadImage('123','fake-token')).rejects.toThrow('Unsupported');expect(fetcher).toHaveBeenCalledTimes(2);
});
