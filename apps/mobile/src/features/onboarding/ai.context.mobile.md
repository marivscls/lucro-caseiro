# Onboarding e perfil do negócio

## Escopo atual

Aprovado em 2026-09-04: a prévia foi integrada ao primeiro acesso real do Lucro Caseiro. O mesmo formulário de cinco etapas é usado em `/onboarding`, no cartão do Início e em Configurações → Perfil do negócio. As outras marcas mantêm o onboarding anterior.

## Dados e persistência

- Nome, nome do negócio e tipo são gravados pela API de perfil existente. Segmentos são mapeados para o enum já aceito: confeitaria → food, artesanato → crafts, revenda → other.
- Segmento específico, momento, canais e prioridade ficam em `user_metadata.business_onboarding` do Supabase Auth, com versão 1 e status `completed` ou `dismissed`. São preferências do próprio usuário, nunca autorização ou permissões. Não exigem migração de banco.
- As duas escritas são sequenciais: só há confirmação e navegação quando ambas terminam. Se a segunda falhar, os campos básicos podem já estar atualizados, mas o formulário continua aberto com o rascunho e uma ação de nova tentativa.
- `onboarding_completed: true` significa que o primeiro acesso foi resolvido, inclusive por dispensa. O status detalhado distingue dispensa de conclusão. A decisão local por userId também é atualizada após sucesso para não depender de atualização do JWT.
- Ao abrir, as preferências são buscadas na conta. Cache de preferências e de perfil são separados por userId. Troca de conta durante o salvamento impede a gravação de preferências na nova sessão.
- “Agora não”, fechar o primeiro fluxo e voltar no Android persistem a dispensa quando ainda não há decisão. A edição posterior não apaga respostas salvas ao cancelar. Rascunhos não concluídos não são persistidos.
- Dados fictícios da prévia anterior não são migrados. O store mockado foi removido.

## Personalização

- O Início mostra a recomendação da prioridade selecionada, com navegação para precificação, venda, agenda, financeiro, catálogo ou cadastro de serviço.
- Ideias para divulgar: orientações determinísticas e recolhíveis para cada canal selecionado, adaptadas ao segmento. Não enviam mensagens, não publicam conteúdos e não fazem chamadas de IA.
- `useBusinessCopy` reaproveita o tipo canônico e especializa serviços, peças de artesanato e exemplos de confeitaria. Marcas verticais mantêm seus próprios termos.
- “Primeiros passos” permanece separado. Depois da decisão de perfil, fica disponível sob demanda. O guia de produtos não é exibido para prestadores de serviço.
- O convite de demonstração foi retirado do Início. A recomendação só aparece após concluir; o acesso continua em Configurações. Contas antigas não são forçadas a responder novamente.

## Interface

Reaproveita o design compacto aprovado: Manrope, paleta da marca, ilustrações existentes, perguntas de 26/32 px, opções com altura mínima de 72 px e ações de 48 px. Alturas flexíveis, conteúdo rolável, foco visível, suporte a fonte ampliada e redução de movimento. Estados de carregamento, erro e salvamento; entradas e ações bloqueadas durante a gravação.

O formulário `business-profile-form.tsx` é compartilhado pelo fluxo real. A composição e a persistência ficam em `business-profile.tsx` e `use-business-onboarding.ts`.

## Verificação

Testes cobrem validação, mapeamento de segmentos, recomendações/canais, falhas de API e Auth, nova tentativa, dispensa remota, isolamento e troca de conta, textos personalizados e regressão do guia anterior. Revisão visual na prévia web usando a leitura do perfil existente, sem gravar dados fictícios na conta. Publicação de produção não executada.
