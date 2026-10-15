import type {DiscoveryHandoff,DiscoveryStyling} from './discoveryHandoff';
import type {ShoppingContext} from './shoppingContext';
export function safeDiscoveryStyling(packet:DiscoveryHandoff,context:ShoppingContext,raw:{matches:{productId:string;wardrobeItemIds:string[];reason:string}[]}):DiscoveryStyling{
 const products=new Set(packet.products.map(p=>p.id));
 const matches=raw.matches.slice(0,12).flatMap(m=>{
  const ids=[...new Set(m.wardrobeItemIds)];
  if(!products.has(m.productId)||!ids.length||ids.some(id=>!context.items.some(i=>i.id===id)))return [];
  return [{productId:m.productId,items:ids.map(id=>{const i=context.items.find(i=>i.id===id)!;return {id:i.id,name:i.details.name};}),reason:m.reason.slice(0,280)}];
 });
 return {state:'ready',summary:matches.length?'These picks have possible pairings with your available wardrobe pieces.':'I could not suggest a pairing confidently from the recorded details.',matches,limitations:['Advice uses saved descriptions and store details. Colour match, size stock and fit have not been checked visually.']};
}
