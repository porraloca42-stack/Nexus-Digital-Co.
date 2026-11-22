# OFERTISMO — Link inteligente para grupos

Projeto Cloudflare Worker (plano Free) + Durable Object SQLite. Pronto para instalação, ainda **não publicado**.

## Funções

- Link fixo e atribuição por origem: `/entrar/team`, `/entrar/meta`, `/entrar/telegram`, `/entrar/direto`.
- Contador global persistente de **acessos válidos**, por grupo e origem, e estatísticas diárias no horário de São Paulo.
- Após 1.000 acessos de um grupo, o próximo acesso é direcionado automaticamente ao próximo grupo, em ordem.
- Quando todos os grupos chegam ao limite, retorna aviso e não redireciona para um grupo lotado.
- Painel protegido em `/admin`, onde se adicionam e reordenam grupos, sem expor convites no GitHub.
- Requisições de pré-visualização de robôs comuns não são contabilizadas.

## O que o contador NÃO faz

- **Não mede entradas efetivas no WhatsApp.** Um clique no convite não garante adesão. Grupos podem ficar cheios antes de 1.000 cliques, ou ter menos de 1.000 membros após 1.000 cliques.
- **Não diferencia pessoas únicas.** Vários acessos do mesmo usuário contam separadamente.
- **Não estabelece automaticamente a origem de cliques na landing ApexFlow.** Se a campanha leva à landing da ApexFlow, o botão da landing deverá apontar para uma rota do Worker. Pode ser necessário criar uma landing por origem ou ajustar o encaminhamento de parâmetros para preservar o canal. Não alterar a landing da campanha Meta atual durante a configuração.
- Não garante bloquear todo tráfego automatizado.

## Preparação de publicação (a ser finalizada)

1. Criar/entrar em conta Cloudflare Free, sem contratar plano pago.
2. Na área Workers & Pages, conectar GitHub e escolher repositório `porraloca42-stack/Nexus-Digital-Co.`. Definir **Root directory** como `Ofertismo/LinkRouter` (se o projeto estiver nesse caminho no GitHub) e **Deploy command** `npm run deploy`.
3. Conferir nome do Worker `ofertismo-link-router` e efetuar primeira implantação. O ambiente cria um endereço `*.workers.dev`.
4. Em **Worker > Settings > Variables and Secrets**, criar o segredo `ADMIN_TOKEN` com valor aleatório robusto (pelo menos 24 caracteres; preferencialmente 32 bytes gerados com segurança). **Não salvar o segredo no GitHub ou no chat.**
5. Abrir `/admin`, autenticar-se, adicionar links completos dos convites na ordem correta e salvar. Não é necessário publicar código para alterar a lista de grupos.
6. Testar `/entrar/team` com limite de teste usando grupos de teste e restaurar limite de 1.000 antes de divulgar. Os testes contam acessos reais no ambiente, portanto separar grupos de teste dos grupos definitivos.
7. Adicionar o domínio personalizado em Cloudflare, mantendo DNS e HTTPS. Pode-se utilizar o endereço `workers.dev` até obter domínio próprio.
8. Ao conectar GitHub, cada commit no ramo selecionado pode publicar automaticamente uma nova versão. Solicitar validação antes de alterar um Worker já em produção.

## Operação por canal

- Team Landers: `https://SEU-DOMINIO/entrar/team` (direto ao convite do WhatsApp).
- Telegram: `https://SEU-DOMINIO/entrar/telegram`.
- Redes sociais: `https://SEU-DOMINIO/entrar/social`.
- **Landing da ApexFlow:** continuar usando a landing atual enquanto avaliamos o funil. Para que a troca automática aconteça, o CTA dela precisa passar pelo Worker. Se quisermos preservar fonte Team Landers, o CTA deve preservar essa informação.

## Segurança

- Os grupos são salvos exclusivamente no armazenamento da Cloudflare e obtidos via `/admin` com Bearer token.
- As requisições não guardam IP, e-mail nem telefone dos visitantes.
- URLs aceitas: apenas convites HTTPS dos hosts WhatsApp e Telegram selecionados.
- O projeto nunca contém credenciais nem convites de grupo reais em GitHub público.

## Desenvolvimento local

```bash
npm install
npm test
npm run dev
```

Documentação: https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/ e https://developers.cloudflare.com/durable-objects/get-started/