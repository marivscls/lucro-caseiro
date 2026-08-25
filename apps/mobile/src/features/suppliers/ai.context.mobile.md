# ai.context.mobile.md — Suppliers

## Purpose

A rota `/suppliers` oferece visão mensal, busca, filtros, ordenação, cards contextuais, cadastro,
edição, arquivo, WhatsApp e recompra revisável.

## Non-goals

- Não inventa planejamento ou estados por heurística.
- Não registra recompra sem revisão e confirmação.
- Não mantém fixtures ou imagens externas na implementação de produção.

## Boundaries & Ownership

Depende de contracts, React Query, componentes compartilhados, Supabase Storage e purchases. A rota
coordena os modais; a lógica pura permanece em `domain.ts`.

## Code pointers

- `app/suppliers.tsx`: rota e ações.
- `components/supplier-list.tsx`: painel, filtros e estados.
- `components/supplier-card.tsx`: cards e ações contextuais.
- `components/supplier-form.tsx`: formulário compartilhado.
- `components/supplier-avatar.tsx`: upload, preset ou iniciais.
- `components/supplier-illustration.tsx`: família local de 24 desenhos SVG com `viewBox` comum.
- `illustration-presets.ts`: 24 presets locais.
- `domain.ts`: busca, filtros, validação, prefill e geometria.
- `assets/fornecedores-caixas.png`: arte oficial transparente.

## Components

`SupplierList` renderiza uma FlatList de coluna única; `SupplierCard` mostra dados derivados;
`SupplierForm` é reutilizado por criação e edição; `StandardModal` fornece bottom sheet/dialog com
footer fixo; `SupplierAvatar` aplica a prioridade upload → preset → iniciais. O registro separa
metadados dos presets dos paths SVG, persistindo somente ids estáveis.

## Hooks

`useSuppliersOverview` lê o agregado. Mutations de supplier e purchase invalidam as query keys
afetadas. A lista paginada anterior continua disponível ao `SupplierSelector`.

## API Integration

`GET /api/v1/suppliers/overview` alimenta o painel e a lista. POST/PATCH/DELETE implementam cadastro,
edição, flags, arquivo e exclusão. Filtros visuais rodam sobre o cache, sem novas requisições.
Durante o rollout, respostas 400/404/500 do overview acionam compatibilidade com a API anterior:
o cliente pagina `/suppliers` e `/purchases`, normaliza os campos legados e deriva o mesmo agregado.

## Contracts

Usa `Supplier`, `SupplierOverviewItem`, `SuppliersOverview`, `CreateSupplier` e `UpdateSupplier`. A
categoria aceita insumos, embalagens, alimentos e outros.

## Error Handling

Há skeleton, retry, lista vazia, busca sem resultado e mês zerado. Erros do formulário preservam os
campos e o arquivo selecionado; submit duplicado é bloqueado.

## Performance

A busca local normaliza caixa, espaços e acentos. Contagens e listas usam memoização. O PNG usa
`contain`, ignora eventos e tem largura fluida limitada: 38%, mínimo 108 e máximo 190 px.

## Test matrix

- `domain.test.ts`: totais, busca, filtros, ordenação, validações, iniciais, recompra e PNG.
- `supplier-form.test.tsx`: categoria/presets, upload, remoção, preferência e validação.
- `create-supplier-form.test.tsx`: abertura, fechamento e CTA.
- Auditoria CDP: 320, 360, 375, 390, 412, 768 e desktop; modal, Escape e console.

## Examples

“Comprar novamente” converte os itens da última compra em `prefill` e abre
`CreatePurchaseForm`. WhatsApp só aparece com telefone válido e flag ativa.

## Change log / Decisions

- 2026-08-18: tela completa baseada na referência e no PNG oficial.
- Presets ficam em registro vetorial local com seis opções por categoria.
- Upload só é definitivo no submit, reutiliza o pipeline existente e confere os bytes reais de
  PNG/JPEG/WebP antes de enviar.
- Sem orçamento no backend, o chip correto é “Sem planejamento”.
- 2026-08-18: filtros de categoria da lista usam o `Chip` compartilhado
  (`@lucro-caseiro/ui`) com badge de contagem. Só os rótulos e totais vêm da tela.
  A fileira usa `FilterChipRow`: o rótulo do chip não encolhe com reticências,
  então "Alimentos" e "Outros" quebram para a linha de baixo em vez de cortar.
- 2026-08-25: a navbar do app no celular vem do root (`MobileFloatingTabBar`);
  `/suppliers` não duplica mais uma barra própria.
- 2026-08-24: estado vazio da lista deixou de usar ilustração PNG.
