# Padrão de formulários

Vale para todo cadastro e edição do app (produto, cliente, encomenda, orçamento,
serviço, insumo, embalagem, receita, fornecedor, compra, lançamento, rótulo,
perfil, login…), no celular e no computador. A referência é o cadastro de
produto (`features/products/components/create-product-form.tsx`).

O objetivo é um vocabulário só: quem aprende um formulário já sabe usar todos.

## Peças

| Peça                                           | Arquivo                            | Uso                                                                                                           |
| ---------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `StandardModal size="form"`                    | `standard-modal.tsx`               | Moldura de todo formulário: folha de baixo no celular, janela de 680 px no computador, rodapé fixo de ações.  |
| `FormBody`                                     | `form-layout.tsx`                  | Corpo do formulário: blocos empilhados com 32 px entre eles.                                                  |
| `FormSection collapsible={false}`              | `form-section.tsx`                 | Grupo com título (18 px no computador, 16 no celular) e descrição opcional. Sem ícone, sem caixa.             |
| `FormSection` (recolhível)                     | `form-section.tsx`                 | Só para detalhes opcionais que a maioria não preenche. Caixa com borda; abre sozinha se tiver erro.           |
| `FormGrid`                                     | `form-layout.tsx`                  | Campos lado a lado quando cabem (mede a largura; vira uma coluna no celular). `span="full"` ocupa a linha.    |
| `FormField label optional hint validation`     | `form-field.tsx`                   | Rótulo de 15 px + controle + erro. `validation={form.field("nome")}` liga o erro ao campo.                    |
| `TextField icon prefix suffix right multiline` | `form-field.tsx`                   | Caixa de texto padrão: 48 px (112 px multilinha), raio 12, borda `#D8D2CC`, foco na cor de ação.              |
| `Input label optional hint error`              | `@lucro-caseiro/ui`                | Mesmo visual do `TextField`, com rótulo embutido. Serve para telas que já usam `Input`.                       |
| `SelectField`                                  | `form-field.tsx`                   | Campo que abre uma escolha (categoria, cliente, data). Mesma caixa, seta à direita.                           |
| `ChoiceField`                                  | `form-field.tsx`                   | Escolha única entre 2 a 4 opções curtas, lado a lado. Selecionada: fundo rosado, borda vinho de 2 px e check. |
| `FieldLinkAction`                              | `form-field.tsx`                   | Ação curta ao lado do rótulo ("Gerar código"). Use em `FormField labelAction`.                                |
| `FormActions`                                  | `form-layout.tsx`                  | Rodapé: secundária à esquerda, principal por último. Celular divide a largura; computador alinha à direita.   |
| `FormStepProgress`                             | `form-step-progress.tsx`           | Etapas, só quando o formulário tem mais de ~8 campos obrigatórios ou assuntos bem separados.                  |
| `useFormValidation` + `validation`             | `shared/hooks/use-form-validation` | Erro no campo, foco no primeiro campo com problema e aviso para leitor de tela.                               |

## Regras

**Rótulos**

- Sempre acima do campo, em caixa normal, 15 px semibold. Nada de rótulo em CAIXA ALTA.
- Campo opcional: `optional` (mostra "(opcional)" discreto). Obrigatório: sem marca. Não escreva
  "(opcional)" nem "\*" dentro do texto do rótulo.
- Unidade vai no campo (`prefix="R$"`, `suffix="kg"`), não no rótulo ("Preço (R$)").
- Explicação curta vai em `hint`, entre o rótulo e o campo. Exemplo vai no placeholder ("Ex: 50").

**Campos**

- Uma altura só: 48 px. Multilinha: 112 px. Nada de 52, 56, 58, 60 ou 66.
- Ícone dentro do campo é opcional, cinza (`textSecondary`), 20 px. Nunca rosa.
- Datas usam `DateField` ou `SelectField` que abre o calendário, não uma máscara digitada.
- Dinheiro: `prefix="R$"` e `keyboardType="numeric"`.

**Grupos**

- Um formulário curto (até ~6 campos) não precisa de seção: `FormGrid` direto no `FormBody`.
- Título de seção não repete o título da etapa nem o do modal.
- Seções recolhíveis só para o que é opcional e raro. O essencial fica sempre aberto.

**Colunas**

- `FormGrid` põe dois campos por linha quando há espaço (computador e tablet). Pares naturais:
  nome + categoria, preço + custo, telefone + aniversário, quantidade + alerta.
- Campos longos (observações, descrição, endereço) usam `span="full"`.

**Ações**

- Rodapé do `StandardModal` com `FormActions`: secundária (`variant="outline"`) + principal.
  - Formulário de uma etapa: **Cancelar** + **Salvar …**/**Cadastrar …**.
  - Com etapas: **Cancelar** na primeira, **Voltar** nas outras; **Continuar** até a última.
  - Excluir não fica no rodapé: vai no fim do corpo, `variant="alertOutline"`, com confirmação.
- O rótulo diz a ação e o objeto ("Cadastrar produto", "Salvar alterações"), nunca só "OK".
- Sempre `Button` do `@lucro-caseiro/ui` (com `loading`). Nada de `Pressable` desenhado à mão.

**Erros**

- `useFormValidation` + `FormField validation`. O primeiro erro recebe foco e é anunciado.
- Não repita a mensagem em texto solto acima do campo nem em `alertValidation` quando o campo
  já mostra o erro. `alertValidation` fica só para regras que não pertencem a um campo.
- "Continuar" de uma etapa valida só os campos daquela etapa, com erro no campo, não em alerta.

**Texto**

- Português simples, frases curtas. Botões com verbo. Nada de jargão ("SKU", "input").

## Verificação

Para cada formulário alterado:

1. Capturas em 390×844, 1024×768 e 1440×900: vazio, com erro e preenchido.
2. Tab passa por todos os campos na ordem visual; Esc fecha; o foco vai para o primeiro erro.
3. `pnpm --filter @lucro-caseiro/mobile lint typecheck test`.
