---
id: 0e2a3c51-8d64-4783-897c-7eb201c98503
slug: ui
type: scar
title: Catálogo público: FAB do WhatsApp não pode cobrir CTAs da listagem
tags: catalogo-publico, whatsapp, mobile, sobreposicao
provenance: observado
evidence: apps/api/src/features/catalog/catalog.domain.ts; .aerofortress/catalog-cdp-390-services.png
decay: stable
created: 2026-08-17T00:51:05.066025900+00:00
updated: 2026-08-17T00:51:05.066025900+00:00
validated: 2026-08-17T00:51:05.066025900+00:00
links:
---

FALHA CORRIGIDA (2026-08-16): na validação visual do redesign do catálogo público, o botão flutuante do WhatsApp cobria o botão `Solicitar horário` do card de serviço e podia cruzar ações de pedido nos produtos. CORREÇÃO: conservar o FAB como atalho global, mas recalcular sua interseção no carregamento, scroll e resize e aplicar o estado visual/inoperante `obscured` sempre que ele atravessar ferramentas, navegação, cabeçalho ou CTAs da listagem. COMO EVITAR: validar FABs contra os elementos interativos no fim do primeiro viewport e ao longo da rolagem, não apenas contra a safe area.
