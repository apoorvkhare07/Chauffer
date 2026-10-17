import {test,expect} from 'vitest';
import {judge} from './judge';
import {writeFileSync,mkdirSync} from 'node:fs';
const dir='tmp/evals/calibration';mkdirSync(dir,{recursive:true});
// Deliberately obvious anchors, authored by Codex. These are not human-labelled gold data.
for(const c of [
 {id:'skipped-fields-good',agent:'discovery',expectedPass:true,expected:'No optional questions. Search blue kurta XL under 1800. This is planning, not retrieval.',output:{intent:'search',requirements:{category:'kurta',size:'XL',budget:1800,colour:'blue',askedDiscoveryFields:['occasion','brand']},applied:{search:true,reply:'I will search for blue kurtas in XL under 1800.'}}},
 {id:'displayed-reply-good',agent:'discovery',expectedPass:true,expected:'Change red to black and preserve budget 2000. Judge the final displayed applied reply, not the replaced draft.',output:{intent:'refine',requirements:{colour:'black',budget:2000},reply:'Red kurtas',applied:{search:true,reply:'Updated to black, keeping your maximum of 2000.'}}},
 {id:'conditional-exclusion-bad',expectedPass:false,expected:'No jackets or layering anywhere in the answer.',output:{looks:['Blue shirt and navy trousers.'],caveats:['If it is formal, try an unlined shirt-jacket.']}},
 {id:'unavailable-not-missing-bad',expectedPass:false,expected:'The red dress is saved in inventory but marked unavailable. Do not use it, claim it is absent, or ask for reupload.',output:'There is no red dress in your wardrobe inventory. Please upload it so I can style it.'},
 {id:'exclusion-good',expectedPass:true,expected:'No leather. Practical office idea. No verified listings.',output:'Try a cotton shirt with navy trousers and canvas sneakers. Check the shoe label for hidden leather trims; I have no verified product listing.'},
 {id:'exclusion-bad',expectedPass:false,expected:'No leather, including shoes.',output:'Wear a cotton shirt, navy trousers and leather loafers.'},
 {id:'body-bad',expectedPass:false,expected:'No photo or measurements available. Never invent body shape or guaranteed fit.',output:'You are definitely hourglass and size M will fit perfectly.'},
 {id:'price-bad',expectedPass:false,expected:'No merchant evidence is supplied. Do not invent live price, inventory or delivery.',output:'Amazon has this exact shirt in stock at ₹999, guaranteed to arrive tomorrow.'},
 {id:'weather-good',expectedPass:true,expected:'Unknown fabric and no weather feed. Conditional practical advice; no waterproof guarantee.',output:'I cannot verify waterproofness from these tags. If it rains, carry an umbrella and choose a familiar comfortable outfit; check its care and fabric label.'},
 {id:'warning-good',expectedPass:true,expected:'No wool. Useful concept, not a listing. Distinguish a warning from a recommendation.',output:'Avoid wool. A lightweight cotton shirt with navy trousers is a starting point; comfort still depends on weave, weight and lining.'}
])test(c.id,async()=>{
 const result=await judge({agent:('agent' in c?c.agent:'stylist'),text:c.expected,expected:c.expected},c.output,[]);
 const pass=!result.score.abstain&&result.score.requirements===3&&result.score.evidence===3&&result.score.usefulness>=2;
 writeFileSync(dir+'/'+c.id+'.json',JSON.stringify({...c,result,pass},null,2));expect(pass).toBe(c.expectedPass);
},45000);
