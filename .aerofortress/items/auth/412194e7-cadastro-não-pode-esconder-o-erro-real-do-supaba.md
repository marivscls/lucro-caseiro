---
id: 412194e7-ee62-416d-82ec-6199a22e1739
slug: auth
type: scar
title: Cadastro não pode esconder o erro real do Supabase
tags: signup, supabase, mobile, debug
provenance: observado
evidence: apps/mobile/src/shared/hooks/use-auth.ts; relato do usuário com popup genérico ao tentar criar conta em 2026-06-29.
decay: stable
created: 2026-06-30T01:06:22.442195+00:00
updated: 2026-06-30T01:06:22.442195+00:00
validated: 2026-06-30T01:06:22.442195+00:00
links:
---

Erro corrigido: o cadastro por e-mail convertia quase qualquer erro do Supabase em `Erro ao criar conta. Tente novamente.`, impedindo descobrir se era e-mail existente, senha, rate limit, SMTP/confirmacao ou trigger `handle_new_user` quebrado. Ao mexer no signup, manter mapeamento explícito dos erros comuns e logar `code/message/status` em dev para diagnosticar falhas reais sem esconder a causa.
