# ai.context.mobile.md — Labels (Mobile Feature)

---

## Purpose

Criar e gerenciar rotulos para produtos caseiros: selecionar template visual, preencher dados do rotulo (nome do produto, ingredientes, datas, produtor) e pre-visualizar o resultado antes de salvar.

## Non-goals

- Nao imprime rotulos diretamente (apenas cria/salva para uso posterior).
- Nao gerencia produtos (feature `products`).
- Nao faz upload de logo (campo previsto mas sem upload implementado).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `Label`, `CreateLabel`, `UpdateLabel`, `LabelData`), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`.
- **Dependentes:** nenhum no momento.

## Code pointers

| Arquivo                                                            | Descricao                                                                                     |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `apps/mobile/src/features/labels/api.ts`                           | Funcoes HTTP (fetchLabels, fetchLabel, fetchTemplates, createLabel, updateLabel, deleteLabel) |
| `apps/mobile/src/features/labels/hooks.ts`                         | React Query hooks                                                                             |
| `apps/mobile/src/features/labels/components/create-label-form.tsx` | Formulario de criacao com preview ao vivo                                                     |
| `apps/mobile/src/features/labels/components/label-preview.tsx`     | Componente de pre-visualizacao do rotulo                                                      |
| `apps/mobile/src/features/labels/components/template-picker.tsx`   | Seletor horizontal de templates                                                               |
| `apps/mobile/src/app/labels.tsx`                                   | Screen (rota `/labels`)                                                                       |

## Components

### `CreateLabelForm`

- **Props:** `{ productId?: string; onSuccess?: () => void }`
- Campos: nome do rotulo, template (via TemplatePicker), nome do produto, ingredientes, datas de fabricacao/validade (DD/MM/AAAA), nome do produtor, telefone.
- Converte datas DD/MM/AAAA para ISO antes de enviar.
- Inclui preview ao vivo via `LabelPreview`.

### `LabelPreview`

- **Props:** `{ data: LabelData; templateId: string; logoUrl?: string | null; scale?: number }`
- Renderiza preview visual do rotulo com estilos baseados no template selecionado.
- 5 templates: classico, moderno, minimalista, artesanal, gourmet (cada um com cores bg/accent/border proprias).
- Largura fixa 280px \* scale.

### `TemplatePicker`

- **Props:** `{ selected?: string; onSelect: (templateId: string) => void }`
- FlatList horizontal com cards de 120x140 para cada template.
- Usa `useTemplates()` para carregar templates do backend.
- Indica selecao com borda verde.

## Hooks

| Hook               | Tipo          | Descricao                                                                       |
| ------------------ | ------------- | ------------------------------------------------------------------------------- |
| `useLabels(opts?)` | `useQuery`    | Lista paginada. Query key: `["labels", opts]`                                   |
| `useLabel(id)`     | `useQuery`    | Detalhe de um rotulo. Query key: `["labels", id]`                               |
| `useTemplates()`   | `useQuery`    | Lista de templates. `staleTime: Infinity`. Query key: `["labels", "templates"]` |
| `useCreateLabel()` | `useMutation` | Cria rotulo. Invalida `["labels"]`.                                             |
| `useUpdateLabel()` | `useMutation` | Atualiza rotulo. Invalida `["labels"]`.                                         |
| `useDeleteLabel()` | `useMutation` | Remove rotulo. Invalida `["labels"]`.                                           |

## API Integration

| Endpoint                   | Verbo  | Funcao           | Parametros             |
| -------------------------- | ------ | ---------------- | ---------------------- |
| `/api/v1/labels`           | GET    | `fetchLabels`    | `?page=N&productId=ID` |
| `/api/v1/labels/:id`       | GET    | `fetchLabel`     | path param `id`        |
| `/api/v1/labels/templates` | GET    | `fetchTemplates` | -                      |
| `/api/v1/labels`           | POST   | `createLabel`    | body: `CreateLabel`    |
| `/api/v1/labels/:id`       | PATCH  | `updateLabel`    | body: `UpdateLabel`    |
| `/api/v1/labels/:id`       | DELETE | `deleteLabel`    | -                      |

## Contracts

- `Label` — rotulo salvo (id, name, templateId, productId, data, createdAt).
- `LabelData` — dados do rotulo (productName, ingredients, manufacturingDate, expirationDate, producerName, producerPhone).
- `CreateLabel` — payload de criacao (name, templateId, productId?, data).
- `UpdateLabel` — payload de edicao.
- `LabelTemplate` — tipo local `{ id: string; name: string }`.

## Error Handling

- **Erro de listagem:** EmptyState com "Nao foi possivel carregar seus rotulos."
- **Erro de criacao:** `Alert.alert("Erro", "Nao foi possivel criar o rotulo. Tente novamente.")`.
- **Validacao local:** nome do rotulo e nome do produto no rotulo obrigatorios.

## Performance

- Templates carregados com `staleTime: Infinity` (dados estaticos).
- Preview renderizado em tempo real conforme usuario preenche campos.

## Test matrix

- [ ] `useTemplates` retorna templates e nao refetcha
- [ ] `CreateLabelForm` valida nome obrigatorio
- [ ] `LabelPreview` aplica estilo correto por template
- [ ] `TemplatePicker` marca template selecionado
- [ ] Conversao de data DD/MM/AAAA para ISO funciona

## Examples

- Acessado via Home (quick access "Rotulos") ou rota `/labels`.
- Fluxo: lista de rotulos -> FAB "Novo rotulo" -> modal de criacao -> preview ao vivo -> salvar.
- Preview de rotulo existente via tap na lista.

## Change log / Decisions

- Limite freemium: 1 template no Free, ilimitado no Premium (enforcement no backend).
- Templates definidos com cores fixas no front (TEMPLATE_STYLES e TEMPLATE_COLORS).
