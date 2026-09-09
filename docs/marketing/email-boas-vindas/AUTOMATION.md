# Boas-vindas e ajuda no app

Implementação de 09/09/2026. **Ainda não ativada em produção.**

## Comportamento

A API verifica novos cadastros a cada minuto. Após pelo menos cinco minutos do cadastro e a confirmação do email, prepara o modelo aprovado “Passo a passo”, personalizado com primeiro nome, negócio e orientações para produtos ou serviços. O botão principal usa `lucrocaseiro://`; o site aparece no rodapé.

O remetente é Lucro Caseiro e as respostas vão para a caixa configurada em `EMAIL_REPLY_TO`. Contas antigas, desativadas, excluídas, bloqueadas ou de outras marcas não entram na seleção inicial. A ativação grava um marco permanente no banco: reiniciar a API não reenviará boas-vindas aos usuários antigos. Não há envio retroativo para Gamaliel.

Uma fila privada no schema `app_email` mantém um registro por usuário. O conteúdo e a chave de idempotência permanecem iguais nas tentativas. Há exclusão entre processos, nova verificação de conta/email antes de enviar, recuo entre tentativas e interrupção para revisão após oito falhas ou 23 horas desde a primeira tentativa. `sent` significa aceito pelo provedor, não entrega comprovada na caixa de entrada.

## Ativação da API

1. Publicar os arquivos de `apps/api/src/features/email/welcome-email*`, a integração em `config.ts`, `main.ts` e `start.ts`, e a migration `packages/database/src/migrations/20260909155011_welcome_email_automation.sql`.
2. O comando de início existente aplica a migration idempotente antes de iniciar a API. Usar a conexão de backend já configurada, com acesso a `auth.users`; nunca uma credencial de cliente.
3. Conferir `RESEND_API_KEY`, o domínio remetente e a caixa monitorada em `EMAIL_REPLY_TO`. Padrões documentados: `Lucro Caseiro <notificacoes@lucrocaseiro.com.br>` e `contato@orionseven.com.br`.
4. Habilitar `WELCOME_EMAIL_ENABLED=true` no serviço desejado e reiniciar. O marco de ativação é gravado quando o worker inicia com as configurações obrigatórias presentes.
5. Conferir o log `[welcome-email] signup automation enabled` e o marco abaixo. Aguardar um novo cadastro confirmado para verificar a fila e o aceite no Resend.

Consultas administrativas de acompanhamento, sem expor conteúdo de mensagens:

```sql
SELECT activated_at FROM app_email.welcome_settings;
SELECT status, count(*) FROM app_email.welcome_jobs GROUP BY status;
```

Para pausar, definir `WELCOME_EMAIL_ENABLED=false` e reiniciar. Preservar a fila e o marco. Um envio em andamento pode concluir. Não apagar registros nem recolocar itens em `review` na fila sem conferir o histórico do provedor, pois isso pode duplicar mensagens.

## Assistente de ajuda

O componente está integrado à tela Suporte/Central de ajuda do app. Responde a perguntas digitadas e sugestões usando instruções locais sobre produtos, preços, vendas, catálogo, materiais, receitas, clientes, agenda e acesso. Adapta orientações de preço para serviços. Não chama um modelo externo, não acessa registros financeiros e não guarda conversas no servidor.

Quando não reconhece a pergunta ou ela exige análise da equipe, oferece contato por email. O botão abre um rascunho com a dúvida; a pessoa revisa e envia pelo próprio aplicativo de email. Está disponível em todos os planos. A conversa é temporária e limitada às quatro interações recentes.

O recurso estará disponível aos usuários após publicar a nova versão do app; a prévia local não atualiza o aplicativo instalado. O projeto não possui atualização remota de JavaScript configurada para esta versão nativa.

## Validação local

- Nove testes de template e fluxo de boas-vindas, incluindo repetição de polling, conteúdo estável nas tentativas e falha de persistência após aceite do provedor.
- Treze testes do domínio e da interface do assistente, incluindo navegação e passagem da dúvida para um email revisável.
- Migração e queries executadas em PostgreSQL local em memória: marco persistente, seleção, duplicidade, exclusão entre workers, espera entre tentativas, token obsoleto, revisão, cancelamento e isolamento dos papéis de cliente.
- TypeScript da API e mobile; ESLint dos arquivos alterados; validação dos contextos das features.
- Prévia do componente real no navegador, com pergunta digitada, resposta e encaminhamento. Não substitui validação de deep link no dispositivo ou entrega real de email.
