import {test,expect,afterAll} from 'vitest';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {judge} from './judge';
import rubric from './rubric.json';
const source=process.env.EVAL_SOURCE||'verified';
if(!/^[a-zA-Z0-9_-]+$/.test(source))throw Error('Invalid source label');
const dir='tmp/evals/'+process.env.EVAL_LABEL;mkdirSync(dir,{recursive:true});
const manifest=JSON.parse(readFileSync('tmp/evals/'+source+'/manifest.json','utf8'));
const cases=manifest.cases.filter((c:any)=>c.agent==='discovery');
writeFileSync(dir+'/manifest.json',JSON.stringify({...manifest,label:process.env.EVAL_LABEL,rubric,rescoredFrom:source,cases},null,2));
const results:any[]=[];
for(const c of cases)for(let repeat=1;repeat<=manifest.repeats;repeat++)test(c.id+' #'+repeat,async()=>{
 const row=JSON.parse(readFileSync(`tmp/evals/${source}/${c.id}-${repeat}.json`,'utf8'));
 const scored=await judge(row.input,row.output,row.trace);
 const pass=!row.error&&!row.checks.length&&!scored.score.abstain&&scored.score.requirements===3&&scored.score.evidence===3&&scored.score.usefulness>=2;
 const updated={...row,label:process.env.EVAL_LABEL,judge:scored,pass,rescoredFrom:source};results.push(updated);
 writeFileSync(`${dir}/${c.id}-${repeat}.json`,JSON.stringify(updated,null,2));expect(pass).toBe(true);
},45000);
afterAll(()=>writeFileSync(dir+'/results.json',JSON.stringify(results,null,2)));
