# Integração das entregas no Git

Data: 28/09/2026. Solicitado: commitar e enviar as alterações, documentações e análises pendentes.

## Conteúdo preservado

- Aquisição por conta, atribuição Android, primeira tarefa do onboarding e ícone L nas notificações.
- Configuração da Play Console, análises agregadas, links de campanha e evidências dos testes Android da versão 31.
- Comparativo Pousti/Ametista e exportação de planejamento de divulgação, sem credenciais.
- Imagens e vídeos de divulgação. Os MP4 em `apps/promo-video/public/funcionalidades` usam Git LFS.
- A proposta de ficha de 23/09 foi preservada em `docs/play-store/proposta-listing-2026-09-23.md`; `listing.md` registra o conteúdo efetivamente enviado em 28/09.

## Conciliação com as mudanças do Claude

Base remota integrada: `b9c8628f`. Foram encontrados 11 conflitos de conteúdo, além da sobreposição de contratos de aquisição.

- `acquisition` continua sendo a lista de origens das instalações; `accountAcquisition` contém contas confirmadas, marcos de primeira utilidade e coortes.
- Os envelopes de coleta aceitam as UTMs da web (`acquisition`) e as etiquetas do Install Referrer Android (`attribution`). Se ambos forem enviados, a atribuição Android prevalece em bloco. Uma campanha conhecida não é substituída por outra.
- A coleta Android mantém timeout e nova tentativa; uma falha temporária não é gravada como ausência definitiva de origem.
- O cadastro canônico conserva `auth.users.created_at` e o bloqueio por conta, incluindo o Google. A volta de uma conta antiga não vira cadastro no dia atual.
- Propriedades de eventos, novos eventos e melhorias de layout trazidos pela outra entrega foram preservados.
- As bases isoladas dos testes foram atualizadas para conter as migrações das duas entregas.

## Limites

A primeira execução do gate completo encontrou uma falha no teste de apresentação do período grátis: `trialNotice` recebia uma data fixa, mas a checagem de plano consultava o relógio real. A correção repassa a mesma data por todos os helpers envolvidos, mantendo a data atual como padrão.

Arquivos temporários, caches, requisições de automação e o AAB compilado permanecem locais. O push não representa publicação de uma versão Android na Play Store. Os testes nativos da versão integrada continuam pendentes conforme combinado; o snapshot EAS 32 antecede esta integração.
