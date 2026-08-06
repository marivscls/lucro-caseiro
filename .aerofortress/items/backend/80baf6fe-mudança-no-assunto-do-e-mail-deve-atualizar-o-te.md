---
id: 80baf6fe-e525-4ef6-a235-2537c5ccc86d
slug: backend
type: scar
title: Mudança no assunto do e-mail deve atualizar o teste de contrato
tags:
provenance: observado
evidence: apps/api/src/features/email/professional-trial-email.ts; apps/api/src/features/email/professional-trial-email.test.ts; pre-push de a7fcb65 em 2026-08-06
decay: stable
created: 2026-08-06T15:45:14.926038500+00:00
updated: 2026-08-06T15:45:14.926038500+00:00
validated: 2026-08-06T15:45:14.926038500+00:00
links:
---

SINTOMA (2026-08-06): ao trocar o assunto do e-mail Profissional para abrir uma thread limpa no Gmail, o pre-push falhou porque `professional-trial-email.test.ts` ainda exigia o texto antigo `1 mês de Profissional grátis`. CORREÇÃO: atualizar o teste para afirmar o novo assunto completo e manter as demais verificações de conteúdo, assets HTTPS e deep link. COMO EVITAR: toda alteração deliberada no subject do template deve ser feita junto ao teste de contrato antes do commit/push.
