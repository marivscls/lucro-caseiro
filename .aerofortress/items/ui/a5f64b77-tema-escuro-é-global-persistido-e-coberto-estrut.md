---
id: a5f64b77-aea0-4336-b093-53e30149b73b
slug: ui
type: fact
title: Tema escuro é global, persistido e coberto estruturalmente por todas as rotas
tags: dark-mode, theme, mobile, brands, audit
provenance: observado
evidence: packages/ui/src/theme-context.tsx; packages/ui/src/theme.ts; apps/mobile/src/app/_layout.tsx; apps/mobile/src/shared/hooks/theme-pref.ts; apps/mobile/src/app/settings.tsx; packages/brands/src/*/brand.json; apps/mobile/src/shared/components/skeleton.tsx:641; teste src/test/lucro-caseiro-theme.test.ts aprovado em 2026-08-14
decay: seasonal
created: 2026-08-14T18:04:03.108842600+00:00
updated: 2026-08-14T18:04:03.108842600+00:00
validated: 2026-08-14T18:04:03.108842600+00:00
links:
---

O app mobile monta um `ThemeProvider` global com temas claro/escuro derivados da marca ativa, segue o esquema do sistema quando não há preferência e persiste a escolha do usuário em `themeMode`. A auditoria de 2026-08-14 encontrou 42 arquivos de rota: 38 consomem `useTheme` diretamente e os quatro restantes são redirects/wrappers que herdam componentes tematizados. Todas as seis marcas possuem configuração escura explícita ou fallback do design system. Isso comprova cobertura estrutural, mas não substitui validação visual rota a rota; previews de recibo/etiqueta e câmera mantêm cores fixas intencionais, e o divisor de tabela do skeleton ainda usa preto translúcido fixo.
