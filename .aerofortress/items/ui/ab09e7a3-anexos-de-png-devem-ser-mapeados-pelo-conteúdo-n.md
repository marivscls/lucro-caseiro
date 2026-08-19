---
id: ab09e7a3-7e54-4c81-a58d-64eba2d5076b
slug: ui
type: scar
title: Anexos de PNG devem ser mapeados pelo conteúdo, não pela posição
tags: assets, png, branding, hash, anexos
provenance: observado
evidence: packages/brands/lucro-revenda/assets/illustrations/services-empty.png; packages/brands/lucro-revenda/assets/illustrations/purchases-empty.png; build:pwa:revenda de 2026-08-14
decay: stable
created: 2026-08-14T15:42:51.880791700+00:00
updated: 2026-08-14T15:42:51.880791700+00:00
validated: 2026-08-14T15:42:51.880791700+00:00
links:
---

FALHA REAL (2026-08-14): ao instalar três anexos da Revenda, os caminhos temporários dos dois últimos foram associados pela ordem errada; a sacola entrou em Serviços e a loja entrou em Compras/resultado da Precificação. A listagem do bundle revelou hashes e tamanhos incompatíveis com o conteúdo esperado. CORREÇÃO: reabrir/identificar cada anexo pelo conteúdo, copiar loja → `services-empty.png` e sacola → `purchases-empty.png`, confirmar cada par por SHA-256 e só então reconstruir a PWA. COMO EVITAR: nunca inferir a finalidade por sequência de UUIDs/anexos; registrar visual → destino antes de copiar e validar o hash do par correto.
