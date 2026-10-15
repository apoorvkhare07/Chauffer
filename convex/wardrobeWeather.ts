"use node";
import {v} from 'convex/values';
import {getAuthUserId} from '@convex-dev/auth/server';
import {action} from './_generated/server';
import {internal} from './_generated/api';
import {eventValidator,validateEvent,eventHour,localClock,type OutfitEvent,type WardrobeWeather,cleanLocation,locationValidator} from './wardrobeContextRules';
import type {Infer} from 'convex/values';
const unavailable=(note:string):WardrobeWeather=>({status:'unavailable',note});
export async function fetchWardrobeWeather(location:Infer<typeof locationValidator>|null,event:OutfitEvent,now=Date.now()):Promise<WardrobeWeather>{
 if(!location)return {status:'not_requested',note:'Add a city or choose approximate location for weather. You can also describe the weather yourself.'};
 const key=process.env.WEATHER_API_KEY;if(!key)return unavailable('Live weather is not connected yet. Tell us the weather in your request.');
 const place=cleanLocation(location),q=place.source==='city'?place.city:`${place.latitude},${place.longitude}`;
 const url=new URL('https://api.weatherapi.com/v1/forecast.json');url.search=new URLSearchParams({key,q,days:'3',aqi:'no',alerts:'no'}).toString();
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(8000)});if(!response.ok)return unavailable(response.status===400?'Could not find that location. Try city, state and country.':'Weather is unavailable right now. You can describe conditions in your request.');
  const reader=response.body?.getReader();if(!reader)return unavailable('Weather is unavailable right now.');let size=0;const chunks:Uint8Array[]=[];while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>250000){await reader.cancel();throw new Error('large');}chunks.push(part.value);}const data=JSON.parse(Buffer.concat(chunks).toString());
  const zone=String(data.location?.tz_id??event.timeZone),clock=localClock(now,zone),current=event.date===clock.date&&event.period==='auto';
  const hour=eventHour({...event,timeZone:zone},now),weather=current?data.current:data.forecast?.forecastday?.find((d:any)=>d.date===event.date)?.hour?.find((h:any)=>Number(h.time?.slice(11,13))===hour);
  if(!weather)return unavailable('No forecast is available for that date yet. Describe expected weather or check closer to the day.');
  if(![weather.temp_c,weather.feelslike_c,weather.wind_kph,weather.humidity].every(Number.isFinite)||typeof weather.condition?.text!=='string'||Math.abs(weather.temp_c)>70||Math.abs(weather.feelslike_c)>90||weather.wind_kph<0||weather.wind_kph>500||weather.humidity<0||weather.humidity>100)throw new Error('invalid');
  const observedAt=Number(current?weather.last_updated_epoch:weather.time_epoch)*1000;if(!Number.isFinite(observedAt)||(current&&(observedAt<now-7200000||observedAt>now+300000)))return unavailable('Weather data is out of date. Describe conditions yourself for now.');
  return {status:'ready',note:'Weather is an estimate; conditions can change.',source:'WeatherAPI.com',kind:current?'current':'forecast',location:[data.location?.name,data.location?.region,data.location?.country].filter(Boolean).join(', ').slice(0,160),timeZone:zone,date:event.date,hour,temperatureC:weather.temp_c,feelsLikeC:weather.feelslike_c,windKph:weather.wind_kph,humidity:weather.humidity,condition:weather.condition.text.slice(0,100),isDay:weather.is_day===1,fetchedAt:now,observedAt,...(!current&&Number.isFinite(weather.chance_of_rain)?{rainChance:Math.max(0,Math.min(100,weather.chance_of_rain))}:{})};
 }catch{return unavailable('Could not check weather. Your outfit request can still use the conditions you describe.');}
}
export const preview=action({args:{event:eventValidator},handler:async(ctx,{event}):Promise<WardrobeWeather>=>{const owner=await getAuthUserId(ctx);if(!owner)throw new Error('Please sign in.');const valid=validateEvent(event);await ctx.runMutation(internal.wardrobeContext.claimWeather,{owner});return fetchWardrobeWeather(await ctx.runQuery(internal.wardrobeContext.place,{owner}),valid);}});
