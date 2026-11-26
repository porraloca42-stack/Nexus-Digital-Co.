// Aggregate operational counters. No visitor identifiers, URLs, cookies or IPs are persisted.
import {dateInSaoPaulo} from './rotation.mjs';
export const STAGES=new Set(['landing_request','consent_accept','consent_decline','redirect_ok','redirect_unavailable','redirect_yes','redirect_no','redirect_unset','capi_pageview_accepted','capi_pageview_failed','capi_lead_accepted','capi_lead_failed']);
const SOURCES=new Set(['meta','team','telegram','social','direto','outro']);
const CREATIVE_REGISTRY={'oft_t03':['imagem_01','video_01']};
export function traffic(source,campaign,creative){
 const s=SOURCES.has(source)?source:'outro';
 return {source:s,campaign:s==='meta'&&Object.hasOwn(CREATIVE_REGISTRY,campaign)&&CREATIVE_REGISTRY[campaign].includes(creative)?campaign:'',creative:s==='meta'&&Object.hasOwn(CREATIVE_REGISTRY,campaign)&&CREATIVE_REGISTRY[campaign].includes(creative)?creative:''};
}
export function trafficFromUrl(url){
 const p=new URL(url).searchParams,origin=(p.get('origem')||p.get('utm_source')||'').toLowerCase().trim();
 let source='direto';
 if(['meta','facebook','instagram','fb','ig','metaads'].includes(origin)||(!origin&&p.has('fbclid')))source='meta';
 else if(['team','teamlanders','team-landers'].includes(origin))source='team';
 else if(['telegram','tg'].includes(origin))source='telegram';
 else if(['social','tiktok','youtube'].includes(origin))source='social';
 else if(origin)source='outro';
 return traffic(source,p.get('utm_campaign'),p.get('utm_content'));
}
export function eligibleRequest(request){
 const a=request.headers.get('user-agent')||'';
 const purpose=[request.headers.get('purpose'),request.headers.get('sec-purpose')].join(' ');
 return Boolean(a)&&!/(bot|crawler|spider|preview|facebookexternalhit|curl|headless|slackbot)/i.test(a)&&!/(prefetch|prerender)/i.test(purpose);
}
export function countStage(state,stage,dimensions={},now=new Date()){
 if(!STAGES.has(stage))return state;
 const {source,campaign,creative}=traffic(dimensions.source,dimensions.campaign,dimensions.creative);
 const day=dateInSaoPaulo(now),cutoff=dateInSaoPaulo(new Date(now.getTime()-89*86400000));
 const next={};
 for(const [key,row] of Object.entries(state||{}))if(/^\d{4}-\d{2}-\d{2}$/.test(key)&&key>=cutoff&&key<=day)next[key]={...row};
 const row=next[day]??={},key=[source,campaign||'-',creative||'-',stage].join('|');
 row[key]=Math.min(Number.MAX_SAFE_INTEGER,(row[key]||0)+1);
 return next;
}
export function consentState(request){
 const choice=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('oft_measure='))?.slice(12);
 return choice==='yes'?'yes':choice==='no'?'no':'unset';
}
export async function recordStage(env,request,stage,dimensions){
 if(new URL(request.url).origin!=='https://ofertismo.com.br'||!eligibleRequest(request)||!STAGES.has(stage))return;
 try{
  const stub=env.ROUTER_STATE.get(env.ROUTER_STATE.idFromName('ofertismo-main'));
  await stub.fetch('https://router.local/internal/funnel',{method:'POST',body:JSON.stringify({stage,dimensions})});
 }catch{/* Metrics are best-effort and must never block the visitor. */}
}
export async function readSmallJson(request,max=2048){
 if(!request.body||Number(request.headers.get('content-length')||0)>max)return null;
 const reader=request.body.getReader();const decoder=new TextDecoder();let size=0,s='';
 try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();return null;}s+=decoder.decode(value,{stream:true});}s+=decoder.decode();return JSON.parse(s);}catch{return null;}
}
