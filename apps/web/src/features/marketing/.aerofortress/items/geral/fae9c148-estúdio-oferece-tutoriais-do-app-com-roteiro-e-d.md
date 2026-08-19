---
id: fae9c148-3303-4df7-9fd3-00bcd5fc72cd
slug: geral
type: contract
title: Estúdio oferece Tutoriais do app com roteiro e direção visual variáveis
tags: tutorial, posts, carrossel, lucro-caseiro, desktop
provenance: observado
evidence: apps/desktop/src/PostCampaignSources.tsx; backends/Selenita.Api/Modules/Creative/PostProductionPrompt.cs; backends/Selenita.Api/Modules/Creative/PostDesignGptVisualKit.EditorialStepTutorial.cs; 28 testes desktop + 4 backend focados, typecheck, lint e Design Doctor verdes em 2026-08-15.
decay: stable
created: 2026-08-15T16:47:29.127820700+00:00
updated: 2026-08-15T16:47:29.127820700+00:00
validated: 2026-08-15T16:47:29.127820700+00:00
links:
---

IMPLEMENTADO E VALIDADO EM 2026-08-15: o Estúdio de Posts do desktop Tauri expõe a categoria visível “Tutoriais do app”. A geração preserva `format: tutorial`, escolhe uma única funcionalidade confirmada alinhada à campanha e produz um carrossel de 3 a 10 slides usando somente os passos necessários, sem completar número fixo. A produção e o Kit Visual variam entre interface real confirmada, ação/controle, tipografia, produto, ferramenta, objetos, cena e resultado. A personagem é opcional e pontual: não aparece por obrigação nem em todos os slides. O Kit preserva exatamente a quantidade do roteiro aprovado e não fabrica telas ou etapas. Requisitos de origem: e371da81 e 01fe47a9.
