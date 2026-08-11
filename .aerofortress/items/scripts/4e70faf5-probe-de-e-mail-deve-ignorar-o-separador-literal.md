---
id: 4e70faf5-0c2a-4107-9f37-c873c649de15
slug: scripts
type: scar
title: Probe de e-mail deve ignorar o separador literal do pnpm
tags: pnpm, cli, email, argumentos, teste-de-regressao
provenance: observado
evidence: apps/api/src/features/email/send-test-email.ts; primeira execução do probe em 2026-08-06 falhou no parse antes de createResendEmailSender/sendEmail
decay: stable
created: 2026-08-06T13:29:43.481058100+00:00
updated: 2026-08-06T13:29:43.481058100+00:00
validated: 2026-08-06T13:29:43.481058100+00:00
links:
---

SINTOMA (2026-08-06): `pnpm --filter @lucro-caseiro/api email:test -- destinatario --confirm` repassou `"--"` em `process.argv`; o script escolheu esse primeiro argumento como destinatário e o Zod falhou com `Invalid email`. Nenhum request chegou ao Resend. CORREÇÃO: o parser do probe remove `--` e flags conhecidas, exige exatamente um argumento posicional e tem teste de regressão com a forma documentada. PREVENÇÃO: scripts operacionais chamados por `pnpm run` não devem assumir que o separador é consumido; testar a linha de comando exatamente como aparece na documentação antes de usar credenciais reais.
