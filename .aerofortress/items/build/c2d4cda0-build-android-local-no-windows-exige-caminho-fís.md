---
id: c2d4cda0-d667-4e99-baae-22c8768e144e
slug: build
type: scar
title: Build Android local no Windows exige caminho físico curto e store pnpm encurtado ou hoisted
tags: android, development-build, windows, gradle, cmake, pnpm, expo, path-limit, apk
provenance: observado
evidence: apps/mobile/dist/lucro-caseiro-development-arm64.apk (SHA256 4699405E63B4C6511A403640BB8B03C1840308AA7DF6CDB1137F82D04F6466E2); apps/mobile/dist/lucro-papelaria-development-arm64.apk (SHA256 44491DA3C0FA2F696B577A8D58843324D89923EF7AD5D45A2376A4404484C664); ambos BUILD SUCCESSFUL em 2026-07-19
decay: stable
created: 2026-07-20T02:53:50.497262700+00:00
updated: 2026-07-20T02:59:54.733683100+00:00
validated: 2026-07-20T02:59:54.733683100+00:00
links:
---

SINTOMA (2026-07-19): após a cota EAS Android gratuita esgotar, `gradlew assembleDebug` local falhou em `configureCMakeDebug[arm64-v8a]` com `CreateProcess error=2` para `prefab_command.bat`. `subst` não resolveu porque Gradle/pnpm voltaram aos caminhos canônicos; uma cópia ainda longa com `virtual-store-dir-max-length=40` avançou, mas o CMake/Ninja excedeu `CMAKE_OBJECT_PATH_MAX` e entrou em regeneração contínua.

CAUSA: o caminho físico do repo + nomes do virtual store isolado do pnpm + diretórios CMake ultrapassam os limites de processo/objeto no Windows (`LongPathsEnabled=0` nesta máquina).

CORREÇÕES COMPROVADAS:

1. Cópia/worktree físico curto com `node-linker=hoisted` (caso Lucro Caseiro, `C:\lc-build`).
2. Sem hoisted: cópia mínima em `C:\p`, `pnpm install --frozen-lockfile --config.virtual-store-dir-max-length=20`, `expo prebuild --platform android --clean --no-install` com a marca correta e `NODE_ENV=development`, seguido de `gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a --no-daemon` (caso Lucro na Papelaria).

COMO EVITAR: no fallback local Windows para Expo/React Native com pnpm, usar desde o início uma cópia física curtíssima; escolher hoisted ou limitar o virtual store a 20 caracteres; compilar só ARM64 e sem daemon. Não insistir em junction/subst, raiz intermediária ou store de 40 caracteres. Validar o package do APK com `apkanalyzer` antes de entregar.
