const key='chauffeur-guest-tryon';
let memory;
export function guestTryOnToken(){
 if(memory)return memory;
 try{const saved=localStorage.getItem(key)||localStorage.getItem('chauffeur-guest-search');if(/^[a-f0-9-]{72}$/.test(saved??''))memory=saved;}catch{}
 memory??=crypto.randomUUID()+crypto.randomUUID();
 try{localStorage.setItem(key,memory);}catch{}
 return memory;
}
