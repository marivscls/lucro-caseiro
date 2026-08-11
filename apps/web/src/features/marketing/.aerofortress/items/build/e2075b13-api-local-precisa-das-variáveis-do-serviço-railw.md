---
id: e2075b13-a78e-4b39-ac63-acf68ff782ef
slug: build
type: fact
title: API local precisa das variáveis do serviço Railway
tags: dev, api, railway, environment
provenance: observado
evidence: apps/api/.env; execução verificada em 2026-08-10
decay: seasonal
created: 2026-08-10T18:20:32.530535700+00:00
updated: 2026-08-10T18:20:32.530535700+00:00
validated: 2026-08-10T18:20:32.530535700+00:00
links:
---

Em 2026-08-10, `apps/api/.env` continha placeholders inválidos para SUPABASE_URL, SUPABASE_ANON_KEY e DATABASE_URL, então `pnpm --filter @lucro-caseiro/api dev` não iniciou. A API local subiu na porta 3001 com `railway run -s @lucro-caseiro/api pnpm --filter @lucro-caseiro/api dev`; a web local foi iniciada na 3000 com NEXT_PUBLIC_API_URL=http://localhost:3001. O health retornou 200 com marketingAi=true. Esse modo usa as variáveis do ambiente production do Railway e, portanto, conecta a serviços/dados de produção.
