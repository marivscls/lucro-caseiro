---
id: e416be94-b7b1-410b-9cf9-e75bad0f869c
slug: build
type: scar
title: Commit pode varrer arquivos já staged por trabalho paralelo + -m sobrescrito por COMMIT_EDITMSG
tags: git, commit, colisao, build, scar
provenance: observado
evidence: commit b698582 em origin/main; git reset --mixed origin/main para reconciliar
decay: stable
created: 2026-06-25T14:30:46.506191+00:00
updated: 2026-06-25T14:30:46.506191+00:00
validated: 2026-06-25T14:30:46.506191+00:00
links:
---

**O que deu errado (2026-06-25):** ao commitar a Fase 3 (purchases) com `git add <meus arquivos>` + `git commit -m "feat(purchases)..."`, o commit resultante (b698582, pushado em main) **juntou 3 arquivos de tema que a dona tinha staged em paralelo** e saiu com a **mensagem do tema** (do `.git/COMMIT_EDITMSG` preexistente), não a minha. O local ainda divergiu (um commit de tema concorrente, b69a326). Bagunça: dois trabalhos num commit só, mensagem errada, local≠remoto.

**Como evitar:**

1. Antes de `git add`, rodar `git status --short` e checar se há **arquivos já staged** (coluna A/M na 1ª posição) ou commit em andamento — a dona trabalha no repo EM PARALELO.
2. Stage explícito dos MEUS arquivos e conferir `git diff --cached --name-only` == exatamente o que eu mexi (não mais).
3. Se `git log -1` após o commit mostrar mensagem ≠ a que passei, foi sobrescrita por COMMIT_EDITMSG → investigar antes de pushar.
4. Reconciliar local divergido com `git reset --mixed origin/main` (NÃO `--hard` — destrói o WIP não-commitado dela). origin/main era a versão correta.

Evidência: main b698582 (bundle purchases+tema sob msg de tema). Relacionado: [[push-direct-to-main]] (ela pusha direto, sem PR, e mexe no repo junto comigo).
