---
id: b1c0765a-ac8a-4bb7-90b7-e22df6e6efc9
slug: auth
type: scar
title: "Sessão inválida" ao excluir conta = Auth user já removido; authMiddleware valida via getUser a cada request
tags: 
provenance: observado
evidence: apps/api/src/shared/middleware/auth.ts:29-32 (supabase.auth.getUser); apps/api/src/features/account/account.usecases.ts (deleteAuthUser antes de deleteUser); apps/mobile/src/app/settings.tsx runDeleteAccount; commit 7178ac9
decay: stable
created: 2026-06-26T00:42:18.966156600+00:00
updated: 2026-06-26T00:42:18.966156600+00:00
validated: 2026-06-26T00:42:18.966156600+00:00
links: 
---

DIAGNÓSTICO: o `authMiddleware` valida o token chamando `supabase.auth.getUser(token)` em TODO request — não é só checagem de assinatura local. Então, assim que o usuário é removido do Supabase Auth, qualquer request seguinte cai em 401 "Sessao invalida". No fluxo de exclusão (`deleteAccount` apaga o Auth user PRIMEIRO, depois os dados), se o request anterior já removeu o Auth user, a próxima tentativa de excluir retorna 401 e o app mostrava "Erro: Sessao invalida" sem saída. PROGRESSÃO ÚTIL: se a mensagem mudou de "Exclusão indisponível" (503, faltava SUPABASE_SERVICE_ROLE_KEY) para "Sessão inválida", então a chave passou a funcionar e a conta foi de fato excluída. CORREÇÃO (mobile): em 401 no `runDeleteAccount`, fazer `signOut()` + ir pro login (a conta já não existe ou a sessão morreu — destino é o login nos dois casos). CUIDADO: NÃO fazer auto-logout global em todo 401 — o token pode estar transitoriamente expirado durante o refresh do Supabase, e deslogaria usuário válido. RISCO LATENTE: como deleteAuthUser roda antes de deleteUser, se a deleção dos dados falhar depois, sobra dado órfão (sem Auth user) — improvável mas possível. Ver [[pending-sql-migrations]] / config Railway [[stripe-billing-live-launch-todo]].
