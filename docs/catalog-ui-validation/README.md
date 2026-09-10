# Catálogo — revisão visual

Implementação com a skill `better-ui`, preservando as ilustrações existentes e as alterações anteriores do projeto.

| Severity | Location                             | Before                                                                    | After                                                     | Why                                         |
| -------- | ------------------------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| MEDIUM   | apps/mobile/src/app/catalog.tsx:96   | Arte empilhada no celular e sobreposta ao texto no tablet                 | Arte inteira ao lado da descrição, com largura responsiva | Hierarquia e separação entre texto e imagem |
| MEDIUM   | apps/mobile/src/app/catalog.tsx:754  | Cartão recuado, borda e sombra concorrentes                               | Margens alinhadas, sombra leve e indicadores distintos    | Superfícies e agrupamento mais claros       |
| MEDIUM   | apps/mobile/src/app/catalog.tsx:894  | Ações ocupavam várias linhas de tela; rótulo cortava ao usar duas colunas | Colunas proporcionais e suporte a duas linhas no rótulo   | Preservar a leitura e a área de toque       |
| LOW      | apps/mobile/src/app/catalog.tsx:408  | Adornos ocupavam espaço na lista                                          | Mais espaço para nomes, preços e controles                | Clareza dos componentes                     |
| LOW      | apps/mobile/src/app/catalog.tsx:1307 | Espaçamento superior de 58 px                                             | Espaçamento de 8 px no celular                            | Aproximar as ações do cabeçalho             |

Verificação: TypeScript, ESLint e Prettier passaram. Navegador com dados locais simulados em 320, 390, 500, 768 e 1440 px; ilustração presente, sem rolagem horizontal; menu, abas e Organizar verificados. Estados vazio, desativado e escuro conferidos em 390 px. Nenhuma alteração de dados reais ou compartilhamento externo realizado.

Not verified: execução nativa em Android/iOS; compartilhamento do sistema; animações a 10% da velocidade; navegação completa por teclado e estados de foco/hover. Os estados de carregamento e erro foram inspecionados no código, sem simulação visual.

Approve — composição e controles verificados acima; as limitações de cobertura permanecem explícitas.
