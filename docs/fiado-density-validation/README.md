# Fiado e padrões de tamanho — better-ui

## Escala compartilhada

Os componentes comuns aplicam a escala às telas que os reutilizam. Isso não representa uma revisão individual de todas as páginas.

| Elemento                              | Padrão                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------- |
| Botão compacto / FAB de cabeçalho     | 40 dp, com área de toque ampliada                                           |
| Botão padrão, filtro e botão de ícone | 44 dp                                                                       |
| Botão grande e campo de entrada       | 48 dp                                                                       |
| Contador de filtro / avatar de Fiado  | 20 / 36 dp                                                                  |
| Resumo ilustrado de Fiado             | mínimo de 136 dp no celular; 144 dp nas demais larguras                     |
| Navegação inferior                    | 64 dp web, 68 dp Android, 80 dp iOS; mantém a reserva de espaço e os insets |
| Espaçamentos                          | escala existente de 4, 8, 12, 16, 20 e 24 dp                                |

Fonte: `packages/ui/src/theme.ts`, token `controlSizes`. Cabeçalhos usam 8 dp de espaço vertical. Rodapés usam o `Button` comum e podem crescer quando o texto quebra, sem altura fixa que corte o rótulo. As ilustrações existentes permanecem.

## Superfícies, proporções e agrupamento

| Severity | Location                                                          | Before                                                                 | After                                                                      | Why                                                            |
| -------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| MEDIUM   | apps/mobile/src/app/fiado.tsx:976                                 | Resumo de 188 dp, espaçamento de 20 dp                                 | Resumo de 136–144 dp, espaçamento de 12 dp e arte limitada                 | Densidade e hierarquia sem retirar a ilustração                |
| MEDIUM   | apps/mobile/src/app/fiado.tsx:1024                                | Avatar de 48 dp, selo de 38 dp, ações de 48 dp e borda rosa com sombra | Avatar de 36 dp, selo de 24 dp, ações de 44 dp, superfície com sombra leve | Menos peso visual; valor e situação legíveis em telas pequenas |
| MEDIUM   | packages/ui/src/components/chip.tsx:73                            | Padding lateral de 16 dp em cada filtro                                | Padding de 8 dp, mantendo altura de 44 dp                                  | Evitar que filtros ocupem várias linhas sem necessidade        |
| MEDIUM   | apps/mobile/src/shared/components/screen-create-bar.tsx:50        | Botão próprio de altura fixa                                           | Button comum, mínimo de 44 dp e até duas linhas                            | Tamanho e feedback de toque consistentes                       |
| LOW      | apps/mobile/src/shared/components/mobile-floating-tab-bar.tsx:188 | Navegação de 72 dp web e raios desalinhados com o padding              | 64 dp, raios de 20/12 dp e padding de 8 dp                                 | Raios concêntricos e mais espaço para conteúdo                 |

## Verificação

- TypeScript: app mobile e pacote UI passaram.
- ESLint: arquivos mobile alterados verificados; o pacote UI não possui configuração própria de lint.
- 24 testes existentes passaram: Fiado, cabeçalho e navegação.
- Navegador com dados simulados: 320, 390, 500, 1024 e 1440 px, sem rolagem horizontal; busca, limpar filtros, filtro de contato, menu e confirmação de recebimento funcionaram, sem gravar dados.
- Capturas finais de 390 px com as imagens carregadas: claro, escuro e vazio. A ilustração é preservada inclusive com saldo zero.
- Estados de loading/disabled e redução de movimento do Button foram inspecionados no código.

Not verified: execução nativa em Android/iOS, revisão individual das demais páginas, navegação completa por teclado, hover/foco, reprodução de animações a 10% e estados de carregamento/erro simulados visualmente. WhatsApp, ligação e confirmação efetiva de pagamento não foram acionados.

Approve — escopo inspecionado e validado acima; limitações de cobertura explícitas.
