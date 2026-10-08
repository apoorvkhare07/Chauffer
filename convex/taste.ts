import {v,type Infer} from 'convex/values';
export const tasteValidator=v.object({prefer:v.array(v.string()),avoid:v.array(v.string())});
export type Taste=Infer<typeof tasteValidator>;
export const emptyTaste:Taste={prefer:[],avoid:[]};
export function cleanTerms(terms:string[]):string[]{return [...new Set(terms.map(t=>t.trim().toLowerCase()).filter(t=>t.length>1&&t.length<=40&&!/[\r\n<>]/.test(t)))].slice(0,10);}
