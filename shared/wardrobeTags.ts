export const clothingCategories: Record<string,string> = {top:'Top / shirt',bottom:'Trousers / skirt',dress:'Dress',kurta:'Kurta',saree:'Saree',outerwear:'Outerwear',shoes:'Shoes',accessory:'Accessory'};
export const attributeLabels: Record<string,string> = {sleeve:'Sleeves',neckline:'Neckline / collar',length:'Length',fastening:'Fastening',heel:'Heel / sole',strap:'Strap / handle'};
export const categoryAttributes: Record<string,string[]> = {top:['sleeve','neckline','length'],bottom:['length','fastening'],dress:['sleeve','neckline','length'],kurta:['sleeve','neckline','length'],saree:['length'],outerwear:['sleeve','length','fastening'],shoes:['fastening','heel'],accessory:['fastening','strap']};
export function wardrobeTitle(details: {category:string;colour?:string;pattern?:string;kind?:string}) {
 const parts=[details.colour,details.pattern,details.kind||clothingCategories[details.category]?.split(' / ')[0]||'Clothing'];
 const text=[...new Set(parts.map(x=>x?.trim()).filter(x=>x&&x.toLowerCase()!=='unknown'))].join(' ');
 return (text.charAt(0).toUpperCase()+text.slice(1)).slice(0,80)||'Wardrobe piece';
}
export function clothingTags(details: Record<string,any>) {
 return [details.kind||clothingCategories[details.category],details.colour,details.pattern,details.fabric,details.brand,details.size?`Size ${details.size}`:'',details.cut,...(categoryAttributes[details.category]||[]).map(key=>details.attributes?.[key])].filter(value=>value&&value.toLowerCase()!=='unknown');
}
