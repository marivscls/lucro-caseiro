---
id: 7f0ea72e-c2b4-4952-b114-3e0fd9d621b2
slug: dev
type: scar
title: Endereço LAN do Metro não funciona quando o celular está no 5G
tags: expo, metro, lan, 5g, tunnel
provenance: observado
evidence: Falha exibida pelo development build em 2026-07-25; após reinício do apps/mobile com `--dev-client --tunnel`, o túnel exp.direct respondeu HTTP 200.
decay: stable
created: 2026-07-26T02:13:33.205959800+00:00
updated: 2026-07-26T02:13:33.205959800+00:00
validated: 2026-07-26T02:13:33.205959800+00:00
links:
---

SINTOMA (2026-07-25): o development build falhou após 10 segundos ao conectar em `192.168.1.7:8083`. A mensagem revelou origem `192.0.0.4` e a barra do aparelho mostrava 5G: o celular não estava na mesma rede LAN do computador. CORREÇÃO: usar Expo `--tunnel` e o endereço `https://…exp.direct` quando o aparelho estiver no 5G; usar `http://<IP_LAN_DO_PC>:8083` apenas quando ambos estiverem no mesmo Wi‑Fi. COMO EVITAR: antes de recomendar o IP local, confirmar a rede do aparelho; um HTTP 200 testado no próprio PC não prova alcance a partir do celular.
