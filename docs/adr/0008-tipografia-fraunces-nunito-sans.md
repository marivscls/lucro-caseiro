# ADR-0008 — Tipografia oficial: Fraunces (display) + Nunito Sans (texto)

**Status:** aceito pela dona do produto (2026-07-11)

## Contexto

O app não carregava nenhuma fonte própria: títulos usavam a serifa do sistema (Noto Serif no Android), o resto a sans do sistema (Roboto), e havia ~371 `fontSize` inline em 58 arquivos. Resultado: sensação de 2-3 fontes diferentes e hierarquia inconsistente entre telas (e dentro da mesma tela).

## Decisão

1. **Duas famílias oficiais**, carregadas via `@expo-google-fonts` no RootLayout (`useFonts`, JS-only — não exige build nativo):
   - **Fraunces** (600/700) — display, h1, h2: a voz da marca, serifa acolhedora.
   - **Nunito Sans** (400/600/700/800) — todo o resto: arredondada e altamente legível (público inclui idosas).
2. **Escala tipográfica única** no `Typography` do `@lucro-caseiro/ui`, com família + tamanho + entrelinha por variante:
   - `display` 36/42 Fraunces Bold · `h1` 28/34 Fraunces Bold · `h2` 22/28 Fraunces SemiBold
   - `h3` 18/24 Nunito Bold · `body` 16/24 Regular · `bodyBold` 16/24 Bold
   - `caption` 14/20 Regular · `label` 13/18 Bold uppercase
   - `money/moneyLg/moneyHero` Nunito ExtraBold com `tabular-nums`
3. **Token `fonts`** no theme; componentes base (Button, Badge, Chip, Input, EmptyState) usam as famílias do token.

## Regras de uso (o que mantém a hierarquia consistente)

- Texto novo = `Typography` com a variante certa. **Nunca** `fontSize`/`fontWeight`/`fontFamily` inline em telas.
- Peso vem da **família** (`fonts.bold`), nunca de `fontWeight` — no Android, `fontWeight` sobre fonte custom vira faux-bold ou cai pra fonte do sistema.
- Fraunces é reservada a display/h1/h2 (e ao `serif` legado do Typography). Labels, botões e corpo são sempre Nunito Sans.
- Telas legadas migram por varredura (sweep 2026-07-11) e oportunisticamente ao serem tocadas.

## Consequências

- Identidade tipográfica única; hierarquia previsível entre telas.
- ~6 arquivos de fonte embutidos no bundle JS (±40 KB cada).
- O app segura o primeiro render até `useFonts` resolver (coberto pelo BrandIntro).
