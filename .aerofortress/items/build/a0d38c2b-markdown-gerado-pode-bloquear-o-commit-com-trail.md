---
id: a0d38c2b-4032-492b-a38f-04e7cb5f6991
slug: build
type: scar
title: Markdown gerado pode bloquear o commit com trailing whitespace
tags: git, markdown, diff-check, aerofortress
provenance: observado
evidence: Preparação do commit da Central de Marketing em 2026-07-16: git diff --cached --check falhou em itens .aerofortress e documentos docs/marketing; normalização restrita aos Markdown staged e nova execução aprovada.
decay: stable
created: 2026-07-17T02:02:36.752408400+00:00
updated: 2026-07-17T02:02:36.752408400+00:00
validated: 2026-07-17T02:02:36.752408400+00:00
links:
---

SINTOMA: `git diff --cached --check` bloqueou o commit da Central de Marketing porque itens gerados da rede continham `links: ` com espaço final e documentos Markdown usavam dois espaços no fim da linha. CORREÇÃO: remover apenas whitespace final dos arquivos Markdown já staged, adicionar novamente esses arquivos e repetir o diff-check. COMO EVITAR: antes de commitar itens `.aerofortress` ou lotes de documentação, rodar `git diff --cached --check`; quando falhar, limitar a normalização ao conjunto staged para não tocar trabalhos paralelos ou arquivos fora do escopo.
