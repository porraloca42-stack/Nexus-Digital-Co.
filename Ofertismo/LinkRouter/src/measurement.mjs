import { sendCapi } from './meta-capi.mjs';
const ORIGIN='https://ofertismo.com.br';
const TTL=3600;
const enc=new TextEncoder();
const cookie=(r,n)=> (r.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(n+'='))?.slice(n.length+1)||'';
export const allowed=(env)=>env.META_CAPI_ENABLED==='true'&&typeof env.META_CAPI_TOKEN==='string'&&env.META_CAPI_TOKEN.length>0&&typeof env.META_MEASUREMENT_SIGNING_KEY==='string'&&env.META_MEASUREMENT_SIGNING_KEY.length>=32&&env.META_MEASUREMENT_SIGNING_KEY!==env.ADMIN_TOKEN&&env.META_MEASUREMENT_SIGNING_KEY!==env.META_CAPI_TOKEN;
async function key(env){return crypto.subtle.importKey('raw',enc.encode(env.META_MEASUREMENT_SIGNING_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
const hex=b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
export async function issueTicket(path,env,now=Math.floor(Date.now()/1000)){
 if(!allowed(env)||!['/','/inicio'].includes(path))return '';
 const body=crypto.randomUUID()+'.'+now+'.'+(path==='/'?'home':'inicio');
 const sig=hex(await crypto.subtle.sign('HMAC',await key(env),enc.encode('ofertismo:measurement:v1:'+body)));
 return body+'.'+sig;
}
export async function verifyTicket(ticket,env,now=Math.floor(Date.now()/1000)){
 if(!allowed(env)||typeof ticket!=='string'||! /^[0-9a-f-]{36}\.\d{10}\.(home|inicio)\.[0-9a-f]{64}$/.test(ticket))return null;
 const [id,ts,path,sig]=ticket.split('.');
 if(Number(ts)>now+5||now-Number(ts)>TTL)return null;
 const body=[id,ts,path].join('.');
 const valid=await crypto.subtle.verify('HMAC',await key(env),Uint8Array.from(sig.match(/../g),s=>parseInt(s,16)),enc.encode('ofertismo:measurement:v1:'+body));
 return valid?{id,issuedAt:Number(ts),sourceUrl:ORIGIN+(path==='home'?'/':'/inicio')}:null;
}
export async function dispatchMeasurement(request,env,ticket,name,fetchImpl=fetch){
 if(new URL(request.url).origin!==ORIGIN||cookie(request,'oft_measure')!=='yes')return {sent:false,reason:'no_consent_or_origin'};
 if(name==='PageView'&&request.headers.get('origin')!==ORIGIN)return {sent:false,reason:'origin'};
 if(name==='Lead'){
  let ref;
  try{ref=new URL(request.headers.get('referer')||'');}catch{return {sent:false,reason:'referer'};}
  if(ref.origin!==ORIGIN||!['/','/inicio'].includes(ref.pathname))return {sent:false,reason:'referer'};
 }
 const page=await verifyTicket(ticket,env);
 if(!page||!['PageView','Lead'].includes(name))return {sent:false,reason:'ticket'};
 const userAgent=request.headers.get('user-agent')||'';
 if(!userAgent||/(bot|crawler|spider|preview|facebookexternalhit|curl|headless|slackbot)/i.test(userAgent))return {sent:false,reason:'agent'};
 const stub=env.ROUTER_STATE.get(env.ROUTER_STATE.idFromName('measurement:'+page.id));
 const claim=await stub.fetch('https://router.local/internal/measurement-claim',{method:'POST',body:JSON.stringify({name})});
 if(!claim.ok)return {sent:false,reason:'duplicate_or_unavailable'};
 let fbc=cookie(request,'_fbc');
 if(!fbc){
  try{
   const ref=new URL(request.headers.get('referer')||'');
   const click=ref.searchParams.get('fbclid')||'';
   if(ref.origin===ORIGIN&&ref.origin+ref.pathname===page.sourceUrl&&/^[A-Za-z0-9_-]{1,512}$/.test(click))fbc='fb.1.'+(page.issuedAt*1000)+'.'+click;
  }catch{}
 }
 return sendCapi({consent:true,name,eventId:page.id+'_'+name,eventTime:Math.floor(Date.now()/1000),sourceUrl:page.sourceUrl,userAgent,clientIp:request.headers.get('cf-connecting-ip')||'',fbp:cookie(request,'_fbp'),fbc},env,fetchImpl);
}

// Minimal delivery telemetry: no event IDs, URLs, cookies, IP, UA, token, or raw errors.
export async function observeMeasurement(operation,name,logger=console){
 if(!['PageView','Lead'].includes(name))return;
 let result;
 try{result=await operation();}catch{result={sent:false,reason:'internal_error'}}
 const reasons=['disabled','invalid_or_no_consent','no_consent_or_origin','origin','referer','ticket','agent','duplicate_or_unavailable','transport_error','graph_rejected','internal_error'];
 const record={component:'oft_capi',event:name,outcome:result?.sent===true?'accepted':'not_sent'};
 if(reasons.includes(result?.reason))record.reason=result.reason;
 if(Number.isInteger(result?.status)&&result.status>=100&&result.status<=599)record.http_status=result.status;
 for(const field of ['graph_error_code','graph_error_subcode'])if(Number.isSafeInteger(result?.[field]))record[field]=result[field];
 // Avoid recording unconsented or ineligible visitor activity; only actual delivery failures/successes.
 if(record.outcome==='accepted'||['transport_error','graph_rejected','internal_error','duplicate_or_unavailable'].includes(record.reason)){
  try{logger[record.outcome==='accepted'?'info':'warn'](JSON.stringify(record))}catch{}
 }
 return result;
}
