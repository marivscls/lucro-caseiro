# Padrão de layout desktop

Aplicável ao app autenticado no navegador a partir de 1024 px. A identidade visual, as ilustrações de resumo e os fluxos de cada área continuam sendo os existentes.

## Estrutura compartilhada

- `DesktopShell`: navegação de 240 px; margens laterais de 32 px; conteúdo de até 1280 px.
- `ScreenHeader`: título de 20/26 px, subtítulo de 13/18 px, respiro vertical de 24 px e ações à direita. As páginas compartilham o mesmo eixo horizontal.
- `ScreenGuidance`: ajuda `?` nas ações do cabeçalho, antes da ação principal; o painel abre sob demanda. A introdução só ocupa a largura da página enquanto a tela está vazia e a orientação não foi dispensada ou concluída; explicação e ações ficam lado a lado quando cabem. Cabeçalhos próprios recebem o botão por `renderHeader`.
- `FAB`: no desktop, botão com texto e altura de 44 px; no mobile, mantém o formato anterior.
- `ScreenCreateBar` e rodapés de `StandardModal`: ações alinhadas à direita no desktop.
- `desktopSplitLayout`: campos flexíveis, intervalo de 24 px e resumo de 30% da largura, limitado a 280–360 px. O resumo permanece visível ao rolar.
- Buscas: largura máxima de 480 px, alinhadas ao conteúdo; campos monetários e quantitativos permanecem compactos.
- Grades e ilustrações devem usar a largura disponível do conteúdo. `desktopContentWidth` desconta a navegação e as margens; grades de Nova venda medem a coluna via `onLayout`.
- Modais de leitura e cadastros curtos podem manter largura menor. Não centralizar uma página inteira em uma coluna de modal.
- Resumos ilustrados permanecem presentes quando os totais são zero. Estados vazios usam texto e ação, sem PNG decorativo próprio.

## Validação de 08/09/2026

A cobertura e as capturas estão em `docs/desktop-ui-validation/README.md`. A revisão inclui páginas sem registros, formulários e as etapas de Nova venda com produtos de teste. Dados e autenticação são simulados em um navegador isolado.

Para alterações futuras, conferir o desktop de 1024 px e de 1440 px, uma largura mobile e o conteúdo após terminar as animações. Verificar alinhamento, ausência de rolagem horizontal da página, texto livre de sobreposição com arte, campos acessíveis e ações visíveis.
