# ai.context.mobile.md — Labels (Mobile Feature)

---

## Purpose

Criar e gerenciar rotulos para produtos caseiros: selecionar template visual, preencher dados do rotulo (nome do produto, ingredientes, datas, produtor) e pre-visualizar o resultado antes de salvar.

## Non-goals

- Nao gerencia produtos (feature `products`).
- Nao hospeda o QR como imagem: `qrCodeUrl` guarda o link de destino; o QR e gerado on the fly (SVG) no preview e no PDF.

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `Label`, `CreateLabel`, `UpdateLabel`, `LabelData`), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`.
- **Dependentes:** nenhum no momento.

## Code pointers

| Arquivo                                                            | Descricao                                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `apps/mobile/src/features/labels/api.ts`                           | Funcoes HTTP (fetchLabels, fetchLabel, fetchTemplates, createLabel, updateLabel, deleteLabel)    |
| `apps/mobile/src/features/labels/hooks.ts`                         | React Query hooks                                                                                |
| `apps/mobile/src/features/labels/components/create-label-form.tsx` | Formulario de criacao com preview ao vivo                                                        |
| `apps/mobile/src/features/labels/components/label-preview.tsx`     | Componente de pre-visualizacao do rotulo                                                         |
| `apps/mobile/src/features/labels/components/template-picker.tsx`   | Seletor horizontal de templates                                                                  |
| `apps/mobile/src/features/labels/label-export.ts`                  | Gera HTML do rotulo -> PDF (expo-print) e abre share/print (expo-sharing)                        |
| `apps/mobile/src/features/labels/qr.ts`                            | `normalizeLink` (texto -> URL) e `buildQrSvg` (QR como SVG via qrcode-generator, JS puro)        |
| `apps/mobile/src/features/labels/dates.ts`                         | Datas: `isoToBR`/`brToIso` (exibir vs salvar), `maskDateBR` (mascara) e `addDaysToBR` (validade) |
| `apps/mobile/src/features/labels/nutrition.ts`                     | `NUTRITION_FIELDS` (config), `hasNutrition`, `cleanNutrition`                                    |
| `apps/mobile/src/features/labels/components/nutrition-fields.tsx`  | Secao colapsavel de inputs da informacao nutricional (criar/editar)                              |
| `apps/mobile/src/app/labels.tsx`                                   | Screen (rota `/labels`)                                                                          |

## Components

### `CreateLabelForm`

- **Props:** `{ productId?: string; onSuccess?: () => void }`
- Campos: nome do rotulo, template (via TemplatePicker), nome do produto, ingredientes, datas de fabricacao/validade (DD/MM/AAAA com mascara `maskDateBR`), "validade em dias" (auto-calcula a validade via `addDaysToBR`), nome do produtor, telefone.
- Datas exibidas/digitadas em DD/MM/AAAA; converte para ISO (`brToIso`) antes de enviar. O preview/PDF exibem via `isoToBR` (funciona tanto para ISO salvo quanto para o BR ao vivo).
- Inclui preview ao vivo via `LabelPreview`.
- Secao "Informacao nutricional" (colapsavel, `NutritionFields`): 9 campos opcionais (porcao, kcal, carboidratos, acucares, proteinas, gorduras totais/saturadas, fibra, sodio). `cleanNutrition` nao envia se vazio. Renderizada como tabela no preview e no PDF. Layout informativo, nao e o template certificado ANVISA.
- Upload de logo opcional (galeria/camera via `useImagePicker`); sobe pro storage com `uploadLabelLogo` no submit e envia `logoUrl` no `createLabel`. Se o upload falhar, salva sem o logo.
- Campo "Link do QR Code" opcional: `normalizeLink` converte o texto em URL e envia em `qrCodeUrl`; o QR aparece no preview e no PDF.
- Botao "Baixar / Compartilhar" gera PDF do rotulo a partir dos dados atuais (sem precisar salvar) via `exportLabelPdf`, incluindo logo e QR.

### `LabelPreview`

- **Props:** `{ data: LabelData; templateId: string; logoUrl?: string | null; qrUrl?: string | null; scale?: number }`
- Exporta `TEMPLATE_STYLES` (reaproveitado pelo HTML do PDF em `label-export.ts`).
- Renderiza preview visual do rotulo com estilos baseados no template selecionado. Mostra o logo (se `logoUrl`) no topo e o QR (se `qrUrl`, via `buildQrSvg` + `react-native-svg`) no rodape.
- 5 templates: classico, moderno, minimalista, artesanal, gourmet (cada um com cores bg/accent/border proprias).
- Largura fixa 280px \* scale.

### `TemplatePicker`

- **Props:** `{ selected?: string; onSelect: (templateId: string) => void }`
- FlatList horizontal com cards de 120x140 para cada template.
- Usa `useTemplates()` para carregar templates do backend.
- Indica selecao com borda verde.

## Utils

### `exportLabelPdf(data, templateId, logoUrl?, qrUrl?, copies?)`

- Monta HTML do rotulo reaproveitando `TEMPLATE_STYLES` (exportado de `LabelPreview`) e gera um PDF com `expo-print` (`printToFileAsync`). Inclui o logo (`<img>`), o QR (SVG inline via `buildQrSvg`) e a tabela nutricional quando informados.
- `copies > 1`: repete o card numa grade A4 de 2 colunas (`@page A4`, `break-inside: avoid`) que pagina sozinha — imprimir varias etiquetas por folha.
- Abre a folha de compartilhamento do sistema via `expo-sharing` (salvar em Arquivos, WhatsApp, imprimir). Fallback: `Print.printAsync`.

### `exportLabelPdfWithChoice(data, templateId, logoUrl?, qrUrl?)`

- Pergunta (Alert) "1 etiqueta" ou "Folha cheia (8)" e chama `exportLabelPdf` com o `copies` escolhido. Usado pelos botoes "Baixar / Compartilhar" no `CreateLabelForm` e em `labels.tsx`.

### `uploadLabelLogo(localUri)` (shared/utils/upload-image)

- Sobe a imagem local pro bucket `product-photos` do Supabase Storage (path `${userId}/logo-${timestamp}.{ext}`) e devolve a URL publica. Mesma infra de `uploadProductImage` (bucket unico, escopado por usuario).

### `normalizeLink(input)` e `buildQrSvg(text, color?)` (features/labels/qr.ts)

- `normalizeLink`: trim; vazio -> undefined; sem esquema -> prefixa `https://`. Usado para montar o `qrCodeUrl`.
- `buildQrSvg`: gera o QR como string SVG (modulos pretos sobre fundo branco para maximo contraste/leitura, quiet zone 2; `color` customizavel) com `qrcode-generator` (JS puro, sem Buffer). Mesmo SVG no preview (`react-native-svg`) e no PDF (inline no HTML).

### Datas (features/labels/dates.ts)

- `isoToBR(iso)`: yyyy-mm-dd -> DD/MM/AAAA (deixa nao-ISO intacto). Usado no preview e no PDF para exibir datas salvas.
- `brToIso(br)`: DD/MM/AAAA -> ISO; enviado ao back (contrato exige `z.string().date()`).
- `maskDateBR(input)`: mascara progressiva DD/MM/AAAA enquanto digita.
- `addDaysToBR(br, days)`: fabricacao + dias -> validade (campo "validade em dias").

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
- `LabelData` — dados do rotulo (productName, ingredients, manufacturingDate, expirationDate, producerName, producerPhone, `nutrition?: NutritionFacts`).
- `NutritionFacts` — informacao nutricional opcional (servingSize, calories, carbs, sugars, protein, totalFat, satFat, fiber, sodium; cada campo e string opcional).
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
- [x] `normalizeLink` prefixa https quando falta esquema e retorna undefined p/ vazio
- [x] `buildQrSvg` gera SVG com path dos modulos na cor do template
- [x] `isoToBR`/`brToIso`/`maskDateBR`/`addDaysToBR` (dates.test.ts)

## Examples

- Acessado via Home (quick access "Rotulos") ou rota `/labels`.
- Fluxo: lista de rotulos -> FAB "Novo rotulo" -> modal de criacao -> preview ao vivo -> salvar.
- Preview de rotulo existente via tap na lista.

## Change log / Decisions

- Limite freemium: 1 template no Free, ilimitado no Premium (enforcement no backend).
- Templates definidos com cores fixas no front (TEMPLATE_STYLES e TEMPLATE_COLORS).
- 2026-05-30: adicionada exportacao de rotulo como PDF (expo-print + expo-sharing). `TEMPLATE_STYLES` agora exportado de `LabelPreview` para o HTML do PDF bater com o preview. Decisao por PDF (qualidade de impressao) em vez de imagem, pois rotulo e impresso/colado no produto.
- 2026-05-30: upload de logo no fluxo de criacao (campo `logoUrl` ja existia no contrato/DB). Reaproveita bucket `product-photos` (path com prefixo `logo-`) — sem migration nova.
- 2026-05-30: edicao de logo em rotulo salvo (`LabelDetailModal` em `labels.tsx`): trocar (upload do novo) ou remover. Remover envia `logoUrl: null` (UpdateLabelDto passou a aceitar nullable). Omitir `logoUrl` mantem o atual; upload com falha mantem o logo anterior.
- 2026-05-30: QR code no rotulo. `qrCodeUrl` guarda o link de destino (Instagram/cardapio/WhatsApp); o QR e gerado como SVG (offline) via `qrcode-generator` e renderizado no preview (`react-native-svg`) e no PDF. Edicao envia `qrCodeUrl: normalizeLink(qrLink) ?? null` (vazio limpa). Deps novas: `react-native-svg`, `qrcode-generator`.
- 2026-05-30: datas. Corrigido bug de exibicao (rotulo salvo/PDF mostravam ISO) via `isoToBR`. Inputs com mascara `maskDateBR`. Campo "validade em dias" auto-calcula a validade (`addDaysToBR`). Edicao agora hidrata datas em BR e converte para ISO no salvar (evita rejeicao do contrato).
- 2026-05-30: informacao nutricional opcional. `LabelData.nutrition` (objeto `NutritionFacts` no contrato, dentro do JSON `data` — sem migration). Tabela no preview e no PDF.
- 2026-05-30: imprimir varias etiquetas por folha. `exportLabelPdf` aceita `copies`; `exportLabelPdfWithChoice` pergunta 1 vs folha cheia (8). Grade A4 2 colunas que pagina sozinha.

- 2026-06-09: formulário de rótulo reorganizado com `FormSection` (shared/components/
  form-section.tsx, seções colapsáveis): básico aberto; datas (aberta), nutrição e
  contato/marca (fechadas). Reduz a rolagem de 40+ campos.
- 2026-06-09: **estilo customizado (Premium)** — `LabelStyleEditor`
  (components/label-style-editor.tsx): cor de destaque (presets + ColorPickerModal,
  agora em shared/components), fonte (clássica/moderna), borda (linha/tracejada/dupla/
  sem) e cantos (arredondado/reto). Persistido em `data.style` (contrato `LabelStyle`);
  preview (`resolveLabelStyle`) e PDF aplicam o estilo; fundo derivado da cor por tint.
  Free: tocar abre paywall; backend reforça com LIMIT_EXCEEDED.
- 2026-06-10: `LabelStyleEditor` ganhou prop `locked` (free): opções visíveis com leve
  opacidade + cadeado; tocar abre o paywall. Vislumbre converte mais que esconder.
- 2026-06-10: datas de fabricacao/validade usam DateField compartilhado (shared/components/date-field.tsx): mascara DD/MM/AAAA + seletor nativo (@react-native-community/datetimepicker) pelo icone de calendario.
