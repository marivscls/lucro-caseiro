# ai.context.mobile.md — Etiquetas

## Purpose

Criar etiquetas simples de identificacao para imprimir e colar nos produtos. A dor
principal e substituir o papel adesivo escrito a mao por uma etiqueta bonita, repetivel e
rapida.

## Non-goals

- Nao gera rotulagem tecnica ou industrial.
- Nao calcula nem imprime macros, tabela nutricional, ingredientes ou advertencias.
- Nao certifica conformidade sanitaria e nao substitui rotulagem obrigatoria quando
  aplicavel.
- Nao gerencia produtos; apenas vincula a um produto existente.

## Boundaries & Ownership

- **Depende de:** contratos de etiquetas e planos em `@lucro-caseiro/contracts`, componentes
  de `@lucro-caseiro/ui`, autenticação e cliente HTTP compartilhados, catálogo público para o
  QR, perfil/assinatura para personalização premium e produtos para o vínculo da etiqueta.
- **Dependentes:** rota `/labels`, atalhos do shell e fluxos que abrem a criação já vinculada a
  um produto.

## Current flow

1. Selecionar um produto.
2. Escolher um dos cinco modelos visuais.
3. Confirmar o nome que sera impresso.
4. Opcionalmente informar observacao, datas, contato, logo e QR do catalogo.
5. Pre-visualizar, salvar e gerar uma etiqueta ou uma folha A4 com oito copias.

O QR e opcional. A feature funciona mesmo sem catalogo publicado.

## Code pointers

| Arquivo                                                               | Responsabilidade                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------- |
| `apps/mobile/src/app/labels.tsx`                                      | Lista, detalhe, edicao e exclusao                       |
| `apps/mobile/src/features/labels/components/create-label-form.tsx`    | Criacao e preview ao vivo                               |
| `apps/mobile/src/features/labels/components/label-preview.tsx`        | Preview simples da etiqueta                             |
| `apps/mobile/src/features/labels/components/label-product-picker.tsx` | Busca e selecao do produto                              |
| `apps/mobile/src/features/labels/components/template-picker.tsx`      | Selecao dos cinco modelos                               |
| `apps/mobile/src/features/labels/components/label-style-editor.tsx`   | Personalizacao Profissional                             |
| `apps/mobile/src/features/labels/label-export.ts`                     | HTML, PDF, folha com copias e aviso de responsabilidade |
| `apps/mobile/src/features/labels/qr.ts`                               | QR como SVG                                             |
| `apps/mobile/src/features/labels/dates.ts`                            | Conversao ISO ↔ DD/MM/AAAA                              |
| `apps/mobile/src/features/labels/api.ts`                              | Cliente HTTP                                            |
| `apps/mobile/src/features/labels/hooks.ts`                            | Queries e mutations                                     |

## Components

- `CreateLabelForm`: modal de criação; recebe `visible`, `onClose`, `productId?` e
  `onSuccess?`, valida os campos, envia a etiqueta e pode exportá-la imediatamente.
- `LabelPreview`: renderização compartilhada pelo formulário, detalhe e exportação.
- `LabelProductPicker`, `TemplatePicker` e `LabelStyleEditor`: seleção do produto, modelo e
  personalização premium, respectivamente.
- A edição e as ações de detalhe ficam na tela `app/labels.tsx` e reutilizam o preview.

## Hooks

- `useLabels` e `useLabel`: listagem paginada/filtro por produto e detalhe.
- `useTemplates`: modelos com cache permanente durante a sessão.
- `useCreateLabel`, `useUpdateLabel` e `useDeleteLabel`: mutations que invalidam a chave
  `['labels']`.

## API Integration

| Endpoint                   | Verbo  | Uso              |
| -------------------------- | ------ | ---------------- |
| `/api/v1/labels`           | GET    | Listar etiquetas |
| `/api/v1/labels/:id`       | GET    | Buscar detalhe   |
| `/api/v1/labels/templates` | GET    | Listar modelos   |
| `/api/v1/labels`           | POST   | Criar etiqueta   |
| `/api/v1/labels/:id`       | PATCH  | Editar etiqueta  |
| `/api/v1/labels/:id`       | DELETE | Excluir etiqueta |

## Contracts

- `LabelData`: conteúdo impresso e estilo opcional.
- `CreateLabel` e `UpdateLabel`: payloads de criação e edição.
- `Label`: registro persistido retornado pela API.
- A disponibilidade de personalização usa `hasActiveFeature(..., 'labelsPremium')`.

## Error Handling

- Validação local usa `alertValidation`/`showAlert` antes de enviar.
- Falhas da API preservam a mensagem de `Error` quando disponível e exibem fallback em
  português.
- Falhas de logo e PDF têm alertas próprios; a criação não depende de QR ou logo.

## Performance

- React Query mantém lista, detalhe e modelos em cache; mutations invalidam somente etiquetas.
- O preview é derivado do estado local, sem round-trip de rede.
- A imagem do logo é enviada apenas no submit e os modelos usam `staleTime: Infinity`.

## Test matrix

- [x] Conversão e validação das datas opcionais.
- [x] HTML/PDF omite campos regulatórios e mantém identificação, contato, logo e QR.
- [x] Exportação cobre etiqueta única e folha de cópias.
- [ ] Fluxo visual completo de criar, editar e excluir no dispositivo.

## Examples

- Etiqueta simples: nome do produto e observação livre.
- Etiqueta com rastreio: datas, contato do produtor e QR para o produto no catálogo da conta.
- Impressão em lote: folha A4 com oito cópias do mesmo modelo.

## LabelData usado no fluxo novo

- `productName`: nome impresso, obrigatorio.
- `note`: observacao livre opcional.
- `manufacturingDate` e `expirationDate`: datas opcionais informadas pelo usuario.
- `producerName` e `producerPhone`: contato opcional.
- `style`: personalizacao opcional do plano Profissional.

Campos regulatorios antigos continuam aceitos no contrato e preservados no JSON para que
registros existentes nao quebrem, mas nao aparecem no formulario, preview ou PDF.

## Export

- `buildLabelHtml` inclui somente nome, observacao, datas, contato, logo e QR opcional.
- `exportLabelPdfWithChoice` mostra o aviso de que a etiqueta de identificacao nao substitui
  a rotulagem obrigatoria quando aplicavel.
- O usuario escolhe uma etiqueta ou folha cheia com oito copias.
- O nome do arquivo usa `etiqueta-<produto>.pdf`.
- O PDF inclui credito discreto da marca ativa.

## Compatibility

- Tabela e endpoints continuam chamados `labels`; nao ha migration.
- `LabelData` e JSONB, portanto os dados antigos permanecem legiveis.
- IDs legados de template sao normalizados pela API.
- Logo e QR aceitam `null` no update para remocao explicita.

## Validation

- Nome interno da etiqueta obrigatorio.
- Produto vinculado obrigatorio na UI.
- Nome impresso obrigatorio.
- Datas opcionais, mas quando preenchidas precisam ser validas; validade nao pode anteceder
  a producao.
- QR e logo opcionais.

## Change log / Decisions

- 2026-05-30: PDF, logo, QR, datas e varias copias por folha.
- 2026-06-09: personalizacao visual exclusiva do plano Profissional.
- 2026-07-19: a feature chegou a receber campos de rotulagem nutricional/regulatoria.
- 2026-07-19: decisao de produto corrigida. A feature voltou a ser **Etiqueta** simples,
  destinada a poupar o produtor domestico de escrever nomes a caneta. Nutricao e campos
  regulatorios foram retirados da UI/preview/PDF; dados antigos sao preservados apenas por
  compatibilidade.
