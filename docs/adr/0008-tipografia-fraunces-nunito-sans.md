# ADR-0008 — Tipografia oficial: Nunito Sans em toda a interface

**Status:** atualizado pela dona do produto (2026-07-25)

## Contexto

O app não carregava nenhuma fonte própria: títulos usavam a serifa do sistema (Noto Serif no
Android), o resto a sans do sistema (Roboto), e havia ~371 `fontSize` inline em 58 arquivos.
Em 2026-07-11, Fraunces foi adotada nos títulos e Nunito Sans no restante. Em 2026-07-25, a
dona do produto decidiu uniformizar também os títulos com a sans usada na referência visual de
Precificação.

## Decisão

1. **Uma família oficial**, carregada via `@expo-google-fonts/nunito-sans` no RootLayout
   (`useFonts`, JS-only — não exige build nativo):
   - **Nunito Sans** (400/600/700/800) — toda a interface, incluindo títulos e displays.
2. **Escala tipográfica única** no `Typography` do `@lucro-caseiro/ui`, com família + tamanho +
   entrelinha por variante:
   - `display` 36/42 Bold · `h1` 28/34 Bold · `h2` 22/28 Bold · `h3` 18/24 Bold
   - `body` e `bodyBold` 15/22 · `caption` e `captionBold` 13/18
   - `label` 13/18 Bold uppercase
   - `money/moneyLg/moneyHero` ExtraBold com `tabular-nums`
3. **Token `fonts`** no theme; componentes base (Button, Badge, Chip, Input, EmptyState) usam as
   famílias do token.

## Regras de uso (o que mantém a hierarquia consistente)

- Texto novo = `Typography` com a variante certa. **Nunca**
  `fontSize`/`fontWeight`/`fontFamily` inline em telas.
- Peso vem da **família** (`fonts.bold`), nunca de `fontWeight` — no Android, `fontWeight` sobre
  fonte custom vira faux-bold ou cai para a fonte do sistema.
- Títulos preservam a escala grande, mas usam Bold 700. ExtraBold 800 fica reservado a números de
  destaque.
- O componente `Typography` não oferece exceção serifada. Conteúdo configurável pelo usuário, como
  modelos de etiquetas, pode preservar suas opções tipográficas sem alterar a interface.
- Telas legadas migram por varredura e oportunisticamente ao serem tocadas.

## Consequências

- Uma família em toda a interface e hierarquia previsível entre telas.
- 4 arquivos de fonte embutidos no bundle JS (±40 KB cada).
- O app segura o primeiro render até `useFonts` resolver (coberto pelo BrandIntro).
