/** Descoberta de recursos: regras puras (sem React, sem armazenamento). */

export type NextStepId = "recipes" | "catalog" | "insights" | "recurring_expenses";
export type DiscoveryTrigger =
  | "pricing_saved"
  | "product_created"
  | "sale_completed"
  | "expense_created";

export interface NextStep {
  id: NextStepId;
  title: string;
  message: string;
  action: string;
  route: string;
}

export const NEXT_STEPS: Record<NextStepId, NextStep> = {
  recipes: {
    id: "recipes",
    title: "Saiba quando o custo subir",
    message:
      "Cadastre a receita deste produto e o app avisa quando os ingredientes ficarem mais caros.",
    action: "Cadastrar receita",
    route: "/recipes",
  },
  catalog: {
    id: "catalog",
    title: "Seus produtos num link só",
    message: "Monte seu catálogo e mande no WhatsApp para os clientes escolherem.",
    action: "Montar catálogo",
    route: "/catalog",
  },
  insights: {
    id: "insights",
    title: "Quanto você lucrou?",
    message: "Veja o resultado das suas vendas e os produtos que mais saem.",
    action: "Ver meu resultado",
    route: "/insights",
  },
  recurring_expenses: {
    id: "recurring_expenses",
    title: "Gasto que se repete todo mês?",
    message: "Cadastre aluguel, gás e internet uma vez e o app lança sozinho.",
    action: "Deixar automático",
    route: "/recurring-expenses",
  },
};

/** Quantidade mínima de produtos ou vendas antes de sugerir catálogo ou relatórios. */
export const NEXT_STEP_MIN_COUNT = 3;

/**
 * Próximo passo depois de uma ação concluída. `count` é o total de produtos ou
 * vendas já contando o que acabou de ser criado. Cada passo aparece uma vez.
 */
export function nextStepFor(
  trigger: DiscoveryTrigger,
  count: number,
  seen: readonly NextStepId[],
  options: { recipesAvailable: boolean } = { recipesAvailable: true },
): NextStep | null {
  let id: NextStepId | null = null;
  if (trigger === "pricing_saved") id = options.recipesAvailable ? "recipes" : null;
  if (trigger === "product_created" && count >= NEXT_STEP_MIN_COUNT) id = "catalog";
  if (trigger === "sale_completed" && count >= NEXT_STEP_MIN_COUNT) id = "insights";
  if (trigger === "expense_created") id = "recurring_expenses";
  if (!id || seen.includes(id)) return null;
  return NEXT_STEPS[id];
}

export type TrialChecklistId = "catalog" | "recipes" | "insights";

export interface TrialChecklistItem {
  id: TrialChecklistId;
  label: string;
  route: string;
  done: boolean;
}

/**
 * Itens do teste grátis (Essencial): catálogo completo, receitas sem limite e a
 * prévia dos relatórios do Profissional. Um item fica feito quando foi aberto
 * pela lista ou, no caso de receitas, quando já existe uma receita.
 */
export function trialChecklist(input: {
  recipes: number;
  opened: readonly TrialChecklistId[];
  recipesAvailable: boolean;
}): TrialChecklistItem[] {
  const items: TrialChecklistItem[] = [
    {
      id: "catalog",
      label: "Monte seu catálogo com a sua cara",
      route: "/catalog",
      done: input.opened.includes("catalog"),
    },
  ];
  if (input.recipesAvailable) {
    items.push({
      id: "recipes",
      label: "Cadastre uma receita e veja o custo real",
      route: "/recipes",
      done: input.recipes > 0 || input.opened.includes("recipes"),
    });
  }
  items.push({
    id: "insights",
    label: "Conheça os relatórios do Profissional",
    route: "/insights",
    done: input.opened.includes("insights"),
  });
  return items;
}

export type PaidPreviewScreen = "insights" | "recurring_expenses" | "purchases";

export interface PaidPreviewRow {
  label: string;
  detail?: string;
  /** Valor em reais do exemplo. */
  amount?: number;
  /** Texto curto no lugar do valor. */
  value?: string;
}

export interface PaidPreview {
  title: string;
  description: string;
  rows: readonly PaidPreviewRow[];
}

/** Exemplos fictícios mostrados no lugar do bloqueio. Nunca são dados da pessoa. */
export const PAID_PREVIEWS: Record<PaidPreviewScreen, PaidPreview> = {
  insights: {
    title: "Seu resultado do mês",
    description: "Faturamento, lucro e o que mais vende, sem fazer conta.",
    rows: [
      { label: "Faturamento do mês", amount: 2480 },
      { label: "Lucro estimado", amount: 1120 },
      { label: "Produto campeão", detail: "Brigadeiro gourmet", value: "86 vendidos" },
      { label: "Melhor cliente", detail: "Ana", value: "9 pedidos" },
    ],
  },
  recurring_expenses: {
    title: "Gastos fixos no automático",
    description: "Cadastre uma vez e o app lança na data certa todo mês.",
    rows: [
      { label: "Aluguel", detail: "Todo dia 5", amount: 600 },
      { label: "Gás", detail: "Todo dia 10", amount: 120 },
      { label: "Internet", detail: "Todo dia 15", amount: 99.9 },
      { label: "Total do mês", amount: 819.9 },
    ],
  },
  purchases: {
    title: "Compras e fornecedores",
    description: "Registre o que comprou e o gasto entra direto no caixa.",
    rows: [
      { label: "Atacadão", detail: "Leite condensado e chocolate", amount: 186.4 },
      { label: "Embalagens da Rua", detail: "100 caixinhas", amount: 74 },
      { label: "Gasto com compras no mês", amount: 260.4 },
    ],
  },
};

export interface DiscoveryProgress {
  seenSteps: NextStepId[];
  opened: TrialChecklistId[];
  checklistDismissed: boolean;
}

export const EMPTY_DISCOVERY_PROGRESS: DiscoveryProgress = {
  seenSteps: [],
  opened: [],
  checklistDismissed: false,
};

const STEP_IDS = Object.keys(NEXT_STEPS) as NextStepId[];
const CHECKLIST_IDS: readonly TrialChecklistId[] = ["catalog", "recipes", "insights"];

function pickKnown<T extends string>(value: unknown, known: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is T => known.includes(item as T));
}

/** Lê o progresso salvo; qualquer valor inválido vira vazio. */
export function parseDiscoveryProgress(raw: string | null): DiscoveryProgress {
  try {
    const value: unknown = JSON.parse(raw ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return EMPTY_DISCOVERY_PROGRESS;
    }
    const data = value as Record<string, unknown>;
    return {
      seenSteps: pickKnown(data.seenSteps, STEP_IDS),
      opened: pickKnown(data.opened, CHECKLIST_IDS),
      checklistDismissed: data.checklistDismissed === true,
    };
  } catch {
    return EMPTY_DISCOVERY_PROGRESS;
  }
}
