---
id: 1178f9eb-3973-493b-a4b6-465586f27a65
slug: design
type: decision
title: Pedido pendente: onboarding coachmark/spotlight pra novos usuários (estilo Kyte)
tags: onboarding, coachmark, spotlight, ux, pendente
provenance: dito
evidence: apps/mobile/src/shared/hooks/use-onboarding.ts; apps/mobile/src/app/tabs/index.tsx (dirty); app/onboarding.tsx
decay: volatile
created: 2026-06-25T23:07:54.730550900+00:00
updated: 2026-06-25T23:07:54.730550900+00:00
validated: 2026-06-25T23:07:54.730550900+00:00
links: 
---

A usuária pediu (mostrando captura do Kyte) um onboarding **coachmark/spotlight** pra novos usuários: escurece a home, destaca um botão (ex.: "Produtos/Serviços") e mostra balão "Comece por aqui". Pergunta foi "dá pra fazer assim?". Resposta: sim.

**Plano proposto (a confirmar pela usuária via AskUserQuestion — 2 caminhos):**

- (A) **Coachmark spotlight** igual Kyte: componente `<Coachmark>` próprio (sem lib pesada) que mede o alvo com `measureInWindow`, escurece o resto com furo sobre o botão, balão passo-a-passo. Curto (3-4 passos: Produtos→Nova venda→Caixa/Catálogo), sempre pulável. Persistir "viu" no `use-onboarding.ts` (já tem `completed`).
- (B) **Cartão "Comece por aqui" guiado** (checklist com CTAs, sem overlay/medição) — mais simples, robusto e melhor pra idosos; alinhado ao padrão de EmptyState rico que já usamos.

**Blocker:** o spotlight (A) precisa instrumentar os botões da home `apps/mobile/src/app/tabs/index.tsx`, que está SUJO com WIP não-commitado do outro agente (Codex) — não bundlar; limpar/commitar esse arquivo antes, OU começar pelo componente `<Coachmark>` que não toca nele. Infra existente: `use-onboarding.ts` (zustand+SecureStore, `completed`/`completeOnboarding`), `app/onboarding.tsx` (wizard de setup inicial). Sem lib de tour instalada hoje.
