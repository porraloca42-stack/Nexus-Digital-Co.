function officialWhatsAppInvite(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.hostname !== 'chat.whatsapp.com' ||
        !/^\/[a-zA-Z0-9_-]{10,128}\/?$/.test(u.pathname) ||
        u.username || u.password) return null;
    return u.href;
  } catch { return null; }
}
function androidAppIntent(value, pkg) {
  const url = officialWhatsAppInvite(value);
  if (!url || !['com.whatsapp','com.whatsapp.w4b'].includes(pkg)) throw Error('Unsupported WhatsApp invitation or package.');
  const u = new URL(url);
  return 'intent://' + u.host + u.pathname + u.search +
    '#Intent;scheme=https;action=android.intent.action.VIEW;package=' + pkg +
    ';S.browser_fallback_url=' + encodeURIComponent(u.href) + ';end';
}
function esc(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
}
export function renderChooserPage(value, agent) {
  const invite = officialWhatsAppInvite(value);
  if (!invite) throw Error('This page only supports official WhatsApp group links.');
  const android = /android/i.test(agent || '');
  const direct = esc(invite);
  const options = android ? `
  <a class="button primary" href="${esc(androidAppIntent(invite,'com.whatsapp'))}" rel="noopener"><span class="symbol">◉</span><span><b>WhatsApp pessoal</b><small>Recomendado para acompanhar ofertas</small></span><span>↗</span></a>
  <a class="button secondary" href="${esc(androidAppIntent(invite,'com.whatsapp.w4b'))}" rel="noopener"><span class="symbol">▣</span><span><b>WhatsApp Business</b><small>Entrar com seu número comercial</small></span><span>↗</span></a>` : `
  <a class="button primary" href="${direct}" rel="noopener"><span class="symbol">↗</span><span><b>Abrir WhatsApp</b><small>Continuar para o convite oficial do grupo</small></span><span>↗</span></a>`;
  return `<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#0e0e13">
<title>Escolha seu WhatsApp | Ofertismo</title>
<style>
:root{color-scheme:dark;--muted:#c2b9c3;--orange:#ff7442;--gold:#ffd05c}
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 52% 0%,#68312542,transparent 61%),#0c0c12;color:#fffbf3;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{width:min(510px,calc(100% - 36px));margin:0 auto;padding:35px 0 80px}
.brand{font-weight:930;letter-spacing:-.03em;font-size:20px;text-decoration:none;display:inline-flex;align-items:center;gap:9px}
.logo{width:33px;height:33px;display:inline-grid;place-items:center;border-radius:10px;background:linear-gradient(120deg,#f05633,#f9aa40)}
.eyebrow{margin:52px 0 12px;color:#ffb787;font-weight:850;font-size:11px;letter-spacing:.13em;text-transform:uppercase;text-align:center}
h1{font-size:clamp(30px,7vw,43px);letter-spacing:-.055em;line-height:1.1;text-align:center;margin:0 0 13px}
.lead{color:var(--muted);line-height:1.65;text-align:center;margin:0 auto 28px;max-width:350px}
.panel{padding:23px;border-radius:23px;border:1px solid #ffffff24;background:linear-gradient(140deg,#201d24,#17161b);box-shadow:0 25px 55px #0007}
.button{display:flex;align-items:center;gap:13px;text-decoration:none;padding:15px 14px;border-radius:14px;min-height:72px;line-height:1.25}
.button+.button{margin-top:12px}.button span:nth-child(2){flex:1}
.button b{display:block;font-size:15px}.button small{display:block;margin-top:5px;font-size:11px;font-weight:500;opacity:.76}
.button .symbol{width:37px;height:37px;flex:none;border-radius:11px;background:#ffffff35;display:grid;place-items:center;font-size:20px;font-weight:800}
.primary{background:linear-gradient(110deg,#ffd764,#ffab40);color:#25160d;border:1px solid #ffe6a144}
.secondary{background:#36282d;color:#fff7ee;border:1px solid #76534c}
.hint{font-size:12px;color:#aaa2ad;text-align:center;margin:18px 0 0}
.safe{margin-top:18px;border:1px solid #ffffff1c;background:#18161e;border-radius:16px;padding:18px}
.safe p{font-size:12px;color:var(--muted);margin:0 0 8px}
.safe a{font-size:13px;font-weight:750;color:#ffd08d;text-underline-offset:3px;overflow-wrap:anywhere}
.foot{font-size:11px;line-height:1.65;color:#827d88;text-align:center;margin:23px 0}
a:focus-visible{outline:3px solid var(--gold);outline-offset:3px}
</style></head><body><main>
<a class="brand" href="/" aria-label="Voltar ao Ofertismo"><span class="logo">O</span> OFERTISMO.</a>
<p class="eyebrow">Acesso ao grupo VIP</p>
<h1>Escolha seu <span style="color:#ffb661">WhatsApp</span></h1>
<p class="lead">${android ? 'Selecione o aplicativo que deseja usar para entrar no grupo.' : 'Toque abaixo para abrir o convite oficial no aplicativo disponível no seu aparelho.'}</p>
<section class="panel" aria-label="Escolha de aplicativo">${options}
<p class="hint">A entrada no grupo é gratuita.</p></section>
<div class="safe"><p>Não abriu ou seu navegador não permite escolher o aplicativo?</p>
<a href="${direct}" rel="noopener">Abrir convite oficial do WhatsApp ↗</a></div>
<p class="foot">O aplicativo aberto depende das configurações e permissões do seu aparelho. Ofertismo não consegue alterar essas preferências.</p>
</main></body></html>`;
}
