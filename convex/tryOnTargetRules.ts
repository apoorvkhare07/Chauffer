import {v} from 'convex/values';
export const targetValidator=v.union(v.literal('auto'),v.literal('top'),v.literal('bottom'),v.literal('dress'),v.literal('outerwear'),v.literal('kurta'),v.literal('dupatta'),v.literal('saree'),v.literal('blouse'),v.literal('lehenga'),v.literal('set'),v.literal('shoes'));
export const targetCategories=['top','bottom','dress','outerwear','kurta','dupatta','saree','blouse','lehenga','set','shoes','accessory','unknown'] as const;
export type TargetCategory=typeof targetCategories[number];
export type TargetChoice=Exclude<TargetCategory,'accessory'|'unknown'>|'auto';
export const targetLabels:Record<TargetCategory,string>={top:'Top',bottom:'Bottoms',dress:'Dress or jumpsuit',outerwear:'Outerwear',kurta:'Kurta or kameez',dupatta:'Dupatta',saree:'Saree',blouse:'Blouse or choli',lehenga:'Lehenga skirt',set:'Matching outfit set',shoes:'Footwear',accessory:'Accessory',unknown:'Unclear item'};
export class PreviewError extends Error{constructor(public code:string){super(code);}}
export const targetErrorMessages:Record<string,string>={
 target_unclear:'Choose the piece in “Try on only”, or use a clearer product photo. We couldn’t confidently separate it from the rest of the outfit.',
 target_mismatch:'That piece isn’t clear in the product photo. Choose the matching item or upload a closer product photo.',
 target_not_visible:'The area for this item isn’t visible in your photo. For shoes, include your feet; for a full-length outfit, include the full outfit area.',
 unsupported_accessory:'Try-on currently supports clothing and shoes. Glasses, earrings, necklaces and other accessories aren’t supported yet.',
 target_unavailable:'We couldn’t identify the product right now. Your photos are still here; please try again.',
};
export type TargetPlan={category:TargetCategory;components:TargetCategory[];detail:string};
export function validateTarget(value:unknown,choice:TargetChoice='auto',needsExplicitItem=false):TargetPlan{
 const p=value as any;
 if(!p||!Array.isArray(p.visibleCategories)||p.visibleCategories.length>16||p.visibleCategories.some((x:unknown)=>!targetCategories.includes(x as TargetCategory))||!targetCategories.includes(p.category)||!Array.isArray(p.components)||p.components.length>4||p.components.some((x:unknown)=>!targetCategories.includes(x as TargetCategory))||typeof p.detail!=='string'||p.detail.length>240||typeof p.confidence!=='number'||!Number.isFinite(p.confidence)||p.confidence<0||p.confidence>1||typeof p.ambiguous!=='boolean'||typeof p.regionVisible!=='boolean')throw new PreviewError('target_unavailable');
 if(needsExplicitItem&&(!Array.isArray(p.visibleCategories)||p.visibleCategories.some((x:unknown)=>!targetCategories.includes(x as TargetCategory))||new Set(p.visibleCategories).size!==1))throw new PreviewError('target_unclear');
 if(p.category==='accessory'||p.components.includes('accessory'))throw new PreviewError('unsupported_accessory');
 if(p.category==='unknown'||p.ambiguous||p.confidence<0.8)throw new PreviewError('target_unclear');
 if(choice!=='auto'&&p.category!==choice)throw new PreviewError('target_mismatch');
 if(!p.regionVisible)throw new PreviewError('target_not_visible');
 if(p.category==='set'){
  if(p.components.length<2||p.components.some((x:TargetCategory)=>['set','unknown','shoes','outerwear'].includes(x))||new Set(p.components).size!==p.components.length)throw new PreviewError('target_unclear');
 }else if(p.components.length!==1||p.components[0]!==p.category)throw new PreviewError('target_unclear');
 return {category:p.category,components:p.components,detail:p.detail.replace(/[\u0000-\u001f\u007f]/g,' ')};
}
const boundaries:Record<string,string>={
 top:'Replace only the upper-body top; retain trousers/skirt, footwear and all accessories.',
 bottom:'Replace only the lower-body garment; retain the top, dupatta, footwear and all accessories. Preserve palazzo width, salwar volume or churidar ankle gathers when present.',
 dress:'Replace the full dress or jumpsuit region, including upper and lower clothing it covers. Preserve the reference hemline and silhouette; do not turn it into a top or tuck it into original trousers.',
 outerwear:'Replace or add only the outer layer. Keep inner clothing visible where the reference jacket is open.',
 kurta:'Replace only the kurta/kameez. Preserve neckline, sleeve shape, side slits, embroidery placement and kurta hem length. Keep existing salwar, churidar, palazzo or trousers and any dupatta; do not copy the reference model’s matching suit pieces.',
 dupatta:'Replace an existing dupatta or add only the reference dupatta as a separate draped cloth. Preserve its border, zari, motifs, length, transparency, folds and shoulder drape. Drape the cloth over the existing shoulders and let the ends hang freely along the existing pose. Never move, bend, raise or reposition an arm or hand to hold it; keep both hands at their original image coordinates. The reference model holding the dupatta is NOT a pose instruction. Keep the existing kurta, suit, blouse and bottoms unchanged underneath; a dupatta is not a dress, saree, scarf-print top or full suit.',
 saree:'Transfer only the saree cloth: wrapped lower drape, waist pleats, border and pallu over the shoulder. Preserve border continuity, pallu placement, fabric transparency and pleat direction. Retain the wearer’s blouse and visible jewellery. Do not copy the reference blouse or invent a new neckline. Preserve modest coverage.',
 blouse:'Replace only the saree blouse/choli; retain saree/pallu or lehenga skirt, dupatta, jewellery and footwear. Keep sleeve length, neckline and embroidery as shown; do not expose more skin than needed for the target garment.',
 lehenga:'Replace only the lehenga skirt, preserving waist, flare, panels and hem embroidery. Retain the choli/blouse, dupatta, jewellery and footwear.',
 shoes:'Replace ONLY the visible shoes/sandals on the existing feet. Retain all clothing, trouser hems, dupatta, bags and accessories. Preserve foot and leg position, shoe orientation, ground contact and perspective. Do not change pose or add feet that are cropped out.',
};
export function targetEditInstructions(plan:TargetPlan){
 const categories=plan.category==='set'?plan.components:[plan.category];
 return `Locked target: ${targetLabels[plan.category]}. Allowed components: ${categories.map(x=>targetLabels[x]).join(', ')}. ${plan.category==='set'?'Only these verified sold-together clothing pieces may change. Other styling in the product photograph is excluded. ':''}${categories.map(c=>boundaries[c]).join(' ')} ${plan.category==='set'?'For this verified set, replacing the listed companion pieces overrides the single-piece preserve instruction only for those listed pieces.':''}`;
}
