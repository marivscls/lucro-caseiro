---
id: f7ea7935-a39b-49ca-a2de-b13190996a47
slug: ui
type: scar
title: Campos lado a lado no desktop alinham pela base apesar de rótulos quebrados
tags: desktop, formularios, inputs, alinhamento, servicos, flexbox
provenance: dito
evidence: Captura da usuária em 2026-07-28; apps/mobile/src/features/services/components/service-form.tsx; lint e typecheck do pacote mobile aprovados
decay: stable
created: 2026-07-29T01:36:14.575201900+00:00
updated: 2026-07-29T01:36:14.575201900+00:00
validated: 2026-07-29T01:36:14.575201900+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-28): no formulário de Serviços, os inputs de custos ficavam em alturas diferentes porque alguns rótulos ocupavam duas linhas e outros apenas uma. CAUSA: a linha com `flexWrap` mantinha o alinhamento padrão dos contêineres `Input`, então a altura extra do rótulo deslocava só alguns controles. CORREÇÃO: no desktop, alinhar os filhos da linha pela base (`alignItems: "flex-end"`); preservar `stretch` no mobile. COMO EVITAR: em linhas desktop de campos com rótulos de comprimentos variados, validar o eixo dos controles, não apenas a largura dos contêineres.
