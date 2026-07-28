---
id: 400a1895-e3ee-4f67-b390-92307288693f
slug: ui
type: scar
title: Patches em blocos JSX repetidos precisam de contexto estrutural único
tags: jsx, patch, typecheck, react-native, new-sale
provenance: observado
evidence: apps/mobile/src/app/tabs/new-sale.tsx; pnpm --filter @lucro-caseiro/mobile typecheck (TS2367/TS1117 em 2026-07-25)
decay: stable
created: 2026-07-25T16:49:03.418027300+00:00
updated: 2026-07-25T16:49:03.418027300+00:00
validated: 2026-07-25T16:49:03.418027300+00:00
links:
---

SINTOMA (2026-07-25): ao reduzir o rodapé de `new-sale.tsx`, um patch baseado apenas em `minHeight`/`flexDirection` atingiu o bloco do passo 2 em vez do rodapé dos passos 1/3. Isso inseriu `justifyContent` duplicado e comparou `step === 1` dentro de um ramo onde `step` já era `2`; o typecheck falhou com TS2367 e TS1117. CORREÇÃO: remover a regra do bloco do passo 2 e aplicá-la no bloco identificado pelo comentário `Navigation Buttons (client and payment steps)`. COMO EVITAR: em arquivos com vários objetos de estilo semelhantes, incluir no hunk um contexto estrutural único (comentário, condição JSX ou nome do componente), e rodar typecheck imediatamente após a edição.
