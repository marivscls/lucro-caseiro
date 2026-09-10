# Estatísticas de receitas — revisão visual

Aplicação da skill `better-ui` no modal de estatísticas, em 10/09/2026.
As capturas usam dados simulados, incluindo prejuízo elevado para verificar valores negativos e quebra de linha.

| Princípio                | Antes                                           | Depois                                                                                                 | Impacto                            |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Hierarquia e alinhamento | Nome, lucro e margem disputavam a mesma linha   | Nome completo acima dos valores; números alinhados                                                     | Leitura sem truncar os nomes       |
| Cor com significado      | Margem negativa em verde                        | Prejuízo em vermelho, rótulo “Margem negativa” e ícone descendente                                     | Interpretação correta do resultado |
| Superfícies e raios      | Ranking inteiro dentro de uma superfície pesada | Fundo discreto apenas no primeiro resultado positivo; raios concêntricos de 20/8 px com 12 px de recuo | Destaque com menos ruído           |
| Contraste                | Texto secundário no destaque escuro             | Margem do primeiro colocado usa o tom semântico de sucesso                                             | Contraste de 4,60:1 no tema escuro |

Verificação:

- Navegador Chromium: 320, 390, 500 e 1440 px, sem transbordamento horizontal no modal.
- Nomes longos completos, perdas em vermelho, fechar, reabrir e Escape.
- Estados vazio, erro e carregamento; temas claro e escuro.
- Todas as requisições externas interceptadas; nenhuma escrita de dados reais.
- ESLint do componente: passou.
- Testes existentes de `statistics.test.ts`: 2 passaram; cálculos preservados.
- Validação de contextos mobile: passou.
- TypeScript global: impedido por erros em `client-detail.tsx:204` (`textOnSuccess`) e `numeric-input.test.tsx:28` (`numericMode`), fora do componente alterado.
- Not verified: execução nativa Android/iOS, leitor de tela e reprodução de animações a 10% da velocidade. O modal reutiliza os controles e animações compartilhados.

Reprodução: `apps/mobile/scripts/recipe-statistics-ui-smoke.cjs`. Aceita `PLAYWRIGHT_PATH`, `VALIDATION_PREVIEW_URL`, `RECIPE_STATS_WIDTH` e `RECIPE_STATS_SCENARIO` (`populated`, `dark`, `empty`, `error`, `loading`).

Approve — escopo visual e interações de navegador verificados acima.
