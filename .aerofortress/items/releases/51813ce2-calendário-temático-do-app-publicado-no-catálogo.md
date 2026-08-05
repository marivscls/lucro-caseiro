---
id: 51813ce2-8afa-4e21-b2b5-ca2fc2ee640d
slug: releases
type: fact
title: Calendário temático do app publicado no catálogo público
tags: release, catalogo, servicos, calendario, data, railway, producao, ui
provenance: observado
evidence: commit 85c0414ecb57c693db675cd8bd804580b526379c; Railway deployment cfaa38fb-31ed-4e3c-865a-da7ef6a015ed; https://catalogo.lucrocaseiro.com.br/c/papelaria?tipo=servicos; https://catalogo.lucrocaseiro.com.br/api/v1/health; GitHub Actions run 30729058241; validação Chrome local 900x900 e 500x844
decay: seasonal
created: 2026-08-02T02:12:36.088957700+00:00
updated: 2026-08-02T02:36:48.737166600+00:00
validated: 2026-08-02T02:36:48.737166600+00:00
links:
---

Em 2026-08-01/02, o formulário público de solicitação de serviços foi corrigido e publicado para reutilizar o padrão visual e comportamental do `CalendarModal` do app. O campo `booking-date` agora usa `DD/MM/AAAA` com ícone e abre modal centralizado temático com navegação de mês, grade de 42 dias, destaque do dia atual/selecionado e escolha de ano; a data é convertida para ISO somente no envio. O horário permanece como campo temático mascarado `HH:MM`. O Railway concluiu o deployment `cfaa38fb-31ed-4e3c-865a-da7ef6a015ed`; health e catálogo responderam HTTP 200, a URL real contém o novo calendário e não contém mais `<input type="date">`. A interação foi validada visualmente em Chrome nas variantes desktop e compacta. O CI geral do GitHub continua falhando somente no fixture paralelo e não publicado `apps/mobile/src/features/recipes/statistics.test.ts`, que não possui `publicEnabled` no main; o deploy da API foi concluído e validado.
