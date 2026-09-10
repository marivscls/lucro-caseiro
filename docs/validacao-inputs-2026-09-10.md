# Revisão de inputs — 10/09/2026

Escopo: formulários do aplicativo em `apps/mobile` (incluindo a versão web/PWA), com foco na entrada de números e nas regras existentes de preenchimento e envio.

## Correção

`keyboardType` apenas sugere o teclado; não impede letras digitadas ou coladas. Os campos numéricos sem máscara agora declaram `numericMode`, aplicado por `CenteredTextInput` e repassado por `Input` e `TextFieldCard`.

- `integer`: dígitos; permite apagar o valor para editá-lo.
- `decimal`: dígitos e um separador decimal (vírgula ou ponto).
- `signed-decimal`: também permite sinal negativo no início, para o reajuste de preços do varejo.
- Letras, números misturados com texto, notação científica e múltiplos separadores são rejeitados, preservando o valor anterior. Não se transforma uma entrada como `-12` em `12`.
- Máscaras de dinheiro, telefone, data e hora mantêm seus próprios tratamentos. Campos de texto continuam livres.

Na criação e edição de receitas, rendimento deve ser finito e maior que zero tanto ao avançar quanto ao salvar. Um ponto ou uma vírgula isolados não permitem avançar. Frações como `1,5` continuam válidas.

## Telas revisadas

| Tela/área                              | Regra de entrada e validações verificadas                                                                                                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Receitas                               | Rendimento e quantidade de ingredientes com filtro decimal. Nome, unidade, ingredientes e rendimento positivo são verificados no envio; contratos impõem limites de quantidade.                |
| Materiais                              | Filtro decimal no estoque, alerta e conteúdo por unidade. Custo mantém máscara monetária; contrato valida quantidades e valores.                                                               |
| Produtos                               | Filtro inteiro em estoque, reposição, alertas e variações. Preços mantêm máscara monetária; contrato exige inteiros não negativos para estoque.                                                |
| Compras                                | Quantidade de itens com filtro inteiro, conforme contrato. Custos e valor mantêm máscara monetária; data mantém máscara brasileira.                                                            |
| Orçamentos                             | Quantidade e desconto com filtro decimal. Preço e custo mantêm máscara monetária; validade mantém máscara e validação de data.                                                                 |
| Nova venda                             | Peso e desconto com filtro decimal; limites e valores positivos continuam nas validações de venda.                                                                                             |
| Etiquetas                              | Largura e altura com filtro decimal. Cópias já removiam caracteres não numéricos. Contrato verifica dimensões e capacidade da folha.                                                           |
| Precificação                           | Margem inteira e taxas decimais com restrição. Campos compartilhados de quantidade/percentual recebem filtro decimal; valores monetários mantêm máscara.                                       |
| Operações                              | Quantidades, custos, preços e valores previstos com filtro decimal. Obrigatoriedade e vínculos continuam verificados pelo formulário; regras adicionais dependem do contrato de cada operação. |
| Varejo                                 | Contagem com filtro inteiro; valores e descontos com filtro decimal. Reajuste aceita negativos, conforme contrato (`-99` a `1000`). Regras de envio continuam específicas de cada operação.    |
| Financeiro e despesas recorrentes      | Máscara monetária e máscara de data existentes. Dia da recorrência remove não dígitos e o contrato limita de 1 a 28.                                                                           |
| Serviços e encomendas                  | Durações e intervalos já removem não dígitos; valores usam tratamento monetário. Datas e horários possuem máscaras; contratos verificam duração e valores.                                     |
| Embalagens e metas                     | Valores já usam máscara monetária; validações de preenchimento e valores permanecem.                                                                                                           |
| Clientes, fornecedores e configurações | Telefones possuem máscara; datas de aniversário usam máscara brasileira. Fornecedores validam nome, telefone e e-mail.                                                                         |
| Login e cadastro                       | E-mail e senha possuem validações específicas; não recebem restrição numérica.                                                                                                                 |

O filtro controla a sintaxe durante a edição. Campos temporariamente vazios ou com separador decimal ainda precisam das validações de envio. Esta alteração preserva os limites e regras de negócio existentes, sem criar novos limites arbitrários.

## Verificação

- 70 testes direcionados passaram: input numérico, formulário real de receita, feedback de validação, dinheiro, datas, telefones e validações gerais.
- Suíte completa: 815 testes passaram; 8 falharam em `api-client.test.ts` (7) e `form-step-progress.test.tsx` (1), fora dos arquivos de testes modificados nesta correção.
- TypeScript de `packages/ui` passou. A checagem global do aplicativo encontrou erro de iterabilidade de `NodeListOf<Element>` em `features/sales/receipt-pdf.test.ts:113`, fora desta alteração.
- Os testes de interface usam React Native Web/DOM. Não foi executado teste em aparelho físico.
