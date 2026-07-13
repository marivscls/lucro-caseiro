# PRD — Gates de planos por feature

Status: implementação aprovada
Data: 2026-07-12

## Problema

Após a migração de `free/premium` para `free/essential/professional`, algumas telas
continuaram usando `isProfilePremiumActive`. Essa função responde apenas se existe
qualquer plano pago e, portanto, libera recursos do Profissional para assinantes do
Essencial. O backend pode rejeitar a operação no fim, criando a falsa impressão de que
o cadastro está disponível e não salva.

## Objetivo

Todo recurso qualitativo deve consultar sua feature na matriz canônica de planos. O
conceito genérico de “plano pago” fica restrito a benefícios realmente compartilhados
entre Essencial e Profissional.

## Matriz de acesso

| Recurso                                  | Gratuito | Essencial | Profissional | Feature                                   |
| ---------------------------------------- | -------- | --------- | ------------ | ----------------------------------------- |
| Sem anúncios e gestão da assinatura      | Não      | Sim       | Sim          | plano pago                                |
| PDF básico do resumo mensal              | Não      | Sim       | Sim          | `exportBasic`                             |
| Compras                                  | Não      | Não       | Sim          | `purchases`                               |
| Gastos fixos                             | Não      | Não       | Sim          | `recurringExpenses`                       |
| Insights e histórico financeiro          | Não      | Não       | Sim          | `advancedReports`                         |
| PDF/XLSX completo e recibo personalizado | Não      | Não       | Sim          | `export`                                  |
| Orçamento em PDF                         | Não      | Não       | Sim          | `quotesPdf`                               |
| Rótulos premium                          | Não      | Não       | Sim          | `labelsPremium`                           |
| Fotos adicionais                         | Não      | Não       | Sim          | `extraPhotos`                             |
| Produtos compostos/kits                  | Não      | Não       | Sim          | `compositeProducts`                       |
| Catálogo completo/personalizado          | Não      | Não       | Sim          | `catalogPremium` / `catalogCustomization` |
| Aniversários e notificações avançadas    | Não      | Não       | Sim          | `premiumNotifications`                    |
| Suporte prioritário                      | Não      | Não       | Sim          | `prioritySupport`                         |

## Escopo de implementação

- Acrescentar `premiumNotifications` e `prioritySupport` à matriz canônica.
- Substituir gates genéricos nas telas de Compras, Insights, Financeiro, Produtos,
  Rótulos, Orçamentos, Recibos, notificações/aniversários e Suporte.
- Manter `isProfilePremiumActive` apenas para remoção de anúncios, estado de assinatura
  e gestão/restauração do plano.
- O paywall de uma feature Profissional não pode fechar automaticamente para uma conta
  Essencial.
- O backend continua como autoridade para rotas protegidas; o mobile impede a ilusão de
  acesso antes do formulário/ação.

## Critérios de aceitação

1. Conta Essencial não vê nem aciona controles exclusivos do Profissional.
2. Conta Profissional mantém acesso a todos os recursos listados.
3. Conta Gratuita continua com limites e teasers atuais.
4. PDF básico mensal permanece disponível no Essencial.
5. Anúncios permanecem ocultos em ambos os planos pagos.
6. Paywall Profissional permanece aberto para conta Essencial até upgrade ou fechamento.
7. Testes da matriz provam que as novas features são negadas ao Essencial e liberadas no
   Profissional.
8. Não há uso de `isProfilePremiumActive` como autorização de feature específica.

## Fora de escopo

- Alterar preços ou limites quantitativos.
- Criar novos níveis de assinatura.
- Mudar dados históricos ou remover recursos já cadastrados após downgrade.
