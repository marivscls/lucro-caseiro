---
id: 9da860d0-eb1d-415a-af5b-3abd258a67bf
slug: build
type: scar
title: Getting Started: remover mapa de ícones exige verificar também o fallback do hero
tags: typescript, onboarding, assets, fallback, typecheck
provenance: observado
evidence: apps/mobile/src/shared/components/getting-started-overlay.tsx; `pnpm --filter @lucro-caseiro/mobile typecheck` falhou em 2026-08-24 na linha do fallback e passou após restaurar STAGE_ICONS
decay: stable
created: 2026-08-24T14:39:28.267325100+00:00
updated: 2026-08-24T14:39:28.267325100+00:00
validated: 2026-08-24T14:39:28.267325100+00:00
links: 
---

FALHA CORRIGIDA (2026-08-24): ao trocar o ícone auxiliar da etapa 2 por PNG, `STAGE_ICONS` foi removido porque parecia não ser mais usado no card, mas o fallback do hero ainda o referenciava e o typecheck falhou com TS2304. CORREÇÃO: preservar o mapa para o fallback visual e limitar a troca ao ramo do card. COMO EVITAR: antes de remover um símbolo compartilhado, buscar todas as referências no arquivo inteiro; componentes com assets podem manter fallbacks não exercitados no caminho principal.
