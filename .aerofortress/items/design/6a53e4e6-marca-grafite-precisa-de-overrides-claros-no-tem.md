---
id: 6a53e4e6-f6a5-4086-a128-aaefc3bd7a7e
slug: design
type: scar
title: Marca grafite precisa de overrides claros no tema escuro
tags: contraste, tema-escuro, obra, grafite, acessibilidade
provenance: observado
evidence: packages/brands/src/lucro-obra/brand.json; capturas headless antes/depois em http://localhost:8088 em 2026-08-14
decay: stable
created: 2026-08-14T14:45:11.400090+00:00
updated: 2026-08-14T14:45:11.400090+00:00
validated: 2026-08-14T14:45:11.400090+00:00
links:
---

SINTOMA (2026-08-14): ao trocar o Lucro na Obra de azul para grafite `#4B5563`, o primeiro build escuro deixou wordmark, links e botão com aparência desativada porque `buildThemes` reutilizou tons grafite escuros em superfícies `#222A30`. CORREÇÃO: manter a marca/logo grafite, mas definir `primaryStrongDark: #D1D5DB` para texto/links e `primaryInteractiveDark: #9CA3AF` para ações no tema escuro. PREVENÇÃO: toda paleta neutra nova deve ser validada em captura do tema escuro, não apenas pelo hex da logo.
