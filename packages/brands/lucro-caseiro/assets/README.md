# Ícone de notificação do Lucro Caseiro

`notification-icon.svg` é a matriz vetorial monocromática do L com ponto da marca. A silhueta segue a marca existente em `apps/mobile/assets/icon.png`, sem gradientes, contorno ou espessura adicional. As propostas raster geradas durante a exploração não foram utilizadas.

`notification-icon.png` é a exportação de 96 × 96 px: preenchimento branco e fundo transparente. É usado pelo plugin `expo-notifications`, via `brandAsset` no `app.config.ts`. O `app.json` também aponta para este arquivo.

O arquivo fica na pasta desta marca para não trocar o ícone das outras marcas que ainda usam o recurso padrão. O Expo gera as densidades Android de 24, 36, 48, 72 e 96 px durante o prebuild.

Para reproduzir a exportação, renderizar o SVG em PNG a 96 × 96 px, preservando o canal alfa (a exportação atual usou Sharp 0.35.4). Não achatar o fundo nem aplicar sombra ou moldura.

Esta alteração exige um novo binário Android. O AAB 31 já gerado contém a casinha. O próximo `versionCode` do projeto é 32; atualizar JavaScript ou a ficha da Play Store não troca esse recurso no aplicativo instalado.
