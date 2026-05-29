# Guia — Subir o app pro Teste Interno do Google Play

Passo a passo pra colocar o **Lucro Caseiro** no **track de Teste Interno** da Google Play
(ótimo pra testar com pessoas reais e validar a compra de assinatura via Google Play Billing
antes de publicar pra todo mundo).

- **Pacote (applicationId):** `br.com.orionseven.lucrocaseiro`
- **Projeto EAS:** `lucro-caseiro` (projectId `83a64ebe-a3e6-408a-b0f9-a076445bfa68`)
- **Versão atual:** 1.1.0 (o `versionCode` do Android é remoto e auto-incrementado pelo EAS no profile `production`)

---

## 0. Pré-requisitos (uma vez só)

1. **Conta Google Play Console** (taxa única de US$ 25): https://play.google.com/console
2. **App criado** no Console com o pacote `br.com.orionseven.lucrocaseiro`.
3. **Ficha mínima da loja** preenchida (nome, descrição curta/completa, ícone 512px,
   feature graphic, 2+ screenshots, política de privacidade). O Teste Interno é mais
   leve que produção, mas o Console pede o básico.
4. **Logado no EAS:** `eas whoami` (se não, `eas login` — conta `marivscls7`).

---

## 1. Gerar o AAB de produção (EAS Build)

O Teste Interno usa o **App Bundle (.aab)**, igual produção. Na pasta `apps/mobile`:

```bash
eas build -p android --profile production
```

- Usa o profile `production` do `eas.json` (já aponta pra API do Railway e Supabase corretos).
- O `versionCode` é incrementado automaticamente (`autoIncrement: true`).
- Ao final, o EAS dá um link pra baixar o `.aab`.

> Primeira build Android pelo EAS: ele cria/gerencia a **keystore de upload** pra você
> (deixe o EAS gerenciar — opção "Generate new keystore"). Guarde bem essa keystore; é o
> que assina todas as próximas versões.

---

## 2. Subir no Play Console (manual)

1. Play Console → app **Lucro Caseiro** → **Testes → Teste interno**.
2. **Criar nova versão**.
3. Em **App bundles**, faça **upload do `.aab`** baixado do EAS.
4. Preencha as **notas da versão** (ex.: "Versão de teste interno 1.1.0").
5. **Salvar → Revisar versão → Iniciar lançamento para o teste interno**.
6. Aba **Testadores**: crie uma **lista de e-mails** (contas Google dos testadores) e salve.
7. Copie o **link de adesão** e mande pros testadores. Cada um abre o link, aceita virar
   testador e instala pela Play Store (pode levar alguns minutos pra propagar).

---

## 3. (Opcional) Subir automático com `eas submit`

Dá pra pular o upload manual configurando uma **service account** do Google:

1. No Console → **Configurações → Acesso à API** → crie/vincule uma service account e baixe
   o JSON de credenciais (NÃO commitar; o repo já ignora chaves em `google cloud service account keys`).
2. Aponte o JSON no `eas.json` em `submit.production`:
   ```json
   "submit": {
     "production": {
       "android": {
         "serviceAccountKeyPath": "./caminho/para/service-account.json",
         "track": "internal"
       }
     }
   }
   ```
3. Rode:
   ```bash
   eas submit -p android --profile production
   ```
   Isso envia o último build direto pro track **internal**.

---

## 4. Testar a assinatura (Google Play Billing)

Pra a compra de **Premium** funcionar no Android (o app usa Google Play Billing no Android e
Stripe no iOS/Web):

1. No Console → **Monetização → Produtos → Assinaturas**: crie a assinatura premium
   (mesmos IDs que o app espera) e **ative**.
2. O app precisa estar publicado em **algum track** (o interno já serve) pra o Billing
   responder.
3. Adicione os testadores também em **Configurações → Testes de licença** pra eles poderem
   "comprar" sem cobrança real (compras de teste).
4. Instale pelo **link de teste interno** (não pelo APK lateral) — o Billing só funciona com
   o app instalado pela Play Store, assinado com a keystore de upload.

---

## 5. Próximas versões

1. Faça as mudanças e dê push (Railway redeploy da API é automático).
2. `eas build -p android --profile production` (versionCode sobe sozinho).
3. Suba o novo `.aab` no Teste Interno (ou `eas submit`).
4. Os testadores recebem a atualização pela Play Store.

---

## Checklist rápido

- [ ] Conta Play Console paga e app criado (`br.com.orionseven.lucrocaseiro`)
- [ ] Ficha mínima + política de privacidade
- [ ] `eas build -p android --profile production` concluído
- [ ] `.aab` enviado pro track **Teste interno** e lançamento iniciado
- [ ] Lista de testadores criada + link compartilhado
- [ ] (Premium) assinatura criada/ativa no Console + testadores de licença
- [ ] Testador conseguiu instalar pelo link e logar (Google/produção)

> Relacionado: ainda faltam itens pra "ir pro Live" de verdade (chaves live do Stripe,
> domínio próprio, split de billing Android). O Teste Interno não exige isso.
