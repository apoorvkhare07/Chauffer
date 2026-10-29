// Deliberately sequential: each preview uses the original photo, and the server
// allows one active preview per account. Closing the panel does not restart work.
export async function runTryOnQueue({ids,run,shouldStop,onStart,onReady,onError}){
 for(const id of [...new Set(ids)]){
  if(shouldStop())break;
  onStart(id);
  try{const result=await run(id);if(result)onReady(id,result);}
  catch(error){onError(id,error);if(/wait for your current|service is busy/i.test(String(error?.data??error?.message??error)))break;}
 }
}
