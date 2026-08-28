# ADR-0008 — Tipografia oficial: Manrope em todo o aplicativo

**Status:** atualizado pela dona do produto (2026-08-11)

## Contexto

O app originalmente usava as fontes do sistema. Depois passou por Fraunces, Nunito Sans e
Montserrat. Em 2026-08-11, a dona do produto escolheu Manrope como família única e determinou a
eliminação das demais fontes, inclusive das exceções serifadas em etiquetas e documentos gerados.

## Decisão

1. **Uma família oficial**, carregada via `@expo-google-fonts/manrope` no RootLayout
   (`useFonts`, JS-only — não exige build nativo):
   - **Manrope** (400/600/700/800) — interface, títulos, displays, etiquetas e PDFs.
2. **Escala tipográfica única** no `Typography` do `@lucro-caseiro/ui`, com família + tamanho +
   entrelinha por variante:
   - `display` 36/42 Bold · `h1` 28/34 Bold · `h2` 22/28 Bold · `h3` 18/24 Bold
   - `screenTitle` 20/26 Bold — único tamanho de título de tela (`ScreenHeader` e abas)
   - `body` e `bodyBold` 15/22 · `caption` e `captionBold` 13/18
   - `label` 13/18 Bold uppercase
   - `money/moneyLg/moneyHero` ExtraBold com `tabular-nums`
3. **Token `fonts`** no theme; componentes base usam as famílias registradas para cada peso.
4. HTML gerado para recibos, orçamentos, receitas e etiquetas carrega Manrope e não define
   famílias serifadas locais.

## Regras de uso

- Texto novo = `Typography` com a variante certa. Não definir `fontSize`, `fontWeight` ou
  `fontFamily` inline quando uma variante resolve.
- Título de tela = `screenTitle`. Título de seção/lista/modal = `h3`. Nome em card = `bodyBold`.
- O peso vem da família (`fonts.bold`), nunca de `fontWeight` sobre a fonte customizada.
- ExtraBold 800 fica reservado a números de destaque (`money`, `moneyLg`, `moneyHero`).
- Não oferecer nem renderizar exceções serifadas, inclusive em conteúdo configurável.
- O cache offline do PWA deve incluir os quatro arquivos Manrope realmente usados.

## Consequências

- Uma família em todo o aplicativo e hierarquia previsível entre telas e documentos.
- Quatro pesos de Manrope fazem parte do bundle e do cache offline essencial.
- O app segura o primeiro render até `useFonts` resolver, coberto pelo BrandIntro.
