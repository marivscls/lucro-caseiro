# Notificações no navegador

O PWA recebe Web Push pelo service worker mesmo com a página fechada. A ativação
é voluntária em Configurações e pertence ao navegador e à conta atual. Sair da
conta cancela a inscrição no navegador; fechar a página mantém os lembretes.

## Ativação no ambiente

1. Em `apps/api`, execute `pnpm exec web-push generate-vapid-keys` uma vez.
2. Configure `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY` e `WEB_PUSH_SUBJECT`
   no servidor. O subject deve ser um contato real, como `mailto:suporte@seudominio`.
   Guarde o par de chaves: trocar a chave exige reinscrever os navegadores.
3. Publique a API pelo comando `start` do projeto. Com as três variáveis, o startup
   aplica a migração idempotente `20260909183022_browser_push_notifications.sql`
   e inicia o worker. Em desenvolvimento (`dev`), aplique essa migração antes de
   configurar as chaves. A tabela usa RLS e não concede acesso a `anon` ou `authenticated`.
4. Gere e publique o PWA (`pnpm --filter @lucro-caseiro/mobile build`). O gerador
   inclui `public/push-worker.js` no `sw.js`, preservando o cache offline existente.
5. Abra Configurações, ative as notificações, aceite a permissão e use **Enviar teste**.
   Feche a página para validar um lembrete agendado com uma inscrição real.

A API precisa permanecer em execução. Sem configuração, a tela explica que o
servidor precisa ser configurado e não solicita a permissão ao usuário.

`GET /api/v1/notifications/web/config` é público e retorna apenas a chave pública
VAPID (ou `null` quando não configurado). Cadastro, remoção e teste de inscrições
continuam exigindo autenticação. Um 404 nessa consulta indica que a API publicada
ainda não contém a atualização, mesmo se o frontend já mostrar os controles.

## Horários e preferências

- Às 9h no fuso IANA informado pelo navegador: um aviso reúne entregas até amanhã
  (incluindo atrasadas), vendas pendentes, estoque baixo, aniversários de clientes
  e, às segundas, o convite ao resumo semanal. Apenas itens habilitados e com dados
  aplicáveis entram no aviso. O toque abre a primeira pendência apresentada.
- Às 19h: lembrete para registrar as vendas do dia.
- Aniversários, resumo semanal e lembrete diário exigem o recurso
  `premiumNotifications` no plano vigente. A API reavalia a validade do plano no envio.
- Os recursos de estoque e agenda respeitam a marca. Preferências são salvas
  no servidor antes de atualizar o controle na tela.

O worker consulta a cada minuto, em lotes de 50 inscrições, durante a hora do
envio. Registra a data de cada período para evitar repetições e bloqueia a linha
durante o envio para coordenar múltiplas instâncias. Falhas voltam à fila após
cinco minutos; inscrições expiradas (404/410) são removidas. Não há recuperação
de lembretes após a janela de uma hora. Um encerramento do processo entre a
aceitação pelo provedor e o commit pode repetir o envio; a tag estável substitui
o aviso anterior na central de notificações quando suportado pelo navegador.

## Compatibilidade e validação

Exige HTTPS (localhost também é permitido pelo navegador), Push API e service worker
ativo. No iPhone/iPad, use o app adicionado à Tela de Início. Entrega e exibição
dependem da conexão, permissões e restrições de energia/notificações do sistema.
O servidor de desenvolvimento do Expo não fornece o worker de produção.

Testes cobrem regras de horário/plano, rejeição de endpoints externos aos provedores,
persistência em PostgreSQL local em memória, deduplicação, cancelamento, falhas de
rede, permissões e eventos do worker. O envio real exige chaves e inscrição reais;
não é feito pelos testes automatizados.

Referências: [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API),
[web-push](https://github.com/web-push-libs/web-push),
[Web Push no ecossistema Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers).
