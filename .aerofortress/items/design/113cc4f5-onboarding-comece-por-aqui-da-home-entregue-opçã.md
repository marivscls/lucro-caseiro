---
id: 113cc4f5-ea72-4cee-a0af-a0fb48b5ecd7
slug: design
type: decision
title: Onboarding "Comece por aqui" da home — entregue (opção B, checklist leve)
tags:
provenance: observado
evidence: apps/mobile/src/app/tabs/index.tsx (GettingStartedCard/StartStep); apps/mobile/src/shared/hooks/use-onboarding.ts (dismissedGettingStarted); commit 02e4dbf
decay: stable
created: 2026-06-25T23:18:51.712539200+00:00
updated: 2026-06-25T23:18:51.712539200+00:00
validated: 2026-06-25T23:18:51.712539200+00:00
links:
---

ENTREGUE (2026-06-25) o onboarding pedido pra novos usuários — escolhida a opção B (checklist leve, não o spotlight/coachmark do Kyte). Card "Comece por aqui" na home (`tabs/index.tsx`), logo após o LimitBanner, com 2 passos auto-marcáveis: (1) Cadastre seu primeiro produto → /products, (2) Registre sua primeira venda → /tabs/new-sale. Cada passo marca ✓ sozinho via `useProducts()`/`useSales()` (existência de itens); ao concluir os dois, fecha pra sempre. Botão "Pular" dismissa. Persistência: flag `dismissedGettingStarted` no store `useOnboarding` (SecureStore) — separado do `completed` do wizard de setup. Só aparece quando as queries estão settled e nem todos os passos feitos (sem flash pra usuário estabelecido, que auto-dismissa no 1º load). Racional da escolha B sobre A (spotlight): respeita o princípio #1 (simplicidade radical, máx 3 toques, público idoso) e reusa conteúdo; o coachmark do Kyte é puramente explicativo de telas que o LC já tem. ponytail: o check de existência reusa as listas cacheadas; endpoint de contagem dedicado seria mais barato se a home pesar.
