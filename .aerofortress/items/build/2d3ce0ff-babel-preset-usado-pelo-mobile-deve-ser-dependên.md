---
id: 2d3ce0ff-664a-43b1-a098-4fe7ab9e6f72
slug: build
type: scar
title: Babel preset usado pelo mobile deve ser dependência direta para o EAS
tags: eas, expo, babel, pnpm, monorepo
provenance: observado
evidence: EAS build e09ef244-948e-43c7-8358-38e8ade1cff7; apps/mobile/package.json; `expo install --check` e build mobile verdes em 2026-07-18
decay: stable
created: 2026-07-18T19:34:59.594607400+00:00
updated: 2026-07-18T19:34:59.594607400+00:00
validated: 2026-07-18T19:34:59.594607400+00:00
links:
---

Sintoma: EAS passou por prebuild, mas `:app:createBundleReleaseJsAndAssets` falhou com `Cannot find module 'babel-preset-expo'`; o export local passava porque o preset existia apenas de forma transitiva no workspace. Correção: declarar `babel-preset-expo` diretamente em devDependencies do app mobile e manter o patch do Expo alinhado com `expo install --check`. Em builds pnpm podados/remotos, toda ferramenta citada em babel.config deve ser dependência direta do app.
