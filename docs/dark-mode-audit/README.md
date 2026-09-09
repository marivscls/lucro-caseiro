# Revisão do modo escuro — Lucro Caseiro

Revisão realizada em 09/09/2026 na versão Expo Web do aplicativo, com dados simulados e todas as chamadas externas interceptadas. Nenhuma conta foi alterada.

## Resultado

As telas principais já usavam superfícies e tipografia ligadas ao tema. Foram corrigidas combinações pontuais que ainda perdiam contraste no modo escuro:

- Configurações e demais telas com a paleta editorial: os títulos e links agora usam o tom de texto de alto contraste da marca.
- Ações fixas de cadastro, filtros de produtos, embalagens, fichas de custo e financeiro, ações de fiado e alguns ícones: texto escuro sobre o preenchimento rosa claro do modo escuro. O texto sobre vinho continua claro.
- Fornecedores: avatares com superfície escura e categorias com cores semânticas legíveis.
- Materiais: indicação “Em dia”, controles de quantidade e ícones de alerta com pares de cores adequados.
- Embalagens e precificação: texto escuro sobre os destaques lima.
- Campos compartilhados: placeholders sem redução de opacidade no modo escuro. A ação de mostrar senha na recuperação usa a cor de texto de alto contraste.

## Cobertura

Foi feita inspeção de código das rotas e dos componentes usados pelas telas. A verificação no navegador cobriu:

- Configurações, início, vendas, nova venda, agenda, clientes e mais opções.
- Produtos, serviços, materiais, precificação, financeiro, fichas de custo, embalagens, fornecedores, compras e lista de insumos.
- Orçamentos, fiado, gastos fixos, resultados, etiquetas, catálogo, planos, suporte, outros aplicativos e perfil do negócio.
- Login, cadastro e recuperação de senha com sessão simulada.
- Configurações em 320, 390 e 1440 px: seleção de tema, abertura do perfil e acesso às ações de conta sem sobreposição da navegação.
- Fornecedores, materiais, embalagens, precificação e serviços em 390 e 1440 px, incluindo registros simulados nas listas alteradas.

As rotas `retail` e `operations` redirecionam para o início na marca Lucro Caseiro; não foram contadas como telas próprias verificadas. Rotas de autenticação de infraestrutura, área administrativa e variantes de outras marcas não fazem parte da verificação visual. As capturas documentam os estados exercitados, sem representar todos os possíveis formulários, conteúdos e erros. Não houve execução em aparelho Android ou iOS.

Imagens de produtos, prévias de etiquetas para impressão, PDFs e o catálogo público personalizado mantêm suas cores de conteúdo; não são superfícies do tema do aplicativo.

## Evidências

- `gallery.html`: galeria das rotas internas.
- `report.json`: rotas resolvidas, texto renderizado, erros de execução e transbordamento horizontal.
- `populated/`: capturas e relatórios com registros simulados, em celular e desktop.
- `auth/`: login, cadastro e recuperação de senha.
- `../settings-visual-validation/`: verificações interativas de Configurações, nos temas claro e escuro.

TypeScript do app e do pacote de UI, lint dos arquivos mobile alterados e oito testes de tema/paleta são verificados na conclusão. O teste de contraste exige pelo menos 4,5:1 nos pares de texto sobre cartões, rosa, lima e vinho do modo escuro.

Os scripts `check.cjs`, `check-populated.cjs` e `check-auth.cjs` usam o preview local em `http://localhost:8092` e permitem substituir a URL por `VALIDATION_PREVIEW_URL`.
