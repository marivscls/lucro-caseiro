# Confirmação de cadastro

Template da mensagem **Confirm sign up** do Supabase Auth.

- Assunto: `Confirme seu e-mail | Lucro Caseiro`
- Corpo inicial: [`email.html`](email.html)
- Link de confirmação: `{{ .ConfirmationURL }}` (mantido no botão e na alternativa em texto)
- Logo pública usada no template atual: `https://ujwxvpceqigvyxcqolch.supabase.co/storage/v1/object/public/email-assets/logo.png`

O template atual em produção recebeu uma nova versão visual no painel e usa a logo hospedada no bucket público `email-assets`. O HTML em `email.html` é a versão inicial; consulte Authentication > Emails > Templates > Confirm sign up para a versão ativa.
