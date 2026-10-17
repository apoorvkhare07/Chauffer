import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
const suite=process.env.EVAL_SUITE||'agents';
if(!['agents','images','calibration','rescore'].includes(suite))throw Error('Unknown suite');
const label=process.env.EVAL_LABEL||('run-'+new Date().toISOString().replace(/[:.]/g,'-'));
if(!/^[a-zA-Z0-9_-]+$/.test(label))throw Error('Use a simple run label');
if(existsSync('tmp/evals/'+label+'/results.json'))throw Error('Choose a new EVAL_LABEL; completed evidence is never overwritten.');
let key=process.env.GEMINI_API_KEY;
if(!key){try{key=execFileSync('npx',['convex','env','get','GEMINI_API_KEY'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();}catch{throw Error('Could not read the development Gemini key. Check Convex CLI access.');}}
if(!key)throw new Error('Development Gemini key missing.');
const config=({rescore:'evals/rescore.config.ts',images:'evals/images.config.ts',calibration:'evals/calibration.config.ts'})[suite]||'evals/vitest.config.ts';
const result=spawnSync('npx',['vitest','run','--config',config],{stdio:'inherit',env:{...process.env,EVAL_LABEL:label,GEMINI_API_KEY:key,CHAUFFER_LIVE_EVAL:'1'}});
if(result.status!==0)process.exit(result.status??1);
if(suite==='agents'){
 const rows=JSON.parse(readFileSync('tmp/evals/'+label+'/results.json','utf8'));
 const failures=rows.filter(r=>!r.pass);
 console.log(`${rows.length-failures.length}/${rows.length} runs passed quality checks. Evidence: tmp/evals/${label}`);
 // Vitest passing proves completion, not semantic quality. Fail the command on either kind of failure.
 if(!rows.length||failures.length)process.exit(1);
}
