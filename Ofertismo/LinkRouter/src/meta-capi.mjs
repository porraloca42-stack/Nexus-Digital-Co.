// Base isolada. Não importar no Worker de produção antes de validar consentimento,
 // evento compartilhado com o Pixel, teste Meta e credencial Secret.
const PIXEL_ID = '2468079523719290';
const ENDPOINT = 'https://graph.facebook.com/v25.0/' + PIXEL_ID + '/events';
const EVENTS = new Set(['PageView','Lead']);
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
  if (typeof input.fbp === 'string' && /^fb\.1\.\d{10,16}\.\d{1,30}$/.test(input.fbp)) user_data.fbp=input.fbp;
  if (typeof input.fbc === 'string' && /^fb\.1\.\d{10,16}\.[A-Za-z0-9_-]{1,512}$/.test(input.fbc)) user_data.fbc=input.fbc;
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
  try {
    const r=await fetchImpl(ENDPOINT,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+env.META_CAPI_TOKEN},body:JSON.stringify(body),signal:AbortSignal.timeout(4000)});
    const result=await r.json();
    return {sent:r.ok && result.events_received===1,status:r.status};
  } catch {return {sent:false,reason:'transport_error'};}
}
