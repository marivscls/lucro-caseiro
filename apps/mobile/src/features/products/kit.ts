import type { ProductComponentInput } from "@lucro-caseiro/contracts";

/** Linha de componente em edicao (quantidade como string para o Input). */
export interface ComponentDraft {
  componentProductId: string;
  quantity: string;
}

/** Converte os rascunhos em payload do contrato (quantidade > 0). */
export function draftsToComponents(drafts: ComponentDraft[]): ProductComponentInput[] {
  return drafts
    .map((d) => ({
      componentProductId: d.componentProductId,
      quantity: parseFloat(d.quantity.replace(",", ".")),
    }))
    .filter((c) => !isNaN(c.quantity) && c.quantity > 0);
}

/**
 * Custo total do kit ao vivo = soma de (custo do componente x quantidade).
 * Componente sem custo conhecido (null/undefined) conta como 0 — espelha o
 * `calculateCompositeCost` do backend. Quantidade invalida e ignorada.
 */
export function kitTotalCost(
  drafts: ComponentDraft[],
  costOf: (componentProductId: string) => number | null | undefined,
): number {
  return drafts.reduce((sum, c) => {
    const qty = parseFloat(c.quantity.replace(",", "."));
    if (isNaN(qty)) return sum;
    return sum + (costOf(c.componentProductId) ?? 0) * qty;
  }, 0);
}

/** Rotulo do chip do componente: "Nx Nome" quando quantidade > 1, senao so o nome. */
export function chipLabel(name: string, quantity: string): string {
  const qty = parseFloat(quantity.replace(",", "."));
  return !isNaN(qty) && qty > 1 ? `${qty}x ${name}` : name;
}

/** Rascunho do formulario de produto para validacao local (preco ja parseado). */
export interface ProductDraftInput {
  name: string;
  category: string;
  price: number;
  isComposite: boolean;
  components: ComponentDraft[];
}

/**
 * Valida o cadastro de produto antes de enviar ao backend.
 * Retorna a mensagem de erro (pt-BR) ou `null` quando esta tudo certo.
 * Espelha as regras do contrato (`CreateProductDto`): nome e categoria
 * obrigatorios, preco > 0 e, quando kit, ao menos um componente valido.
 */
export function validateProductDraft(input: ProductDraftInput): string | null {
  if (!input.name.trim()) return "Coloque o nome do produto";
  if (!input.category.trim()) return "Escolha uma categoria";
  if (isNaN(input.price) || input.price <= 0) return "O preço precisa ser maior que zero";
  if (input.isComposite && draftsToComponents(input.components).length === 0) {
    return "Escolha pelo menos um produto para montar o kit";
  }
  return null;
}
