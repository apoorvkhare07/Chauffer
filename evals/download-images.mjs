import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('tmp/evals/images',{recursive:true});
for(const [file,id] of [['person-man.jpg','8346219'],['woman-casual.jpg','2226848']]){
 const response=await fetch(`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?cs=srgb&fm=jpg&w=800&q=85`,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error(`Stock download failed: ${response.status}`);
 const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length>3000000)throw Error('Photo too large');
 writeFileSync('tmp/evals/images/'+file,bytes);
}
