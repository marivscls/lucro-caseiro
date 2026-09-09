# Validação dos formulários

Os formulários do aplicativo Expo compartilham a validação no Android/iOS, desktop e PWA. A tentativa de continuar ou salvar revela uma mensagem de atenção junto ao primeiro campo pendente, destaca os campos e mantém os dados digitados. As mensagens desaparecem quando os valores são corrigidos.

## Implementação

- `apps/mobile/src/shared/hooks/use-form-validation.ts`: erros por campo, estado de tentativa, foco, reinício ao reabrir e campos em etapas diferentes.
- `packages/ui/src/components/validation-field.tsx`: aviso e erro no próprio formulário, identificação acessível e foco no texto ou seletor.
- `CenteredTextInput` registra o campo nativo, preservando as referências dos formulários. No navegador, o campo usa `aria-invalid` e `aria-describedby`.
- `StandardModal` e `KeyboardAwareScrollView` fornecem a rolagem nativa para campos de texto e seletores. Seções de um grupo inválido são expandidas.

Para integrar um novo formulário, declare `useFormValidation` com os erros atuais, envolva cada controle em `ValidationField` com `validation.field("campo")` e interrompa o envio quando `validation.validate()` retornar `false`. Campos opcionais ou inativos devem retornar `undefined` ou `false`. Passe a visibilidade da janela como segundo argumento para limpar os avisos quando ela for reaberta.

## Abrangência

Cadastro e edição de produtos, categorias, kits, estoque, materiais, embalagens, receitas, clientes, fornecedores, serviços, pedidos/atendimentos, compras, orçamentos, etiquetas, lançamentos, gastos fixos, metas, perfil, catálogo e operações de varejo. Inclui entrada/cadastro de conta, troca de senha, configuração inicial, avanço da venda e campos de precificação. As regras de domínio existentes continuam verificando formatos, limites e dependências adicionais.

## Verificação

- Testes do hook e do componente renderizado: envio bloqueado, aviso, foco em texto e seletor, acessibilidade, correção dos erros e preservação dos valores.
- Teste de rolagem nativa para um seletor obrigatório sem teclado aberto.
- Suíte do aplicativo, TypeScript do aplicativo e do pacote UI, lint e exportação web do Expo.
- `apps/mobile/scripts/form-validation-smoke.cjs`: teste em navegador invisível, com sessão fictícia e interceptação de todas as chamadas externas, nas larguras de 390 e 1440 px. Verifica produtos, categoria aninhada e materiais, sem permitir gravações externas.
- Capturas nesta pasta mostram os estados de erro em celular e desktop.

A conferência visual foi feita no navegador. Instalação do PWA e execução em aparelhos Android/iOS físicos não foram verificadas nesta sessão.
