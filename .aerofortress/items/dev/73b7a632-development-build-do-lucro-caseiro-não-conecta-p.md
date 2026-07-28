---
id: 73b7a632-864d-4d04-b6f7-76b25236def1
slug: dev
type: scar
title: Development build do Lucro Caseiro não conecta pelo link exp:// do Expo Go
tags: expo, dev-client, metro, android, tunnel
provenance: dito
evidence: Correção explícita da usuária em 2026-07-25; validação observada: Expo `--dev-client --tunnel` em apps/mobile, manifest application/expo+json HTTP 200 e bundle Android de 17.022.162 bytes HTTP 200 em https://ndtdfua-marivscls-8083.exp.direct
decay: stable
created: 2026-07-25T15:22:15.580469700+00:00
updated: 2026-07-25T15:36:40.468471900+00:00
validated: 2026-07-25T15:36:40.468471900+00:00
links:
---

SINTOMA INICIAL (2026-07-25): foi passado `exp://192.168.1.7:8083`, mas o projeto usa módulos nativos e `expo-dev-client`; Expo Go/`exp://` não é o fluxo correto. A orientação seguinte (`http://<IP_LAN>:8083` no Development Build) também não conectou no aparelho da usuária, embora Metro, manifesto e bundle respondessem no PC.

CORREÇÃO: iniciar o Metro com `expo start --dev-client --tunnel --port 8083` e, no Development Build instalado do Lucro Caseiro, usar a URL HTTPS `*.exp.direct` mostrada pelo túnel. Validar pela API local do ngrok (`http://127.0.0.1:4040/api/tunnels`), pelo manifesto com cabeçalhos Expo e pelo download do bundle Android. O deep link completo tem a forma `lucrocaseiro://expo-development-client/?url=<URL_HTTPS_CODIFICADA>`. LAN (`http://<IP>:8083`) só deve ser sugerido quando a conectividade do aparelho até o PC estiver confirmada; ADB USB com `adb reverse tcp:8083 tcp:8083` é uma alternativa quando o aparelho estiver conectado.
