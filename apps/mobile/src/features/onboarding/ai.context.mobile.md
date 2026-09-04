# Onboarding e perfil do negócio

## Purpose

Aprovado em 2026-09-04: a prévia foi integrada ao primeiro acesso real do Lucro Caseiro. O mesmo formulário de cinco etapas é usado em `/onboarding`, no cartão do Início e em Configurações → Perfil do negócio. As outras marcas mantêm o onboarding anterior.

## API Integration

- Nome, nome do negócio e tipo são gravados pela API de perfil existente. Segmentos são mapeados para o enum já aceito: confeitaria → food, artesanato → crafts, revenda → other.
- Segmento específico, momento, canais e prioridade ficam em `user_metadata.business_onboarding` do Supabase Auth, com versão 1 e status `completed` ou `dismissed`. São preferências do próprio usuário, nunca autorização ou permissões. Não exigem migração de banco.
- As duas escritas são sequenciais: só há confirmação e navegação quando ambas terminam. Se a segunda falhar, os campos básicos podem já estar atualizados, mas o formulário continua aberto com o rascunho e uma ação de nova tentativa.
- `onboarding_completed: true` significa que o primeiro acesso foi resolvido, inclusive por dispensa. O status detalhado distingue dispensa de conclusão. A decisão local por userId também é atualizada após sucesso para não depender de atualização do JWT.
- Ao abrir, as preferências são buscadas na conta. Cache de preferências e de perfil são separados por userId. Troca de conta durante o salvamento impede a gravação de preferências na nova sessão.
- “Agora não”, fechar o primeiro fluxo e voltar no Android persistem a dispensa quando ainda não há decisão. A edição posterior não apaga respostas salvas ao cancelar. Rascunhos não concluídos não são persistidos.
- Dados fictícios da prévia anterior não são migrados. O store mockado foi removido.

## Components

- O Início mostra a recomendação da prioridade selecionada, com navegação para precificação, venda, agenda, financeiro, catálogo ou cadastro de serviço.
- Ideias para divulgar: orientações determinísticas e recolhíveis para cada canal selecionado, adaptadas ao segmento. Não enviam mensagens, não publicam conteúdos e não fazem chamadas de IA.
- `useBusinessCopy` reaproveita o tipo canônico e especializa serviços, peças de artesanato e exemplos de confeitaria. Marcas verticais mantêm seus próprios termos.
- “Primeiros passos” permanece separado. Depois da decisão de perfil, fica disponível sob demanda. O guia de produtos não é exibido para prestadores de serviço.
- O convite de demonstração foi retirado do Início. A recomendação só aparece após concluir; o acesso continua em Configurações. Contas antigas não são forçadas a responder novamente.

## Performance

Reaproveita o design compacto aprovado: Manrope, paleta da marca, ilustrações existentes, perguntas de 26/32 px, opções com altura mínima de 72 px e ações de 48 px. Alturas flexíveis, conteúdo rolável, foco visível, suporte a fonte ampliada e redução de movimento. Estados de carregamento, erro e salvamento; entradas e ações bloqueadas durante a gravação.

O formulário `business-profile-form.tsx` é compartilhado pelo fluxo real. A composição e a persistência ficam em `business-profile.tsx` e `use-business-onboarding.ts`.

## Test matrix

Testes cobrem validação, mapeamento de segmentos, recomendações/canais, falhas de API e Auth, nova tentativa, dispensa remota, isolamento e troca de conta, textos personalizados e regressão do guia anterior. Revisão visual na prévia web usando a leitura do perfil existente, sem gravar dados fictícios na conta. Publicação de produção não executada.

## Non-goals

Não altera planos, permissões ou cobrança. Não publica divulgações nem substitui o guia de ativação. Não migra respostas fictícias da prévia.

## Boundaries & Ownership

Onboarding coleta preferências; subscription mantém nome e tipo canônicos; Auth persiste a decisão de primeiro acesso. Home consome a recomendação, e Configurações oferece edição.

## Code pointers

- `business-profile.tsx`: composição de fluxo e cartão.
- `business-profile-form.tsx`: formulário compartilhado.
- `profile-data.ts`, `profile-visuals.tsx`: escolhas, recomendações e elementos visuais.
- `business-profile-data.ts`: validação, mapeamento e persistência coordenada.
- `use-business-onboarding.ts`: leitura e salvamento vinculados à conta.

## Hooks

`useBusinessOnboarding` consulta a conta, expõe carregamento/erro/salvamento e impede envio duplicado. `useProfile` e `useUpdateProfile` fornecem os campos canônicos. `useBusinessCopy` adapta exemplos ao segmento.

## Contracts

Usa `UpdateProfile` e `UserProfile` dos contratos existentes. `BusinessOnboarding` possui `version: 1`, `status: completed | dismissed` e respostas validadas de segmento, estágio, canais e objetivo. `BusinessProfileAnswers` também contém nome e negócio para o formulário.

## Error Handling

Falha em qualquer escrita mantém o formulário aberto e o rascunho disponível. Carregamento malsucedido oferece nova tentativa. Nunca marca conclusão apenas por ter alterado o perfil básico. Verifica a identidade antes da atualização de Auth.

## Examples

Artesanato com prioridade de preço destaca a precificação de uma peça. Serviços com prioridade de organização abrem a agenda. Canais WhatsApp e Instagram produzem duas ideias distintas de divulgação. Uma conta dispensada mantém a edição disponível em Configurações.

## Change log / Decisions

- 2026-09-04: prévia convertida em fluxo real com persistência por conta e layout compacto.
- 2026-09-04: removidos nomes e convite de demonstração; Início só mostra o cartão personalizado após conclusão. A edição continua em Configurações.
