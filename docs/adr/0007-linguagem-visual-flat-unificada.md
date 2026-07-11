# ADR-0007 — Linguagem visual flat unificada (padrão da home) + token de sombra

**Status:** aceito (2026-07-11) · **Contexto:** PRD melhorias pré-lançamento, itens 5.1–5.3

## Contexto

Após o redesign da home (flat, bordas, raios grandes da escala `radii`), as telas legadas (Vendas, Planos, Catálogo, entre outras) seguiam outra linguagem: `shadowColor:"#000"` hardcoded, raios mágicos (22/26/36), paletas locais paralelas. Duas linguagens visuais coexistindo. Scars relevantes: no Android, `elevation` + fundo translúcido produz "caixa branca"; sombras em cards arredondados já quebraram os cantos.

## Decisão

1. **O padrão visual canônico é o da home**: cards flat com borda sutil e raios exclusivamente da escala `radii` do tema.
2. **Elevação vira token** no design system (`packages/ui/theme`): um único estilo de sombra/elevação definido lá; nenhuma tela redefine sombra à mão. `Card` variant `elevated` usa esse token (fundo sempre opaco no Android).
3. Cores exclusivamente via `theme.colors` — sem hex hardcoded nem paletas locais.
4. Fontes seguem o mínimo de 16 px do guia de acessibilidade (exceções tipográficas conscientes ficam documentadas no design system, não inline).

Migração nesta rodada: Vendas, Planos e Catálogo. Demais telas legadas migram oportunisticamente ao serem tocadas.

## Consequências

- Identidade visual única; mudanças futuras de elevação/cor acontecem em um lugar.
- Diffs visuais nas 3 telas migradas — validar com screenshots claro/escuro com a dona do produto.
