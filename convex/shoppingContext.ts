import {wardrobeContext} from './wardrobeContext';
import {shopperValidator} from './wardrobeContextRules';
import type {QueryCtx} from './_generated/server';
import type {Doc} from './_generated/dataModel';
import {v,type Infer} from 'convex/values';
import {garmentValidator,styleValidator,emptyStyle,wardrobeKey} from './wardrobeRules';
export function wardrobeIntent(text:string,previous=false){if(/(?:don.t|do not) use (?:my |the )?(?:wardrobe|closet|saved style)|ignore (?:my |the )?(?:wardrobe|closet|saved style)/i.test(text))return false;return /\b(wardrobe|closet|what i own|with my (?:[a-z-]+ ){0,3}(?:wardrobe|closet|jeans|trousers|pants|shirt|top|sweater|jacket|kurta|dress|saree|shoes|sneakers|saved)|my (?:style|styling|body) profile|saved (?:style|styling))\b/i.test(text)||previous;}
export const shoppingContextValidator=v.object({requested:v.boolean(),shopper:v.optional(shopperValidator),items:v.array(v.object({id:v.id('wardrobeItems'),details:garmentValidator})),style:styleValidator,shoppingBrief:v.string(),sourceKey:v.string()});
export type ShoppingContext=Infer<typeof shoppingContextValidator>;
export async function loadShoppingContext(ctx:Pick<QueryCtx,'db'>,c:Doc<'conversations'>,historyText=''):Promise<ShoppingContext>{
 const requested=c.wardrobeContextRequested??wardrobeIntent([c.inputText??'',historyText].join(' '));
 if(!requested||!c.key.startsWith('web:'))return {requested:false,items:[],style:emptyStyle,shoppingBrief:'',sourceKey:''};
 const owner=c.key.slice(4),items=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).take(80),context=await wardrobeContext(ctx,owner);
 const details=context.style;
 // Exact private snapshot comparison, not a model confidence score or a guessed version.
 const sourceKey=JSON.stringify([wardrobeKey(items),context.contextKey]);
 const rows=await ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',c._id).eq('session',c.session)).order('desc').take(30);
 const shoppingBrief=rows.filter(m=>m.role==='user').slice(0,8).reverse().map(m=>m.text.slice(0,300)).join('\n');
 const anchor=(c.inputText??'').match(/with my\s+([^.!?]+)/i)?.[1]?.toLowerCase()??'';
 const available=items.filter(i=>i.available).sort((a,b)=>{const score=(i:typeof a)=>[i.details.kind,i.details.name,i.details.colour].filter(Boolean).reduce((n,t)=>n+Number(anchor.includes(t!.toLowerCase())),0);return score(b)-score(a);}).slice(0,24);
 return {requested:true,shopper:context.shopper,items:available.map(i=>({id:i._id,details:i.details})),style:details,shoppingBrief,sourceKey};
}
