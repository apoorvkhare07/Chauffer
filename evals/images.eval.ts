import {performance} from 'node:perf_hooks';
import {test,expect,vi,afterEach} from 'vitest';
import {convexTest} from 'convex-test';
import agentTest from '@convex-dev/agent/test';
import workflow from '@convex-dev/workflow/test';
import schema from '../convex/schema';
import {api,internal} from '../convex/_generated/api';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const modules=import.meta.glob('../convex/**/*.ts');
const dir='tmp/evals/images';
const outputDir='tmp/evals/'+(process.env.EVAL_LABEL||'images-final');mkdirSync(outputDir,{recursive:true});mkdirSync(dir,{recursive:true});
afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();});
for(const c of [
 {id:'cropped',file:'person-man.jpg',usable:false},
 {id:'casual',file:'woman-casual.jpg',usable:true,garment:'public/images/mens-shirt.jpg'},
 {id:'kurta',file:'woman-casual.jpg',usable:true,garment:'public/images/green-floral-kurta.jpg'}
])test(c.id,async()=>{
 if(process.env.CHAUFFER_LIVE_EVAL!=='1')throw Error('Use evals/run.mjs');
 vi.useFakeTimers();const t=convexTest(schema,modules);agentTest.register(t);workflow.register(t);
 const owner='stock-eval-'+c.id,actor=t.withIdentity({subject:owner});
 await actor.action(api.stylingPhoto.upload,{jpegBase64:readFileSync(dir+'/'+c.file).toString('base64'),consent:true});
 const profile=await actor.query(api.styling.get,{});
 writeFileSync(outputDir+'/'+c.id+'-analysis.json',JSON.stringify(profile,null,2));
 expect(profile.photoState).toBe('ready');expect(profile.analysis?.usable).toBe(c.usable);
 if(!c.garment)return;
 const garment=await t.run(async ctx=>{
 const photoId=await ctx.storage.store(new Blob([readFileSync(c.garment!)],{type:'image/jpeg'}));
 return ctx.db.insert('wardrobeItems',{owner,photoId,details:{name:c.id==='kurta'?'Floral kurta':'Striped shirt',category:c.id==='kurta'?'kurta':'top',colour:c.id==='kurta'?'white':'white and black'},available:true,createdAt:Date.now()});});
 const id=await actor.mutation(api.tryOn.request,{source:{kind:'wardrobe',id:garment},consent:true});
 const start=performance.now();await t.action(internal.tryOnAI.generate,{id});
 const result=await t.run(async ctx=>{const row=await ctx.db.get(id);const blob=row?.outputId?await ctx.storage.get(row.outputId):null;return {state:row?.state,failure:row?.failureCode,mime:blob?.type,base64:blob?Buffer.from(await blob.arrayBuffer()).toString('base64'):null};});
 writeFileSync(outputDir+'/'+c.id+'-result.json',JSON.stringify({state:result.state,failure:result.failure,latencyMs:Math.round(performance.now()-start),visualReview:'pending'},null,2));
 expect(result.state).toBe('ready');
 writeFileSync(outputDir+'/'+c.id+'-preview.'+(result.mime==='image/png'?'png':'jpg'),Buffer.from(result.base64!,'base64'));
},150000);
