# ai.context.mobile.md — Assistant (Anotar falando)

---

## Purpose

Anotar uma venda falando ou escrevendo do jeito que se fala ("3 marmitas pra Dona Cida,
fiado"). A IA monta um rascunho; a pessoa confere antes de salvar.

## Non-goals

- Não salva nada sem confirmação.
- Não cria produto nem preço: item não reconhecido manda para a Nova venda.
- O botão Gravar áudio aparece sempre: no celular grava com expo-audio (AAC .m4a, mono 16 kHz), na web com MediaRecorder. Navegador sem microfone (ex.: http fora do localhost) mostra aviso para usar o ditado do teclado.

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (`Assistant*`, `CreateSale`),
  `features/sales/hooks` (`useCreateSale`), `expo-audio`, `@lucro-caseiro/ui`.
- **Dependentes:** `app/assistant.tsx`; entrada em Mais > Do dia a dia.

## Code pointers

| Arquivo                          | Descricao                                          |
| -------------------------------- | -------------------------------------------------- |
| `api.ts` / `hooks.ts`            | Uso do mês e rascunho da venda                     |
| `domain.ts`                      | `draftToSale`, `draftTotal`, `usageLabel`          |
| `voice-recorder.ts` / `.web.ts`  | expo-audio no celular; MediaRecorder na web (60 s) |
| `components/sale-voice-card.tsx` | Texto/áudio, revisão, pagamento e registrar venda  |
| `app/assistant.tsx`              | Tela                                               |

## Components

- `SaleVoiceCard({ disabled })`: tela "microfone gigante" (opção A aprovada em 2026-09-29):
  título "Toque e fale a venda", `MicButton` de 124 px com dois anéis (vinho no claro,
  rosa no escuro, lima gravando; spinner enquanto monta), dois exemplos de frase e
  "Prefere escrever?" com campo de uma linha e botão de enviar. Depois vira o cartão
  "Confira a venda" com itens, cliente e forma de pagamento; "Registrar venda" ou
  "Abrir Nova venda".

## Hooks

| Hook                  | Tipo          | Descricao                     |
| --------------------- | ------------- | ----------------------------- |
| `useAssistantUsage()` | `useQuery`    | Key `["assistant", "usage"]`. |
| `useDraftSale()`      | `useMutation` | Invalida `["assistant"]`.     |

## API Integration

| Endpoint                       | Verbo | Funcao                | Parametros                |
| ------------------------------ | ----- | --------------------- | ------------------------- |
| `/api/v1/assistant/usage`      | GET   | `fetchAssistantUsage` | -                         |
| `/api/v1/assistant/sale-draft` | POST  | `draftSale`           | `{ text }` ou `{ audio }` |

## Contracts

- `AssistantSaleDraft`, `AssistantUsage { used, limit }` (limite mensal por plano definido na API).

## Error Handling

- Limite do mês, arquivo grande ou IA indisponível: mensagem da API em `alertError`.
- Microfone negado: alerta para liberar ou escrever.

## Performance

- Áudio para em 60 s.

## Test matrix

- [x] `domain.test.ts`: venda pronta, itens desconhecidos, rascunho vazio, total, uso do
      mês.
- [x] `shared/mock/growth-routes.test.ts`: IA bloqueada na demonstração.

## Examples

- Mais > Anotar falando > "2 bolos de pote pra Bia no Pix" > Montar venda > Registrar venda.

## Change log / Decisions

- 2026-09-28: criação. Sem biblioteca nova de áudio (evita build nativo novo): no celular,
  ditado do teclado; na web, MediaRecorder. Limites de uso por plano ficam na API.
- 2026-09-29: gravação de áudio também no celular (expo-audio, permissão de microfone no app.config). Precisa de um build novo do app.
- 2026-09-29: removida a importação por foto do caderno (LUCAS): a leitura da foto falhava com frequência ("Não achei nomes e valores nessa foto"). Endpoints `/assistant/notebook*` e contratos saíram junto.
- 2026-09-29: `expo-audio` só é carregado quando o binário tem o módulo nativo (`requireOptionalNativeModule("ExpoAudio")`). Build sem o módulo não quebra mais: o botão avisa para atualizar o app.
- 2026-09-29: aviso de limite esgotado muda com `usage.trial`: "Seus usos de teste acabaram" no Gratuito; "No dia 1º os usos voltam" nos pagos.
- 2026-09-29: `/assistant?falar=1` (vindo do Início) começa a gravar sozinho em aparelhos que gravam; nos outros abre normal, sem aviso.
