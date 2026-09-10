# Gastos fixos — revisão better-ui

| Severidade | Local                                            | Antes                                                         | Depois                                                                            | Princípio / impacto                                                      |
| ---------- | ------------------------------------------------ | ------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| MEDIUM     | `apps/mobile/src/app/recurring-expenses.tsx:664` | Campos altos em sequência, com rolagem para ver o dia.        | Descrição acima de valor e dia, agrupados lado a lado; campos de 48 px.           | Densidade e hierarquia; o formulário cabe na captura móvel de 320 × 844. |
| MEDIUM     | `apps/mobile/src/app/recurring-expenses.tsx:704` | Categorias grandes, com seleção apenas visual na web.         | Duas colunas, rótulos que podem quebrar linha, marca de seleção e `aria-checked`. | Ícones contextuais e estado acessível; seleção legível e anunciada.      |
| LOW        | `apps/mobile/src/app/recurring-expenses.tsx:746` | Aviso de recorrência no fim da rolagem; duas ações no rodapé. | Resumo visível com o dia escolhido e uma ação principal fixa.                     | Hierarquia; fica claro o que será lançado antes de salvar.               |

Verificação com dados simulados e requisições interceptadas: cadastro vazio,
validações de descrição, valor e dia; seleção de categoria; resumo; criação e
edição, em 320, 390, 482 e 1440 px; modo escuro em 390 px.
TypeScript, ESLint e cinco testes de apresentação dos gastos fixos passaram.

Not verified: teclado virtual em Android/iOS, leitor de tela real, hover e
reprodução de animações em 10% da velocidade. O componente mantém as interações
dos controles compartilhados; nenhum efeito de entrada novo foi adicionado.

Approve — para os fluxos e estados verificados acima.
