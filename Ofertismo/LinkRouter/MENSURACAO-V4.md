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

## Validação e fase 2
1. CI unitário e build de prévia. Verificar em preview mobile e desktop: layout, aceite/recusa/revogação, CTAs e UTM, sem tráfego Meta real nem contagem de produção.
2. Alinhar Lead do navegador/servidor com sucesso do redirecionamento: avaliar POST same-origin, idempotência transitória e fallback seguro. A V4 fase 1 ainda não altera essa semântica. Não deduplicar visitas por identificadores persistentes sem avaliação. 
3. Testar contrato Worker/Durable Object (incluindo falha e concorrência), confirmar que a telemetria não bloqueia CTA, reavaliar cardinalidade/retenção e configuração de novos criativos. 
4. Aprovação separada de publicação, readback, teste real consentido controlado com marcador de teste, confirmação de desduplicação e EMQ real, reversão à versão anterior em caso de regressão.
