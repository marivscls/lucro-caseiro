---
id: 991cf80f-2dc5-4ffe-97db-8cd297c5f660
slug: design
type: scar
title: Peças de marketing aceitam somente a logo oficial única
tags: correcao, logo, branding, prompt, carrossel, validacao
provenance: dito
evidence: Correção da usuária em 2026-08-12; icone/logo-lucrocaseiro-l.png; apps/api/src/features/marketing/marketing.system-prompt.ts; apps/api/src/features/marketing/campaign-ai.ts
decay: stable
created: 2026-08-10T18:02:08.155102500+00:00
updated: 2026-08-12T03:34:17.943728500+00:00
validated: 2026-08-12T03:34:17.943728500+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-12): permitir assinatura textual como fallback fez as gerações adicionarem logos aleatórias e tratamentos concorrentes. CORREÇÃO CANÔNICA: existe uma única logo permitida — o monograma tridimensional em forma de L vinho/bordô com um único ponto circular lima, preservado em icone/logo-lucrocaseiro-l.png. Toda chamada de geração visual deve anexar esse arquivo como referência e usar no máximo uma instância sem redesenhar, estilizar ou alterar proporção, cores, volume ou posição do ponto. Se o asset não estiver anexado, não gerar logo nem assinatura substituta; reservar área limpa para aplicação posterior. São proibidos o antigo círculo com “lc”, selo, estrela, wordmark, nome digitado como logo, novo ícone ou símbolo. Em texto corrido, “Lucro Caseiro” continua sendo conteúdo institucional, não uma segunda logo. COMO EVITAR: repetir o contrato literal em cada prompt individual, validar deterministicamente sua presença e rejeitar instruções concorrentes.
