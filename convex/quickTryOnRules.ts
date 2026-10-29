import {v} from 'convex/values';
export const discoverySourceValidator=v.object({kind:v.literal('discovery'),messageId:v.id('messages'),url:v.string()});

export {catalogSourceValidator} from './browseRules';

export const basketSourceValidator=v.object({kind:v.literal('basket'),id:v.id('tryOnBasket')});
export const TRY_ON_BASKET_LIMIT=8;
