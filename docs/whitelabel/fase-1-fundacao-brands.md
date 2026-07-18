# Fase 1 — Fundacao: packages/brands e tema por marca

> STATUS: CONCLUIDA. Este documento e referencia para as fases seguintes —
> descreve o que ja existe. NAO reimplementar.

## O que foi entregue

### `packages/brands` (`@lucro-caseiro/brands`, framework-free)

- `src/types.ts`:
  - `BrandConfig` { id, appName, slug, scheme, iosBundleId, androidPackage, theme, copy, features }
  - `BrandThemeOverrides` { primary, primaryLight?, primaryDark?, primaryStrong?, primaryInteractive?, primarySoft?, primarySoftDark?, background?, surface?, backgroundDark?, surfaceDark? }
  - `BrandCopy` { productNoun, productNounPlural, saleLabel, stockLabel, revenueLabel, [key: string]: string }
  - `BrandFeatures` { estoque, agendamento, catalogoCores, fichaTecnica, [key: string]: boolean }
- `src/lucro-caseiro/` — marca default (identidade rose atual; estoque, agendamento e ficha
  tecnica ligados; catalogo de cores desligado).
- `src/lucro-papelaria/` — "Lucro na Papelaria": primary `#2E7D5B`, primaryLight `#4CAF7D`,
  primaryDark `#1F5C41`, primarySoft `#E4F0E9`, primarySoftDark `#26332D`,
  background `#FAF7F0`, backgroundDark `#1E2422`;
  features: estoque true, agendamento false, catalogoCores true, fichaTecnica false.
- `src/index.ts` — `brands` (registry), `resolveBrand(id)` (throw descritivo),
  `getActiveBrand()` com precedencia `BRAND` -> `EXPO_PUBLIC_BRAND` -> `NEXT_PUBLIC_BRAND` -> fallback `lucro-caseiro`, `DEFAULT_BRAND_ID`.

### `packages/ui`

- `buildThemes(overrides?: ThemeOverrides)` em `theme.ts` — gera light/dark aplicando
  overrides da marca sobre os tokens atuais (interface local, sem import de brands: sem ciclo).
- `theme-context.tsx`: `ThemeProvider` aceita prop opcional `brand`; novos
  `BrandProvider`, `useBrand()` e `useFeature(flag)`.
- Web tem versao local em `apps/web/src/app/brand-provider.tsx`
  (packages/ui nao e importavel no web: re-exporta React Native).

### Mobile

- `apps/mobile/app.config.ts` substitui `app.json` (deletado). Sem `BRAND`, config
  equivalente ao original; com `BRAND=lucro-papelaria`, troca name/slug/scheme/bundle ids/cores.
- `apps/mobile/eas.json`: profiles `papelaria-development`, `papelaria-preview`,
  `papelaria-production` com `BRAND`, `EXPO_PUBLIC_BRAND` e
  `EXPO_PUBLIC_AUTH_REDIRECT_URL=lucropapelaria://auth/callback`.
- `apps/mobile/src/app/_layout.tsx`: `BrandProvider` + `brand={getActiveBrand()}` no ThemeProvider.

### Web

- `apps/web/next.config.ts`: expoe `NEXT_PUBLIC_BRAND` a partir de `BRAND`.
- `apps/web/src/app/brand-theme.tsx`: `<style>` server-side com overrides de CSS vars
  sobre o `globals.css` (mapeamento 1:1 apenas de `--primary*`, `--background`, `--surface` + dark).
- `apps/web/src/app/layout.tsx`: `<BrandThemeStyle />` + `BrandProvider`.

## Limitacoes conhecidas (enderecadas nas fases 3 e 4)

- Icones/splash da papelaria usam placeholders de `apps/mobile/assets`.
- AdMob com IDs do Lucro Caseiro em todas as marcas.
- `globals.css`: so `--primary*`, `--background`, `--surface` mapeados; escalas rose e semanticas nao.
- Telas ainda nao consomem `useFeature()` / `useBrand().copy` -> Fase 2.

## Como gerar build da marca papelaria

```bash
cd apps/mobile
eas build --profile papelaria-production --platform android
```
