function escaped(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function intentUrl(invite, pkg) {
  const u = new URL(invite);
  if (u.protocol !== 'https:' || u.hostname !== 'chat.whatsapp.com') return '';
  return 'intent://' + u.host + u.pathname +
    '#Intent;scheme=https;action=android.intent.action.VIEW;package=' + pkg +
    ';S.browser_fallback_url=' + encodeURIComponent(u.href) + ';end';
}
export function renderInviteTest(invite) {
  const u = new URL(invite);
  if (u.protocol !== 'https:' || u.hostname !== 'chat.whatsapp.com') {
    throw new Error('Teste suporta somente convite oficial do WhatsApp.');
  }
  const direct = escaped(u.href);
  const personal = escaped(intentUrl(u.href, 'com.whatsapp'));
  const business = escaped(intentUrl(u.href, 'com.whatsapp.w4b'));
  return `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#111015">
<title>Teste do convite oficial | Ofertismo</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#111015;color:#fff9f1;font:15px/1.55 system-ui,-apple-system,sans-serif}
main{max-width:560px;margin:0 auto;padding:40px 20px 80px}
small{font-size:12px;color:#ffcc94;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
h1{font-size:30px;line-height:1.12;letter-spacing:-.04em;margin:10px 0 12px}
p{color:#cbc4c7;margin:0 0 22px}
.box{border:1px solid #43363a;border-radius:19px;background:#1c1a20;padding:21px;margin:15px 0}
.box h2{font-size:17px;line-height:1.3;margin:0 0 9px}
.box p{font-size:13px;color:#c1b9be;margin-bottom:16px}
a.btn{display:block;padding:15px;text-align:center;text-decoration:none;border-radius:12px;color:#19130e;background:linear-gradient(110deg,#ffd45d,#ffa540);font-weight:850}
a.btn.outline{color:#fff3df;background:#34262a;border:1px solid #785748}
code{font:12px ui-monospace,monospace;color:#ffc27b;overflow-wrap:anywhere}
.note{background:#302225;border-left:3px solid #ffb34d;padding:13px 15px;border-radius:5px;color:#e1d0cc;font-size:12px}
a.back{color:#f6c893;text-decoration:none}
</style></head><body><main>
<a class="back" href="/">← Voltar à landing</a>
<p style="margin-top:28px"><small>Ofertismo • Teste separado</small></p>
<h1>Como seu celular abre o convite?</h1>
<p>Esta página mostra o convite original do WhatsApp para comparar o comportamento com o nosso redirecionador.</p>
<div class="box"><h2>1. Convite oficial (sem redirecionamento)</h2>
<p>Este botão aponta diretamente para o WhatsApp. É o teste principal para verificar se aparece a escolha de aplicativo.</p>
<a class="btn" href="${direct}">ABRIR CONVITE OFICIAL</a></div>
<div class="box"><h2>2. Escolher aplicativo no Android (experimental)</h2>
<p>Esses dois botões tentam abrir o aplicativo escolhido diretamente. Dependem do navegador; podem não funcionar dentro do Facebook ou Instagram.</p>
<a class="btn outline" href="${personal}">Abrir no WhatsApp pessoal</a>
<a class="btn outline" style="margin-top:12px" href="${business}">Abrir no WhatsApp Business</a></div>
<div class="box"><h2>Endereço original selecionado pelo LinkRouter</h2>
<code>${direct}</code></div>
<p class="note">Este é só um teste. Ele consulta o grupo da vez sem consumir o limite nem contabilizar acesso. Não use esta página em anúncios.</p>
</main></body></html>`;
}
