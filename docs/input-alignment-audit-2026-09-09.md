# Revisão do alinhamento dos inputs — 09/09/2026

Escopo: telas do aplicativo Expo/PWA em apps/mobile e componentes compartilhados de packages/ui. O pedido foi interpretado como centralização vertical do texto e do placeholder, preservando o alinhamento horizontal à esquerda mostrado na imagem.

## O que foi encontrado e corrigido

O campo financeiro da imagem usava uma textarea com padding zero. A propriedade nativa textAlignVertical não centraliza esse conteúdo no navegador. O Input compartilhado também tinha um espaçamento fixo para várias linhas, que deixava de centralizar quando a altura ou a quebra de linha mudava.

- Criado CenteredTextInput, preservando propriedades, callbacks e ref de TextInput. Campos de uma linha mantêm seu alinhamento normal; Android recebe textAlignVertical center e includeFontPadding false.
- Na PWA, o conteúdo de várias linhas é medido na largura real. O espaço livre é distribuído igualmente acima e abaixo; quando o texto excede a altura, o campo continua rolável.
- Input e TextFieldCard usam o mesmo tratamento. Migradas 30 instâncias locais de TextInput em 20 arquivos, incluindo finanças, vendas, clientes, produtos, materiais, embalagens, fichas técnicas, encomendas, fornecedores, etiquetas, onboarding e precificação.
- Removidos alinhamentos explícitos no topo e espaçamentos superiores assimétricos de campos de observações/descrições. Ícones de encomendas, produtos e materiais foram alinhados com a área dos campos.
- Nenhum TextInput JSX direto permanece em apps/mobile/src fora dos adaptadores de teste; referências de tipo foram preservadas.

## Verificação

A varredura de JSX encontrou 159 usos de Input, 21 de TextFieldCard e 30 de CenteredTextInput em 50 arquivos. Componentes locais reutilizados podem renderizar mais campos em execução; os números representam pontos de uso no código.

Foi usada uma página local com os componentes reais Input e CenteredTextInput e as métricas do campo financeiro. Foram inspecionados screenshot e estilos/layout do navegador:

| Caso                                             | Altura interna | Espaço acima e abaixo | Resultado                                   |
| ------------------------------------------------ | -------------: | --------------------: | ------------------------------------------- |
| Descrição financeira, uma linha                  |          50 px |                 14 px | Centralizado                                |
| Descrição financeira, duas linhas                |          50 px |                  3 px | Centralizado                                |
| Descrição alta, uma linha                        |         100 px |                 39 px | Centralizado                                |
| Descrição alta, duas linhas após reduzir largura |         100 px |                 28 px | Recalculado                                 |
| Observações preenchidas, duas linhas             |          80 px |                 18 px | Centralizado                                |
| Texto longo, 12 linhas                           |          80 px |                  0 px | Última linha alcançada pelo teclado/rolagem |
| Limpar conteúdo longo com o teclado              |          50 px |                 14 px | Placeholder voltou centralizado             |

- Suíte do app: **702 testes passaram em 112 arquivos** na rodada final.
- Build Expo Web: passou (3334 módulos), saída local em tmp/input-alignment/export.
- ESLint: passou nos arquivos desta alteração no app e nos três componentes/utilitários de UI envolvidos.
- Checagem de tipos do app mobile: passou na verificação final.
- Checagem de tipos de packages/ui: bloqueada por dois erros no arquivo validation-field.tsx, criado por uma alteração paralela (tipagem DOM de querySelector e scrollIntoView). Esses erros não estão no código de alinhamento.

Limite da revisão: as 50 origens de campos foram auditadas pelo código; a validação visual foi feita por famílias de componentes, sem navegar individualmente por cada formulário autenticado. Não houve homologação visual em dispositivos Android/iOS. O painel administrativo/marketing separado em apps/web não faz parte das telas Expo/PWA desta revisão.

## Inventário de pontos de uso

| Arquivo (a partir de apps/mobile/src)                     | Input | TextFieldCard | CenteredTextInput |
| --------------------------------------------------------- | ----: | ------------: | ----------------: |
| app/(auth)/login.tsx                                      |     2 |             0 |                 0 |
| app/(auth)/register.tsx                                   |     4 |             0 |                 0 |
| app/fiado.tsx                                             |     0 |             0 |                 1 |
| app/labels.tsx                                            |     5 |             0 |                 1 |
| app/materials.tsx                                         |     0 |             0 |                 1 |
| app/onboarding.tsx                                        |     1 |             0 |                 0 |
| app/operations.tsx                                        |    13 |             0 |                 0 |
| app/packaging.tsx                                         |     0 |             0 |                 1 |
| app/products.tsx                                          |    11 |             0 |                 1 |
| app/quotes.tsx                                            |     2 |             0 |                 0 |
| app/recurring-expenses.tsx                                |     3 |             0 |                 0 |
| app/reset-password.tsx                                    |     2 |             0 |                 0 |
| app/retail.tsx                                            |    18 |             0 |                 0 |
| app/services.tsx                                          |     1 |             0 |                 0 |
| app/settings.tsx                                          |     0 |             3 |                 0 |
| app/tabs/clients.tsx                                      |     0 |             0 |                 2 |
| app/tabs/new-sale.tsx                                     |     4 |             0 |                 1 |
| app/tabs/sales.tsx                                        |     1 |             0 |                 2 |
| features/catalog/components/catalog-customizer.tsx        |    15 |             0 |                 0 |
| features/clients/components/client-picker-modal.tsx       |     1 |             0 |                 0 |
| features/clients/components/edit-client-form.tsx          |     8 |             0 |                 0 |
| features/finance/components/create-finance-entry.tsx      |     0 |             0 |                 1 |
| features/finance/components/finance-dashboard.tsx         |     0 |             0 |                 1 |
| features/goals/components/prolabore-goal-form.tsx         |     3 |             0 |                 0 |
| features/labels/components/create-label-form.tsx          |     5 |             0 |                 0 |
| features/labels/components/label-layout-editor.tsx        |     3 |             0 |                 0 |
| features/labels/components/label-product-picker.tsx       |     1 |             0 |                 0 |
| features/materials/components/material-form.tsx           |     0 |             5 |                 1 |
| features/onboarding/business-profile-form.tsx             |     0 |             0 |                 2 |
| features/orders/components/complete-service-modal.tsx     |     3 |             0 |                 0 |
| features/orders/components/order-form.tsx                 |     0 |             0 |                 1 |
| features/packaging/components/packaging-form.tsx          |     0 |             1 |                 1 |
| features/pricing/components/pricing-calculator.tsx        |     0 |             0 |                 4 |
| features/pricing/components/pricing-cost-details.tsx      |     1 |             0 |                 0 |
| features/pricing/components/pricing-fields.tsx            |     1 |             1 |                 0 |
| features/pricing/components/simple-pricing-calculator.tsx |     1 |             4 |                 0 |
| features/products/components/create-product-form.tsx      |     0 |             7 |                 3 |
| features/products/components/variation-editor.tsx         |     4 |             0 |                 0 |
| features/purchases/components/create-purchase-form.tsx    |     5 |             0 |                 0 |
| features/quotes/components/quote-form.tsx                 |     9 |             0 |                 0 |
| features/recipes/components/recipe-form-fields.tsx        |     0 |             0 |                 3 |
| features/recipes/components/recipe-list.tsx               |     1 |             0 |                 0 |
| features/recipes/components/recipe-materials-editor.tsx   |     2 |             0 |                 0 |
| features/services/components/service-form.tsx             |    22 |             0 |                 0 |
| features/suppliers/components/supplier-form.tsx           |     5 |             0 |                 0 |
| features/suppliers/components/supplier-list.tsx           |     0 |             0 |                 1 |
| features/suppliers/components/supplier-selector.tsx       |     0 |             0 |                 1 |
| shared/components/color-picker-modal.tsx                  |     1 |             0 |                 0 |
| shared/components/date-field.tsx                          |     1 |             0 |                 0 |
| shared/components/form-field.tsx                          |     0 |             0 |                 1 |
