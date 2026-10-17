import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const dir=resolve(process.argv[2]||'tmp/evals/verified');
const rows=JSON.parse(readFileSync(dir+'/results.json','utf8'));
const manifest=JSON.parse(readFileSync(dir+'/manifest.json','utf8'));
const ids=[...new Set(rows.map(r=>r.caseId))];
const stable=id=>{const r=rows.filter(x=>x.caseId===id);return r.length===manifest.repeats&&r.every(x=>x.pass);};
let report=`# Agent evaluation: ${manifest.label}\n\n${ids.filter(stable).length}/${ids.length} cases passed every repeat; ${rows.filter(r=>r.pass).length}/${rows.length} individual runs passed. Model-scored synthetic tests, not shopper validation.\n\nSource hash: ${manifest.hash}\n\n| Case | Passed repeats | Average action time |\n|---|---:|---:|\n`;
for(const id of ids){const r=rows.filter(x=>x.caseId===id);report+=`| ${id} | ${r.filter(x=>x.pass).length}/${r.length} | ${Math.round(r.reduce((n,x)=>n+x.latencyMs,0)/r.length)} ms |\n`;}
report+='\n## Cases needing review\n\n';
for(const r of rows.filter(x=>!x.pass))report+=`- ${r.caseId} #${r.repeat}: ${r.error||r.checks.join('; ')||r.judge.score.reason||r.judge.score.firstFailure}\n`;
report+='\n## Review before accepting\n\nRead each case expectation, actual reply and context in its JSON. Score requirements/evidence/usefulness yourself before viewing the model score. Record disagreements; do not edit expected behaviour merely to increase the pass rate. Check a sample of passes as well as every failure.\n';
writeFileSync(dir+'/REPORT.md',report);console.log(dir+'/REPORT.md');
