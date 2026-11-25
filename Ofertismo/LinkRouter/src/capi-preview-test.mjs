// Transport-only harness. Remove before production merge. Never use production credentials.
export const CAPI_PREVIEW_PATH='/__capi-test/transport';
const HOST='ofertismo-capi-foundation-20261125-ofertismo-link-router.porraloca42.workers.dev';
const DATASET='29104010142601422';
const GRAPH='https://graph.facebook.com/v25.0/'+DATASET+'/events';
const json=(body,status)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});
const secret=(s)=>typeof s==='string'&&s.length>=32;
function equal(a,b){
  const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);
  let v=x.length^y.length;
  for(let i=0;i<Math.max(x.length,y.length);i++)v|=(x[i]||0)^(y[i]||0);
  return v===0;
}
async function readLimited(request){
  if(!request.body)return null;
  const reader=request.body.getReader(),decoder=new TextDecoder();
  let bytes=0,text='';
  try{
    while(true){
      const {done,value}=await reader.read();if(done)break;
      bytes+=value.byteLength;if(bytes>512){await reader.cancel();return null;}
      text+=decoder.decode(value,{stream:true});
    }
    return JSON.parse(text+decoder.decode());
  }catch{return null;}
}
export async function handleCapiPreviewTest(request,env,fetchImpl=fetch){
  const url=new URL(request.url);
  if(url.protocol!=='https:'||url.hostname!==HOST||url.port||url.pathname!==CAPI_PREVIEW_PATH||
     env.META_CAPI_PREVIEW_ENABLED!=='true'||!secret(env.META_CAPI_PREVIEW_AUTH)||
     !secret(env.META_CAPI_PREVIEW_TOKEN)||!/^TEST[A-Za-z0-9_-]{1,64}$/.test(env.META_CAPI_PREVIEW_TEST_EVENT_CODE||'')||
     env.META_CAPI_PREVIEW_AUTH===env.ADMIN_TOKEN||env.META_CAPI_PREVIEW_AUTH===env.META_CAPI_PREVIEW_TOKEN)
    return json({ok:false},404);
  if(request.method!=='POST')return json({ok:false},405);
  if(!equal(request.headers.get('authorization')||'','Bearer '+env.META_CAPI_PREVIEW_AUTH))return json({ok:false},401);
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))return json({ok:false},415);
  const data=await readLimited(request);
  if(!data||data.consent!==true||!['PageView','Lead'].includes(data.event_name)||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(data.test_id||''))
    return json({ok:false,reason:'invalid_test'},400);
  const ua=request.headers.get('user-agent');
  if(!ua||!ua.trim())return json({ok:false,reason:'missing_user_agent'},400);
  const id=data.test_id+'_'+data.event_name;
  // Dedicated preview object, never the rotation object's ID.
  try{
    const stub=env.ROUTER_STATE.get(env.ROUTER_STATE.idFromName('capi-preview:'+data.test_id));
    const claim=await stub.fetch('https://router.local/internal/measurement-claim',{method:'POST',body:JSON.stringify({name:data.event_name})});
    if(!claim.ok)return json({ok:false,reason:'duplicate_or_unavailable'},409);
  }catch{return json({ok:false,reason:'claim_failed'},503);}
  const body={test_event_code:env.META_CAPI_PREVIEW_TEST_EVENT_CODE,data:[{
    event_name:data.event_name,event_id:id,event_time:Math.floor(Date.now()/1000),
    action_source:'website',event_source_url:url.origin+CAPI_PREVIEW_PATH,
    user_data:{client_user_agent:ua.slice(0,1024)}
  }]};
  try{
    const response=await fetchImpl(GRAPH,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+env.META_CAPI_PREVIEW_TOKEN},body:JSON.stringify(body),signal:AbortSignal.timeout(4000)});
    const result=await response.json();
    // Return only diagnostics safe to share, never payload, credentials or raw Graph errors.
    const ok=response.ok&&result.events_received===1;
    const diagnostic={};
    if(!ok&&result.error){
      if(Number.isSafeInteger(result.error.code))diagnostic.graph_error_code=result.error.code;
      if(Number.isSafeInteger(result.error.error_subcode))diagnostic.graph_error_subcode=result.error.error_subcode;
    }
    return json({ok,test:true,dataset:DATASET,event_id:id,events_received:Number(result.events_received)||0,graph_status:response.status,...diagnostic},ok?200:502);
  }catch{return json({ok:false,test:true,reason:'transport_error'},502);}
}
