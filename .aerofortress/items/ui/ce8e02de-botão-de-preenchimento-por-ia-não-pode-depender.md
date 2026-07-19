---
id: ce8e02de-6901-4e2a-8a2b-a654438a13ee
slug: ui
type: scar
title: Botão de preenchimento por IA não pode depender dos campos que ele deve preencher
tags: central-marketing, ia, formularios, botoes, campanhas, ux, compatibilidade
provenance: dito
evidence: Correções explícitas da usuária e captura em 2026-07-18; apps/web/.env.local aponta para API Railway; não havia API local em 3001; apps/web/src/features/marketing/campaign-studio.tsx; apps/web/src/features/marketing/campaign-strategy.ts; apps/web/src/features/marketing/campaign-studio.test.ts; packages/contracts/src/schemas/marketing.ts; apps/api/src/features/marketing/campaign-ai.ts; 7 testes web, typecheck, lint e build aprovados
decay: stable
created: 2026-07-18T23:33:36.921074900+00:00
updated: 2026-07-19T00:04:01.478318600+00:00
validated: 2026-07-19T00:04:01.478318600+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-07-18): o botão “Preencher todos os campos com IA” do Campaign Studio foi entregue desabilitado com Público/Oferta vazios e com mensagem lateral; após liberar, retornou “Dados inválidos”; depois de aceitar a chamada, o plano básico veio preenchido, mas Pesquisa estratégica e Big Idea e produção ficaram vazios. CAUSA OBSERVADA: a Central local usa `NEXT_PUBLIC_API_URL` apontando para a API de produção, cuja versão ainda aplica o contrato e o schema de campanha antigos; o cliente novo foi implementado contra a API nova ainda não publicada. CORREÇÃO: CTA só desabilita durante a mutation, texto lateral removido, campos vazios viram instruções compatíveis com a validação antiga e, quando a resposta primária não contém os blocos novos, o frontend chama o endpoint genérico de rascunho já publicado para completar os dois blocos, valida-os com os schemas novos e mescla antes de mostrar o plano. COMO EVITAR: ao mudar contratos compartilhados, testar o cliente novo contra a API efetivamente publicada; preencher por IA não deve exigir os campos que promete preencher; compatibilidade transitória deve cobrir não só validação da entrada, mas também a forma antiga da saída.
