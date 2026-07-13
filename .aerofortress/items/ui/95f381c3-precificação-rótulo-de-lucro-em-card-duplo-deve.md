---
id: 95f381c3-223e-4f44-b966-e9f40f1dede2
slug: ui
type: scar
title: Precificação: rótulo de lucro em card duplo deve caber em uma linha
tags: precificacao, layout, responsividade, android, texto
provenance: observado
evidence: apps/mobile/src/features/pricing/components/pricing-result.tsx; apps/mobile/.maestro/screenshots/15-precificacao-layout.png; screenshot enviada pela usuária em 2026-07-13; emulador Android lucro_e2e; ESLint e typecheck mobile aprovados
decay: stable
created: 2026-07-13T13:34:02.061060+00:00
updated: 2026-07-13T14:47:00.180816900+00:00
validated: 2026-07-13T14:47:00.180816900+00:00
links:
---

SINTOMA (2026-07-13, Android): no resultado da Precificação, o rótulo “LUCRO LÍQUIDO” do card de Projeção mensal quebrava em duas linhas enquanto “FATURAMENTO” permanecia em uma, desalinhando os cards. CAUSA: os dois cards dividem a largura, mas somente os valores monetários usavam adaptação de fonte; o rótulo mais longo não tinha restrição. CORREÇÃO: aplicar `numberOfLines={1}`, `adjustsFontSizeToFit` e `minimumFontScale={0.7}` ao rótulo “LUCRO LÍQUIDO”. COMO EVITAR: em cards lado a lado, rótulos variáveis/assimétricos devem declarar a estratégia responsiva, mantendo uma linha quando o design depende de alturas iguais. VALIDADO VISUALMENTE: emulador Android `lucro_e2e` (1080×2400) com o componente real mostrou “LUCRO LÍQUIDO” em uma linha, alinhado a “FATURAMENTO”, e `R$ 1.615,00` sem corte.
