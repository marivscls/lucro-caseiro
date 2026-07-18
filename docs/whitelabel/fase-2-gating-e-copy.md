# Fase 2 — Feature gating e copy da marca nas telas

> STATUS: CONCLUIDA EM 2026-07-18. Pre-requisito: Fase 1 concluida.
> Regras globais: ver README.md desta pasta.

## Objetivo

Fazer as telas principais (mobile + web) consumirem a marca ativa:
modulos desligados por flag somem dos pontos de entrada, e textos-chave
passam a vir de `useBrand().copy`.

## Tarefa 0 — Correcao previa (bug pre-existente)

`apps/mobile/src/app/tabs/index.tsx` esta com erro de typecheck:
`ListCard`/`ListCardItem` usados sem import. Encontrar onde esses componentes
sao definidos e corrigir o import (ou ajustar o uso). Confirmar com:

```bash
pnpm --filter @lucro-caseiro/mobile typecheck
```

## Tarefa 1 — Mapear antes de mudar

Inventariar e anotar (arquivo:linha) ANTES de editar:

- Mobile (`apps/mobile/src/app/**`) e web (`apps/web/src/app/**`): todos os
  pontos de ENTRADA dos modulos das flags `estoque`, `agendamento`,
  `catalogoCores`, `fichaTecnica` — tabs, menus, acoes rapidas da home, links de nav.
- Onde aparecem os textos do BrandCopy: "Registrar venda" (saleLabel),
  "Estoque" (stockLabel), "produto" (productNoun).

Aplicar as mudancas APENAS nos pontos de entrada. NAO reescrever telas internas.

## Tarefa 2 — Feature gating nos pontos de entrada

- **Mobile (expo-router)**: ocultar tabs/entradas cuja flag esta off na marca
  ativa, usando `useFeature("agendamento")` etc. Abordagem canonica do
  expo-router: `href: null` no `Tabs.Screen` ou renderizacao condicional.
  Atalhos da home e menus que apontem para modulos desligados tambem somem.
- **Web**: mesma logica nos links/nav com o BrandProvider local
  (`apps/web/src/app/brand-provider.tsx`).
- Resultado esperado: na marca `lucro-papelaria`, agendamento e ficha tecnica
  NAO aparecem em nenhum ponto de entrada.

## Tarefa 3 — Copy da marca

Nos pontos mapeados na Tarefa 1, trocar literais por `useBrand().copy.*`:

- `copy.saleLabel` — botao principal de venda
- `copy.stockLabel` — titulo/label de estoque
- `copy.productNoun` — onde for substituicao segura 1:1

Somente home/acoes rapidas, tela de vendas e tela de estoque.
NAO fazer sweep global de strings.

## Tarefa 4 — Guards de navegacao direta

Se alguma rota de modulo desligado continuar acessivel por URL/deep link
(ex.: `/agendamento` na papelaria), adicionar guard leve na tela:

- Mobile: `Redirect` para a home (expo-router).
- Web: equivalente no Next (`redirect()` ou componente guard).

Comentario em cada guard explicando que a rota existe mas o modulo esta
desligado para a marca ativa.

## Validacao obrigatoria

```bash
pnpm --filter @lucro-caseiro/mobile typecheck   # deve passar (inclui Tarefa 0)
pnpm --filter @lucro-caseiro/web typecheck      # deve passar
```

- Lint/prettier nos arquivos tocados.
- Rodar testes existentes das telas alteradas, se houver.
- Conferir por inspecao: com `EXPO_PUBLIC_BRAND=lucro-papelaria`, as entradas
  de agendamento/ficha tecnica nao renderizam.

## Formato do reporte final

1. Causa raiz do erro da Tarefa 0 (1 linha)
2. Pontos de entrada gated (arquivo:linha) e como
3. Strings trocadas para copy da marca
4. Guards adicionados
5. Resultados de typecheck/testes
6. O que ficou fora de escopo para a Fase 3
