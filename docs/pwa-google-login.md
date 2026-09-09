# Troca de conta Google no PWA

O login em `use-auth.ts` envia `prompt=select_account` ao Google. Sair do
Lucro Caseiro encerra a sessão do app; o navegador pode continuar conectado ao
Google. A escolha explícita permite entrar com outra conta.

No navegador, `redirectTo` usa a origem atual (`window.location.origin`),
incluindo a porta local. Essa URL precisa estar permitida no Supabase Auth.
O login continua na mesma aba, com PKCE.

Ao investigar uma versão antiga depois do login, comparar a origem antes e
depois do retorno. Um retorno para outro domínio/porta pode abrir outra versão
e outra sessão local. Ainda não foi confirmado como causa deste relato.

Validação: `use-auth.test.ts`, `auth-url.test.ts` e `session-gate.test.ts` cobrem
os parâmetros do OAuth, limpeza do callback e roteamento após logout.

Verificação no navegador local em 2026-09-09: logout levou a `/login`;
recarregar manteve a sessão encerrada; o botão Google abriu “Choose an account”
com retorno solicitado para `http://localhost:8083/`. O login completo com outra
conta e o relato de versão antiga ainda dependem de reprodução no endereço usado
pela pessoa.

Referências:

- [Parâmetros OpenID Connect do Google](https://developers.google.com/identity/openid-connect/reference)
- [Login Google no Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google)
