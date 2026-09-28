# Padrão de layout desktop

Vale para o app autenticado no navegador a partir de 1024 px (`useDesktopLayout()`).
O objetivo é uma tela pensada para computador, e não o celular esticado. A
referência visual é o Início no computador e a Nova venda.
Marca, paleta vinho/rosa, Manrope e fluxos continuam os mesmos.

**Regra de ouro:** toda mudança fica atrás de `useDesktopLayout()`. No
celular, todas as primitivas abaixo renderizam os filhos sem wrapper, então
embrulhar a marcação mobile existente não muda nada no celular. Confira isso com
capturas em 390 px antes e depois.

## Estrutura da página

- `DesktopShell` (automático): navegação de 240 px e margens laterais de 40 px.
  A página tem até **1200 px** (`desktopWidths.page`) e fica centralizada na área útil.
- Em 1024 px a área útil tem 704 px; em 1440 px, 1120 px. Projete para as duas.
- Ritmo vertical: 32 px entre blocos da página (`desktopLayout.blockGap`),
  24 px entre itens de uma seção (`sectionGap`) e 56 px no fim da página.
- Uma página tem **um** título. O título da etapa ou da seção não repete o da página.

## Escala tipográfica (`desktopTypography` / variantes de `Typography`)

| Papel                          | Variante                               | Tamanho    |
| ------------------------------ | -------------------------------------- | ---------- |
| Título da página               | `desktopPageTitle`                     | 36/42 800  |
| Subtítulo da página            | `desktopPageSubtitle`                  | 17/26      |
| Título de seção (fora de card) | `desktopSection`                       | 22/30 700  |
| Título de card                 | `desktopCardTitle`                     | 18/26 700  |
| Texto                          | `desktopBody`                          | 16/24      |
| Texto forte / valores          | `desktopBodyStrong`                    | 16/24 700  |
| Legenda, cabeçalho de tabela   | `desktopMeta`                          | 14/20 500  |
| Rótulo de campo                | `desktopFieldLabel`                    | 15/22 600  |
| Indicador                      | `desktopMetric` + `desktopMetricLabel` | 28/34 + 15 |
| Total em destaque              | `desktopTotal`                         | 36/42 800  |

Nada abaixo de 14 px no desktop. Rótulos em CAIXA ALTA pequenos (`label`, 13 px)
não entram em telas novas. Use `desktopMeta` em caixa normal.

```tsx
<Typography variant={isDesktop ? "desktopSection" : "h3"}>Seus produtos</Typography>
```

## Cabeçalho: `ScreenHeader`

O `ScreenHeader` já aplica a escala no desktop: 36 px de título, 17 px de
subtítulo, 40 px acima e 32 px (`blockGap`) abaixo, com ajuda e ações à direita. No desktop,
`titleStyle` é ignorado e todas as páginas usam a cor de texto. Cabeçalhos próprios
devem ser trocados por `ScreenHeader`, com o botão de ajuda em `help` via
`ScreenGuidance.renderHeader`.

```tsx
<ScreenGuidance
  area="clients"
  renderHeader={(help) => (
    <ScreenHeader
      title="Clientes"
      subtitle="5 pessoas no seu negócio"
      help={help}
      right={novoCliente}
    />
  )}
  {...guidance}
/>
```

- A ação de criar fica no cabeçalho. No desktop, **não** repita a mesma ação em
  `ScreenCreateBar`/FAB no rodapé. Esconda com `isDesktop ? null : <ScreenCreateBar …/>`.
- `ScreenGuidance`, no desktop, mostra a introdução como uma faixa discreta
  (ícone, título, texto, "Agora não" e ação principal na mesma linha). A tela não
  precisa fazer nada para isso.
- **Ritmo do cabeçalho:** título → conteúdo, título → faixa e faixa → conteúdo
  são sempre 32 px, e quem garante isso são o `ScreenHeader` e a faixa. A tela não
  mede o cabeçalho nem soma margens. Se o cabeçalho rola dentro de um contêiner
  com `desktopPageContent` (`gap` de 32), envolva-o em `DesktopPageHeader` para o
  `gap` não se somar (senão ficam 64 px). Com o cabeçalho fora desse contêiner, ou
  com `gap: 0`, não precisa de nada.

## Primitivas (`shared/layout/desktop-page.tsx`)

| Primitiva                                                      | Uso                                                                                                               |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `desktopPageContent(isDesktop, "page" \| "form" \| "reading")` | `contentContainerStyle` do ScrollView da página: largura máxima, `gap` de 32 e respiro final.                     |
| `DesktopPage`                                                  | Mesmo contrato para páginas sem ScrollView próprio.                                                               |
| `DesktopPageHeader`                                            | Cabeçalho que rola dentro do contêiner `desktopPageContent`: anula o `gap` para manter os 32 px do cabeçalho.     |
| `DesktopSplit aside={…}`                                       | Coluna principal flexível e lateral de 280 a 360 px, fixa ao rolar. Serve para resumo, prévia e filtros.          |
| `DesktopGrid minColumnWidth maxColumns`                        | Grade de cartões que preenche a coluna (mede a largura).                                                          |
| `useDesktopColumns(min, gap, max)`                             | Hook da grade para `FlatList numColumns`, entre outros usos.                                                      |
| `DesktopSection title description action card`                 | Seção com título de 22 px (18 px quando `card`) e link à direita.                                                 |
| `DesktopCard` / `desktopCardStyle(theme)`                      | Cartão branco, borda hairline, raio 16 e padding 24. `selected` usa borda de 2 px.                                |
| `DesktopFormGrid columns={2}` + `DesktopField span="full"`     | Formulário em colunas. Campos longos (observações, endereço) ocupam a linha toda.                                 |
| `DesktopFormActions` + `desktopActionButton`                   | Ações alinhadas à direita, com largura do texto e a principal por último.                                         |
| `DesktopStatRow items`                                         | Faixa de indicadores com valor de 28 px, no lugar de números de 16 px com legendas de 12 px.                      |
| `DesktopTable columns rows`                                    | Tabela de dados: cabeçalho de 14 px, linhas de 56 px, valores à direita, hover.                                   |
| `DesktopToolbarButton icon label`                              | Ação secundária de 52 px ao lado da busca.                                                                        |
| `DesktopStepper` (`desktop-stepper.tsx`)                       | Etapas de um fluxo em linha. Substitui `FormStepProgress` no desktop; o título da etapa fica na tela, uma só vez. |

### Peças repetidas (`shared/layout/desktop-kit.tsx`)

Sempre renderizam: use só nos ramos de desktop.

| Peça                                                         | Uso                                                                                                                                        |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `DesktopEmptyCard layout icon art action`                    | Estado vazio tracejado. `row` (ícone rosado, ação à direita), `stack` (cartão branco), `center` (na coluna) e `tall` (240 px, ilustração). |
| `DesktopTag label variant strong`                            | Selo de 14 px com as cores do `Badge` (`success`, `warning`, `primary`…). No desktop, substitui o `Badge` de 12 px.                        |
| `DesktopToolbar` + `DesktopSearchField` + `DesktopSegmented` | Barra de ferramentas: busca de 52 px que cresce e filtro segmentado com contagem, lado a lado; quebra linha em 1024 px.                    |

```tsx
<DesktopToolbar>
  <DesktopSearchField value={search} onChangeText={setSearch} placeholder="Buscar cliente" />
  <DesktopSegmented
    accessibilityLabel="Filtrar clientes"
    value={filter}
    onChange={setFilter}
    options={[{ key: "all", label: "Todos", count: 12 }]}
  />
</DesktopToolbar>
<DesktopEmptyCard
  icon="cube-outline"
  title="Nenhum produto ainda"
  description="Cadastre o primeiro para começar a vender."
  action={{ label: "Cadastrar produto", onPress: openCreate }}
/>
```

### Exemplos

Página de dados com lateral:

```tsx
<ScrollView contentContainerStyle={[mobileStyle, desktopPageContent(isDesktop)]}>
  <ScreenHeader title="Vendas" subtitle="…" right={novaVenda} />
  <DesktopStatRow
    items={[{ label: "Vendido no período", value: formatCurrency(total) }]}
  />
  <DesktopSplit aside={isDesktop ? <Filtros /> : null}>
    {isDesktop ? (
      <DesktopTable
        columns={cols}
        rows={sales}
        keyExtractor={(s) => s.id}
        onRowPress={open}
      />
    ) : (
      <MobileList />
    )}
  </DesktopSplit>
</ScrollView>
```

Grade de cartões:

```tsx
<DesktopGrid minColumnWidth={240} maxColumns={4}>
  {items.map((item) => (
    <ItemCard key={item.id} item={item} />
  ))}
</DesktopGrid>
```

Formulário:

```tsx
<DesktopSection card title="Dados do cliente">
  <DesktopFormGrid>
    <Input label="Nome" … />
    <Input label="Telefone" … />
    <DesktopField span="full"><Input label="Observações" multiline … /></DesktopField>
  </DesktopFormGrid>
  <DesktopFormActions>
    <Button title="Cancelar" variant="ghost" style={desktopActionButton} … />
    <Button title="Salvar cliente" style={desktopActionButton} … />
  </DesktopFormActions>
</DesktopSection>
```

## Regras de composição

- **Use a largura.** Se duas colunas cabem, use duas. Listas viram grade ou tabela,
  e formulários ficam em 2 colunas. Um resumo ou uma prévia vai para a lateral de `DesktopSplit`.
- **Resumo alinhado ao conteúdo.** A lateral começa na mesma linha da primeira
  peça da coluna principal (etapas ou primeira seção), nunca mais abaixo.
- **Botões com largura do texto.** Nada de botão com 1100 px. Os únicos
  botões de largura total ficam dentro da lateral de 280 a 360 px.
- **Buscas** ocupam a barra de ferramentas (`flexGrow`) ao lado das ações
  (`DesktopToolbarButton`). Campos monetários e quantitativos continuam compactos.
- **Estados vazios**: `DesktopEmptyCard`, cartão tracejado com título de 18 px e texto
  de 16 px na coluna, não um texto de 14 px solto no meio da tela.
- **Painéis vinho (hero)**: mantêm a arte. Os números seguem `desktopMetric`
  ou maiores, e as legendas não descem de 14 px.
- **Hover**: cartões clicáveis escurecem a borda (`textSecondary`); a seleção usa
  borda de 2 px vinho (`pal.wine`) e ícone de confirmação.
- **Alvos**: 48 px de altura mínima em controles e 44 px em botões de ícone, sempre com texto ou `accessibilityLabel`.
- Modais de leitura e cadastros curtos podem ficar estreitos (`desktopModalSurface`).

## Helpers antigos

`desktopSplitLayout`, `desktopStretch`, `desktopContained`, `desktopAction` e
`desktopCompactField` continuam valendo para telas ainda não migradas. Em telas
novas ou migradas, use as primitivas acima. `desktopWidths.data` agora é 1200, igual a `page`.

## Verificação

Para cada tela alterada:

1. Build da demo: `pnpm --filter @lucro-caseiro/mobile export:demo -- --output-dir <pasta>`
   e servir com fallback para `index.html`. Um e-mail desconhecido cria "Doces da Ana"
   com dados; o cadastro cria uma conta vazia.
2. Capturas em 1440×900 e 1024×768, com dados e vazio, depois de terminar as animações.
3. Captura em 390×844 antes e depois. O celular deve ficar igual pixel a pixel.
4. Sem rolagem horizontal (`scrollWidth <= innerWidth`), texto sem sobreposição e ações visíveis.
5. `pnpm --filter @lucro-caseiro/mobile lint typecheck test` e atualizar o `ai.context.mobile.md` da feature.

A auditoria de 23/09/2026, com problemas por tela e lotes, está em
`/mnt/project-files/desktop-app/auditoria.md`. A validação anterior (08/09/2026)
continua em `docs/desktop-ui-validation/README.md`.
