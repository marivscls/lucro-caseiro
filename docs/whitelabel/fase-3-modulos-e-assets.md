# Fase 3 — Modulos exclusivos por vertical + assets e tema completos

> STATUS: IMPLEMENTADA EM 2026-07-18. A migration ainda requer apply/rollback em
> banco de desenvolvimento autorizado; nenhum banco remoto foi alterado nesta execucao.
> Regras globais: ver README.md desta pasta.

## Objetivo

1. Transformar a feature exclusiva da papelaria (`catalogoCores`) em modulo real.
2. Mover assets de marca para `packages/brands/<marca>/assets` e completar o
   mapeamento de tema (incluindo o globals.css do web).

## Tarefa 1 — Assets por marca

- Criar `packages/brands/lucro-papelaria/assets/` com icon, adaptive-icon,
  splash e notification-icon proprios (gerar/exportar arte fora deste escopo de
  codigo; se a arte final nao existir, criar versoes derivadas da paleta da marca
  como placeholder consciente, ex.: icone verde `#2E7D5B`).
- Atualizar `apps/mobile/app.config.ts`: resolver o diretorio de assets pela
  marca ativa (`packages/brands/<id>/assets`), com fallback para
  `apps/mobile/assets` quando um arquivo nao existir na marca. Remover o
  comentario TODO(brand) correspondente.
- Validar com `npx expo config --type public` nas duas marcas.

## Tarefa 2 — Tema completo no web (globals.css)

Hoje `apps/web/src/app/brand-theme.tsx` so sobrescreve `--primary*`,
`--background`, `--surface`. Estender:

- Mapear as escalas de marca (hoje rose50-900 no globals.css) para uma escala
  gerada a partir de `brand.theme.primary` (gerar tons em JS — clarear/escurecer
  o hex em passos equivalentes — ou declarar a escala completa em cada
  BrandConfig; escolher UMA abordagem e documentar no ADR-0009).
- Manter semanticas (success/alert/premium) compartilhadas entre marcas, salvo
  override explicito na BrandConfig.
- Cabecalho do globals.css e brand-theme.tsx atualizados com a nova regra.

## Tarefa 3 — Modulo `catalogoCores` (papelaria)

Primeira feature exclusiva de vertical, seguindo a regra "mora no codebase
principal, desligada por flag":

- Definir o escopo minimo: variacoes de produto por cor/tamanho (ex.: caneta
  azul/vermelha, caderno pautado/liso) no cadastro e na venda.
- `packages/contracts`: DTOs de variacao (campos opcionais — nao quebrar o
  contrato atual de produtos).
- `packages/database`: tabela/colunas de variacoes coexistindo com o schema
  atual; migration nova, sem alterar dados existentes.
- `apps/api`: endpoints de variacao validando a flag `catalogoCores` da marca
  no backend (nunca confiar so no front). Definir como a API descobre a marca
  do request (header `x-brand` ou coluna `brand` no tenant) e documentar a
  escolha no ADR-0009.
- `apps/mobile` e `apps/web`: UI de variacoes visivel apenas com
  `useFeature("catalogoCores")`.

## Tarefa 4 — Preparar terreno para `lucro-manicure`

- Criar `packages/brands/lucro-manicure/` com BrandConfig inicial
  (agendamento: true, estoque: false, catalogoCores: true para esmaltes,
  fichaTecnica: false; copy: productNoun "servico"). Tema: definir com a
  responsavel de design antes de codar — deixar valores provisorios MARCADOS
  com comentario TODO(design).
- NAO criar telas novas de agendamento nesta fase; apenas registrar a marca
  no registry e validar `resolveBrand("lucro-manicure")`.

## Validacao obrigatoria

```bash
pnpm install
pnpm typecheck        # turbo: todos os packages/apps
pnpm test             # testes existentes
pnpm build            # apps tocados compilam
```

- `npx expo config` nas 3 marcas (lucro-caseiro, lucro-papelaria, lucro-manicure).
- Migration aplica e reverte limpo em banco de desenvolvimento.
- Com `catalogoCores` off, API rejeita operacao de variacao (teste ou inspecao).

## Formato do reporte final

1. Estrutura final de assets e logica de fallback
2. Abordagem escolhida para escalas de cor no web + justificativa
3. Modulo catalogoCores: contratos, migration, endpoints, telas (arquivo:linha)
4. Decisao de propagacao de marca na API (header vs tenant)
5. Config da marca manicure
6. Resultados de typecheck/testes/build
