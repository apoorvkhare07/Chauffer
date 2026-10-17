import {currentFeedForOwner,setFeedForOwner} from './dailyFeed';
import {confirmPhotoForOwner} from './wardrobeMetadata';
import {v,ConvexError} from 'convex/values';
import {createAccount} from '@convex-dev/auth/server';
import {internalMutation,internalQuery,internalAction,type MutationCtx} from './_generated/server';
import {internal} from './_generated/api';
import type {Id,Doc} from './_generated/dataModel';
import {testRecipientAllowed} from './whatsappProtocol';
import {mediaPurpose,waIncoming,menuButtons,menuText,appUrl,channelCommand} from './whatsappUi';
import {savePreferences,profileDefaults} from './profilePreferences';
import {emptyStyle} from './wardrobeRules';
import {emptyTaste} from './taste';
import {getConversation,beginTurn,searchClaim} from './conversationCore';
import {consumeMonthly} from './planAccess';
import {start} from '@convex-dev/workflow';
import {requestStyleForOwner} from './stylist';
import {requestOutfitsForOwner} from './wardrobe';
import {requestPreviewForOwner} from './tryOn';
import {saveKnownOption} from './savedProducts';

// Only the signed webhook calls receive. No client can choose a WhatsApp owner.
export const receive=internalMutation({args:{incoming:v.array(waIncoming),statuses:v.array(v.object({messageId:v.string(),status:v.string()}))},returns:v.number(),handler:async(ctx,{incoming,statuses})=>{
 await ctx.runMutation(internal.whatsapp.receive,{incoming:[],statuses});
 let accepted=0;
 for(const m of incoming.slice(0,100)){
  if(!/^91[6-9]\d{9}$/.test(m.phone)||!testRecipientAllowed(m.phone)||m.timestamp<Date.now()-86400000||m.timestamp>Date.now()+300000)continue;
  if(await ctx.db.query('waInbox').withIndex('by_message',q=>q.eq('messageId',m.messageId)).unique())continue;
  const recent=await ctx.db.query('waInbox').withIndex('by_phone',q=>q.eq('phone',m.phone).gte('_creationTime',Date.now()-60000)).take(11);if(recent.length>=10)continue;
  let c=await ctx.db.query('waConversations').withIndex('by_phone',q=>q.eq('phone',m.phone)).unique();
  if(c&&m.timestamp<c.lastInboundAt)continue;
  if(!c){const cid=await ctx.db.insert('waConversations',{phone:m.phone,revision:0,lastInboundAt:m.timestamp,requirements:{}});c=(await ctx.db.get(cid))!;}
  const revision=c.revision+1;
  await ctx.db.patch(c._id,{revision,lastInboundAt:m.timestamp});
  const id=await ctx.db.insert('waInbox',{...m,conversationId:c._id,revision,reply:'',search:false,requirements:{},state:'queued'});
  await ctx.scheduler.runAfter(0,internal.whatsappChannel.process,{id});accepted++;
 }
 return accepted;
}});
export const lookup=internalQuery({args:{id:v.id('waInbox')},returns:v.union(v.null(),v.object({phone:v.string()})),handler:async(ctx,{id})=>{
 const m=await ctx.db.get(id),c=m?await ctx.db.get(m.conversationId):null;
 return !m||m.state!=='queued'||!c||c.revision!==m.revision||!testRecipientAllowed(m.phone)||m.timestamp<Date.now()-86400000?null:{phone:m.phone};
}});
export const process=internalAction({args:{id:v.id('waInbox')},returns:v.null(),handler:async(ctx,{id}):Promise<null>=>{
 const m=await ctx.runQuery(internal.whatsappChannel.lookup,{id});if(!m)return null;
 try{
  const {user}=await createAccount(ctx,{provider:'msg91',account:{id:m.phone},profile:{phone:`+${m.phone}`,phoneVerificationTime:Date.now()},shouldLinkViaPhone:false});
  await ctx.runMutation(internal.whatsappChannel.route,{id,owner:user._id});
 }catch(error){
  const data=error instanceof ConvexError?error.data:null;
  const message=typeof data==='string'?data:typeof data==='object'&&data&&'message' in data?String(data.message):'I couldn’t finish that request. Please try again, or type help.';
  await ctx.runMutation(internal.whatsappChannel.fail,{id,text:message});
 }
 return null;
}});
async function reply(ctx:MutationCtx,id:Id<'waInbox'>,text:string,buttons?:{id:string;title:string}[]){
 await ctx.db.patch(id,{reply:text,state:'complete'});
 await ctx.scheduler.runAfter(0,internal.whatsapp.send,{id,phase:'reply',text,...(buttons?.length?{buttons}:{})});
}
export const fail=internalMutation({args:{id:v.id('waInbox'),text:v.string()},returns:v.null(),handler:async(ctx,{id,text})=>{const m=await ctx.db.get(id);if(m&&m.state==='queued')await reply(ctx,id,text);return null;}});
function revisionButtons(c:Doc<'waConversations'>,choices:{id:string;title:string}[]){return choices.map(b=>({...b,id:`wa:${c.revision}:${b.id}`}));}

export const route=internalMutation({args:{id:v.id('waInbox'),owner:v.id('users')},returns:v.null(),handler:async(ctx,{id,owner})=>{
 const m=await ctx.db.get(id),c=m?await ctx.db.get(m.conversationId):null,user=await ctx.db.get(owner);
 if(!m||!c||m.state!=='queued'||c.revision!==m.revision||!testRecipientAllowed(m.phone)||m.timestamp<Date.now()-86400000)return null;
 if(user?.phone!==`+${m.phone}`||!user.phoneVerificationTime||c.owner&&c.owner!==owner)throw new Error('WhatsApp account mismatch');
 await ctx.db.patch(c._id,{owner});
 let text=(m.text??'').trim();
 if(text.startsWith('wa:')){const match=/^wa:(\d+):(.+)$/.exec(text);if(!match||Number(match[1])!==c.revision-1){await reply(ctx,id,'That choice belongs to an earlier message. Type help to see your current options.');return null;}text=match[2];}
 const cmd=channelCommand(text);
 if(cmd==='stop'){await ctx.db.patch(c._id,{stopped:true,mode:undefined});await reply(ctx,id,'WhatsApp assistance is paused. Send START whenever you want to return. Your saved account remains available on the web.');return null;}
 if(c.stopped&&cmd!=='menu')return null;
 if(c.stopped)await ctx.db.patch(c._id,{stopped:false});
 if(!c.consentedAt){
  if(text==='consent:yes'){await ctx.db.patch(c._id,{consentedAt:Date.now()});}
  else{await reply(ctx,id,'Hi, I’m Chauffeur, your fashion assistant. I can find products, style your clothes and help with try-on.\n\nUse the same phone number on the web to access your account. May I save the preferences and conversations you share? Photos need a separate confirmation.',revisionButtons(c,[{id:'consent:yes',title:'Let’s begin'}]));return null;}
 }
 const profile=await ctx.db.query('profiles').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 let prefs=profile?.preferences??{language:'en' as const};
 let style=await ctx.db.query('wardrobeStyles').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
 const step=c.setupStep;
 if(step==='name'&&text.length<=60&&text&&!cmd&&!m.media)prefs={...prefs,name:text};
 if(step==='age'&&/^\d{2,3}$/.test(text)&&Number(text)>=13&&Number(text)<=120)prefs={...prefs,age:Number(text)};
 if(step==='audience'&&['audience:men','audience:women','audience:unisex'].includes(text))prefs={...prefs,audience:text.slice(9) as 'men'|'women'|'unisex',gender:text==='audience:men'?'male':text==='audience:women'?'female':'undisclosed'};
 if(step==='language'&&['language:en','language:hi','language:hinglish'].includes(text))prefs={...prefs,language:text.slice(9) as 'en'|'hi'|'hinglish'};
 if(step==='styles'&&!cmd&&!m.media&&text.length>0&&text.length<=300){const details={...(style?.details??emptyStyle),stylePreferences:text};if(style)await ctx.db.patch(style._id,{details,updatedAt:Date.now()});else{const sid=await ctx.db.insert('wardrobeStyles',{owner,details,updatedAt:Date.now()});style=(await ctx.db.get(sid))!;}}
 if(step)await savePreferences(ctx,owner,prefs);
 let next='',prompt='',choices:{id:string;title:string}[]=[];
 if(!prefs.name){next='name';prompt='What should I call you?';}
 else if(!prefs.age){next='age';prompt='How old are you? Enter your age in years (13 or above).';}
 else if(!prefs.audience||!prefs.gender){next='audience';prompt='Choose your profile and default clothing preference. You can shop for someone else in any request.';choices=[{id:'audience:men',title:'Male / menswear'},{id:'audience:women',title:'Female / womenswear'},{id:'audience:unisex',title:'Prefer not to say'}];}
 else if(step==='audience'){next='language';prompt='Which language would you prefer?';choices=[{id:'language:en',title:'English'},{id:'language:hi',title:'हिन्दी'},{id:'language:hinglish',title:'Hinglish'}];}
 else if(!style?.details.stylePreferences){next='styles';prompt='What styles do you enjoy—casual, minimal, streetwear, traditional, or something else? You can say “exploring” if you’re unsure.';}
 if(next){await ctx.db.patch(c._id,{setupStep:next});await reply(ctx,id,prompt,choices.length?revisionButtons(c,choices):undefined);return null;}
 if(step){await ctx.db.patch(c._id,{setupStep:undefined});const setup=await ctx.db.query('stylingProfiles').withIndex('by_owner',q=>q.eq('owner',owner)).unique();if(!setup)await ctx.db.insert('stylingProfiles',{owner,onboarding:'skipped',photoState:'empty',updatedAt:Date.now()});await reply(ctx,id,`You’re ready, ${prefs.name}. ${menuText}`,menuButtons);return null;}
 if(cmd==='menu'||text==='consent:yes'){await reply(ctx,id,menuText,menuButtons);return null;}
 if(cmd==='settings'){await reply(ctx,id,`Your preferences, account controls and plan are here:\n${appUrl('settings')}\nSign in with this same phone number. Send STOP to pause WhatsApp assistance.`);return null;}
 if(m.media){
  if(m.media.kind==='document'){await reply(ctx,id,'Send the photo as a WhatsApp image rather than a document, or use the web uploader for HEIC files.');return null;}
  await ctx.db.patch(c._id,{pendingMedia:id});
  if(m.media.kind==='audio'){await reply(ctx,id,'May AI transcribe this short voice note as a shopping request? I’ll show you the words to confirm before searching. Keep the clip under 700 KB.',revisionButtons(c,[{id:'photo:voice',title:'Transcribe'},{id:'photo:cancel',title:'Skip'}]));return null;}
  await reply(ctx,id,'How would you like to use this photo? Choosing an option allows AI to analyse it and save it to your account. Clothing tags and body observations stay drafts until you confirm them. A body photo replaces your current styling photo.',revisionButtons(c,[{id:'photo:wardrobe',title:'Add clothing'},{id:'photo:body',title:'Styling / try-on'},{id:'photo:search',title:'Find similar'}]));return null;
 }
 if(text==='photo:cancel'){await ctx.db.patch(c._id,{pendingMedia:undefined});await reply(ctx,id,'Photo skipped. I haven’t downloaded it.');return null;}
 if(['photo:wardrobe','photo:body','photo:search','photo:voice'].includes(text)){
  const source=c.pendingMedia?await ctx.db.get(c.pendingMedia):null;
  if(!source?.media||source.phone!==m.phone||source.timestamp<Date.now()-3600000){await reply(ctx,id,'Send the photo again, then choose how to use it.');return null;}
  const purpose=text.slice(6) as 'wardrobe'|'body'|'search'|'voice';
  await ctx.db.patch(id,{mediaPurpose:purpose,state:'queued'});
  await ctx.scheduler.runAfter(0,internal.whatsapp.send,{id,phase:'reply',text:'Reviewing your photo. I’ll show you what I find before saving confirmed details.'});
  await ctx.scheduler.runAfter(0,internal.whatsappMedia.analyse,{id,purpose});return null;
 }
 if(text==='input:confirm'){if(!c.inputDraft){await reply(ctx,id,'Send a fresh photo or voice note first.');return null;}text=c.inputDraft;await ctx.db.patch(c._id,{inputDraft:undefined,mode:'shop'});c.mode='shop';}
 if(text==='input:discard'){await ctx.db.patch(c._id,{inputDraft:undefined});await reply(ctx,id,'Draft skipped. Type the request you want instead.');return null;}
 if(text==='wardrobe:confirm'){
  const draft=c.draftId?await ctx.db.get(c.draftId):null;
  if(!draft||draft.owner!==owner||!draft.analysis){await reply(ctx,id,'Send a new clothing photo to review.');return null;}
  await confirmPhotoForOwner(ctx,owner,draft._id,draft.analysis.details);await ctx.db.patch(c._id,{draftId:undefined});await reply(ctx,id,'Added to your wardrobe. I’m also preparing a clean product photo. It will appear in your web wardrobe.',[{id:'menu:wardrobe',title:'My wardrobe'},{id:'menu:outfit',title:'Style my wardrobe'}]);return null;
 }
 if(text==='wardrobe:discard'){
  const draft=c.draftId?await ctx.db.get(c.draftId):null;if(draft?.owner===owner){if(draft.photoId)await ctx.storage.delete(draft.photoId);await ctx.db.delete(draft._id);}await ctx.db.patch(c._id,{draftId:undefined});await reply(ctx,id,'Draft discarded. Send another clothing photo whenever you’re ready.');return null;
 }
 const correction=/^(brand|size|fabric|colour|pattern):\s*(.{1,80})$/i.exec(text);
 if(c.draftId&&correction){const draft=await ctx.db.get(c.draftId);if(draft?.owner===owner&&draft.analysis&&draft.state==='ready'){const key=correction[1].toLowerCase(),details={...draft.analysis.details,[key]:correction[2]};const {validateGarment}=await import('./wardrobeRules');validateGarment(details);await ctx.db.patch(draft._id,{analysis:{...draft.analysis,details}});await reply(ctx,id,`Updated ${key}: ${correction[2]}. Confirm when the tags are right.`,revisionButtons(c,[{id:'wardrobe:confirm',title:'Save to wardrobe'},{id:'wardrobe:discard',title:'Discard'}]));return null;}}
 if(text.startsWith('body:confirm:')){
  const photo=await ctx.db.query('stylingProfiles').withIndex('by_owner',q=>q.eq('owner',owner)).unique();
  if(!photo||photo.photoId!==text.slice(13)||photo.photoState!=='ready'||!photo.analysis?.canEstimate){await reply(ctx,id,'That photo changed. Upload a fresh photo or review your styling setup.');return null;}
  const details={...(style?.details??emptyStyle),bodyDescription:photo.analysis.proportions.slice(0,300)};
  if(style)await ctx.db.patch(style._id,{details,updatedAt:Date.now()});else await ctx.db.insert('wardrobeStyles',{owner,details,updatedAt:Date.now()});
  await ctx.db.patch(photo._id,{confirmedDescription:details.bodyDescription});await reply(ctx,id,'Saved your reviewed styling description. You can correct or remove it in settings.',menuButtons);return null;
 }
 if(cmd==='shop'||cmd==='style'||cmd==='outfit'){await ctx.db.patch(c._id,{mode:cmd,...(cmd==='style'?{lastStyleId:undefined}:{})});await reply(ctx,id,cmd==='shop'?'What are you looking for? Tell me the item, occasion and budget.':cmd==='style'?'What are you getting ready for? Tell me your occasion or styling question.':'What are you dressing for? I’ll use the available items in your wardrobe.');return null;}
 if(cmd==='wardrobe'){
  const items=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).order('desc').take(12);
  await ctx.db.patch(c._id,{mode:'wardrobe'});
  for(const [index,item] of items.slice(0,6).entries()){const imageStorageId=item.cleanPhotoId??item.photoId;if(imageStorageId)await ctx.scheduler.runAfter(1000+index*6500,internal.whatsapp.send,{id,phase:`product_${index+1}` as 'product_1',text:[item.details.name,item.details.colour,item.details.brand,item.details.size].filter(Boolean).join(' · '),imageStorageId});}
  await reply(ctx,id,items.length?'Your wardrobe\n\n'+items.map((i,n)=>`${n+1}. ${i.details.name}${i.available?'':' (unavailable)'}`).join('\n')+'\n\nAdd or edit clothes: '+appUrl('wardrobe'):'Your wardrobe is empty. Add your first clothing photo here:\n'+appUrl('wardrobe'),[{id:'menu:outfit',title:'Style my wardrobe'},{id:'menu:tryon',title:'Try on'}]);return null;
 }
 if(text==='daily:enable'||text==='daily:disable'){await setFeedForOwner(ctx,owner,text==='daily:enable');await reply(ctx,id,text==='daily:enable'?'Daily picks are enabled. Type “daily picks” to check today’s selection. I won’t send unsolicited WhatsApp messages.':'Daily picks are paused.');return null;}
 if(cmd==='daily'){const daily=await currentFeedForOwner(ctx,owner);if(!daily.enabled){await reply(ctx,id,'Would you like a daily fashion edit based on your preferences? You can ask for it here or see it on the web. WhatsApp notifications are not enabled.',[{id:'daily:enable',title:'Enable daily picks'}]);return null;}}
 if(cmd==='saved'||cmd==='daily'){
  const rows=cmd==='saved'?(await ctx.db.query('savedProducts').withIndex('by_owner',q=>q.eq('owner',owner)).order('desc').take(6)).map(r=>r.option):(await currentFeedForOwner(ctx,owner)).feed?.options.slice(0,3)??[];
  await reply(ctx,id,rows.length?rows.map((o,n)=>`${n+1}. ${o.title}\n₹${o.price.toLocaleString('en-IN')} · ${o.store}\n${o.url}`).join('\n\n')+'\n\nThese are saved observations; check today’s price on the store.':cmd==='saved'?'No saved products yet. After a search, reply “save 1” to keep a product.':'Your daily picks are not ready. Manage your daily edit here:\n'+appUrl('home'));return null;
 }
 if(cmd==='tryon'){
  const items=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',owner)).order('desc').take(40);
  const eligible=items.filter(i=>i.photoId&&!['shoes','accessory'].includes(i.details.category)).slice(0,6);
  const saved=await ctx.db.query('savedProducts').withIndex('by_owner',q=>q.eq('owner',owner)).order('desc').take(6);
  const {allowedImageUrl}=await import('./discoveryRules');
  const choices=[...eligible.map(i=>({key:String(i._id),title:i.details.name})),...saved.filter(i=>allowedImageUrl(i.option.imageUrl)).slice(0,3).map(i=>({key:`saved:${i._id}`,title:i.option.title}))].slice(0,9);
  await ctx.db.patch(c._id,{mode:'tryon',selectionIds:choices.map(i=>i.key)});
  await reply(ctx,id,choices.length?'Choose a garment by replying “try 1”, “try 2”, etc.\n\n'+choices.map((i,n)=>`${n+1}. ${i.title}`).join('\n')+'\n\nI’ll ask before using your saved body photo.':'Add a garment and your optional full-length photo first:\n'+appUrl('try-on'));return null;
 }
 const tryMatch=/^try ([1-9])$/i.exec(text);
 if(c.mode==='tryon'&&tryMatch){
  const selection=c.selectionIds?.[Number(tryMatch[1])-1],saved=selection?.startsWith('saved:');
  const item=selection?await ctx.db.get((saved?selection.slice(6):selection) as Id<'wardrobeItems'>|Id<'savedProducts'>):null;
  if(!item||item.owner!==owner){await reply(ctx,id,'Choose Try on again for your current clothes.');return null;}
  const title='details' in item?item.details.name:item.option.title;
  await reply(ctx,id,`Generate a visual preview of ${title.slice(0,160)} using your saved body photo? AI will process the two images. A preview does not confirm size or fit.`,revisionButtons(c,[{id:`preview:${selection}`,title:'Generate preview'},{id:'menu:menu',title:'Not now'}]));return null;
 }
 if(text.startsWith('preview:')){
  const selection=text.slice(8);if(!c.selectionIds?.includes(selection))throw new ConvexError('Choose a current garment.');
  const source=selection.startsWith('saved:')?{kind:'saved' as const,id:selection.slice(6) as Id<'savedProducts'>}:{kind:'wardrobe' as const,id:selection as Id<'wardrobeItems'>};
  const job=await requestPreviewForOwner(ctx,owner,{source,consent:true});await reply(ctx,id,'Making your preview. I’ll send it here when it’s ready.');await ctx.scheduler.runAfter(3000,internal.whatsappChannel.poll,{id,kind:'tryon',job,attempt:0});return null;
 }
 if(/^save [1-6]$/i.test(text)){
  const conv=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${owner}`)).unique();
  const rows=conv?await ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',conv._id).eq('session',conv.session)).order('desc').take(1):[];
  const option=rows[0]?.result?.options[Number(text.slice(5))-1];if(!option||conv?.pending||conv?.revision!==c.discoveryRevision){await reply(ctx,id,'Choose a number from your latest completed search.');return null;}await saveKnownOption(ctx,owner,option);await reply(ctx,id,`Saved ${option.title}. It’s available in your web account too.`);return null;
 }
 if(c.mode==='style'||c.mode==='outfit'){
  const job=c.mode==='style'?await requestStyleForOwner(ctx,owner,{text,...(c.lastStyleId?{parentId:c.lastStyleId}:{})}):await requestOutfitsForOwner(ctx,owner,{text});
  if(c.mode==='style')await ctx.db.patch(c._id,{lastStyleId:job as Id<'stylistSessions'>});
  await reply(ctx,id,c.mode==='style'?'Your stylist is considering your request.':'Putting together outfits from your wardrobe.');await ctx.scheduler.runAfter(3000,internal.whatsappChannel.poll,{id,kind:c.mode,job,attempt:0});return null;
 }
 // Same web conversation and owner-based limits, so neither channel grants extra usage.
 const existing=await ctx.db.query('conversations').withIndex('by_key',q=>q.eq('key',`web:${owner}`)).unique();
 if(existing?.pending&&existing.updatedAt>Date.now()-120000)throw new ConvexError('Your search is still running. Wait for its reply before continuing.');
 if(!existing||/^(reset|start)[!.\s]*$/i.test(text))await consumeMonthly(ctx,owner,'conversations');
 const defaults=profileDefaults(prefs),conversation=await getConversation(ctx,`web:${owner}`,defaults);
 await ctx.db.patch(conversation._id,{language:prefs.language});conversation.language=prefs.language;
 if(!conversation.requirements.audience&&defaults.audience)conversation.requirements={...conversation.requirements,audience:defaults.audience};
 if(!conversation.revision)conversation.taste=emptyTaste;
 const turn=await beginTurn(ctx,conversation,text,defaults,undefined,true);
 const claimId=turn.search||turn.aiRequested?await searchClaim(ctx,owner,turn.aiRequested?'ai':'search'):undefined;
 await ctx.db.patch(c._id,{conversationId:turn.conversationId,discoveryRevision:turn.revision,requirements:turn.requirements,mode:'shop'});
 await ctx.db.patch(id,{sharedRevision:turn.revision,reply:turn.reply,search:turn.search,requirements:turn.requirements,state:'complete'});
 await start(ctx,internal.discoveryWorkflow.respond,{conversationId:turn.conversationId,revision:turn.revision,inboxId:id,...(claimId?{claimId}:{})});return null;
}});

export const poll=internalMutation({args:{id:v.id('waInbox'),kind:v.union(v.literal('style'),v.literal('outfit'),v.literal('tryon')),job:v.string(),attempt:v.number()},returns:v.null(),handler:async(ctx,{id,kind,job,attempt})=>{
 const m=await ctx.db.get(id),c=m?await ctx.db.get(m.conversationId):null;if(!m||!c?.owner||c.revision!==m.revision||c.stopped)return null;
 let state='',text='',imageStorageId:Id<'_storage'>|undefined;
 if(kind==='style'){
  const result=await ctx.runQuery(internal.stylist.handoff,{owner:c.owner,id:job as Id<'stylistSessions'>});
  if(!result)return null;state=result.status;
  const a=result.advice;if(a)text=[a.summary,...a.looks.slice(0,3).map(l=>`${l.title}\n${l.pieces.join(' + ')}\n${l.why}\n${l.styling}`),a.question??''].filter(Boolean).join('\n\n');
 }else if(kind==='outfit'){
  const row=await ctx.db.get(job as Id<'wardrobeOutfits'>);if(row?.owner!==c.owner)return null;state=row.state;

  const {wardrobeContext}=await import('./wardrobeContext');const {wardrobeKey}=await import('./wardrobeRules');
  const items=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',c.owner!)).take(80),context=await wardrobeContext(ctx,c.owner);
  if(row.contextKey!==context.contextKey||row.wardrobeKey!==wardrobeKey(items)){state='stale';}else if(state==='ready')text=row.outfits.map((o,n)=>`Outfit ${n+1}\n${o.itemIds.map(i=>items.find(item=>item._id===i)?.details.name??'').filter(Boolean).join(' + ')}\n${o.reason}`).join('\n\n')||row.note;
 }else{
  const row=await ctx.db.get(job as Id<'tryOnPreviews'>);if(row?.owner!==c.owner||row.expiresAt<Date.now())return null;state=row.state;
  const profile=await ctx.db.query('stylingProfiles').withIndex('by_owner',q=>q.eq('owner',c.owner!)).unique();
  if(profile?.photoId!==row.photoId){state='stale';}else if(state==='ready'){imageStorageId=row.outputId;text=`${row.title}\nAI-generated visual preview. Check the garment’s size guide for fit.`;}else text=row.note;
 }
 if(state==='building'&&attempt<50){await ctx.scheduler.runAfter(3000,internal.whatsappChannel.poll,{id,kind,job,attempt:attempt+1});return null;}
 if(!text||state==='stale')text=state==='stale'?'Your saved details changed. Ask again for an updated suggestion.':'This request could not finish. Please try again.';
 await ctx.scheduler.runAfter(0,internal.whatsapp.send,{id,phase:'options',text:text.slice(0,4000),...(imageStorageId?{imageStorageId}:{})});return null;
}});
export const ownedOutput=internalQuery({args:{id:v.id('waInbox'),storageId:v.id('_storage')},returns:v.union(v.null(),v.string()),handler:async(ctx,{id,storageId})=>{
 const m=await ctx.db.get(id),c=m?await ctx.db.get(m.conversationId):null;if(!m||!c?.owner||c.revision!==m.revision||c.stopped)return null;
 const clothes=await ctx.db.query('wardrobeItems').withIndex('by_owner',q=>q.eq('owner',c.owner!)).take(80);if(clothes.some(i=>i.photoId===storageId||i.cleanPhotoId===storageId))return ctx.storage.getUrl(storageId);
 const previews=await ctx.db.query('tryOnPreviews').withIndex('by_owner',q=>q.eq('owner',c.owner!)).order('desc').take(20);
 const profile=await ctx.db.query('stylingProfiles').withIndex('by_owner',q=>q.eq('owner',c.owner!)).unique();
 const preview=previews.find(p=>p.outputId===storageId&&p.state==='ready'&&p.expiresAt>Date.now()&&p.photoId===profile?.photoId);if(!preview)return null;const source=await ctx.db.get(preview.source.id);if(source?.owner!==c.owner)return null;
 return ctx.storage.getUrl(storageId);
}});

export const mediaCurrent=internalQuery({args:{id:v.id('waInbox')},returns:v.boolean(),handler:async(ctx,{id})=>{
 const m=await ctx.db.get(id),c=m?await ctx.db.get(m.conversationId):null;return Boolean(m&&c?.owner&&c.revision===m.revision&&!c.stopped&&c.consentedAt&&testRecipientAllowed(m.phone)&&m.timestamp>Date.now()-3600000);
}});
export const claimMedia=internalMutation({args:{id:v.id('waInbox'),purpose:mediaPurpose},returns:v.union(v.null(),v.object({owner:v.id('users'),mediaId:v.string()})),handler:async(ctx,{id,purpose})=>{
 if(!await ctx.runQuery(internal.whatsappChannel.mediaCurrent,{id}))return null;
 const m=(await ctx.db.get(id))!,c=(await ctx.db.get(m.conversationId))!,source=c.pendingMedia?await ctx.db.get(c.pendingMedia):null;
 if(m.state!=='queued'||m.mediaPurpose!==purpose||!source?.media||source.phone!==m.phone||source.media.kind!==(purpose==='voice'?'audio':'image'))return null;
 await ctx.db.patch(id,{state:'processing'});return {owner:c.owner!,mediaId:source.media.id};
}});
export const photoReady=internalMutation({args:{id:v.id('waInbox'),draftId:v.id('wardrobePhotoDrafts')},returns:v.null(),handler:async(ctx,{id,draftId})=>{
 const m=await ctx.db.get(id),c=m?await ctx.db.get(m.conversationId):null,draft=await ctx.db.get(draftId);
 if(!await ctx.runQuery(internal.whatsappChannel.mediaCurrent,{id})||!c||!draft||draft.owner!==c.owner||!draft.analysis){if(draft?.photoId)await ctx.storage.delete(draft.photoId);if(draft)await ctx.db.delete(draft._id);return null;}
 await ctx.db.patch(c._id,{draftId,pendingMedia:undefined});await ctx.db.patch(id,{state:'complete'});
 const d=draft.analysis.details;
 const text=`Clothing draft\n${[d.kind||d.category,d.colour,d.pattern,d.brand?`Brand: ${d.brand}`:'Brand: unknown',d.size?`Size: ${d.size}`:'Size: unknown'].filter(Boolean).join(' · ')}\n\nCheck the tags before saving. To correct them, reply “brand: …”, “size: …”, “fabric: …”, “colour: …” or “pattern: …”. Unknown details can stay blank.`;
 await ctx.scheduler.runAfter(0,internal.whatsapp.send,{id,phase:'options',text,buttons:revisionButtons(c,[{id:'wardrobe:confirm',title:'Save to wardrobe'},{id:'wardrobe:discard',title:'Discard'}])});return null;
}});
export const attachBody=internalMutation({args:{id:v.id('waInbox'),photoId:v.id('_storage')},returns:v.boolean(),handler:async(ctx,{id,photoId})=>{
 if(!await ctx.runQuery(internal.whatsappChannel.mediaCurrent,{id}))return false;const m=(await ctx.db.get(id))!,c=(await ctx.db.get(m.conversationId))!;
 if(m.mediaPurpose!=='body'||m.state!=='processing')return false;await ctx.runMutation(internal.styling.replacePhoto,{owner:c.owner!,photoId});return true;
}});
export const bodyReady=internalMutation({args:{id:v.id('waInbox'),photoId:v.id('_storage')},returns:v.null(),handler:async(ctx,{id,photoId})=>{
 if(!await ctx.runQuery(internal.whatsappChannel.mediaCurrent,{id}))return null;const m=(await ctx.db.get(id))!,c=(await ctx.db.get(m.conversationId))!;
 const photo=await ctx.db.query('stylingProfiles').withIndex('by_owner',q=>q.eq('owner',c.owner!)).unique();if(photo?.photoId!==photoId)return null;
 await ctx.db.patch(c._id,{pendingMedia:undefined});await ctx.db.patch(id,{state:'complete'});
 const a=photo.analysis,text=!a?.usable?'Please send a clearer head-to-toe photo in everyday clothes.':a.canEstimate?`Your photo is ready for try-on.\n\nTentative styling observation: ${a.proportions}\n\nWould you like to use this description for styling? You can edit it later.`:'Your photo is ready for try-on. I couldn’t reliably estimate proportions, so no body description has been saved.';
 await ctx.scheduler.runAfter(0,internal.whatsapp.send,{id,phase:'options',text,buttons:revisionButtons(c,a?.usable&&a.canEstimate?[{id:`body:confirm:${photoId}`,title:'Use description'},{id:'menu:tryon',title:'Try on only'}]:[{id:'menu:tryon',title:'Try on'}])});return null;
}});
export const mediaFailed=internalMutation({args:{id:v.id('waInbox')},returns:v.null(),handler:async(ctx,{id})=>{if(await ctx.runQuery(internal.whatsappChannel.mediaCurrent,{id})){await ctx.db.patch(id,{state:'failed'});await ctx.scheduler.runAfter(0,internal.whatsapp.send,{id,phase:'options',text:'I couldn’t read that attachment. Try a clear JPEG/PNG photo or a short voice note under 700 KB, or use the web: '+appUrl('wardrobe')});}return null;}});

export const reserveSend=internalMutation({args:{id:v.id('waInbox')},returns:v.union(v.number(),v.null()),handler:async(ctx,{id})=>{
 const m=await ctx.db.get(id),c=m?await ctx.db.get(m.conversationId):null;if(!m||!c||c.revision!==m.revision)return null;
 if(!c.owner)return 0; // Preserve old prepared discovery workflows.
 if(c.stopped&&channelCommand(m.text??'')!=='stop')return null;
 const next=Math.max(Date.now(),(c.lastSendAt??0)+6500);await ctx.db.patch(c._id,{lastSendAt:next});return next-Date.now();
}});
export const discoveryReply=internalQuery({args:{id:v.id('waInbox')},returns:v.union(v.null(),v.string()),handler:async(ctx,{id})=>{
 const m=await ctx.db.get(id),c=m?await ctx.db.get(m.conversationId):null;if(!m||m.sharedRevision===undefined||!c?.conversationId)return null;
 const shared=await ctx.db.get(c.conversationId);if(!shared||shared.revision!==m.sharedRevision)return null;
 const rows=await ctx.db.query('messages').withIndex('by_conversation_session',q=>q.eq('conversationId',shared._id).eq('session',shared.session)).order('desc').take(1),last=rows[0];
 if(!last||last.role!=='assistant')return null;
 return [last.text,...(last.result?.options.slice(0,6).map((o,n)=>`${n+1}. ${o.title.slice(0,130)}\n${o.priceFrom?'From ':''}₹${o.price.toLocaleString('en-IN')} · ${o.store}\n${o.url}`)??[]),last.result?.options.length?'Reply “save 1” to save a product, or tell me what to change. Prices and sizes need checking on the store.':''].filter(Boolean).join('\n\n').slice(0,4000);
}});
export const inputReady=internalMutation({args:{id:v.id('waInbox'),text:v.string(),uncertainties:v.array(v.string())},returns:v.null(),handler:async(ctx,{id,text,uncertainties})=>{
 if(!await ctx.runQuery(internal.whatsappChannel.mediaCurrent,{id}))return null;
 const m=(await ctx.db.get(id))!,c=(await ctx.db.get(m.conversationId))!;text=text.trim().slice(0,800);
 await ctx.db.patch(c._id,{pendingMedia:undefined,inputDraft:text||undefined});await ctx.db.patch(id,{state:'complete'});
 await ctx.scheduler.runAfter(0,internal.whatsapp.send,{id,phase:'options',text:((text?`Is this the request you want to search?\n\n${text}\n\n`:'I couldn’t read a clear shopping request. Please type it or send another attachment.\n')+uncertainties.slice(0,2).join('\n')).slice(0,1024),...(text?{buttons:revisionButtons(c,[{id:'input:confirm',title:'Search this'},{id:'input:discard',title:'I’ll type instead'}])}:{})});return null;
}});
