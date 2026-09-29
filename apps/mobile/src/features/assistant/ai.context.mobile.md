# ai.context.mobile.md — Assistant (Anotar falando)

---

## Purpose

Anotar uma venda falando ou escrevendo do jeito que se fala ("3 marmitas pra Dona Cida,
fiado") e passar a foto do caderno de fiado para o app. A IA monta um rascunho; a pessoa
confere antes de salvar.

## Non-goals

- Não salva nada sem confirmação.
- Não cria produto nem preço: item não reconhecido manda para a Nova venda.
- O botão Gravar áudio aparece sempre: no celular grava com expo-audio (AAC .m4a, mono 16 kHz), na web com MediaRecorder. Navegador sem microfone (ex.: http fora do localhost) mostra aviso para usar o ditado do teclado.

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (`Assistant*`, `NotebookRow`, `ImportNotebook`,
  `CreateSale`), `features/sales/hooks` (`useCreateSale`), `expo-image-picker`,
  `@lucro-caseiro/ui`.
- **Dependentes:** `app/assistant.tsx`; entrada em Mais > Do dia a dia.

## Code pointers

| Arquivo                               | Descricao                                                   |
| ------------------------------------- | ----------------------------------------------------------- |
| `api.ts` / `hooks.ts`                 | Uso do mês, rascunho, leitura do caderno, importação        |
| `domain.ts`                           | `draftToSale`, `draftTotal`, `usageLabel`, linhas editáveis |
| `voice-recorder.ts` / `.web.ts`       | expo-audio no celular; MediaRecorder na web (60 s)          |
| `components/sale-voice-card.tsx`      | Texto/áudio, revisão, pagamento e registrar venda           |
| `components/notebook-import-card.tsx` | Foto, revisão por linha e importação                        |
| `app/assistant.tsx`                   | Tela                                                        |

## Components

- `SaleVoiceCard({ disabled })`: campo multilinha, botão de gravar (web), revisão com
  itens, cliente e forma de pagamento; "Registrar venda" ou "Abrir Nova venda".
- `NotebookImportCard({ disabled })`: tirar/escolher foto (até 6 MB), editar nome e valor,
  marcar "Importar/Pular", importar.

## Hooks

| Hook                  | Tipo          | Descricao                               |
| --------------------- | ------------- | --------------------------------------- |
| `useAssistantUsage()` | `useQuery`    | Key `["assistant", "usage"]`.           |
| `useDraftSale()`      | `useMutation` | Invalida `["assistant"]`.               |
| `useReadNotebook()`   | `useMutation` | Invalida `["assistant"]`.               |
| `useImportNotebook()` | `useMutation` | Invalida vendas, clientes e assinatura. |

## API Integration

| Endpoint                            | Verbo | Funcao                | Parametros                |
| ----------------------------------- | ----- | --------------------- | ------------------------- |
| `/api/v1/assistant/usage`           | GET   | `fetchAssistantUsage` | -                         |
| `/api/v1/assistant/sale-draft`      | POST  | `draftSale`           | `{ text }` ou `{ audio }` |
| `/api/v1/assistant/notebook`        | POST  | `readNotebook`        | `{ image }` base64        |
| `/api/v1/assistant/notebook/import` | POST  | `importNotebook`      | `{ rows }`                |

## Contracts

- `AssistantSaleDraft`, `AssistantNotebookResult`, `ImportNotebook`, `ImportNotebookResult`,
  `AssistantUsage { used, limit }` (limite mensal por plano definido na API).

## Error Handling

- Limite do mês, arquivo grande ou IA indisponível: mensagem da API em `alertError`.
- Microfone negado (web): alerta para liberar ou escrever.
- Foto sem linhas: pede outra foto com mais luz.

## Performance

- Foto com qualidade 0,6 e checagem de tamanho antes de enviar.
- Áudio para em 60 s.

## Test matrix

- [x] `domain.test.ts`: venda pronta, itens desconhecidos, rascunho vazio, total, uso do
      mês, linhas marcadas para importar.
- [x] `shared/mock/growth-routes.test.ts`: IA bloqueada na demonstração.

## Examples

- Mais > Anotar falando > "2 bolos de pote pra Bia no Pix" > Montar venda > Registrar venda.
- Mais > Anotar falando > Tirar foto do caderno > conferir > Importar 8 fiados.

## Change log / Decisions

- 2026-09-28: criação. Sem biblioteca nova de áudio (evita build nativo novo): no celular,
  ditado do teclado; na web, MediaRecorder. Limites de uso por plano ficam na API.
- 2026-09-29: gravação de áudio também no celular (expo-audio, permissão de microfone no app.config). Precisa de um build novo do app.
