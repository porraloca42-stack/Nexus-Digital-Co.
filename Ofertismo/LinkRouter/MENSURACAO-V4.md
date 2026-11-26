# Mensuração V4 — desenvolvimento isolado

## Estado e limites
Esta branch não autoriza merge ou publicação. Prévia mantém META_CAPI_ENABLED=false e rotas de conversão simuladas. Os testes não enviam dados reais à Meta. Preservar pixel, campanha, layout, convites e contadores existentes. O Lead ainda representa interação CTA, não ingresso no WhatsApp.

## V4 fase 1
- Contadores próprios por dia (Brasília), origem e criativo registrado, sem armazenar URLs completas, identificadores de pessoas, cookies ou IP nos agregados. Janela móvel de 90 dias, limpeza em nova atividade; best-effort. Requisições e ações, não pessoas únicas. UTMs não provam origem paga. A contagem de recusas é apenas operacional, sem envio à Meta.
- GET da landing, escolhas explícitas, redirects OK/indisponíveis, consentimento no redirect e resultados CAPI aceitos/falhos. Painel administrativo apresenta tabela e JSON. Contadores do rotacionador preservados.
- Fallback de UTM no HTML sem JavaScript, filtro de prefetch e agentes conhecidos, rota de teste protegida.
- PageView consentido recupera fbclid real da URL pelo header de mesma origem quando necessário; não cria valor fictício. Lead sem Referer pode usar metadados de navegação same-origin mais ticket e cookie. Cobertura de fbp/fbc e retry apenas em logs sanitizados.
- Uma única tentativa extra em falha de transporte ou HTTP 500/502/503/504 sem Retry-After, mesmo payload/ID, dentro da requisição original consentida; nenhuma fila persistente. Não enviar após recusa; não reenviar 400 ou 429. Recebimento duplicado remoto precisa ser verificado na Meta.
- Texto de consentimento transparente, mesma possibilidade de recusar; não bloquear grupo. Revisar finalidade/base legal/retenção e aviso antes de produção.

## V4 fase 2
- O CTA normal usa POST same-origin com UUID aleatório de operação por página, sem usar o UUID para publicidade. O Worker confirma a reserva de um convite antes de devolver o Lead ID; o Pixel só emite Lead se ainda houver consentimento e o ID coincidir. A CAPI usa o mesmo ID, após a reserva. Não comprova abertura do WhatsApp ou ingresso.
- A reserva e os contadores históricos do rotacionador são transacionais. Repetição do mesmo UUID reutiliza a reserva por 120 s, até 256 recibos; os recibos contêm apenas UUID, horário e grupo, sem cookie, IP ou perfil. São descartados na atividade seguinte após expirar, ou em reset/configuração. Não mede pessoas únicas; acessos sem JavaScript, cliques modificados, novas páginas e operações expiradas ainda podem gerar nova reserva.
- Se POST não retornar em até 1,5 s ou falhar, o navegador navega pelo GET de contingência com o mesmo UUID; não emite Pixel Lead antecipado. O servidor pode emitir Lead consentido após resolver o convite. Sem JavaScript, o GET preserva UTMs aprovadas. Se grupo indisponível, não dispara Lead.
- Telemetria agregada best-effort fora da transação de reserva; separada por chave diária, retenção móvel de 90 dias. Cadastro único de campanhas/criativos em src/campaigns.mjs. PageView pode recuperar dimensões aprovadas sem Referer a partir de cabeçalhos first-party após consentimento.
- Alterações de privacidade e retenção sujeitas a revisão antes de produção. Revogação durante POST impede Pixel subsequente, mas não desfaz um envio CAPI já iniciado sob consentimento válido. Retry não é fila persistente. A navegação assíncrona precisa de teste em navegadores in-app reais para verificar abertura externa.
- Testes em GitHub Actions: 46/46 no commit 17c01257 (incluindo contrato Worker/Durable Object com mocks, reserva concorrente, falha e Lead pareado); prévia acessível em desktop 1536x674, aceite e recusa com IDs simulados, tracking:false e groupCounters:false; mobile 390x844 sem sobreposição/overflow, recusa e CTA simulado bem-sucedidos. Nenhum evento Meta real observado. Revalidar o head final antes de publicação.

## Gates de publicação
1. Verificar head final, CI e preview; conferir na Cloudflare build, namespace isolado, flags, domínio e versão atual de produção. API retornou 503/10001; UI exige login. Não inferir configuração administrativa da prévia apenas por seu HTML.
2. Validar navegação mobile real em Facebook/Instagram/WhatsApp, além da simulação. Revisar tratamento de dados, consentimento, textos, retenção e proteção operacional. Reavaliar definição de Lead por reserva vs adesão real; não emitir Lead artificial.
3. Autorização separada de publicação, readback de versão e rollback para versão produtiva anterior. Teste real consentido controlado, com segregação e deduplicação verificada no Events Manager. Acompanhar EMQ e membros reais.
