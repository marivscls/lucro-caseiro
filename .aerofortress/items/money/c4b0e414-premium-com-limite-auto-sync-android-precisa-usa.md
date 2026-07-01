---
id: c4b0e414-d42a-4f1c-a3d9-354848204b71
slug: money
type: scar
title: Premium com limite: auto-sync Android precisa usar compra direta depois do token
tags: premium, limits, android, sync
provenance: observado
evidence: apps/mobile/src/features/subscription/use-subscription.ts; apps/mobile/src/features/subscription/limits.ts; apps/mobile/src/shared/hooks/use-show-ads.ts
decay: stable
created: 2026-06-29T20:09:04.354384100+00:00
updated: 2026-06-29T20:09:04.354384100+00:00
validated: 2026-06-29T20:09:04.354384100+00:00
links: 
---

SINTOMA: conta Premium ainda vê banners/paywalls de limite em algumas telas. CAUSAS corrigidas: (1) no boot Android, `useSubscription` chamava `getAvailablePurchases()` mas ignorava o resultado direto e podia depender do `availablePurchases` do hook, que já se mostrou atrasado; além disso a tentativa podia rodar antes do token existir e não sincronizar o backend. (2) `LimitBanner`/`useLimitCheck` tratavam perfil ainda não carregado como free, então limites free em cache podiam bloquear/mostrar paywall até o perfil chegar. COMO EVITAR: no boot/restauração, sincronizar compras retornadas diretamente por `getAvailablePurchases()` somente após `token` existir; no cliente, nunca bloquear por limite sem perfil carregado e usar sempre `isProfilePremiumActive(profile)` nos gates premium.
