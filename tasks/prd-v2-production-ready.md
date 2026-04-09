# PRD: V2 — Production Ready

## Introducao

Este PRD cobre as funcionalidades pendentes para levar o Lucro Caseiro de uma v1 funcional para producao completa. Inclui integracao de pagamento real, upload de fotos, cron jobs para notificacoes, aplicacao de migrations e testes E2E.

## Goals

- Monetizacao funcional com compras reais na App Store/Google Play
- Upload de fotos de produto com armazenamento no Supabase Storage
- Notificacoes push automaticas (vendas pendentes, aniversarios, estoque baixo)
- DB trigger aplicado para auto-criacao de usuario (remover workaround)
- Testes E2E cobrindo fluxos criticos
- App pronto para publicacao nas lojas

---

## User Stories — Pagamento Real

### US-001: Integrar RevenueCat

**Descricao:** Como usuario, quero assinar o plano Premium e pagar via App Store ou Google Play.

**Acceptance Criteria:**

- [ ] Instalar `react-native-purchases` (RevenueCat SDK)
- [ ] Configurar projeto no dashboard do RevenueCat
- [ ] Criar produtos no App Store Connect e Google Play Console
- [ ] Criar offering "premium_monthly" (R$ 14,90/mes) e "premium_annual" (R$ 119,90/ano)
- [ ] Substituir Alert "Em breve" no paywall por chamada real ao RevenueCat
- [ ] Ao comprar com sucesso: chamar webhook do backend para atualizar plano
- [ ] Ao cancelar: plano reverte para free apos expiracao
- [ ] Restaurar compras funciona
- [ ] Typecheck passa

### US-002: Webhook de pagamento no backend

**Descricao:** Como desenvolvedor, preciso processar eventos de pagamento do RevenueCat.

**Acceptance Criteria:**

- [ ] Endpoint `POST /api/v1/subscription/webhook` ja existe (US-016 anterior)
- [ ] Configurar RevenueCat webhook URL apontando para o endpoint
- [ ] Mapear eventos RevenueCat para os tipos ja suportados (subscription.created, renewed, cancelled, expired)
- [ ] Validar assinatura do webhook (header X-Webhook-Secret)
- [ ] Testes de integracao com payloads mockados do RevenueCat

---

## User Stories — Upload de Foto de Produto

### US-003: Criar bucket no Supabase Storage

**Descricao:** Como desenvolvedor, preciso de storage para fotos de produtos.

**Acceptance Criteria:**

- [ ] Criar bucket `product-photos` no Supabase Dashboard > Storage
- [ ] Policy: usuarios autenticados podem upload em `{userId}/`
- [ ] Policy: leitura publica (para exibir fotos nos cards)
- [ ] Limite de 5MB por arquivo
- [ ] Formatos aceitos: jpg, png, webp

### US-004: Upload de foto no mobile

**Descricao:** Como usuario, quero tirar foto ou escolher da galeria para meu produto.

**Acceptance Criteria:**

- [ ] Instalar `expo-image-picker`
- [ ] Substituir botao "Adicionar foto (em breve)" por picker real
- [ ] Opcoes: "Tirar foto" (camera) ou "Escolher da galeria"
- [ ] Comprimir imagem antes do upload (max 1MB)
- [ ] Upload para Supabase Storage via `supabase.storage.from('product-photos').upload()`
- [ ] Salvar URL retornada no campo `photoUrl` do produto via `PATCH /products/:id`
- [ ] Mostrar preview da foto no formulario e no card do produto
- [ ] Loading state durante upload
- [ ] Typecheck passa

---

## User Stories — Cron Jobs para Notificacoes

### US-005: Cron job de vendas pendentes

**Descricao:** Como usuario, quero ser lembrado de vendas fiado ou pendentes ha mais de 7 dias.

**Acceptance Criteria:**

- [ ] Criar Supabase Edge Function `notify-pending-sales`
- [ ] Roda diariamente (cron: `0 9 * * *` — 9h da manha)
- [ ] Query: vendas com status "pending" e `soldAt < now() - 7 days`
- [ ] Para cada usuario com vendas pendentes: enviar push via Expo Push API
- [ ] Mensagem: "Voce tem X vendas pendentes. Confira!"
- [ ] Respeitar toggle de notificacoes do usuario
- [ ] Nao enviar duplicata no mesmo dia

### US-006: Cron job de aniversarios

**Descricao:** Como usuario, quero ser avisado no dia do aniversario dos meus clientes.

**Acceptance Criteria:**

- [ ] Criar Supabase Edge Function `notify-birthdays`
- [ ] Roda diariamente (cron: `0 8 * * *` — 8h da manha)
- [ ] Query: clientes com birthday = hoje (mes e dia)
- [ ] Enviar push: "Hoje e aniversario de [nome]! Que tal enviar uma mensagem?"
- [ ] Respeitar toggle de notificacoes

### US-007: Cron job de estoque baixo

**Descricao:** Como usuario, quero ser avisado quando um produto esta com estoque baixo.

**Acceptance Criteria:**

- [ ] Criar Supabase Edge Function `notify-low-stock`
- [ ] Roda diariamente (cron: `0 10 * * *` — 10h da manha)
- [ ] Query: produtos com `stockQuantity <= stockAlertThreshold` e `stockQuantity IS NOT NULL`
- [ ] Enviar push: "[produto] esta com estoque baixo (X unidades)"
- [ ] Nao enviar se ja enviou para o mesmo produto e o estoque nao mudou
- [ ] Respeitar toggle de notificacoes

### US-008: Salvar push token no backend

**Descricao:** Como desenvolvedor, preciso persistir o push token para enviar notificacoes.

**Acceptance Criteria:**

- [ ] Adicionar campo `push_token` na tabela `users` (migration)
- [ ] Criar endpoint `POST /api/v1/users/push-token` que salva o token
- [ ] Mobile ja envia o token via `use-notifications.ts` — validar que funciona
- [ ] Typecheck passa

---

## User Stories — Aplicar DB Trigger

### US-009: Aplicar migration do trigger no Supabase

**Descricao:** Como desenvolvedor, preciso aplicar o trigger de auto-criacao de usuario.

**Acceptance Criteria:**

- [ ] Executar o SQL de `packages/database/src/migrations/001_auto_create_user_trigger.sql` no Supabase SQL Editor
- [ ] Testar: criar novo usuario via signup e verificar que aparece em `public.users`
- [ ] Remover fallback de auto-create do auth middleware (manter apenas validacao de token)
- [ ] Testar que o app funciona normalmente apos remocao do fallback

---

## User Stories — Testes E2E

### US-010: Configurar Maestro para testes E2E

**Descricao:** Como desenvolvedor, quero testes automatizados dos fluxos criticos no dispositivo.

**Acceptance Criteria:**

- [ ] Instalar Maestro CLI
- [ ] Criar pasta `e2e/` na raiz do projeto
- [ ] Criar arquivo de configuracao `.maestro/config.yaml`

### US-011: Testes E2E dos fluxos criticos

**Descricao:** Como desenvolvedor, quero garantir que os fluxos principais funcionam de ponta a ponta.

**Acceptance Criteria:**

- [ ] Teste: cadastro + login + onboarding
- [ ] Teste: criar produto + criar venda
- [ ] Teste: criar cliente + editar + ver historico
- [ ] Teste: criar receita + escalar
- [ ] Teste: financeiro + exportar PDF
- [ ] Teste: limites freemium (bloqueia ao atingir)
- [ ] Todos os testes passam em iOS e Android

---

## User Stories — Publicacao nas Lojas

### US-012: Preparar para App Store

**Descricao:** Como desenvolvedor, preciso preparar o app para publicacao na App Store.

**Acceptance Criteria:**

- [ ] Configurar `eas.json` para builds de producao
- [ ] Criar icone do app (1024x1024)
- [ ] Criar splash screen
- [ ] Configurar `app.json` com bundleIdentifier, version, permissions
- [ ] Gerar build de producao com `eas build --platform ios`
- [ ] Submeter para review com screenshots e descricao em portugues

### US-013: Preparar para Google Play

**Descricao:** Como desenvolvedor, preciso preparar o app para publicacao na Google Play.

**Acceptance Criteria:**

- [ ] Configurar keystore para assinatura Android
- [ ] Gerar build de producao com `eas build --platform android`
- [ ] Criar listing na Google Play Console
- [ ] Submeter para review com screenshots e descricao em portugues

---

## Functional Requirements

- FR-1: Pagamentos devem ser processados via RevenueCat (Apple/Google)
- FR-2: Webhook deve validar assinatura antes de processar
- FR-3: Fotos de produto limitadas a 5MB, formatos jpg/png/webp
- FR-4: Fotos armazenadas em `{userId}/` no Supabase Storage
- FR-5: Push notifications enviadas via Expo Push API
- FR-6: Cron jobs respeitam toggle de notificacoes do usuario
- FR-7: DB trigger cria usuario automaticamente em `public.users`
- FR-8: Testes E2E cobrem cadastro, venda, financeiro e limites
- FR-9: Builds de producao configurados para iOS e Android

## Non-Goals

- Painel admin web
- Multi-idioma (apenas pt-BR)
- Multi-usuario / equipe
- Integracao com sistemas de delivery
- CI/CD automatizado (fase futura)

## Technical Considerations

- RevenueCat: `react-native-purchases` v8+
- Supabase Edge Functions: Deno runtime, deploy via `supabase functions deploy`
- Expo Push API: `https://exp.host/--/api/v2/push/send`
- Maestro: YAML-based E2E testing, funciona com Expo Go
- EAS Build: Expo Application Services para builds nativas

## Success Metrics

- Pagamento funcional em < 30 segundos (tap to subscribed)
- Upload de foto em < 5 segundos
- Push notifications entregues em < 1 minuto
- 100% dos testes E2E passando em iOS e Android
- App aprovado nas lojas na primeira submissao

## Open Questions

1. Qual conta RevenueCat usar? (precisa de Apple Developer Account + Google Play Console)
2. Qual o preco final? R$ 14,90/mes e R$ 119,90/ano estao confirmados?
3. Precisa de politica de privacidade e termos de uso para as lojas?
4. Dominio para o backend em producao? (atualmente localhost)
5. CI/CD com GitHub Actions nesta fase ou posterior?
