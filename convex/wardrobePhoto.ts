"use node";
import type {Id} from './_generated/dataModel';
import {action} from './_generated/server';
import {internal} from './_generated/api';
import {getAuthUserId} from '@convex-dev/auth/server';
import {v} from 'convex/values';
import {garmentValidator,validateGarment} from './wardrobeRules';
export const add=action({args:{details:garmentValidator,jpegBase64:v.string()},returns:v.id('wardrobeItems'),handler:async(ctx,{details,jpegBase64}):Promise<Id<'wardrobeItems'>>=>{
 const owner=await getAuthUserId(ctx);if(!owner)throw new Error('Please sign in.');validateGarment(details);
 if(jpegBase64.length>930000||!/^[A-Za-z0-9+/]*={0,2}$/.test(jpegBase64))throw new Error('Use a smaller JPEG photo.');
 const bytes=Buffer.from(jpegBase64,'base64');if(bytes.length<128||bytes.length>700000||bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)throw new Error('Use a JPEG photo.');
 const photoId=await ctx.storage.store(new Blob([new Uint8Array(bytes)],{type:'image/jpeg'}));
 try{return await ctx.runMutation(internal.wardrobe.createWithPhoto,{owner,details,photoId});}catch(error){await ctx.storage.delete(photoId);throw error;}
}});
