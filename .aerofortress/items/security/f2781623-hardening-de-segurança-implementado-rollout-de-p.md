---
id: f2781623-7f9c-4b6b-a20c-c9ad5301c234
slug: security
type: fact
title: Hardening de segurança implementado; rollout de produção pendente
tags: security, billing, csp, cors, rate-limit, ci
provenance: observado
evidence: .aerofortress/specs/prd-hardening-seguranca-2026-08.md; docs/adr/0010-seguranca-defesa-em-profundidade.md; pnpm lint/typecheck/test/build/security:audit/security:secrets em 2026-08-04
decay: seasonal
created: 2026-08-04T12:08:38.119944400+00:00
updated: 2026-08-04T12:56:50.575062700+00:00
validated: 2026-08-04T12:56:50.575062700+00:00
links:
---

Em 2026-08-04, o hardening do PRD foi implementado no código: Stripe verifica assinatura sem bypass; Google Play exige obfuscatedExternalAccountId do usuário e vínculo único por SHA-256 do token; audit de produção caiu de 52 ocorrências para zero; Next/PWA/catálogo ganharam CSP nonce/hash e headers; CORS de produção exige allowlist; JSON tem teto; operações sensíveis usam buckets PostgreSQL fail-closed; CI audita dependências/segredos e actions são pinadas; testes impedem associação cruzada de conversa/cliente. Duas service accounts locais foram movidas para C:\Users\maria\.secrets\lucro-caseiro. Validação observada: lint, 7 typechecks, 1.118 testes, builds API/Next/PWA, Sherif, context lint, scanner e audit passaram; probes locais de Next/PWA retornaram CSP/HSTS/nosniff. Pendente fora do código: aplicar migrações 049/050, configurar Railway, publicar e validar headers/CORS/Stripe/Google nos ambientes oficiais. Knip mantém débitos preexistentes não relacionados.
