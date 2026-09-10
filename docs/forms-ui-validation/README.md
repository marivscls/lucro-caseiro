# Revisão dos formulários — better-ui

Melhorias implementadas preservando a paleta e os componentes do projeto. A galeria em `index.html` reúne 12 estados de criação, edição e prévia, capturados com dados simulados.

## Hierarquia, superfícies e alinhamento

| Severity | Location                                                                                                                                  | Before                                                      | After                                                                                    | Why                                                                         |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| MEDIUM   | apps/mobile/src/shared/components/standard-modal.tsx:112                                                                                  | Cabeçalho e rodapé ocupavam mais espaço; subtítulo truncado | Margens consistentes, fechamento circular de 44 px, subtítulo com quebra e rodapé fixo   | Superfícies e alvos de toque: mais espaço útil para o formulário            |
| MEDIUM   | apps/mobile/src/shared/components/form-section.tsx:45                                                                                     | Seções fixas acrescentavam caixas e margens aninhadas       | Seções fixas abertas, sem borda externa; seções recolhíveis preservadas                  | Hierarquia de superfícies: menos ruído e mais largura nos campos de produto |
| MEDIUM   | apps/mobile/src/features/recipes/components/recipe-form-fields.tsx:53                                                                     | Ícones externos deslocavam os campos para outra margem      | Ícones pequenos no rótulo; campos e foto alinhados                                       | Alinhamento óptico: leitura contínua na criação e edição                    |
| MEDIUM   | apps/mobile/src/shared/components/form-step-progress.tsx:25                                                                               | Barras sem numeração e cabeçalho em duas linhas             | Etapas numeradas, seleção com superfície e etapas concluídas com check                   | Estado visível sem depender de animação; números e nomes cabem em 320 px    |
| MEDIUM   | apps/mobile/src/features/labels/components/create-label-form.tsx:277; apps/mobile/src/app/labels.tsx:335                                  | Rodapé podia deixar a ação principal estreita               | Container com largura explícita e ação principal larga no celular                        | Contenção: ação fácil de localizar e tocar                                  |
| MEDIUM   | apps/mobile/src/features/packaging/components/packaging-form.tsx:402; apps/mobile/src/features/materials/components/material-form.tsx:583 | Opções mudavam de largura e uma unidade quebrava isolada    | Grade de embalagens com espaço reservado para check; unidades com alvos mínimos de 44 px | Estabilidade dos controles e consistência de seleção                        |
| LOW      | apps/mobile/src/features/materials/components/material-form.tsx:626                                                                       | Configuração de ícone precedia estoque e custo              | Estoque e custo vêm antes da opção de ícone; estoque em uma coluna no celular            | Prioridade dos dados essenciais e rótulos legíveis                          |
| LOW      | apps/mobile/src/shared/components/form-field.tsx; packages/ui/src/components/input.tsx                                                    | Textos de exemplo muito claros e foco inconsistente         | Cor secundária do tema e borda de foco nos campos compartilhados                         | Estado de foco e leitura dos exemplos                                       |
| LOW      | apps/mobile/src/app/labels.tsx:306                                                                                                        | Exclusão usava preenchimento semelhante ao de ação positiva | Ação discreta com ícone de lixeira; edição com alvo de 44 px                             | Hierarquia de ações e ícones contextuais                                    |
| LOW      | packages/ui/src/components/button.tsx                                                                                                     | Pressão com escala 0.97                                     | Escala 0.96, respeitando movimento reduzido e opção static                               | Feedback de pressão conforme a skill                                        |

## Verificação

- TypeScript do aplicativo mobile e do pacote UI: passou.
- ESLint dos componentes mobile alterados: passou.
- Testes existentes de superfície responsiva e densidade: 8 passaram.
- Chromium: oito formulários nas larguras 320, 390, 500 e 1440 px; limites do modal e posição da ação principal conferidos.
- Edição de embalagem, compra e receita e prévia de etiqueta: abertas em 390 e 1440 px. Avançar e voltar nas edições de compra e receita: passou.
- Oito formulários no tema escuro em 390 px, incluindo rolagem com posição do rodapé preservada: passou.
- Nenhuma gravação de dados de negócio: as chamadas externas foram interceptadas pelo script local.
- Not verified: teclado virtual em dispositivos iOS/Android, leitor de tela, todos os estados de erro e carregamento, exportação/impressão, gravação real e reprodução das animações a 10% de velocidade.

**Approve** para o polimento visual inspecionado; os itens marcados Not verified não estão cobertos por esta aprovação.
