// Temporary diagnostic page, preview only. No tracking until deliberate consent and successful authorization.
export function dedupPage(){
return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ofertismo — diagnóstico de deduplicação</title><style>body{font:16px system-ui,sans-serif;background:#111;color:#eee;margin:0;padding:28px}main{max-width:540px;margin:40px auto;background:#222;border:1px solid #444;border-radius:16px;padding:24px}h1{font-size:24px}label{display:block;margin:20px 0}input[type=password]{box-sizing:border-box;width:100%;padding:12px;margin-top:8px;font-size:16px;border-radius:8px}button{padding:14px 18px;font-weight:700;border:0;border-radius:8px;background:#ff762e;color:#111;cursor:pointer}button:disabled{opacity:.5}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#111;padding:12px;border-radius:8px}</style></head><body><main><h1>Teste de deduplicação</h1><p>Prévia isolada do Ofertismo. Envia um evento de diagnóstico pelo servidor e pelo Pixel, com o mesmo identificador. Não envia Lead nem abre grupos.</p><form id="test" autocomplete="off"><label>Senha temporária da prévia<input id="auth" type="password" required minlength="32" autocomplete="off"></label><label><input id="consent" type="checkbox" required> Autorizo o envio do meu IP, informações do navegador e identificadores do Pixel à Meta somente neste teste.</label><button id="run" type="submit">Executar um teste pareado</button></form><pre id="out" aria-live="polite">Nenhum evento enviado.</pre><p>O recebimento e a deduplicação precisam ser conferidos no Gerenciador de Eventos.</p></main><script>
const form=document.getElementById('test'),out=document.getElementById('out'),button=document.getElementById('run'),auth=document.getElementById('auth');
form.addEventListener('submit',async function(e){
 e.preventDefault();
 if(button.disabled||!document.getElementById('consent').checked)return;
 button.disabled=true;
 let key=auth.value;auth.value='';
 const id=crypto.randomUUID();
 out.textContent='Enviando diagnóstico do servidor...';
 try{
  const response=await fetch(location.pathname,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+key},body:JSON.stringify({consent:true,event_name:'OfertismoCapiDiagnostic',test_id:id}),cache:'no-store',credentials:'same-origin'});
  key='';
  const result=await response.json();
  out.textContent=JSON.stringify(result,null,2);
  if(!response.ok||!result.ok||result.events_received!==1||result.event_id!==id+'_OfertismoCapiDiagnostic'||result.dataset!=='29104010142601422')return;
  if(!document.getElementById('consent').checked){out.textContent+='\\nConsentimento revogado antes do Pixel.';return;}
  const fbq=window.fbq=function(){fbq.callMethod?fbq.callMethod.apply(fbq,arguments):fbq.queue.push(arguments)};
  window._fbq=fbq;fbq.push=fbq;fbq.loaded=true;fbq.version='2.0';fbq.queue=[];
  const script=document.createElement('script');script.async=true;script.src='https://connect.facebook.net/en_US/fbevents.js';
  script.onerror=()=>{out.textContent+='\\nPixel: falha ao carregar script; não confirmado.'};
  script.onload=()=>{
   if(!document.getElementById('consent').checked){out.textContent+='\\nPixel cancelado antes do envio.';return;}
   fbq('set','autoConfig',false,'29104010142601422');
   fbq('init','29104010142601422');
   fbq('trackCustom','OfertismoCapiDiagnostic',{}, {eventID:result.event_id});
   out.textContent+='\\nPixel: chamada emitida com o mesmo eventID. Confirme recepção e deduplicação na Meta.';
  };
  document.head.appendChild(script);
 }catch{out.textContent='Falha de comunicação. Não há confirmação de envio pelo Pixel.'}
 finally{key='';auth.value='';}
});
document.getElementById('consent').addEventListener('change',e=>{if(!e.target.checked&&window.fbq)window.fbq('consent','revoke')});
</script></body></html>`,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, nofollow','x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; script-src 'unsafe-inline' https://connect.facebook.net; style-src 'unsafe-inline'; connect-src 'self' https://*.facebook.com https://connect.facebook.net; img-src https://*.facebook.com https://connect.facebook.net; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
}
