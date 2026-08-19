---
id: 79de1459-3b16-41ff-9819-c3ae6b70b44a
slug: dev
type: scar
title: Metro e preview PWA não podem disputar a porta 8083
tags: expo, metro, dev-server, porta, lan, pwa, development-build, recorrencia
provenance: dito
evidence: Imagem enviada pela usuária em 2026-08-15 mostrando `Unable to load script`; validação observada no túnel https://ndtdfua-marivscls-8083.exp.direct com manifesto e bundle Android HTTP 200.
decay: stable
created: 2026-07-26T02:10:18.449750300+00:00
updated: 2026-08-15T22:08:52.203289900+00:00
validated: 2026-08-15T22:08:52.203289900+00:00
links:
---

SINTOMA (2026-07-25): o development build ficava carregando ao conectar pelo endereço local. CAUSA CONFIRMADA: havia dois processos na porta 8083 — `expo start --dev-client --tunnel` ligado ao listener IPv6 e `scripts/serve-pwa.mjs lucro-caseiro 8083` ligado ao IPv4; `http://192.168.1.7:8083` chegava ao preview PWA, não ao Metro. CORREÇÃO: encerrar ambos e subir apenas o Expo com `--dev-client --lan --port 8083 --clear`, confirmando o PID/comando dono da porta e resposta pelo IP LAN.

RECORRÊNCIA / CORREÇÃO DA USUÁRIA (2026-08-15): após pedir para “subir o servidor” e dizer que testaria mobile, foi mantido `serve-pwa.mjs` na 8083 e entregue um endereço HTTP. O development build Android abriu `Unable to load script` porque precisava do Metro, não do export PWA. Foi corrigido substituindo o preview pelo Expo `--dev-client --tunnel --port 8083 --clear`; manifesto `application/expo+json` e bundle Android de 17.660.109 bytes responderam HTTP 200 no túnel.

COMO EVITAR: “mobile” ou tela do development build determina o alvo: Expo Metro/dev-client. “PWA”, “navegador” ou instalação web determina `serve-pwa.mjs`. Antes de orientar conexão mobile, inspecionar todos os listeners IPv4/IPv6 e seus processos; HTTP 200 sozinho não prova que é o Metro.
