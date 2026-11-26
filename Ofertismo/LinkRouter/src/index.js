import { DurableObject } from 'cloudflare:workers';
import { cleanSource, dateInSaoPaulo, nextClick, validateConfig, retainMetricsForGroups } from './rotation.mjs';
import { landingHtml, privacyHtml } from './landing-v3.mjs';
import { renderInviteTest } from './invite-test.mjs';
import { allowed, issueTicket, verifyTicket, dispatchMeasurement, observeMeasurement } from './measurement.mjs';
import { traffic, trafficFromUrl, eligibleRequest, consentState, countStage, recordStage, readSmallJson } from './operational.mjs';

import { reserveRedirect, validOperation } from './redirect.mjs';

const DEFAULT_CONFIG = { limit: 1000, groups: [] };
const DEFAULT_METRICS = { total: 0, groupIndex: 0, byGroup: {}, bySource: {}, byDaySource: {} };

function reply(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

export class LinkRouterState extends DurableObject {
  async alarm() { await this.ctx.storage.deleteAll(); } // somente objetos isolados measurement:<id> recebem alarmes
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === '/internal/measurement-claim' && request.method === 'POST') {
      const {name}=await request.json();
      if(!['PageView','Lead'].includes(name))return reply({ok:false},400);
      const claimed=await this.ctx.storage.transaction(async txn=>{
        const key='event:'+name;
        if(await txn.get(key))return false;
        await txn.put(key,true);return true;
      });
      if(!claimed)return reply({ok:false},409);
      await this.ctx.storage.setAlarm(Date.now()+7200000);
      return reply({ok:true});
    }
    if (path === '/internal/funnel' && request.method === 'POST') {
      const {stage,dimensions}=await request.json();
      await this.ctx.storage.transaction(async txn=>{
        const previous=await txn.get('funnel-v4')||{};
        const next=countStage(previous,stage,dimensions);
        if(next!==previous)await txn.put('funnel-v4',next);
      });
      return reply({ok:true});
    }
    if (path === '/internal/stats') {
      const [config, metrics, funnel] = await Promise.all([
        this.ctx.storage.get('config'), this.ctx.storage.get('metrics'), this.ctx.storage.get('funnel-v4')
      ]);
      return reply({ config: config || DEFAULT_CONFIG, metrics: metrics || DEFAULT_METRICS, funnel:funnel||{} });
    }
    if (path === '/internal/current-invite' && request.method === 'GET') {
      const [config, metrics] = await Promise.all([this.ctx.storage.get('config'), this.ctx.storage.get('metrics')]);
      const result = nextClick(config || DEFAULT_CONFIG, metrics || DEFAULT_METRICS, 'teste', dateInSaoPaulo());
      if (!result.target) return reply({ error: result.reason }, 503);
      return reply({ url: result.target.url }); // Apenas consulta: não incrementa contadores.
    }
    if (path === '/internal/config' && request.method === 'POST') {
      const payload = await request.json();
      let config;
      try { config = validateConfig(payload); }
      catch (err) { return reply({ error: err.message }, 400); }
      await this.ctx.storage.transaction(async (txn) => {
        const existing = (await txn.get('metrics')) || DEFAULT_METRICS;
        await txn.put('config', config);
        await txn.delete('redirect-receipts-v4');
        await txn.put('metrics', retainMetricsForGroups(existing, config.groups));
      });
      return reply({ ok: true });
    }
    if (path === '/internal/reset' && request.method === 'POST') {
      await this.ctx.storage.transaction(async txn=>{await txn.put('metrics',structuredClone(DEFAULT_METRICS));await txn.delete('redirect-receipts-v4');});
      return reply({ ok: true });
    }
    if (path === '/internal/redirect' && request.method === 'POST') {
      const input=await request.json();
      let result;
      await this.ctx.storage.transaction(async txn=>{
        const config=await txn.get('config')||DEFAULT_CONFIG;
        const metrics=await txn.get('metrics')||DEFAULT_METRICS;
        const receipts=await txn.get('redirect-receipts-v4')||{};
        result=reserveRedirect(config,metrics,receipts,input);
        if(result.target&&!result.repeated)await txn.put('metrics',result.metrics);
        if(Object.keys(result.receipts).length||Object.keys(receipts).length)await txn.put('redirect-receipts-v4',result.receipts);
        if(result.target&&!result.repeated){
          let funnel=await txn.get('funnel-v4')||{};
          const dimensions=traffic(input.source,input.campaign,input.creative);
          funnel=countStage(funnel,'redirect_ok',dimensions);
          funnel=countStage(funnel,'redirect_'+(['yes','no'].includes(input.consent)?input.consent:'unset'),dimensions);
          await txn.put('funnel-v4',funnel);
        }
      });
      if(!result.target)return reply({error:result.reason},503);
      return reply({url:result.target.url,repeated:result.repeated});
    }
    return reply({ error: 'Not found' }, 404);
  }
}

function secureCompare(a, b) {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  const len = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let i = 0; i < len; i++) difference |= (left[i] || 0) ^ (right[i] || 0);
  return difference === 0;
}

function isAuthorized(request, env) {
  const configured = env.ADMIN_TOKEN || '';
  const supplied = request.headers.get('authorization') || '';
  return configured.length >= 24 && secureCompare(supplied, `Bearer ${configured}`);
}

function adminHtml() {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Ofertismo — Controle de Grupos</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;background:#12151b;color:#f5f5f5;max-width:840px;margin:30px auto;padding:18px}main{background:#1c2029;border:1px solid #333b4a;border-radius:16px;padding:20px}input,button{font:inherit;border-radius:8px;padding:10px;background:#292e39;color:#fff;border:1px solid #465065}button{cursor:pointer}button:hover{background:#394150}label{display:block;margin:14px 0 6px}.wide{width:96%}.row{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}.row>*{flex:1}.item{background:#202630;padding:12px;border-radius:10px;margin:8px 0}.muted{color:#aab4c4;font-size:.9em}#out{white-space:pre-wrap;overflow-wrap:anywhere}h1{font-size:1.5em}</style></head><body><main><h1>Ofertismo — Grupos</h1><p class="muted">Acessos válidos, não membros efetivos. Nenhum link é salvo no GitHub.</p><label>Chave administrativa Cloudflare</label><input id="token" class="wide" type="password" autocomplete="off" placeholder="Cole a chave configurada em Secrets"><div class="row"><button id="load">Consultar dados</button><button id="add">Adicionar grupo</button></div><label>Limite de acessos por grupo</label><input id="limit" type="number" min="1" max="1000000" value="1000"><h3>Ordem de redirecionamento</h3><div id="groups"></div><button id="save">Salvar configuração</button><h3>Funil V4 — contagens operacionais</h3><p class="muted">Requisições e ações, não visitantes únicos. UTMs identificam links, não provam mídia paga. Dados agregados recentes; testes e bloqueadores podem afetar a leitura.</p><label>Data (Brasília)</label><input type="date" id="funnel-day"><div id="funnel-view" style="overflow-x:auto"></div><h3>Estatísticas do rotacionador</h3><button id="reset" type="button">Zerar estatísticas</button><pre id="out" class="muted">Faça login para consultar.</pre></main>
<script>
const el = id => document.getElementById(id);
let funnelData={};
el('funnel-day').value=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function showFunnel(){const target=el('funnel-view');target.replaceChildren();const row=funnelData[el('funnel-day').value]||{},groups={};for(const [key,value] of Object.entries(row)){const parts=key.split('|');if(parts.length!==4)continue;const [source,campaign,creative,stage]=parts;const name=[source,campaign,creative].join(' / ');(groups[name]??={})[stage]=value;}const fields=[['landing_request','Acessos LP'],['consent_accept','Aceites'],['consent_decline','Recusas'],['redirect_ok','Redirects OK'],['redirect_unavailable','Indisponíveis'],['redirect_yes','Com aceite'],['redirect_no','Com recusa'],['redirect_unset','Sem escolha'],['capi_pageview_accepted','PV CAPI OK'],['capi_lead_accepted','Lead CAPI OK'],['capi_pageview_failed','PV falhou'],['capi_lead_failed','Lead falhou']];if(!Object.keys(groups).length){target.textContent='Sem registros V4 para a data.';return;}const table=document.createElement('table');table.style.cssText='border-collapse:collapse;min-width:100%;font-size:12px';function line(values,tag){const tr=document.createElement('tr');for(const value of values){const cell=document.createElement(tag);cell.textContent=String(value);cell.style.cssText='padding:8px;border:1px solid #49505a;text-align:left';tr.append(cell);}table.append(tr);}line(['Origem / campanha / criativo',...fields.map(x=>x[1])],'th');for(const [name,data] of Object.entries(groups))line([name,...fields.map(x=>data[x[0]]||0)],'td');target.append(table);}
el('funnel-day').onchange=showFunnel;
function groupRow(g={id:'',url:''}) {const block=document.createElement('div');block.className='item';const a=document.createElement('input');a.placeholder='grupo-01';a.value=g.id;a.className='wide';a.setAttribute('aria-label','Identificador');const b=document.createElement('input');b.placeholder='https://chat.whatsapp.com/...';b.value=g.url;b.className='wide';b.setAttribute('aria-label','Link do convite');const remove=document.createElement('button');remove.textContent='Remover da configuração';remove.onclick=()=>block.remove();block.append(a,b,remove);el('groups').append(block)}
async function api(method,body){const r=await fetch('/api/admin/config',{method,headers:{'authorization':'Bearer '+el('token').value,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});const data=await r.json();if(!r.ok)throw Error(data.error||'Erro '+r.status);return data}
el('add').onclick=()=>groupRow();
el('load').onclick=async()=>{try{const d=await api('GET');el('limit').value=d.config.limit;el('groups').replaceChildren();d.config.groups.forEach(groupRow);funnelData=d.funnel||{};showFunnel();el('out').textContent=JSON.stringify({...d.metrics,funnelV4:funnelData},null,2)}catch(e){el('out').textContent=e.message}};
el('save').onclick=async()=>{try{const groups=[...el('groups').children].map(e=>({id:e.children[0].value.trim(),url:e.children[1].value.trim()}));if(!confirm('Salvar configuração de '+groups.length+' grupos?'))return;await api('POST',{limit:Number(el('limit').value),groups});el('out').textContent='Salvo. Consulte novamente para ver os números.'}catch(e){el('out').textContent=e.message}};
el('reset').onclick=async()=>{
 if(!confirm('Zerar TODOS os contadores? Grupos e limite serão preservados.'))return;
 if(prompt('Digite ZERAR para confirmar:')!=='ZERAR')return;
 try{
  const r=await fetch('/api/admin/reset',{method:'POST',headers:{'authorization':'Bearer '+el('token').value}});
  const d=await r.json();
  if(!r.ok)throw Error(d.error||'Erro '+r.status);
  el('out').textContent='Estatísticas zeradas. Grupos e limite preservados. Consulte novamente para verificar.';
 }catch(e){el('out').textContent=e.message}
};
</script></body></html>`;
}

function pageDimensions(request){
  try{const ref=new URL(request.headers.get('referer')||'');if(ref.origin==='https://ofertismo.com.br')return trafficFromUrl(ref);}catch{}
  return traffic('outro','','');
}
async function reportMeasurement(request,env,ticket,name,dimensions){
  const result=await observeMeasurement(()=>dispatchMeasurement(request,env,ticket,name),name);
  const prefix=name==='PageView'?'capi_pageview_':'capi_lead_';
  if(result?.sent)await recordStage(env,request,prefix+'accepted',dimensions);
  else if(['transport_error','graph_rejected','internal_error'].includes(result?.reason))await recordStage(env,request,prefix+'failed',dimensions);
}
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    if(path.startsWith('/__capi-test/'))return reply({ok:false},404);
    const preview=url.hostname.endsWith('-ofertismo-link-router.porraloca42.workers.dev');
    if(preview&&path==='/preview-redirect-done')return reply({ok:true,preview:true,tracking:false,groupCounters:false});
    if(preview&&/^\/(entrar|go)(\/|$)/.test(path)&&request.method==='POST'){
      const data=await readSmallJson(request,2048);
      if(!data||!validOperation(data.operation)||request.headers.get('origin')!==url.origin)return reply({ok:false},400);
      const id=typeof data.ticket==='string'&&/^[0-9a-f-]{36}\.preview$/.test(data.ticket)&&consentState(request)==='yes'?data.ticket.split('.')[0]+'_Lead':null;
      return reply({ok:true,preview:true,url:'/preview-redirect-done',leadEventID:id,tracking:false,groupCounters:false});
    }
    if(preview&&(/^\/(entrar|go)(\/|$)/.test(path)||path==='/api/measurement/pageview'||path==='/api/operational/choice')){
      return reply({ok:true,preview:true,route:path,tracking:false,groupCounters:false,utm_campaign:url.searchParams.get('utm_campaign'),utm_content:url.searchParams.get('utm_content'),eventID:url.searchParams.has('measurement_ticket')?url.searchParams.get('measurement_ticket').split('.')[0]+'_Lead':null});
    }
    if (path === '/health' && request.method === 'GET') return reply({ status: 'ok', app: 'ofertismo-router' });
    if ((path === '/' || path === '/inicio') && request.method === 'GET') {
      let ticket='';
      if(preview)ticket=crypto.randomUUID()+'.preview';
      else if(env.META_CAPI_ENABLED==='true'){
        ticket='';
        if(url.origin==='https://ofertismo.com.br'&&allowed(env)){
          try{ticket=await issueTicket(path,env)}catch{}
        }
      }
      const dimensions=trafficFromUrl(url);
      if(!preview)ctx.waitUntil(recordStage(env,request,'landing_request',dimensions));
      const fallback='/entrar/'+dimensions.source+(dimensions.campaign?'?utm_campaign='+dimensions.campaign+'&amp;utm_content='+dimensions.creative:'');
      const html=landingHtml.replace('__OFT_MEASUREMENT_TICKET__',JSON.stringify(ticket)).replaceAll('href="/entrar/direto"','href="'+fallback+'"');
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control':'private, no-store', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY' } });
    }
    if(path==='/api/operational/choice' && request.method==='POST'){
      if(url.origin!=='https://ofertismo.com.br'||request.headers.get('origin')!==url.origin||!eligibleRequest(request))return reply({ok:false},403);
      const data=await readSmallJson(request,512);
      if(!data||!['yes','no'].includes(data.choice))return reply({ok:false},400);
      ctx.waitUntil(recordStage(env,request,data.choice==='yes'?'consent_accept':'consent_decline',traffic(data.source,data.campaign,data.creative)));
      return new Response(null,{status:204,headers:{'cache-control':'no-store'}});
    }
    if(path==='/api/measurement/pageview' && request.method==='POST'){
      if(!allowed(env)||url.origin!=='https://ofertismo.com.br'||request.headers.get('origin')!==url.origin)return reply({ok:false},403);
      const length=Number(request.headers.get('content-length')||0);
      if(length>256||!request.body)return reply({ok:false},400);
      const reader=request.body.getReader();let size=0;const decoder=new TextDecoder();let ticket='';
      try{
        while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>256){await reader.cancel();return reply({ok:false},400)}ticket+=decoder.decode(value,{stream:true});}
        ticket+=decoder.decode();
      }catch{return reply({ok:false},400)}
      ctx.waitUntil(reportMeasurement(request,env,ticket,'PageView',pageDimensions(request)));
      return new Response(null,{status:204,headers:{'cache-control':'no-store'}});
    }
    if (path === '/privacidade' && request.method === 'GET') {
      return new Response(privacyHtml, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY' } });
    }
    if (path === '/admin' && request.method === 'GET') {
      return new Response(adminHtml(), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-frame-options': 'DENY', 'content-security-policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'" } });
    }
    const stub = env.ROUTER_STATE.get(env.ROUTER_STATE.idFromName('ofertismo-main'));
    if (path === '/teste-convite' && request.method === 'GET') {
      if(!isAuthorized(request,env))return reply({error:'Não encontrado.'},404);
      const preview = await stub.fetch('https://router.local/internal/current-invite');
      if (!preview.ok) return new Response('Nenhum convite disponível para testar agora.', {
        status: 503, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }
      });
      const { url: invite } = await preview.json();
      try {
        return new Response(renderInviteTest(invite), {
          headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', 'x-frame-options': 'DENY', 'x-content-type-options': 'nosniff' }
        });
      } catch {
        return new Response('Convite indisponível para o teste.', { status: 503, headers: { 'cache-control': 'no-store' } });
      }
    }
    if (path === '/api/admin/config' && (request.method === 'GET' || request.method === 'POST')) {
      if (!isAuthorized(request, env)) return reply({ error: 'Não autorizado.' }, 401);
      const internal = request.method === 'GET' ? '/internal/stats' : '/internal/config';
      return stub.fetch(`https://router.local${internal}`, { method: request.method, headers: { 'content-type': 'application/json' }, body: request.method === 'POST' ? await request.text() : undefined });
    }
    if (path === '/api/admin/reset' && request.method === 'POST') {
      if (!isAuthorized(request, env)) return reply({ error: 'Não autorizado.' }, 401);
      return stub.fetch('https://router.local/internal/reset', { method: 'POST' });
    }
    const match = path.match(/^\/(?:entrar|go)(?:\/([a-z0-9-]{1,40}))?\/?$/);
    if (match && ['GET','POST'].includes(request.method)) {
      const source=cleanSource(match[1]||url.searchParams.get('origem')||'direto');
      const post=request.method==='POST';
      if(!eligibleRequest(request))return post?reply({ok:false},403):new Response('Visualização automatizada: acesso não contabilizado.',{status:200,headers:{'cache-control':'no-store'}});
      if(post&&(url.origin!=='https://ofertismo.com.br'||request.headers.get('origin')!==url.origin))return reply({ok:false},403);
      const data=post?await readSmallJson(request,2048):{};
      if(post&&(!data||!validOperation(data.operation)))return reply({ok:false},400);
      const operation=post?data.operation:url.searchParams.get('operation');
      const dimensions=traffic(source,url.searchParams.get('utm_campaign'),url.searchParams.get('utm_content'));
      const result=await stub.fetch('https://router.local/internal/redirect',{
        method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...dimensions,operation:validOperation(operation)?operation:null,consent:consentState(request)})
      });
      if (!result.ok) {
        ctx.waitUntil(recordStage(env,request,'redirect_unavailable',dimensions));
        const msg = (await result.json()).error;
        const body = msg === 'no_groups' ? 'O grupo será disponibilizado em breve.' : 'Todos os grupos cadastrados atingiram o limite de acessos.';
        return post?reply({ok:false,error:body},503):new Response(body,{status:503,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
      }
      const {url:target}=await result.json();
      const ticket=post?data.ticket:url.searchParams.get('measurement_ticket');
      let leadEventID=null;
      if(ticket&&allowed(env)&&consentState(request)==='yes'){
        const page=await verifyTicket(ticket,env);
        if(page){
          ctx.waitUntil(reportMeasurement(request,env,ticket,'Lead',dimensions));
          if(post)leadEventID=page.id+'_Lead';
        }
      }
      if(post)return reply({ok:true,url:target,leadEventID});
      return new Response(null,{status:302,headers:{location:target,'cache-control':'no-store','referrer-policy':'no-referrer'}});
    }
    return reply({ error: 'Rota não encontrada. Use /entrar/team, /entrar/meta ou /admin.' }, 404);
  }
};