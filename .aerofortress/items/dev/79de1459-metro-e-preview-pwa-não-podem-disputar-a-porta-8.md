---
id: 79de1459-3b16-41ff-9819-c3ae6b70b44a
slug: dev
type: scar
title: Metro e preview PWA não podem disputar a porta 8083
tags: expo, metro, dev-server, porta, lan
provenance: observado
evidence: Sessão local de 2026-07-25: Get-NetTCPConnection mostrou PID 428 (Expo) e PID 5736 (serve-pwa) na 8083; após reinício, PID 26476 executa apps/mobile Expo em modo LAN e http://192.168.1.7:8083 respondeu 200.
decay: stable
created: 2026-07-26T02:10:18.449750300+00:00
updated: 2026-07-26T02:10:18.449750300+00:00
validated: 2026-07-26T02:10:18.449750300+00:00
links:
---

SINTOMA (2026-07-25): o development build ficava carregando ao conectar pelo endereço local. CAUSA CONFIRMADA: havia dois processos na porta 8083 — `expo start --dev-client --tunnel` ligado ao listener IPv6 e `scripts/serve-pwa.mjs lucro-caseiro 8083` ligado ao IPv4; `http://192.168.1.7:8083` chegava ao preview PWA, não ao Metro. CORREÇÃO: encerrar ambos e subir apenas o Expo com `--dev-client --lan --port 8083 --clear`, confirmando o PID/comando dono da porta e resposta pelo IP LAN. COMO EVITAR: antes de orientar conexão mobile, inspecionar todos os listeners IPv4/IPv6 e seus processos; HTTP 200 sozinho não prova que é o Metro.
