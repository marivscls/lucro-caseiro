---
id: deb414de-b34f-4136-a8e4-44aa17d10bf4
slug: build
type: scar
title: Timeout do shell pode deixar o processo EAS vivo e causar build duplicado
tags: eas, windows, processo, duplicata
provenance: observado
evidence: Sessão de 2026-08-31; build único confirmado: 90414e01-4265-4f96-b23e-9f8ceb359c1c
decay: stable
created: 2026-08-31T12:42:30.090757500+00:00
updated: 2026-08-31T12:42:30.090757500+00:00
validated: 2026-08-31T12:42:30.090757500+00:00
links: 
---

FALHA EVITADA (2026-08-31): `pnpm exec eas build --profile development --platform android --non-interactive --no-wait` excedeu o timeout do shell, mas o processo filho `eas-cli` continuou ativo empacotando o projeto. Uma segunda tentativa criou outra árvore de processos e poderia enviar um build duplicado.

CORREÇÃO: antes de repetir após timeout, verificar tanto a fila com `eas build:list` quanto a árvore `pnpm → cmd → node eas-cli` pelo `ParentProcessId`. Se o processo original ainda estiver consumindo CPU, aguardar; se uma duplicata já foi iniciada, encerrar explicitamente apenas a árvore mais nova antes da criação do job. Nesta ocorrência, somente o job `90414e01-4265-4f96-b23e-9f8ceb359c1c` foi criado.
