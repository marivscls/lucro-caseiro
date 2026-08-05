---
id: 1034d341-bfbd-45af-a821-b1baed3d2431
slug: catalog
type: fact
title: Solicitações públicas de horário aparecem dentro do serviço e geram push Expo
tags: serviços, catálogo público, solicitações, push, expo, supabase, release
provenance: observado
evidence: packages/database/src/migrations/048_push_notification_tokens.sql; Supabase project ujwxvpceqigvyxcqolch verificado em 2026-08-04; GitHub commits c776ff8 e 0ee7309; Actions CI 30913545337 e pages-build-deployment 30913540238
decay: seasonal
created: 2026-08-04T11:07:35.192539+00:00
updated: 2026-08-04T13:26:57.746378200+00:00
validated: 2026-08-04T13:26:57.746378200+00:00
links:
---

O formulário público `POST /:slug/service-bookings` grava a solicitação em `public_service_booking_requests` com status inicial `new`. No aplicativo do prestador, ela é exibida em Serviços: tocar no serviço correspondente abre o painel, cuja seção “Solicitações de horário” permite chamar o cliente no WhatsApp e marcar contato, confirmação ou recusa. O registro autenticado de tokens Expo e o envio best-effort de `SERVICE_BOOKING` foram publicados em `main`; tocar no push direciona para `/services`, e falha de entrega não desfaz nem bloqueia a solicitação. Em 2026-08-04, a migration 048 foi aplicada no projeto Supabase correto `ujwxvpceqigvyxcqolch` e verificada com tabela, seis colunas, índice, CHECK de plataforma, FK cascade e RLS ativo. Código publicado no commit `c776ff8`, com correção de fixture no `0ee7309`. O GitHub Pages concluiu; o CI passou scanner, auditoria, lint, typecheck, testes e Sherif, mas permaneceu vermelho no `knip:full` por inventário amplo de arquivos/dependências/exports fora do escopo de push. Credenciais EAS de push não foram validadas nesta implantação.
