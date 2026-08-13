---
id: 56d9399d-4c44-4a79-b5d4-3f549a06c4c8
slug: ui
type: decision
title: App nativo oferece acesso ao PWA desktop pelas Configurações
tags: mobile, pwa, desktop, configuracoes, white-label
provenance: observado
evidence: apps/mobile/src/app/settings.tsx; apps/mobile/src/env.d.ts; apps/mobile/package.json; ESLint e typecheck aprovados, 438 testes mobile aprovados em 2026-08-11
decay: stable
created: 2026-08-11T23:47:34.993924300+00:00
updated: 2026-08-11T23:47:34.993924300+00:00
validated: 2026-08-11T23:47:34.993924300+00:00
links:
---

O app nativo do Lucro Caseiro oferece em Configurações a opção “Usar no computador”, visível somente fora da web. Ela abre o modal padrão, orienta a pessoa a entrar com a mesma conta e permite copiar ou compartilhar o endereço do PWA. A URL pode ser definida por `EXPO_PUBLIC_WEB_APP_URL`; o Lucro Caseiro usa `https://app.lucrocaseiro.com.br` como fallback confirmado, enquanto outras marcas só exibem a opção quando tiverem URL configurada.
