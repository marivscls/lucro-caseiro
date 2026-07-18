---
id: 88fcd973-5b20-445a-ba58-d81488b68c61
slug: ui
type: scar
title: Calculadora pública: explicação de taxas deve refletir taxa zero
tags: web, calculadora, precificacao, taxas, estado-zero, copy
provenance: observado
evidence: apps/web/src/features/landing/price-calculator.tsx; captura Chromium da rota /landing/calculadora
decay: stable
created: 2026-07-17T01:00:24.575440400+00:00
updated: 2026-07-17T01:00:24.575440400+00:00
validated: 2026-07-17T01:00:24.575440400+00:00
links: 
---

SINTOMA (2026-07-16): a calculadora pública calculava corretamente o preço quando taxas eram 0%, mas o painel dizia que “a taxa foi calculada sobre o preço final”, afirmando uma operação que não aconteceu. A revisão visual encontrou a inconsistência. CORREÇÃO: texto condicional — com taxa, explica o gross-up; sem taxa, informa que o preço considera apenas custos e margem. COMO EVITAR: toda explicação de resultado financeiro precisa derivar do mesmo estado usado no cálculo; validar também os estados zero/opcional, não só o valor numérico.
