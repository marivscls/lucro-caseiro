---
id: b6727ebb-2c01-4211-a6eb-043099e9046b
slug: validation
type: scar
title: Campo numérico vazio deve ser rejeitado antes de chamar Number
tags: validacao, javascript, rotulos, numeros
provenance: observado
evidence: apps/mobile/src/features/labels/nutrition.ts
decay: stable
created: 2026-07-19T17:39:45.535512300+00:00
updated: 2026-07-19T17:39:45.535512300+00:00
validated: 2026-07-19T17:39:45.535512300+00:00
links:
---

SINTOMA (2026-07-19): a validação da tabela nutricional podia aceitar `""` como zero porque `Number("") === 0`. CORREÇÃO: aparar e rejeitar a string vazia antes da conversão numérica. PREVENÇÃO: em fronteiras com input textual, validar presença antes de usar `Number`, mesmo quando zero é um valor válido.
