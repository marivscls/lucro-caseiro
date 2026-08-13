---
id: 64053765-c641-4612-9ed5-f9abfbd77962
slug: marketing
type: scar
title: Campanha editorial ativa precisa alimentar e priorizar o Estúdio de Posts
tags: campaigns, posts, post-draft, ui, ordering, traceability
provenance: dito
evidence: apps/desktop/src/PostCampaignSources.tsx; apps/desktop/src/PostsLibraryPage.test.tsx
decay: stable
created: 2026-08-12T01:06:11.642343+00:00
updated: 2026-08-12T03:06:53.324810500+00:00
validated: 2026-08-12T03:06:53.324810500+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-08-11 e 2026-08-12): campanhas ativas persistidas como MarketingResource(kind="campaign") apareciam na grade de Campanhas, mas o Estúdio de Posts consultava somente o cadastro técnico de CampaignPlan e os Post Drafts já produzidos. Depois de integradas, campanhas que já tinham post continuavam ocupando o topo e escondiam as próximas tarefas. REGRA: toda campanha editorial ativa deve aparecer no Estúdio como fonte de “Gerar novo post”; campanhas ainda sem post ficam primeiro, e a campanha deve ir para o fim da grade imediatamente após a criação concluir, preservando a ordem relativa de cada grupo. A geração cria uma ideia completa e rastreável com sourceCampaignId/sourceCampaignTitle, persiste e aprova essa ideia pela ação explícita, então gera um novo Post Draft; campanhas arquivadas não aparecem e gerações adicionais não sobrescrevem posts anteriores.
