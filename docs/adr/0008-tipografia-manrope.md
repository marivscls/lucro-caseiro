# ADR-0008 — Tipografia oficial: Manrope em todo o aplicativo

**Status:** atualizado pela dona do produto (2026-09-08)

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
   - `display` 28/34 Bold · `h1` 24/30 Bold · `h2` 20/26 Bold · `h3` 16/22 Bold
   - `screenTitle` 18/24 Bold no mobile; `ScreenHeader` usa 20/26 no desktop
   - `body` e `bodyBold` 14/20 · `caption` e `captionBold` 13/18
   - `label` 13/18 Bold uppercase
   - `money` 16/22 ExtraBold — preço em card/lista
   - `moneyLg` 20/26 Bold — resumo da tela
   - `moneyHero` 24/30 Bold — um destaque por tela (Home, Financeiro, precificação)
3. **Token `fonts`** no theme; componentes base usam as famílias registradas para cada peso.
4. HTML gerado para recibos, orçamentos, receitas e etiquetas carrega Manrope e não define
   famílias serifadas locais.

## Regras de uso

- Texto novo = `Typography` com a variante certa. Não definir `fontSize`, `fontWeight` ou
  `fontFamily` inline quando uma variante resolve.
- Título de tela = `screenTitle`. Título de seção/lista/modal = `h3`. Nome em card = `bodyBold`.
- Número de dinheiro = `money` / `moneyLg` / `moneyHero`. Não sobrescrever `fontSize` nessas
  variantes. Contagem em métrica (não dinheiro) = `h3`; um resumo principal pode usar `h1` (24/30).
- O peso vem da família (`fonts.bold`), nunca de `fontWeight` sobre a fonte customizada.
- ExtraBold 800 fica reservado a preços compactos (`money`); resumos maiores usam Bold 700.
- Não oferecer nem renderizar exceções serifadas, inclusive em conteúdo configurável.
- O cache offline do PWA deve incluir os quatro arquivos Manrope realmente usados.

## Consequências

- Uma família em todo o aplicativo e hierarquia previsível entre telas e documentos.
- Quatro pesos de Manrope fazem parte do bundle e do cache offline essencial.
- O app segura o primeiro render até `useFonts` resolver, coberto pelo BrandIntro.

## Refinamento de densidade — 2026-09-08

A dona do produto solicitou textos menores e consistentes entre telas. A escala acima substitui os valores anteriores, inclusive nos estados vazios e nas orientações. Botões usam 14 px sem reduzir seus alvos de toque; subtítulos usam 13/18; campos de digitação mantêm 16 px. Zoom do navegador e preferências de tamanho de fonte continuam disponíveis. Tamanhos próprios de impressão/prévia de etiquetas e marcas em ilustrações não são uma escala de interface.
