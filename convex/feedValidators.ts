import {v} from 'convex/values';
export const priceDropValidator=v.object({url:v.string(),previousPrice:v.number(),price:v.number(),previousObservedAt:v.number(),observedAt:v.number()});
