---
id: f2781623-7f9c-4b6b-a20c-c9ad5301c234
slug: security
type: fact
title: Hardening de segurança publicado e validado em produção
tags: security, production, railway, stripe, google-play, csp, cors, rate-limit
provenance: observado
evidence: .aerofortress/specs/prd-hardening-seguranca-2026-08.md; commits ad4f1f3 e 75013cb; probes HTTPS em lucrocaseiro.com.br, app.lucrocaseiro.com.br e catalogo.lucrocaseiro.com.br em 2026-08-04
decay: seasonal
created: 2026-08-04T12:08:38.119944400+00:00
updated: 2026-08-04T13:39:21.293196300+00:00
validated: 2026-08-04T13:39:21.293196300+00:00
links:
---

Em 2026-08-04, o hardening do PRD/ADR foi publicado na main (`ad4f1f3`, com correção do store PostgreSQL em `75013cb`) e os serviços Railway API, PWA e web concluíram deploy. Produção confirmou: API/web/PWA/catálogo com HSTS e `nosniff`; CSP com nonce no Next e hash no PWA; CORS devolve a origem oficial e não concede ACAO a origem arbitrária; payload JSON de 270 KB retorna 413; webhook Stripe com assinatura inválida retorna 400; limitador PostgreSQL retorna 400 nas 20 primeiras tentativas vazias e 429 na 21ª com identidade de probe estável. Health informa Stripe, Google Play, marketing AI e exclusão de conta configurados. As migrações 049/050 são idempotentes e executam antes do boot da API usando a DATABASE_URL do ambiente. Scanner de segredos e auditoria de dependências passaram com zero achados; lint, typecheck, 1.119 testes, builds afetados, Sherif e context lint passaram localmente. O job GitHub Actions alcançou e passou os gates de segurança, lint, tipos, testes e Sherif, mas terminou vermelho no `knip:full` por dívida preexistente já documentada e fora do hardening. Não foi criada compra real Google Play/Stripe em produção; os fluxos válidos permanecem cobertos por testes e health/configuração.
