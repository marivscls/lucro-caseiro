---
id: ef2aac9f-6a1d-4277-97a2-2360365baddc
slug: scripts
type: scar
title: Auditoria Playwright da PWA não deve esperar networkidle nem serviceWorker.ready sem teto
tags: playwright, pwa, auditoria, timeout, evidencia
provenance: observado
evidence: .aerofortress/tmp/playwright-runner/desktop-audit.cjs; duas execuções encerradas sem screenshots em .aerofortress/tmp/desktop-audit
decay: stable
created: 2026-07-17T02:23:17.310454900+00:00
updated: 2026-07-17T02:23:17.310454900+00:00
validated: 2026-07-17T02:23:17.310454900+00:00
links:
---

SINTOMA (2026-07-16): o coletor desktop ficou indefinidamente sem produzir capturas; primeiro `networkidle` nunca chegou por consultas em segundo plano e depois `navigator.serviceWorker.ready` ficou pendente. A ausência de saída também levou a uma afirmação prematura de login concluído sem evidência. CORREÇÃO: usar `domcontentloaded`, esperas com timeout explícito, navegação interna da SPA por history/popstate e log incremental em arquivo; só afirmar uma etapa após screenshot/log correspondente existir. COMO EVITAR: PWAs com polling/service worker nunca devem ter readiness aberto como condição única de uma auditoria automatizada.
