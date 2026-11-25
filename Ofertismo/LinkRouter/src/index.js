import { handleCapiPreviewTest, CAPI_PREVIEW_PATH } from './capi-preview-test.mjs';
import { DurableObject } from 'cloudflare:workers';
import { cleanSource, dateInSaoPaulo, nextClick, validateConfig, retainMetricsForGroups } from './rotation.mjs';
import { landingHtml, privacyHtml } from './landing-v3.mjs';
import { renderInviteTest } from './invite-test.mjs';
import { allowed, issueTicket, dispatchMeasurement } from './measurement.mjs';

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
    if (path === '/internal/stats') {
      const [config, metrics] = await Promise.all([
        this.ctx.storage.get('config'), this.ctx.storage.get('metrics')
      ]);
      return reply({ config: config || DEFAULT_CONFIG, metrics: metrics || DEFAULT_METRICS });
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
        await txn.put('metrics', retainMetricsForGroups(existing, config.groups));
      });
      return reply({ ok: true });
    }
    if (path === '/internal/reset' && request.method === 'POST') {
      await this.ctx.storage.put('metrics', structuredClone(DEFAULT_METRICS));
      return reply({ ok: true });
    }
    if (path === '/internal/redirect' && request.method === 'POST') {
      const { source, campaign, creative } = await request.json();
      let result;
      await this.ctx.storage.transaction(async (txn) => {
        const config = (await txn.get('config')) || DEFAULT_CONFIG;
        const metrics = (await txn.get('metrics')) || DEFAULT_METRICS;
        result = nextClick(config, metrics, cleanSource(source), dateInSaoPaulo(), campaign, creative);
        if (result.target) await txn.put('metrics', result.metrics);
      });
      if (!result.target) return reply({ error: result.reason }, 503);
      return reply({ url: result.target.url });
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
<style>body{font-family:system-ui,-apple-system,sans-serif;background:#12151b;color:#f5f5f5;max-width:840px;margin:30px auto;padding:18px}main{background:#1c2029;border:1px solid #333b4a;border-radius:16px;padding:20px}input,button{font:inherit;border-radius:8px;padding:10px;background:#292e39;color:#fff;border:1px solid #465065}button{cursor:pointer}button:hover{background:#394150}label{display:block;margin:14px 0 6px}.wide{width:96%}.row{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}.row>*{flex:1}.item{background:#202630;padding:12px;border-radius:10px;margin:8px 0}.muted{color:#aab4c4;font-size:.9em}#out{white-space:pre-wrap;overflow-wrap:anywhere}h1{font-size:1.5em}</style></head><body><main><h1>Ofertismo — Grupos</h1><p class="muted">Acessos válidos, não membros efetivos. Nenhum link é salvo no GitHub.</p><label>Chave administrativa Cloudflare</label><input id="token" class="wide" type="password" autocomplete="off" placeholder="Cole a chave configurada em Secrets"><div class="row"><button id="load">Consultar dados</button><button id="add">Adicionar grupo</button></div><label>Limite de acessos por grupo</label><input id="limit" type="number" min="1" max="1000000" value="1000"><h3>Ordem de redirecionamento</h3><div id="groups"></div><button id="save">Salvar configuração</button><h3>Estatísticas</h3><button id="reset" type="button">Zerar estatísticas</button><pre id="out" class="muted">Faça login para consultar.</pre></main>
<script>
const el = id => document.getElementById(id);
function groupRow(g={id:'',url:''}) {const block=document.createElement('div');block.className='item';const a=document.createElement('input');a.placeholder='grupo-01';a.value=g.id;a.className='wide';a.setAttribute('aria-label','Identificador');const b=document.createElement('input');b.placeholder='https://chat.whatsapp.com/...';b.value=g.url;b.className='wide';b.setAttribute('aria-label','Link do convite');const remove=document.createElement('button');remove.textContent='Remover da configuração';remove.onclick=()=>block.remove();block.append(a,b,remove);el('groups').append(block)}
async function api(method,body){const r=await fetch('/api/admin/config',{method,headers:{'authorization':'Bearer '+el('token').value,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});const data=await r.json();if(!r.ok)throw Error(data.error||'Erro '+r.status);return data}
el('add').onclick=()=>groupRow();
el('load').onclick=async()=>{try{const d=await api('GET');el('limit').value=d.config.limit;el('groups').replaceChildren();d.config.groups.forEach(groupRow);el('out').textContent=JSON.stringify(d.metrics,null,2)}catch(e){el('out').textContent=e.message}};
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    if(path===CAPI_PREVIEW_PATH) return handleCapiPreviewTest(request,env);
    const preview=url.hostname.endsWith('-ofertismo-link-router.porraloca42.workers.dev');
    if(preview&&(/^\/(entrar|go)(\/|$)/.test(path)||path==='/api/measurement/pageview')){
      return reply({ok:true,preview:true,route:path,tracking:false,groupCounters:false,utm_campaign:url.searchParams.get('utm_campaign'),utm_content:url.searchParams.get('utm_content'),eventID:url.searchParams.has('measurement_ticket')?url.searchParams.get('measurement_ticket').split('.')[0]+'_Lead':null});
    }
    if (path === '/health' && request.method === 'GET') return reply({ status: 'ok', app: 'ofertismo-router' });
    if ((path === '/' || path === '/inicio') && request.method === 'GET') {
      let ticket=null;
      if(preview)ticket=crypto.randomUUID()+'.preview';
      else if(env.META_CAPI_ENABLED==='true'){
        ticket='';
        if(url.origin==='https://ofertismo.com.br'&&allowed(env)){
          try{ticket=await issueTicket(path,env)}catch{}
        }
      }
      const html=landingHtml.replace('__OFT_MEASUREMENT_TICKET__',JSON.stringify(ticket));
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': ticket===null?'public, max-age=300':'private, no-store', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY' } });
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
      ctx.waitUntil(dispatchMeasurement(request,env,ticket,'PageView').catch(()=>{}));
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
    if (match && request.method === 'GET') {
      const source = cleanSource(match[1] || url.searchParams.get('origem') || 'direto');
      const agent = request.headers.get('user-agent') || '';
      if (/(bot|crawler|spider|preview|facebookexternalhit|curl|headless|slackbot)/i.test(agent)) {
        return new Response('Visualização automatizada: acesso não contabilizado.', { status: 200, headers: { 'cache-control': 'no-store' } });
      }
      const result = await stub.fetch('https://router.local/internal/redirect', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ source, campaign: url.searchParams.get('utm_campaign'), creative: url.searchParams.get('utm_content') })
      });
      if (!result.ok) {
        const msg = (await result.json()).error;
        const body = msg === 'no_groups' ? 'O grupo será disponibilizado em breve.' : 'Todos os grupos cadastrados atingiram o limite de acessos.';
        return new Response(body, { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
      }
      const { url: target } = await result.json();
      const ticket=url.searchParams.get('measurement_ticket');
      if(ticket&&allowed(env))ctx.waitUntil(dispatchMeasurement(request,env,ticket,'Lead').catch(()=>{}));
      return new Response(null,{status:302,headers:{location:target,'cache-control':'no-store','referrer-policy':'no-referrer'}});
    }
    return reply({ error: 'Rota não encontrada. Use /entrar/team, /entrar/meta ou /admin.' }, 404);
  }
};