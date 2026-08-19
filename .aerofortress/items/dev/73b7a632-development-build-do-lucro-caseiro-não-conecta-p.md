---
id: 73b7a632-864d-4d04-b6f7-76b25236def1
slug: dev
type: scar
title: Development build do Lucro Caseiro não conecta pelo link exp:// do Expo Go
tags: expo, dev-client, metro, android, tunnel, recorrencia
provenance: dito
evidence: Correções explícitas da usuária em 2026-07-25 e 2026-08-16; em 2026-08-16 o Metro LAN respondia no PC em 192.168.1.17:8082, mas a usuária informou que esse endereço não funcionava no aparelho.
decay: stable
created: 2026-07-25T15:22:15.580469700+00:00
updated: 2026-08-16T18:23:17.579413+00:00
validated: 2026-08-16T18:23:17.579413+00:00
links:
---

SINTOMA INICIAL (2026-07-25): foi passado `exp://192.168.1.7:8083`, mas o projeto usa módulos nativos e `expo-dev-client`; Expo Go/`exp://` não é o fluxo correto. A orientação seguinte (`http://<IP_LAN>:8083` no Development Build) também não conectou no aparelho da usuária, embora Metro, manifesto e bundle respondessem no PC.

RECORRÊNCIA / CORREÇÃO DA USUÁRIA (2026-08-16): Metro e PWA foram corretamente separados em 8082/8083, porém foi entregue `http://192.168.1.17:8082` como se fosse suficiente para abrir o mobile. A usuária informou que não funcionava. Um endereço HTTP LAN cru só comprova o servidor; não é a entrega correta para o development build e pode ser inalcançável pelo celular.

CORREÇÃO: iniciar o Metro com `expo start --dev-client --tunnel --port <porta>` e, no Development Build instalado do Lucro Caseiro, usar a URL HTTPS `*.exp.direct` mostrada pelo túnel. Validar o túnel, o manifesto com cabeçalhos Expo e o bundle Android. O deep link completo tem a forma `lucrocaseiro://expo-development-client/?url=<URL_HTTPS_CODIFICADA>`. LAN (`http://<IP>:<porta>`) só deve ser sugerido quando a conectividade do aparelho até o PC estiver confirmada; ADB USB com `adb reverse tcp:<porta> tcp:<porta>` é uma alternativa quando o aparelho estiver conectado.
