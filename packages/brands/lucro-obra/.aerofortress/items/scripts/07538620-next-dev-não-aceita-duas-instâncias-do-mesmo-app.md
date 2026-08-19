---
id: 07538620-ecb9-426e-9ee5-da27a5067a3e
slug: scripts
type: scar
title: Next dev não aceita duas instâncias do mesmo app
tags: nextjs, dev-server, porta, brand, processo
provenance: observado
evidence: Execução local em 2026-08-14: a tentativa na porta 3001 anunciou Ready, depois encerrou com “Another next dev server is already running” por causa da instância PID 28028 na porta 3000; após substituir a instância, HTTP 200 foi observado na porta 3001.
decay: seasonal
created: 2026-08-14T19:31:28.721226200+00:00
updated: 2026-08-14T19:31:28.721226200+00:00
validated: 2026-08-14T19:31:28.721226200+00:00
links:
---

Ao iniciar `apps/web`, verifique primeiro se já existe um `next dev` desse diretório. O Next.js 16 mantém um lock em `.next/dev/lock` e rejeita uma segunda instância mesmo em outra porta. Para trocar marca/porta, encerre a árvore exata do processo existente e então inicie uma única instância com `BRAND` e `NEXT_PUBLIC_BRAND` definidos; valide com listener + HTTP, não apenas pela linha `Ready`.
