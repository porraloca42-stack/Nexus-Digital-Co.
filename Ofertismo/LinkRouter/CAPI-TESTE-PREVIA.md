# CAPI — harness temporário de transporte (prévia, não produção)

Status: desativado por padrão. Esta rota não testa o Pixel real nem a deduplicação na Meta; testa somente transporte real de um evento de diagnóstico do servidor, explicitamente marcado com test_event_code. A prévia normal continua simulada.

Prévia única: https://ofertismo-capi-foundation-20261125-ofertismo-link-router.porraloca42.workers.dev
Rota: POST /__capi-test/transport. Acesso negado por padrão; não configurar em produção.

Configurar **somente na prévia individual**, nunca em main ou Previews Base:
- META_CAPI_PREVIEW_ENABLED=true (variável)
- META_CAPI_PREVIEW_AUTH (secret aleatório independente, >=32 caracteres)
- META_CAPI_PREVIEW_TOKEN (secret token dedicado ao novo dataset; não copiar para chat, logs, código ou Base)
- META_CAPI_PREVIEW_TEST_EVENT_CODE (secret, código TEST... do Gerenciador de Eventos do novo dataset)
- Confirmar binding ROUTER_STATE isolado da produção.

Enviar via cliente HTTPS autorizado, com header Authorization: Bearer [secret de teste] e Content-Type: application/json, UA real do cliente, JSON {"consent":true,"event_name":"Lead","test_id":"[UUID v4 único]"}. Ação sintética deliberada, somente em Eventos de teste. Não simular cookies, IP, membros ou compras. Um evento por nome/ID (claim isolado); após falha, usar novo UUID em teste autorizado. Não usar a autenticação de produção. Nunca colocar secrets em URLs, scripts públicos, screenshots ou chat. O retorno só mostra status Graph, events_received e ID; confirmar na aba Eventos de teste. Para testar PageView, usar event_name PageView. Não usar este endpoint para tráfego real.

Após comprovar transporte: preparar teste pareado browser + server na ferramenta Eventos de teste da Meta, com ID compartilhado. Não liberar Pixel real numa prévia pública nem alegar dedup antes da evidência. Desabilitar flag e remover secrets ao concluir. **Remover o harness e sua importação antes de merge em produção.** Alterações de dataset T03 somente após validação e autorização.

Fontes: https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/v25.0/ e https://developers.cloudflare.com/workers/previews/configuration/
