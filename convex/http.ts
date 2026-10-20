import {go} from './affiliate';
import { httpRouter } from 'convex/server';
import { auth } from './auth';
import { registerStaticRoutes } from '@convex-dev/static-hosting';
import { components } from './_generated/api';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { validSignature,parsePayload } from './whatsappProtocol';
const http = httpRouter();
http.route({path:'/go',method:'GET',handler:go});
auth.addHttpRoutes(http);
http.route({path:'/whatsapp',method:'GET',handler:httpAction(async(_ctx,request)=>{
 const p=new URL(request.url).searchParams;
 if(process.env.WHATSAPP_VERIFY_TOKEN&&p.get('hub.mode')==='subscribe'&&p.get('hub.verify_token')===process.env.WHATSAPP_VERIFY_TOKEN&&p.get('hub.challenge'))return new Response(p.get('hub.challenge'),{headers:{'Content-Type':'text/plain'}});
 return new Response('Forbidden',{status:403});
})});
http.route({path:'/whatsapp',method:'POST',handler:httpAction(async(ctx,request)=>{
 const secret=process.env.META_APP_SECRET,phoneId=process.env.WHATSAPP_PHONE_ID;
 if(!secret||!phoneId||!process.env.WHATSAPP_TOKEN||!process.env.WHATSAPP_TEST_RECIPIENTS)return new Response('Not configured',{status:503});
 if(Number(request.headers.get('content-length')??0)>1000000)return new Response('Too large',{status:413});
 const body=await request.text();if(body.length>1000000)return new Response('Too large',{status:413});
 if(!await validSignature(body,request.headers.get('x-hub-signature-256'),secret))return new Response('Forbidden',{status:403});
 let payload:unknown;try{payload=JSON.parse(body);}catch{return new Response('Invalid JSON',{status:400});}
 await ctx.runMutation(internal.whatsappChannel.receive,parsePayload(payload,phoneId));return new Response('EVENT_RECEIVED');
})});
// Multi-page Vite output needs explicit directory redirects; preserve query strings.
for (const page of ['app', 'demo', 'roadmap', 'faq']) {
 const redirect = httpAction(async (_ctx, request) => {
  const target = new URL(request.url);
  target.pathname = `/${page}/index.html`;
  return Response.redirect(target.toString(), 307);
 });
 for (const path of [`/${page}`, `/${page}/`]) http.route({path, method: 'GET', handler: redirect});
}
registerStaticRoutes(http, components.staticHosting);
export default http;
