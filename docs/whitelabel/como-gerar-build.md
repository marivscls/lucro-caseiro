# Como gerar builds por marca

Os builds usam o mesmo código. A marca é resolvida em build time pelos profiles do
`apps/mobile/eas.json`; os IDs e unidades AdMob reais das marcas novas ficam no cofre
do EAS, nunca neste documento.

| Marca                        | Profile                | Comando                                             | Artefato               |
| ---------------------------- | ---------------------- | --------------------------------------------------- | ---------------------- |
| Lucro Caseiro                | `production`           | `eas build --profile production --platform android` | AAB Android            |
| Lucro na Papelaria           | `papelaria-production` | `pnpm build:papelaria`                              | AAB Android            |
| Lucro na Papelaria (revisão) | `papelaria-preview`    | `pnpm build:papelaria:preview`                      | APK/AAB interno do EAS |
| Lucro na Manicure            | `manicure-production`  | `pnpm build:manicure`                               | AAB Android            |
| Lucro na Manicure (revisão)  | `manicure-preview`     | `pnpm build:manicure:preview`                       | APK/AAB interno do EAS |

Execute os scripts dentro de `apps/mobile`. Antes de produção, configure no cofre do
profile as quatro envs `EXPO_PUBLIC_ADMOB_*`, além das URLs e credenciais já exigidas
pelo app. Cada marca também possui `easProjectId` próprio no `BrandConfig` (não é
segredo); `EAS_PROJECT_ID` permite sobrescrever esse valor no ambiente. O fallback de
IDs AdMob do Lucro Caseiro existe somente em desenvolvimento.

`EXPO_PUBLIC_CATALOG_URL` não fica nos profiles compartilhados: configure-a no
ambiente EAS de cada projeto com o domínio público da própria marca. Sem essa variável,
o app usa `EXPO_PUBLIC_API_URL` como fallback funcional, sem herdar o domínio de outra
marca.

Cada marca mantém `applicationId`, `bundleId`, scheme e assets próprios no seu
`BrandConfig`. O envio à loja é manual: `eas submit` só deve ser executado após a
revisão humana do listing e das imagens.

## Deploy web

Crie um deploy por marca e altere somente `BRAND`, `NEXT_PUBLIC_BRAND` e
`NEXT_PUBLIC_SITE_URL`. A API compartilhada recebe `x-brand` de cada cliente. O
catálogo mobile usa `EXPO_PUBLIC_CATALOG_URL`, apontando para o domínio da marca.
