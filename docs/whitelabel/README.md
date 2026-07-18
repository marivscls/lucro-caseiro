# Whitelabel — Um codigo, N marcas

Plano de implementacao da arquitetura whitelabel do Lucro Caseiro.
Decisao de arquitetura registrada em `docs/adr/0009-whitelabel-marcas.md`.

## Contexto do monorepo

- pnpm 9.15.4 + Turbo
- `apps/api` (backend), `apps/web` (Next 16), `apps/mobile` (Expo SDK 54 + expo-router)
- `packages/{brands,config,contracts,database,ui}`

## Regras globais (valem para TODAS as fases)

- Comentarios de codigo em ASCII sem acentos (padrao do repo: "Gestao", "padrao").
- Prettier do repo; mudancas cirurgicas; nada de refatoracao oportunista.
- Feature nova mora no codebase principal, DESLIGADA por flag — nunca `if (brand === "x")`.
- Nao commitar; deixar mudancas no working tree.
- Nao deixar dev server rodando ao final.
- Erros pre-existentes nao relacionados: reportar, nao consertar o repo inteiro.
- Validacao obrigatoria ao final de cada fase: typecheck de todos os packages/apps tocados + testes existentes das telas alteradas.

## Ordem das fases

| Fase | Documento                                                | Status       | O que entrega                                                        |
| ---- | -------------------------------------------------------- | ------------ | -------------------------------------------------------------------- |
| 1    | [fase-1-fundacao-brands.md](fase-1-fundacao-brands.md)   | CONCLUIDA    | `packages/brands`, tema por marca, app.config dinamico, profiles EAS |
| 2    | [fase-2-gating-e-copy.md](fase-2-gating-e-copy.md)       | CONCLUIDA    | Telas consomem `useFeature()` e `useBrand().copy`                    |
| 3    | [fase-3-modulos-e-assets.md](fase-3-modulos-e-assets.md) | IMPLEMENTADA | Modulos exclusivos por vertical + assets/tema completos por marca    |
| 4    | [fase-4-operacao-e-lojas.md](fase-4-operacao-e-lojas.md) | IMPLEMENTADA | Builds, AdMob, lojas e operacao multi-marca                          |

Cada documento e autocontido: contexto, tarefas numeradas, validacao e formato de reporte.
Executar na ordem — cada fase assume as anteriores concluidas.
