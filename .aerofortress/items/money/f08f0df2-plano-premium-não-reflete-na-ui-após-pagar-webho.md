---
id: f08f0df2-1360-4e72-8854-907a8b785a37
slug: money
type: scar
title: Plano premium não reflete na UI após pagar — webhook é assíncrono, um invalidate só corre na frente
tags:
provenance: observado
evidence: apps/mobile/src/features/subscription/use-stripe.ts (pollForPremium); apps/mobile/src/app/_layout.tsx (AppState); commit dabeecc
decay: stable
created: 2026-06-25T23:32:38.330210300+00:00
updated: 2026-06-25T23:32:38.330210300+00:00
validated: 2026-06-25T23:32:38.330210300+00:00
links:
---

SINTOMA: depois de assinar, o botão "Desbloquear premium" não some e a comemoração (PremiumSuccess/confete) não dispara. CAUSA: a ativação do plano acontece no backend por **webhook assíncrono** (Stripe), então um único `invalidateQueries(["subscription"])` logo após o checkout fechar lê o perfil ainda como `free` — o watcher de `profile.plan` nunca vê virar premium. LIÇÃO: nunca reconcilie estado de pagamento com um único refetch imediato; o provedor confirma fora de banda. COMO EVITAR: (1) poll limitado do perfil até virar premium (use-stripe `pollForPremium`: até 6× a cada 2,5s, escreve no cache `["subscription","profile"]`); (2) revalidar a assinatura no `AppState` `active` (volta ao foco). A tela de comemoração já existia e é só disparada pelo watcher — o bug era o plano não atualizar. Vale pra qualquer fluxo provider→webhook→estado (Google Play `sync-plan` é síncrono, então não sofre).
