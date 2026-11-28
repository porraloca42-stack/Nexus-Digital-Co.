// Base isolada. Não importar no Worker de produção antes de validar consentimento,
 // evento compartilhado com o Pixel, teste Meta e credencial Secret.
const PIXEL_ID = '29104010142601422';
const ENDPOINT = 'https://graph.facebook.com/v25.0/' + PIXEL_ID + '/events';
const EVENTS = new Set(['PageView','Lead']);
// Preserve the actual cookie domain index; .com.br cookies can use fb.2.
export const validFbp=value=>typeof value==='string'&&/^fb\.\d{1,3}\.\d{10,16}\.\d{1,30}$/.test(value);
export const validFbc=value=>typeof value==='string'&&/^fb\.\d{1,3}\.\d{10,16}\.[A-Za-z0-9_-]{1,512}$/.test(value);
export function buildEvent(input) {
  if (input.consent !== true || !EVENTS.has(input.name)) return null;
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(input.eventId || '')) return null;
  if (!Number.isSafeInteger(input.eventTime) || input.eventTime <= 0) return null;
  let url;
  try { url = new URL(input.sourceUrl); } catch { return null; }
  if (url.origin !== 'https://ofertismo.com.br' || !['/','/inicio'].includes(url.pathname)) return null;
  if (typeof input.userAgent !== 'string' || !input.userAgent.trim()) return null;
  // Não enviar URL com parâmetros arbitrários ou dados pessoais.
  const user_data = {client_user_agent:input.userAgent.slice(0,1024)};
  if (validFbp(input.fbp)) user_data.fbp=input.fbp;
  if (validFbc(input.fbc)) user_data.fbc=input.fbc;
  if (typeof input.clientIp === 'string' && /^[0-9a-fA-F:.]{3,45}$/.test(input.clientIp)) user_data.client_ip_address=input.clientIp;
  // IDs fornecidos apenas por contexto de evento válido. Nunca inventar cookie/fbclid.
  return {event_name:input.name,event_time:input.eventTime,event_id:input.eventId,
    action_source:'website',event_source_url:url.origin+url.pathname,user_data};
}
export async function sendCapi(input, env, fetchImpl=fetch) {
  if (env.META_CAPI_ENABLED !== 'true' || !env.META_CAPI_TOKEN) return {sent:false,reason:'disabled'};
  const event=buildEvent(input);
  if (!event) return {sent:false,reason:'invalid_or_no_consent'};
  const body={data:[event]};
  if (env.META_CAPI_TEST_EVENT_CODE) body.test_event_code=env.META_CAPI_TEST_EVENT_CODE;
  // One short retry only for transient failures within the original consented request.
  // No durable queue, no new event ID, no retry for rate limits or definitive 4xx.
  const serialized=JSON.stringify(body);
  let last;
  for(let attempt=1;attempt<=2;attempt++){
    let retryable=false;
    try {
      const r=await fetchImpl(ENDPOINT,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+env.META_CAPI_TOKEN},body:serialized,signal:AbortSignal.timeout(4000)});
      let result={};
      try{result=await r.json();}catch{}
      const sent=r.ok && result?.events_received===1;
      const diagnostics={};
      if(!sent&&result?.error){
        if(Number.isSafeInteger(result.error.code))diagnostics.graph_error_code=result.error.code;
        if(Number.isSafeInteger(result.error.error_subcode))diagnostics.graph_error_subcode=result.error.error_subcode;
      }
      last={sent,status:r.status,...(!sent?{reason:'graph_rejected'}:{}),...diagnostics};
      retryable=!sent&&[500,502,503,504].includes(r.status)&&!r.headers?.get('retry-after');
    } catch {last={sent:false,reason:'transport_error'};retryable=true;}
    if(!retryable||attempt===2)return {...last,...(attempt>1?{attempts:attempt}:{})};
  }
  return last;
}
