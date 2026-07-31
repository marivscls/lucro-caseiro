---
id: 21b7d96f-b698-4b52-8d0c-75bb61bd3ee4
slug: video
type: scar
title: Mediabunny instalado usa FilePathSource para arquivos locais no Node
tags: mediabunny, video, node, filepathsource, pnpm
provenance: observado
evidence: apps/promo-video/package.json; validação de apps/promo-video/out/lucro-caseiro-play-store.mp4 em 2026-07-31
decay: stable
created: 2026-07-31T17:00:17.083942500+00:00
updated: 2026-07-31T17:00:17.083942500+00:00
validated: 2026-07-31T17:00:17.083942500+00:00
links: []
---

SINTOMA (2026-07-31): a validação do MP4 falhou porque o exemplo da skill importava `FileSource`, export inexistente na versão de Mediabunny instalada em `apps/promo-video`; uma segunda tentativa também duplicou o caminho porque `pnpm --dir apps/promo-video exec` muda o cwd do processo. CORREÇÃO: no Node deste projeto, usar `FilePathSource` com `resolve('out/<arquivo>.mp4')`, relativo ao diretório do pacote. COMO EVITAR: conferir os exports reais da versão instalada e lembrar que `pnpm --dir` altera o cwd antes de montar caminhos.
