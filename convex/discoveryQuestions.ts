import {v,type Infer} from 'convex/values';
import type {Taste} from './taste';
import type {Option,Requirements} from './discoveryRules';
import {sizeKind} from './fashionRules';
export const discoveryQuestionValidator=v.object({field:v.union(v.literal('occasion'),v.literal('style'),v.literal('pattern'),v.literal('fit'),v.literal('colour'),v.literal('fabric'),v.literal('brand')),question:v.string(),choices:v.array(v.object({label:v.string(),text:v.string(),value:v.string()}))});
export const discoveryStatusValidator=v.union(v.literal('exploring'),v.literal('refining'),v.literal('satisfied'));
export function acceptsDiscovery(text:string){return /^(?:these (?:work|are right)(?: for me)?|(?:i(?:'ve| have) )?found what i (?:wanted|want)|this is what i wanted|that(?:'s| is) (?:perfect|exactly what i wanted))[.!\s]*$/i.test(text.trim());}
export const discoveryFields=['occasion','style','pattern','fit','colour','fabric','brand'];
export type DiscoveryQuestion=Infer<typeof discoveryQuestionValidator>;
export function nextDiscoveryQuestion(r:Requirements,options:Option[]=[],taste:Taste={prefer:[],avoid:[]}):DiscoveryQuestion|null{
 if(!r.category||!r.budget)return null;
 const asked=new Set(r.askedDiscoveryFields??[]),shoe=sizeKind(r.category)==='shoe',athletic=['sneakers','shoes'].includes(r.category),waist=sizeKind(r.category)==='waist';
 const known:Partial<Record<DiscoveryQuestion['field'],RegExp>>={fit:/\b(slim|straight|relaxed|oversized|regular)\b/i,style:/\b(classic|chunky|sporty|retro|minimal)\b/i,pattern:/\b(plain|solid|printed|floral|striped)\b/i,colour:/\b(black|white|blue|red|green|pink|beige|brown|grey|gray|navy)\b/i};
 const question=(field:DiscoveryQuestion['field'],text:string,values:[string,string,string][]):DiscoveryQuestion|null=>asked.has(field)||r[field]||taste.prefer.some(term=>known[field]?.test(term))?null:{field,question:text,choices:values.map(([label,text,value])=>({label,text,value})).filter(choice=>!taste.avoid.some(term=>term.toLowerCase().includes(choice.value.toLowerCase())))};
 const colour=question('colour','Any specific colour in mind? You can also type another colour.',r.category==='jeans'?[['Black','I prefer black','black'],['Blue','I prefer blue','blue'],['Grey','I prefer grey','grey']]:[['Black','I prefer black','black'],['White','I prefer white','white'],['Blue','I prefer blue','blue']]);
 const fit=question('fit','What fit do you prefer: slim, straight, or relaxed?',[['Slim fit','I prefer a slim fit','slim'],['Straight fit','I prefer a straight fit','straight'],['Relaxed fit','I prefer a relaxed fit','relaxed']]);
 if(waist&&fit)return fit;
 if(waist&&options.length&&colour)return colour;
 const purpose=question('occasion',athletic?'What will you mainly use these for: everyday wear, long walks, or workouts?':'What are you shopping for: everyday wear, work, or an occasion?',athletic?[['Everyday wear','For everyday wear','everyday'],['Long walks','For long walks','walking'],['Workouts','For workouts','workout']]:[['Everyday wear','For everyday wear','everyday'],['Work','For work','work'],['Party or celebration','For a party or celebration','party']]);
 if(purpose)return purpose;
 if(shoe){
  const style=question('style',r.category==='heels'?'Which heel style do you prefer: block, stiletto, or platform?':'Which look feels more like you: classic, chunky, or sporty?',r.category==='heels'?[['Block heels','I prefer block heels','block'],['Stiletto heels','I prefer stiletto heels','stiletto'],['Platforms','I prefer platform heels','platform']]:[['Classic','I prefer a classic look','classic'],['Chunky','I prefer a chunky style','chunky'],athletic?['Sporty','I prefer a sporty look','sporty']:['Retro','I prefer a retro style','retro']]);if(style)return style;
  const brand=question('brand','Any preferred brand: Nike, Adidas, Puma, or open to all brands?',[['Nike','Nike','Nike'],['Adidas','Adidas','Adidas'],['Puma','Puma','Puma'],['Any brand','Open to all brands','any']]);if(athletic&&r.budget>=3000&&brand)return brand;
 }else{
  const pattern=question('pattern','Do you prefer plain pieces, prints, or stripes?',[['Plain','I prefer plain pieces','solid'],['Printed','I prefer printed pieces','printed'],['Striped','I prefer striped pieces','striped']]);if(!['bag','belt','watch','sunglasses'].includes(r.category)&&!r.style&&pattern)return pattern;
  if(sizeKind(r.category)!=='none'&&fit)return fit;
 }
 if(colour)return colour;
 if(shoe)return question('fabric','Do you prefer leather, canvas, or mesh?',[['Leather','I prefer leather','leather'],['Canvas','I prefer canvas','canvas'],['Mesh','I prefer mesh','mesh']]);
 return null;
}
export function shouldClarifyBefore(r:Requirements){return !(r.askedDiscoveryFields?.length)&&r.pricePreference!=='lowest_price'&&!r.occasion&&!r.colour&&!r.fabric&&!r.pattern&&!r.fit;}
export function questionAnswer(text:string,q?:DiscoveryQuestion):Partial<Requirements>|null{
 if(!q)return null;
 if(/no (?:more )?questions|don.t ask (?:me )?(?:any |more )?questions/i.test(text))return {askedDiscoveryFields:discoveryFields};
 if(/^(?:no preference(?:,? show options)?|skip(?: this)?|show (?:me )?(?:the )?options|you (?:choose|decide))[.!\s]*$/i.test(text.trim()))return {};
 const choice=q.choices.find(c=>[c.label,c.text].some(x=>x.toLowerCase()===text.trim().toLowerCase()));
 return choice?{[q.field]:choice.value}:null;
}
export function occasionTerms(r:Requirements){const value=r.occasion?.toLowerCase()??'';return /workout|gym|sport/.test(value)?['training','running','athletic','sporty']:/walk/.test(value)?['walking','cushioned','comfort']:/party|wedding|festive|evening/.test(value)?['party','festive','evening']:/work|office/.test(value)?['office','formal']:[];}
