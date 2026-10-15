import {v} from 'convex/values';
import {query,action} from './_generated/server';
import {requireOwner} from './identity';
import {getAuthUserId,invalidateSessions} from '@convex-dev/auth/server';
export const download=query({args:{},returns:v.string(),handler:async ctx=>{
 const owner=await requireOwner(ctx);
 const profile=await ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 const style=await ctx.db.query('wardrobeStyles').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 const styling=await ctx.db.query('stylingProfiles').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 const briefs=await ctx.db.query('stylistSessions').withIndex('by_owner',q=>q.eq('owner',owner)).order('desc').take(100);
 const saved=await ctx.db.query('savedProducts').withIndex('by_owner',q=>q.eq('owner',owner)).take(50);
 const wardrobe=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).take(80);
 const conversation=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${owner}`)).unique();
 const messages=conversation?await ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',conversation._id)).order('desc').take(100):[];
 const feeds=await ctx.db.query('dailyFeeds').withIndex('by_owner_day',q=>q.eq('owner',owner)).order('desc').take(7);
 const subscription=await ctx.db.query('dailySubscriptions').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 return JSON.stringify({exportedAt:new Date().toISOString(),scope:'Shopping data snapshot, not a complete account archive. Includes latest 100 web messages, 100 style briefs and seven daily edits. Uploaded image files, AI provider/component logs, older messages, price history and authentication records are excluded.',styleBriefs:briefs.map(b=>({request:b.request,event:b.event,state:b.state,advice:b.advice??null,createdAt:b.createdAt})),preferences:profile?.preferences??null,taste:profile?.taste??null,style:style?.details??null,photoAnalysis:styling?.analysis??null,confirmedDescription:styling?.confirmedDescription??null,confirmedPhotoStyle:styling?.confirmedVisualStyle??null,onboarding:styling?.onboarding??null,wardrobe:wardrobe.map(i=>({details:i.details,available:i.available,lastWornAt:i.lastWornAt??null,analysis:i.analysis??null})),saved:saved.map(i=>({option:i.option,savedAt:i.savedAt})),messages:messages.reverse().map(m=>({role:m.role,text:m.text,session:m.session,result:m.result??null})),dailyEdit:{enabled:subscription?.enabled??false,recent:feeds.map(f=>({day:f.day,state:f.state,options:f.options,note:f.note}))}},null,2);
}});
export const signOutEverywhere=action({args:{confirmation:v.literal('SIGN OUT')},returns:v.null(),handler:async(ctx)=>{const userId=await getAuthUserId(ctx);if(!userId)throw new Error('Please sign in.');await invalidateSessions(ctx,{userId});return null;}});
