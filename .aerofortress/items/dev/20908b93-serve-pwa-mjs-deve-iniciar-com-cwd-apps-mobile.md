---
id: 20908b93-b0f5-427f-b252-321f9b8fcb24
slug: dev
type: scar
title: serve-pwa.mjs deve iniciar com cwd apps/mobile
tags: pwa, preview, cwd, porta-8083, node
provenance: observado
evidence: .aerofortress/serve-pwa-8083.stderr.log; apps/mobile/scripts/serve-pwa.mjs
decay: stable
created: 2026-08-19T01:51:32.854541400+00:00
updated: 2026-08-19T01:51:32.854541400+00:00
validated: 2026-08-19T01:51:32.854541400+00:00
links:
---

FALHA CORRIGIDA (2026-08-18): ao reiniciar o preview canônico 8083, a linha de comando observada era `node scripts/serve-pwa.mjs lucro-caseiro 8083`, mas o processo antigo ocultava que seu diretório de trabalho era `apps/mobile`. Iniciar a mesma linha na raiz fez Node procurar `<repo>/scripts/serve-pwa.mjs`, encerrar com MODULE_NOT_FOUND e deixou a porta temporariamente sem listener. CORREÇÃO: iniciar `node scripts/serve-pwa.mjs lucro-caseiro 8083` com cwd `apps/mobile` (ou usar o caminho absoluto correto) e provar HTTP 200 antes de anunciar a retomada.
