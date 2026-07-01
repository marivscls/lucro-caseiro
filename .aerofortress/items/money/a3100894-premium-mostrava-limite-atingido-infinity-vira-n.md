---
id: a3100894-607f-4749-a5f8-52cd058b8c70
slug: money
type: scar
title: Premium mostrava "Limite atingido": Infinity vira null no JSON e o global isFinite(null)=true
tags: 
provenance: observado
evidence: apps/api/src/features/subscription/subscription.domain.ts:22-28 (maxX: Infinity p/ premium); apps/mobile/src/features/subscription/components/limit-banner.tsx:33; commit d8fccc7
decay: stable
created: 2026-06-26T01:02:35.219906300+00:00
updated: 2026-06-26T01:02:35.219906300+00:00
validated: 2026-06-26T01:02:35.219906300+00:00
links: 
---

SINTOMA: conta premium exibindo banner "🚀 Limite atingido!" na home. CAUSA: `buildFreemiumLimits` retorna `maxSalesPerMonth: Infinity` (etc.) pra premium, mas `JSON.stringify(Infinity) === "null"` — então o mobile recebe `max: null`. O `LimitBanner` usava o **global `isFinite(null)`**, que coage `null→0` e retorna **true**, então NÃO escondia o banner; depois `current >= null` vira `current >= 0` → "atingido". CORREÇÃO: usar `Number.isFinite` (NÃO coage; `Number.isFinite(null)===false`) → esconde o banner pra premium. Os outros consumidores já estavam certos: `plans.tsx` usa `Number.isFinite`, `use-limit-check.ts` usa `?? Infinity` (o `??` pega o null). DIAGNÓSTICO ÚTIL: se o banner de limite aparece numa conta, OU é free no limite OU é premium batendo nesse bug — só premium manda `max=null`. LIÇÃO: nunca usar o `isFinite` global em valor que pode ser null vindo de JSON; e "ilimitado" como Infinity NÃO sobrevive ao JSON (vira null) — todo cliente tem que tratar null/não-finito como ilimitado. Ver limites em [[freemium-limits-decision]].
