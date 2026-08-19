---
id: c2d4cda0-d667-4e99-baae-22c8768e144e
slug: build
type: scar
title: Build Android local no Windows exige caminho físico curto e store pnpm encurtado ou hoisted
tags: android, development-build, windows, gradle, cmake, pnpm, expo, path-limit, apk
provenance: observado
evidence: 2026-08-15: BUILD SUCCESSFUL em C:\l com pnpm `virtual-store-dir-max-length=16`, Expo prebuild limpo e `-PreactNativeArchitectures=x86_64`; APK de 78.786.658 bytes instalado no emulador lucro_e2e
decay: stable
created: 2026-07-20T02:53:50.497262700+00:00
updated: 2026-08-16T00:10:24.414257900+00:00
validated: 2026-08-16T00:10:24.414257900+00:00
links:
---

SINTOMA (2026-07-19): após a cota EAS Android gratuita esgotar, `gradlew assembleDebug` local falhou em `configureCMakeDebug[arm64-v8a]` com `CreateProcess error=2` para `prefab_command.bat`. `subst` não resolveu porque Gradle/pnpm voltaram aos caminhos canônicos; uma cópia ainda longa com `virtual-store-dir-max-length=40` avançou, mas o CMake/Ninja excedeu `CMAKE_OBJECT_PATH_MAX` e entrou em regeneração contínua.

RECORRÊNCIA CONFIRMADA (2026-08-15): o build local do mock de onboarding repetiu `CreateProcess error=2` no repo original e ainda falhou em `react-native-iap` sob `C:\lc-onboard-test` com virtual store 32. A receita que passou no emulador x86_64 foi: cópia física mínima em `C:\l`; `pnpm install --frozen-lockfile --config.virtual-store-dir-max-length=16`; `expo prebuild --platform android --clean --no-install`; `NODE_ENV=development`; `gradlew app:assembleDebug -PreactNativeDevServerPort=8083 -PreactNativeArchitectures=x86_64`. O APK foi instalado após remover do emulador o APK antigo com assinatura incompatível.

CAUSA: caminho físico do repo + nomes do virtual store isolado do pnpm + diretórios CMake ultrapassam os limites de processo/objeto no Windows (`LongPathsEnabled=0` nesta máquina).

CORREÇÕES COMPROVADAS:

1. Cópia/worktree físico curto com `node-linker=hoisted` (caso Lucro Caseiro, `C:\lc-build`).
2. Sem hoisted em ARM64: cópia mínima em `C:\p`, virtual store 20, prebuild limpo, `NODE_ENV=development`, somente `arm64-v8a` e `--no-daemon`.
3. Sem hoisted em emulador x86_64: raiz `C:\l`, virtual store 16, prebuild limpo e somente `x86_64`.

COMO EVITAR: usar desde o início uma cópia física curtíssima; escolher hoisted ou limitar o virtual store a 16–20 caracteres; compilar apenas a arquitetura do alvo. Não insistir em junction/subst, raiz intermediária ou store de 32–40 caracteres. Validar o package/assinatura e instalar no runtime alvo antes de declarar o APK testado.
