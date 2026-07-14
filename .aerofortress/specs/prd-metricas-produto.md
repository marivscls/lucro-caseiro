# PRD — Métricas de instalação, ativação e retenção

**Status:** implementado no código; depende da aplicação da migration e do deploy da API/app
**Data:** 2026-07-13
**Responsável:** Lucro Caseiro

## Problema

O Lucro Caseiro está publicado, mas não possui uma base própria e verificável para responder:

- quantas instalações realmente abriram o aplicativo;
- quantas pessoas chegaram ao primeiro valor entregue pelo produto;
- quantas voltaram depois do primeiro uso.

Sem essas medidas, downloads, cadastros e assinaturas ficam desconectados e decisões de produto
dependem de percepção isolada.

## Objetivo

Registrar um funil mínimo e confiável, sem SDK analítico externo e sem coletar dados pessoais
desnecessários:

1. instalação observada;
2. cadastro vinculado à instalação;
3. ativação do usuário;
4. atividade diária e retenção D1, D7 e D30.

## Definições canônicas

| Métrica              | Definição                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instalação observada | Primeiro `open` recebido pelo backend para um identificador persistente da instalação. Reinstalar/limpar dados cria uma nova instalação. Não equivale ao download informado pela Google Play. |
| Cadastro             | Linha criada em `users`. A instalação é vinculada ao usuário no primeiro `open` autenticado.                                                                                                  |
| Ativação             | Primeira precificação concluída, venda não cancelada ou encomenda não cancelada.                                                                                                              |
| Ativação em 7 dias   | Usuário ativado até 7 dias após `users.created_at`. O denominador inclui apenas cadastros com pelo menos 7 dias de maturação.                                                                 |
| Dia ativo            | Uma instalação que abriu o app ao menos uma vez no dia UTC; múltiplas aberturas no mesmo dia contam uma vez.                                                                                  |
| Retenção D1/D7/D30   | Instalação que esteve ativa exatamente 1, 7 ou 30 dias após a data da primeira abertura. O denominador inclui somente coortes maduras para cada janela.                                       |

## Escopo funcional

### Aplicativo

- Criar e persistir localmente um UUID de instalação.
- Enviar abertura anônima antes do login.
- Vincular a instalação ao usuário quando houver sessão autenticada.
- Registrar nova atividade ao voltar ao app, com deduplicação diária no servidor.
- Nunca bloquear boot, login ou navegação se a telemetria falhar.

### Backend e banco

- Manter uma linha por instalação com primeira/última abertura, plataforma e versão.
- Manter no máximo uma linha de atividade por instalação/dia.
- Manter vínculo muitos-para-muitos entre instalações e contas, sem reatribuir histórico quando a
  pessoa troca de conta no mesmo aparelho.
- Derivar ativação das tabelas canônicas; não duplicar eventos de precificação, venda ou encomenda.
- Disponibilizar relatório operacional por comando, usando acesso direto e autorizado ao banco.

## Relatório mínimo

O comando `pnpm analytics:report` deve informar:

- instalações totais, nos últimos 7 dias e nos últimos 30 dias;
- instalações vinculadas a um usuário;
- cadastros totais e nos últimos 30 dias;
- usuários ativados e taxa de ativação em até 7 dias;
- instalações e usuários ativos em 1, 7 e 30 dias;
- retenção D1, D7 e D30, com numerador, denominador e percentual.

## Privacidade e segurança

- Não persistir nome, e-mail, telefone, IP, modelo do aparelho, Advertising ID ou conteúdo criado.
- O identificador local representa a instalação, não a identidade civil da pessoa.
- As tabelas analíticas ficam com RLS habilitado e sem acesso para `anon`/`authenticated` via
  PostgREST; somente a API com conexão de banco e operadores autorizados consultam os dados.
- O endpoint anônimo aceita somente UUID, plataforma e versão/build com tamanho limitado.
- A coleta é best effort: falha silenciosa no cliente e nova tentativa na próxima abertura.

## Fora de escopo

- Painel administrativo dentro do aplicativo.
- Atribuição de campanha, UTM, origem da Play Store ou custo de aquisição.
- Crash reporting, replay de sessão e rastreamento de telas/cliques.
- Plataforma genérica de eventos ou integração imediata com PostHog/Firebase/Amplitude.
- Metas numéricas antes de existir uma linha de base confiável.

## Critérios de aceite

- [x] O mesmo aparelho mantém o identificador entre aberturas e atualizações.
- [x] Uma abertura sem login cria/atualiza a instalação sem expor dados pessoais.
- [x] Uma abertura autenticada vincula instalação e histórico diário ao usuário.
- [x] Duas ou mais aberturas no mesmo dia geram um único dia ativo.
- [x] Ativação é derivada de precificação, venda ou encomenda já persistida.
- [x] O cliente continua funcionando se o endpoint analítico estiver indisponível.
- [x] Existe um comando reproduzível para consultar o funil e a retenção.
- [x] Há testes para identidade persistente e regra de data diária enviada ao repositório.
- [x] Política de privacidade e orientação de Data Safety refletem a nova coleta.

## Implantação

1. Aplicar `034_product_analytics.sql` no Supabase.
2. Publicar a API com `/api/v1/analytics/open` e `/api/v1/analytics/identify`.
3. Gerar uma atualização do app com a instrumentação.
4. Após 7 dias, registrar a primeira linha de base de ativação e D1/D7.
5. Após 30 dias, registrar a primeira linha de base de D30 e decidir metas.

## Riscos e mitigação

- **Diferença para a Play Store:** o relatório mede instalações que abriram e alcançaram a API;
  comparar com a Play Console, sem tratar os números como equivalentes.
- **Primeira abertura offline:** será registrada quando uma abertura futura conseguir alcançar a API.
- **Abuso do endpoint anônimo:** payload estrito, rate limit global existente e escrita idempotente.
- **Troca de conta:** vínculos e dias ativos autenticados usam chaves compostas, sem apagar a conta
  usada anteriormente na mesma instalação.
- **Fuso horário:** todos os dias analíticos usam UTC para manter coortes determinísticas.
