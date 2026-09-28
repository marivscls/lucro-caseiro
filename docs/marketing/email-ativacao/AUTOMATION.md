# Dica para calcular o primeiro preço

Automação de ativação criada em 28/09/2026. O código fica inativo por padrão até definir `ACTION_EMAIL_ENABLED=true` na API. Não importa a lista de usuários antigos nem envia mensagens sem adesão.

## Público e momento

- A pessoa ativa **Dicas por e-mail** em Configurações. O estado começa desligado, inclusive para contas antigas e contas criadas com Google.
- Pelo menos três dias se passaram desde o cadastro **e** desde a adesão.
- O e-mail foi confirmado, a conta está ativa e pertence ao Lucro Caseiro.
- Nesta primeira campanha, o perfil do negócio é alimentação, artesanato ou comércio/outros. Serviços e beleza aguardam mensagem própria.
- Não há evento de precificação concluída, produto ou venda registrado, nem evento de uso do app nos últimos três dias.
- Cada pessoa recebe no máximo uma mensagem desta campanha. A seleção e a verificação imediatamente antes do envio usam o estado atual da conta.

O botão abre `lucrocaseiro://pricing`, a tela de Precificação do aplicativo instalado. O texto orienta o caminho manual se o cliente de e-mail não abrir o link. O rodapé e o cabeçalho `List-Unsubscribe` permitem cancelar as dicas sem entrar na conta. O link mostra confirmação antes de alterar a preferência; clientes de e-mail que suportam o protocolo de descadastro em um clique enviam POST diretamente.

## Ativação

1. Publicar a API e o app com a nova preferência em Configurações. No Android instalado, a opção só aparece após novo build; no app web aparece após o deploy.
2. O `start.ts` aplica a migration idempotente `20260928182000_action_email_automation.sql`, que cria preferências e fila privadas em `app_email`.
3. Conferir `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, definir `ACTION_EMAIL_PUBLIC_URL` com a origem HTTPS pública da API, sem barra final, e `ACTION_EMAIL_BUSINESS_ADDRESS` com o endereço comercial válido que aparecerá no rodapé. O e-mail de boas-vindas já usa o mesmo remetente e Reply-To, mas não inclui endereço físico; sem esse endereço a campanha não inicia.
4. Definir `ACTION_EMAIL_ENABLED=true` e reiniciar a API. Verificar o log `[action-email] first-price automation enabled`.
5. Testar com conta própria confirmada que tenha ativado a preferência. Aguardar o prazo ou usar relógio/banco de teste, sem antecipar artificialmente uma conta real.

Para pausar, definir `ACTION_EMAIL_ENABLED=false` e reiniciar. A preferência continua disponível; nenhum novo envio ocorre. Uma requisição já em andamento pode concluir.

## Operação e limites

A fila usa chave de idempotência `first-price-v1-<userId>`, trava por usuário e tentativas limitadas a oito ou 23 horas desde a primeira. Falhas antigas passam a `review` em vez de repetir após a janela de deduplicação do Resend. O worker processa no máximo uma mensagem por minuto e limita a seleção a 20 primeiras tentativas por janela móvel de 24 horas; esta campanha compartilha a cota da conta Resend com os e-mails de autenticação e boas-vindas.

Consultas administrativas sem endereço de e-mail:

```sql
SELECT enabled, count(*) FROM app_email.action_preferences GROUP BY enabled;
SELECT status, count(*) FROM app_email.first_price_jobs GROUP BY status;
SELECT count(*) FROM app_email.first_price_jobs WHERE sent_at >= now()-interval '24 hours';
```

`sent` significa aceito pelo Resend; entrega e retorno ao app devem ser conferidos separadamente. A medida principal é a proporção de destinatários que registram `pricing_completed` nos sete dias seguintes. Antes de ampliar a campanha, reservar um grupo de controle para medir seu efeito. Não usar abertura do e-mail como medida de sucesso.
