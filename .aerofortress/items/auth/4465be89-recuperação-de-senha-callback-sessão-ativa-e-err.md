---
id: 4465be89-f8c6-4141-873d-06aeac624acf
slug: auth
type: scar
title: Recuperação de senha: callback, sessão ativa e erros precisam de tratamento específico
tags: 
provenance: observado
evidence: apps/mobile/src/app/(auth)/login.tsx; apps/mobile/src/app/auth/callback.tsx; apps/mobile/src/app/reset-password.tsx; apps/mobile/src/shared/hooks/use-auth.ts; apps/mobile/src/shared/utils/password-recovery.ts; apps/mobile/src/shared/utils/password-recovery.test.ts; testes 276/276, typecheck e lint verdes em 2026-07-12; EAS build 0d8bd1b7-dbe1-4018-99c3-443af7ed598b
decay: stable
created: 2026-07-12T13:24:52.919694500+00:00
updated: 2026-07-12T14:51:14.292852400+00:00
validated: 2026-07-12T14:51:14.292852400+00:00
links: 
---

SINTOMAS (2026-07-12, Android): o deep link de recuperação abria rota inexistente; erros de senha eram rotulados como link expirado; link inválido/expirado voltava silenciosamente ao login; a tela de redefinição podia ser aberta diretamente; exceção de rede no envio deixava o botão em “Enviando...”; regras completas não apareciam antes do envio; e erros desconhecidos vazavam mensagens técnicas.

CORREÇÃO: manter a rota `auth/callback`; processar PKCE/implicit e substituir sessão em recovery; detectar parâmetros `error/error_code` e explicar o link inválido; exigir simultaneamente `passwordRecovery` e sessão para abrir `reset-password`; adicionar `.catch` ao envio; reutilizar a validação canônica e exibir suas regras; mapear `weak_password`, `same_password` e sessão expirada para português, com fallback amigável. Cobertura em `password-recovery.test.ts` para callback válido/expirado, senha repetida, fraca e erro desconhecido.

COMO EVITAR: redirect URL precisa corresponder a rota do Expo Router; recuperação e cadastro compartilham política de senha; nunca inferir expiração para todo erro nem mostrar mensagem técnica do provedor; cada reteste usa um e-mail/link novo porque links podem ser consumidos.
