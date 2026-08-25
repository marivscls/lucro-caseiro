---
id: d0c11131-bd8e-4e08-bb4f-d97e31e80747
slug: ui
type: scar
title: Getting Started: CTA vinho não deve ter faixa retangular translúcida
tags: getting-started, cta, overlay, transparencia, botao, correcao
provenance: dito
evidence: apps/mobile/src/shared/components/getting-started-overlay.tsx; screenshot da usuária em 2026-08-23; ESLint direcionado e typecheck mobile aprovados
decay: stable
created: 2026-08-23T21:21:01.977598800+00:00
updated: 2026-08-23T21:21:01.977598800+00:00
validated: 2026-08-23T21:21:01.977598800+00:00
links: 
---

CORREÇÃO DA USUÁRIA (2026-08-23): o botão “Cadastrar primeiro produto” mostrava um quadrado/faixa clara no lado direito. CAUSA: uma View absoluta cobria os 42% direitos com `rgba(182, 95, 114, 0.16)`; mesmo recortada pelo pill, a borda vertical denunciava o retângulo. CORREÇÃO: remover essa camada e manter o CTA com `colors.wineFill` uniforme. COMO EVITAR: não aplicar blocos retangulares translúcidos dentro de botões arredondados quando a intenção não é uma divisão explícita; efeitos decorativos precisam respeitar a geometria visual do componente.
