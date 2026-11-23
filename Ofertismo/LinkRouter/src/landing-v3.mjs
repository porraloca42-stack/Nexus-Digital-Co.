// V3 Premium — baseada no rascunho aprovado. Mantém copy e LinkRouter existentes.
export const landingHtml = String.raw`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#08070a">
<meta name="description" content="Acesso VIP gratuito ao Ofertismo: cupons, promoções e achados selecionados diretamente no WhatsApp.">
<meta property="og:type" content="website"><meta property="og:locale" content="pt_BR"><meta property="og:site_name" content="Ofertismo">
<meta property="og:title" content="Ofertismo VIP | Pare de pagar caro. Entre para o VIP!"><meta property="og:description" content="Grupo VIP gratuito de ofertas, cupons e achados pelo WhatsApp. Acesse sem mensalidade.">
<meta name="twitter:card" content="summary"><link rel="icon" href="/logo-oft.webp" type="image/webp">
<title>Ofertismo VIP | Cupons, Ofertas e Achados no WhatsApp</title>
<style>
:root{color-scheme:dark;--ink:#09080e;--txt:#fffdf8;--secondary:#d7cfd1;--red:#ff2431;--orange:#ff700d;--amber:#ffb000;--yellow:#ffe42d;--line:rgba(255,84,45,.45)}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:#07060b;color:var(--txt);font-family:Inter,Arial,Helvetica,system-ui,sans-serif;line-height:1.45;-webkit-font-smoothing:antialiased;overflow-x:hidden}
img{display:block;max-width:100%}a{color:inherit}button{font:inherit;cursor:pointer}a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid #ffe355;outline-offset:4px}
.skip{position:absolute;top:-80px;left:14px;z-index:100;padding:12px;background:#ffb521;color:black;border-radius:6px}.skip:focus{top:12px}
.shell{width:min(1150px,calc(100% - 42px));margin:0 auto}
.v3-top{position:relative;isolation:isolate;overflow:hidden;background:radial-gradient(ellipse at 91% 44%,rgba(227,32,14,.21),transparent 43%),radial-gradient(ellipse at 3% 80%,rgba(171,12,26,.12),transparent 39%),#07060b}
.v3-top::before{content:"";position:absolute;inset:14% -30% 2%;z-index:-1;background:linear-gradient(145deg,transparent 29%,rgba(255,17,15,.12) 30%,transparent 31%),linear-gradient(152deg,transparent 43%,rgba(255,102,15,.18) 43.2%,transparent 43.9%),linear-gradient(20deg,transparent 67%,rgba(255,30,14,.22) 67.2%,transparent 67.9%);pointer-events:none}
.site-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:17px 0 15px}
.brand{display:inline-flex;align-items:center;gap:16px;text-decoration:none;min-width:0}
.brand-logo{width:72px;height:72px;object-fit:contain;flex:none;filter:drop-shadow(0 2px 12px rgba(255,80,20,.25))}
.brand-line{width:2px;height:58px;background:linear-gradient(to bottom,transparent,#fafafa 17%,#fff 82%,transparent);opacity:.65;flex:none}
.brand-title{font-size:clamp(25px,4.4vw,46px);font-weight:1000;font-style:italic;letter-spacing:-.065em;line-height:1;white-space:nowrap}
.brand-tag{display:block;color:#e9e1e4;font-size:clamp(7px,1.32vw,13px);font-weight:800;letter-spacing:.18em;line-height:1.5;margin-top:5px;white-space:nowrap}
.nav-wrap{position:relative}
.menu-btn{background:transparent;border:0;display:grid;place-items:center;gap:5px;padding:10px;min-width:44px;min-height:44px}
.menu-btn span{width:29px;height:3px;border-radius:4px;background:#fff;box-shadow:0 1px 3px #000;display:block}
.menu{position:absolute;z-index:30;right:0;top:53px;width:220px;max-width:calc(100vw - 40px);padding:9px;border:1px solid var(--line);border-radius:13px;background:#1d1015;box-shadow:0 12px 42px rgba(0,0,0,.7)}
.menu[hidden]{display:none}.menu a{display:block;text-decoration:none;padding:12px 13px;font-weight:750;border-radius:7px;font-size:14px}.menu a:hover{background:#4e2226}
.vip-kicker{width:min(940px,100%);margin:0 auto;display:block;text-align:center;border-radius:99px;padding:11px 16px;border:2px solid #ff4b1c;background:linear-gradient(95deg,#200d0f,#35130f 35%,#320f0b 70%,#200d0e);box-shadow:inset 0 0 9px #ff2d2675,0 0 17px #e62a1444,0 3px 21px #000;font-size:clamp(12px,2.8vw,22px);font-weight:950;line-height:1.15;letter-spacing:.01em}
.hero-scene{position:relative;min-height:670px;padding-top:50px;isolation:isolate}
.hero-scene::after{content:"";position:absolute;z-index:-1;right:-14%;top:37%;width:70%;height:62%;background:radial-gradient(ellipse,#ff57121d,transparent 71%);filter:blur(22px);pointer-events:none}
.hero-copy{position:relative;z-index:2;width:52%;max-width:600px;pointer-events:none}
h1{margin:0;font-size:clamp(49px,5vw,73px);font-style:italic;line-height:.98;letter-spacing:-.058em;font-weight:1000;text-shadow:0 2px 3px #000,0 3px 14px #000}
h1 .white,h1 .warm{display:block}
h1 .warm{margin-top:5px;color:#ffce18;text-shadow:0 3px 2px rgba(255,50,0,.36),0 0 12px rgba(248,48,0,.2)}
.title-line{display:block}
.hero-hook{position:relative;margin:38px 0 0;padding:0 0 0 24px;font-size:clamp(22px,2.4vw,27px);line-height:1.32;font-weight:700;letter-spacing:-.028em;max-width:490px;text-shadow:0 2px 8px rgba(0,0,0,.82)}
.hero-hook:before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;border-radius:5px;background:#ff2130}
.hero-hook strong{color:#ffe130;font-weight:950}
.hero-phone{position:absolute;z-index:1;width:min(60%,600px);height:auto;right:-7%;top:14px;filter:drop-shadow(0 6px 13px rgba(0,0,0,.7)) drop-shadow(0 0 21px rgba(242,53,15,.32));pointer-events:none}
.hero-ring{position:absolute;z-index:0;bottom:12%;right:-2%;width:58%;height:10%;border:3px solid rgba(255,95,5,.35);border-radius:50%;box-shadow:0 0 28px #ff510a65,0 0 30px #e700202c;transform:rotate(-7deg);filter:blur(2px)}
.hero-meta{position:absolute;bottom:9px;right:2%;font-size:11px;color:#c9bac1;opacity:.8;text-align:right;z-index:2;text-shadow:0 1px 3px #000;max-width:44%}
.hero-cta-zone{position:relative;z-index:4;margin-top:6px;padding:8px 5px 10px;isolation:isolate}
.hero-cta-zone::before{content:"";position:absolute;z-index:-1;inset:8% -8% -31%;border-radius:45%;border-bottom:2px solid rgba(255,12,28,.6);box-shadow:0 20px 40px rgba(255,9,35,.17);pointer-events:none}
.cta{display:flex;justify-content:center;align-items:center;gap:22px;width:min(820px,100%);min-height:112px;margin:0 auto;padding:18px 25px;border:2px solid #ff8e19;border-radius:100px;background:linear-gradient(170deg,#ff9b12 0%,#ff520b 25%,#fb1b00 60%,#e90020 100%);box-shadow:inset 0 4px 8px rgba(255,240,83,.55),inset 0 -5px 14px rgba(99,0,0,.4),0 0 20px rgba(255,70,0,.45),0 11px 20px rgba(174,0,0,.36);color:white;text-decoration:none;text-shadow:0 3px 4px #8d0808;font-weight:1000;font-size:clamp(22px,3.55vw,35px);line-height:1.04;letter-spacing:-.032em;text-align:center;transition:transform .18s ease,filter .18s ease;cursor:pointer}
.cta:hover{transform:translateY(-2px);filter:brightness(1.07)}
.cta .cta-icon{display:grid;place-items:center;flex:none;width:72px;height:72px;background:radial-gradient(circle at 40% 38%,#19ed44,#008b29);border:4px solid white;border-radius:50%;box-shadow:0 2px 6px #a21406aa;text-shadow:none;font-size:33px;font-weight:900}
.cta-icon svg{width:43px;height:43px;fill:#fff}
.cta-divider{height:63px;width:2px;background:rgba(255,255,255,.65)}
.cta-arrow{display:grid;place-items:center;font-size:50px;line-height:1;font-weight:400;padding-left:8px}
.trust-line{display:flex;align-items:center;justify-content:center;gap:12px;margin:15px auto 0;flex-wrap:wrap;text-align:center;font-weight:800;font-size:clamp(12px,1.55vw,17px);color:#efe8e8;text-shadow:0 2px 5px #000}
.trust-line i{width:7px;height:7px;background:#ffd133;border-radius:50%;display:inline-block;flex:none}
.benefits{position:relative;background:radial-gradient(ellipse at 50% 68%,rgba(176,0,17,.11),transparent 65%),#09070b;padding:66px 0 83px;border-bottom:2px solid rgba(255,30,45,.45)}
.benefits::before{content:"";position:absolute;inset:-15px 0 auto;height:20px;border-top:2px solid #fd1829;border-radius:50%;box-shadow:0 -9px 18px #f6002133}
.section-title{font-size:clamp(29px,4.1vw,47px);font-weight:1000;line-height:1.08;letter-spacing:-.045em;text-align:center;margin:0 0 36px;text-shadow:0 1px 5px #000}
.section-title em{font-style:normal;color:#ffba16}
.benefit-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.benefit{min-width:0;border:2px solid #e72133;border-radius:28px;background:linear-gradient(140deg,rgba(99,7,20,.50),rgba(31,9,13,.7));box-shadow:inset 0 0 20px rgba(255,45,25,.14),0 0 14px rgba(255,40,20,.34),0 12px 25px rgba(0,0,0,.4);padding:26px 13px 22px;text-align:center}
.benefit svg{display:block;margin:0 auto 9px;width:60px;height:60px;fill:none;stroke:#ffd26d;stroke-width:1.85;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 5px rgba(255,94,0,.6))}
.benefit:first-child svg{stroke:#fff}.benefit:nth-child(2) svg{stroke:#eee}.benefit h3{font-weight:950;line-height:1.04;font-size:clamp(18px,2.6vw,27px);margin:0;letter-spacing:-.045em}
.next-area{background:radial-gradient(ellipse at 13% 10%,rgba(250,27,45,.13),transparent 60%),linear-gradient(110deg,#300914,#390912 55%,#210712);border-top:2px solid #ff3751;padding:70px 0}
.section-flag{display:flex;align-items:center;justify-content:center;gap:23px;text-align:left}
.section-flag svg{width:88px;height:88px;flex:none;stroke:#fefefe;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.section-flag h2{font-size:clamp(30px,3.7vw,45px);font-weight:1000;line-height:1.11;letter-spacing:-.045em;margin:0}.section-flag h2 span{color:#ffad19}
.steps{margin-top:50px;display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.step{background:#160b11;border:1px solid rgba(255,110,37,.36);border-radius:17px;padding:25px 24px;box-shadow:0 12px 26px rgba(0,0,0,.2)}
.step b{font-size:31px;color:#ffbc2b}.step h3{font-size:19px;line-height:1.2;margin:10px 0 7px}.step p{font-size:14px;line-height:1.6;color:#e6dce0;margin:0}
.faq-zone{padding:81px 0 38px;background:#0b090e}
.faq-list{max-width:830px;margin:auto;display:grid;gap:12px}
details{border:1px solid rgba(255,133,63,.31);border-radius:13px;background:#1b1319;overflow:hidden}
summary{font-weight:830;font-size:16px;padding:18px 21px;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;list-style:none}
summary::-webkit-details-marker{display:none}summary:after{content:"+";color:#ffbd46;font-size:23px;line-height:1}details[open] summary:after{content:"−"}
details p{margin:0;padding:0 21px 22px;color:#d5cbd0;line-height:1.6;font-size:14px}
.end-cta{background:radial-gradient(ellipse at 50% 50%,rgba(255,30,17,.16),transparent 70%);padding:50px 0 74px;text-align:center}
.end-cta h2{font-size:clamp(27px,4.1vw,46px);font-weight:1000;line-height:1.15;margin:0 auto 26px;max-width:760px}
.end-cta h2 strong{color:#ffcb22}
.end-cta .cta{max-width:720px;min-height:85px;font-size:clamp(22px,3vw,29px)}.end-cta .cta-icon{width:57px;height:57px}.end-cta .cta-icon svg{width:34px;height:34px}.end-cta .cta-divider{height:46px}
.footer{border-top:1px solid rgba(255,81,43,.32);padding:25px 0 98px;font-size:12px;color:#b0a6ae;background:#07060b}
.footer-inner{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}.footer a{color:#e9c4a4}
.sticky{display:none}
@media(max-width:900px){.hero-scene{min-height:570px}.hero-phone{width:61%;right:-12%;top:38px}.hero-hook{max-width:50%;font-size:clamp(17px,3vw,24px)}h1{font-size:clamp(39px,6vw,58px)}.brand-logo{width:60px;height:60px}.brand-line{height:43px}.brand{gap:12px}.brand-title{font-size:clamp(24px,4.8vw,38px)}}
@media(max-width:640px){
 .shell{width:calc(100% - 34px)}.site-head{padding:5px 0 10px}.brand-logo{width:60px;height:60px}.brand-line{height:44px;width:1px}.brand-title{font-size:clamp(23px,7vw,32px)}.brand-tag{font-size:clamp(6px,1.7vw,10px);letter-spacing:.1em}.brand{gap:9px}.menu-btn{min-width:39px;padding:4px}.menu-btn span{width:25px;height:3px}.menu{top:43px}
 .vip-kicker{font-size:clamp(11px,2.8vw,14px);padding:8px 9px;border-width:2px}
 .hero-scene{min-height:clamp(342px,86vw,435px);padding-top:24px}
 .hero-copy{width:58%}h1{font-size:clamp(29px,7.35vw,39px);line-height:.98;letter-spacing:-.063em}.title-line{white-space:nowrap}
 .hero-hook{margin-top:23px;padding-left:10px;font-size:clamp(12px,3.25vw,17px);line-height:1.30;letter-spacing:-.025em;max-width:96%;font-weight:700}.hero-hook:before{width:3px}
 .hero-phone{top:3px;right:-7.5%;width:64%;max-width:none}.hero-ring{right:-7%;bottom:4%;width:69%;height:8%}
 .hero-meta{font-size:7px;max-width:48%;bottom:0;right:0;line-height:1.3}
 .hero-cta-zone{margin-top:4px;padding:5px 0 9px}
 .cta{width:100%;min-height:69px;gap:10px;padding:10px 16px;border-width:1.5px;font-size:clamp(18px,5vw,24px);box-shadow:inset 0 2px 6px rgba(255,240,83,.55),0 0 18px rgba(255,70,0,.50),0 5px 10px rgba(174,0,0,.30)}
 .cta .cta-icon{width:47px;height:47px;border-width:3px}.cta-icon svg{width:30px;height:30px}.cta-divider{height:41px;width:1px}.cta-arrow{font-size:33px;padding-left:0}
 .trust-line{font-size:clamp(10px,2.9vw,13px);gap:8px;margin-top:14px;white-space:nowrap}.trust-line i{width:5px;height:5px}
 .benefits{padding:38px 0 48px}.section-title{font-size:clamp(23px,6vw,32px);margin-bottom:23px}.benefit-grid{gap:8px}.benefit{padding:16px 5px 18px;border-radius:18px;border-width:1.5px}.benefit svg{width:40px;height:40px;margin-bottom:9px}.benefit h3{font-size:clamp(13px,3.7vw,17px)}
 .next-area{padding:41px 0 50px}.section-flag{gap:12px}.section-flag svg{width:52px;height:52px}.section-flag h2{font-size:clamp(24px,6.4vw,33px)}.steps{grid-template-columns:1fr;gap:12px;margin-top:28px}.step{padding:19px}.step b{font-size:26px}.step h3{font-size:17px;margin:5px 0}.step p{font-size:14px}
 .faq-zone{padding:55px 0 30px}.faq-list{gap:10px}summary{font-size:14px;padding:16px}.end-cta{padding:32px 0 48px}.end-cta h2{font-size:28px}.end-cta .cta{font-size:19px;min-height:70px}.end-cta .cta-icon{width:43px;height:43px}.end-cta .cta-icon svg{width:27px;height:27px}.end-cta .cta-divider{height:38px}
 .footer{padding-bottom:95px}.sticky{display:block;position:fixed;bottom:0;left:0;right:0;z-index:55;padding:10px 14px calc(10px + env(safe-area-inset-bottom));border-top:1px solid rgba(255,96,47,.45);background:rgba(7,6,11,.96);backdrop-filter:blur(12px);transform:translateY(110%);opacity:0;pointer-events:none;transition:transform .25s,opacity .25s}.sticky.active{transform:translateY(0);opacity:1;pointer-events:auto}.sticky .cta{min-height:48px;font-size:15px;padding:9px;gap:10px}.sticky .cta-icon{width:32px;height:32px;border-width:2px}.sticky .cta-icon svg{width:18px;height:18px}.sticky .cta-divider{height:27px}.sticky .cta-arrow{font-size:23px}
}
@media(max-width:365px){.hero-scene{min-height:335px}.hero-copy{width:59%}h1{font-size:clamp(27px,7.3vw,29px)}.hero-hook{font-size:12px;margin-top:20px}.hero-phone{width:67%;right:-9%}.vip-kicker{letter-spacing:-.02em}.cta{font-size:18px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{transition:none!important;animation:none!important}}
</style>
</head><body>
<a class="skip" href="#conteudo">Ir para o conteúdo</a>
<main id="conteudo"><div class="v3-top">
<header class="site-head shell">
 <a class="brand" href="/" aria-label="Ofertismo — página inicial">
  <img class="brand-logo" src="/logo-oft.webp" width="192" height="192" alt="Logo oficial OFT, carrinho de ofertas">
  <span class="brand-line" aria-hidden="true"></span>
  <span><span class="brand-title">OFERTISMO</span><span class="brand-tag">OFERTAS • CUPONS • ACHADOS</span></span>
 </a>
 <div class="nav-wrap"><button id="menu-toggle" class="menu-btn" aria-label="Abrir menu" aria-expanded="false" aria-controls="navigation"><span></span><span></span><span></span></button>
 <nav id="navigation" class="menu" aria-label="Navegação principal" hidden><a href="#beneficios">Benefícios do VIP</a><a href="#como-funciona">Como funciona</a><a href="#perguntas">Dúvidas frequentes</a><a href="#participar">Entrar no grupo</a></nav></div>
</header>
<div class="shell">
 <div class="vip-kicker">ACESSO LIBERADO • GRUPO VIP GRATUITO</div>
 <section class="hero-scene" aria-label="Convite ao Ofertismo VIP">
   <div class="hero-copy"><h1><span class="white"><span class="title-line">PARE DE</span><span class="title-line">PAGAR CARO.</span></span><span class="warm"><span class="title-line">ENTRE PARA</span><span class="title-line">O VIP!</span></span></h1>
    <p class="hero-hook">Imagine comprar um produto hoje e descobrir amanhã que poderia ter pago <strong>até 50% menos</strong> numa oferta relâmpago ou bug de preço!</p>
   </div>
   <div class="hero-ring" aria-hidden="true"></div>
   <img class="hero-phone" src="/celular-ofertas.webp" alt="Ilustração de uma mão segurando celular com exemplo de grupo de ofertas, produtos e preços promocionais fictícios" width="400" height="585" fetchpriority="high">
   <span class="hero-meta">Ofertas exibidas no celular são ilustrativas, não estão disponíveis para compra.</span>
 </section>
 <div class="hero-cta-zone"><a class="cta join-cta" id="hero-cta" href="/entrar/direto" aria-label="Entrar grátis no grupo VIP do Ofertismo pelo WhatsApp">
 <span class="cta-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.2-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-3.7 15.1l-.4-.2-2.7.7.7-2.6-.2-.4A8 8 0 0 1 12 4zm-3.4 3.5c-.5 0-.8.3-1 1-.2.6-.2 1.4.2 2.3.9 2.1 3 4.4 5.6 5.4.9.3 1.6.3 2.1.1.7-.3 1.2-1.2 1.2-1.7 0-.3-.1-.4-.4-.5l-2-.9c-.3-.1-.5-.1-.7.2l-.8 1c-.2.2-.3.3-.6.1-1.3-.7-2.3-1.7-3-3-.2-.3-.1-.4.1-.6l.7-.8c.2-.2.3-.4.2-.7l-.9-2.1c-.2-.4-.3-.5-.7-.5z"/></svg></span>
 <span class="cta-divider" aria-hidden="true"></span><span>ENTRAR GRÁTIS<br>NO GRUPO VIP</span><span class="cta-arrow" aria-hidden="true">›</span></a>
 <p class="trust-line"><span>100% gratuito</span><i></i><span>Sem mensalidade</span><i></i><span>Saia quando quiser</span></p></div>
</div></div>
<section class="benefits" id="beneficios"><div class="shell">
 <h2 class="section-title">POR QUE ENTRAR NO<br><em>OFERTISMO VIP?</em></h2>
 <div class="benefit-grid">
  <article class="benefit"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 18h48v10c-6 0-8 4-8 6s2 6 8 6v10H8V40c6 0 8-4 8-6s-2-6-8-6V18Z"/><path d="M25 37 39 25M25 26h.1M39 37h.1"/></svg><h3>Cupons<br>especiais</h3></article>
  <article class="benefit"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="m8 19 24-12 24 12-24 12L8 19Zm0 0v27l24 13 24-13V19M32 31v28M20 13l24 12"/></svg><h3>Achados<br>imperdíveis</h3></article>
  <article class="benefit"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 18 17 42l15-12 15 12 11-24-17 8-9-17-9 17-17-8Zm11 28h30v7H17v-7Z"/></svg><h3>Seleção<br>VIP</h3></article>
 </div>
</div></section>
<section class="next-area" id="como-funciona"><div class="shell">
 <div class="section-flag"><svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="4" width="33" height="56" rx="5"/><path d="M20 11h13M20 54h13M24 27v14l8-7-8-7m10-9 8 10m-8 0h12"/></svg><h2>COMO APROVEITAR<br><span>AS OFERTAS?</span></h2></div>
 <div class="steps">
  <article class="step"><b>01</b><h3>Entre gratuitamente</h3><p>Toque no botão e acesse nosso grupo VIP.</p></article>
  <article class="step"><b>02</b><h3>Acompanhe as oportunidades</h3><p>Receba cupons, descontos e achados diretamente no WhatsApp.</p></article>
  <article class="step"><b>03</b><h3>Aproveite seus favoritos</h3><p>Confira as condições na loja e aproveite as ofertas que fizerem sentido para você.</p></article>
 </div></div></section>
<section class="faq-zone" id="perguntas"><div class="shell"><h2 class="section-title">AINDA TEM <em>DÚVIDAS?</em></h2><div class="faq-list">
 <details><summary>Preciso pagar para entrar?</summary><p>Não! O acesso ao grupo VIP do Ofertismo é totalmente gratuito.</p></details>
 <details><summary>Que tipo de ofertas vou encontrar?</summary><p>Cupons, promoções, achados e oportunidades de diferentes tipos de produtos.</p></details>
 <details><summary>Sou obrigado a comprar alguma coisa?</summary><p>Não! Você acompanha as oportunidades e aproveita apenas o que quiser.</p></details>
 <details><summary>Posso sair do grupo quando quiser?</summary><p>Sim. É possível sair a qualquer momento nas opções do próprio WhatsApp.</p></details>
</div></div></section>
<section class="end-cta" id="participar"><div class="shell"><h2>NÃO PERCA O PRÓXIMO ACHADO!<br><strong>ENTRE GRÁTIS NO GRUPO VIP.</strong></h2>
<a class="cta join-cta" href="/entrar/direto"><span class="cta-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.2-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-3.7 15.1l-.4-.2-2.7.7.7-2.6-.2-.4A8 8 0 0 1 12 4zm-3.4 3.5c-.5 0-.8.3-1 1-.2.6-.2 1.4.2 2.3.9 2.1 3 4.4 5.6 5.4.9.3 1.6.3 2.1.1.7-.3 1.2-1.2 1.2-1.7 0-.3-.1-.4-.4-.5l-2-.9c-.3-.1-.5-.1-.7.2l-.8 1c-.2.2-.3.3-.6.1-1.3-.7-2.3-1.7-3-3-.2-.3-.1-.4.1-.6l.7-.8c.2-.2.3-.4.2-.7l-.9-2.1c-.2-.4-.3-.5-.7-.5z"/></svg></span><span class="cta-divider" aria-hidden="true"></span><span>ENTRAR GRÁTIS<br>NO GRUPO VIP</span><span class="cta-arrow" aria-hidden="true">›</span></a></div></section>
</main>
<footer class="footer"><div class="shell footer-inner"><span>© Ofertismo • Ofertas, Descontos e Cupons.</span><span>Exemplos visuais não representam ofertas reais. Preços e disponibilidade devem ser confirmados na loja. <a href="/privacidade">Privacidade</a></span></div></footer>
<div class="sticky" id="sticky"><a class="cta join-cta" href="/entrar/direto"><span class="cta-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.2-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-3.7 15.1l-.4-.2-2.7.7.7-2.6-.2-.4A8 8 0 0 1 12 4z"/></svg></span><span class="cta-divider" aria-hidden="true"></span><span>ENTRAR GRÁTIS NO GRUPO VIP</span><span class="cta-arrow" aria-hidden="true">›</span></a></div>
<script>
(function(){
 var menu=document.getElementById('menu-toggle'),nav=document.getElementById('navigation');
 function closeMenu(){nav.hidden=true;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menu')}
 menu.addEventListener('click',function(){var open=menu.getAttribute('aria-expanded')!=='true';nav.hidden=!open;menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Fechar menu':'Abrir menu')});
 nav.querySelectorAll('a').forEach(function(a){a.addEventListener('click',closeMenu)});
 document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenu()});
 document.addEventListener('click',function(e){if(!e.target.closest('.nav-wrap'))closeMenu()});
 var p=new URLSearchParams(location.search),origin=(p.get('origem')||p.get('utm_source')||'').toLowerCase().trim(),source='direto';
 if(['meta','facebook','instagram','fb','ig','metaads'].includes(origin)||(!origin&&p.has('fbclid')))source='meta';
 else if(['team','teamlanders','team-landers'].includes(origin))source='team';
 else if(['telegram','tg'].includes(origin))source='telegram';
 else if(['social','tiktok','youtube'].includes(origin))source='social';
 document.querySelectorAll('.join-cta').forEach(function(a){a.href='/entrar/'+source});
 var sticky=document.getElementById('sticky'),heroCTA=document.getElementById('hero-cta');
 if('IntersectionObserver' in window){new IntersectionObserver(function(entries){sticky.classList.toggle('active',!entries[0].isIntersecting)},{threshold:0}).observe(heroCTA)}
 else{function sync(){sticky.classList.toggle('active',scrollY>800)}window.addEventListener('scroll',sync,{passive:true});sync()}
 if(location.hostname==='localhost')return;
 !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
 fbq('init','2468079523719290');fbq('track','PageView');
 document.querySelectorAll('.join-cta').forEach(function(a){a.addEventListener('click',function(){if(window.fbq)fbq('track','Lead')})});
})();
</script>
</body></html>`;
export { privacyHtml } from './landing.mjs';