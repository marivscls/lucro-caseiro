import type { Product } from "@lucro-caseiro/contracts";

type StockBadgeVariant = "danger" | "warning" | "success";

interface StockBadge {
  label: string;
  variant: StockBadgeVariant;
}

/**
 * Selo de estoque de um produto. Os selos de alerta ("Sem estoque" /
 * "Estoque baixo") só aparecem quando a preferência "Estoque baixo" está ligada;
 * a contagem neutra ("X un.") é apenas informação e aparece sempre.
 *
 * Retorna `null` quando não há selo a exibir (peso/kg, kit, sem controle de
 * estoque, ou alerta com a preferência desligada).
 */
export function getStockBadge(
  product: Product,
  lowStockEnabled: boolean,
): StockBadge | null {
  // Produtos vendidos por peso (kg) nao usam controle de estoque por unidade.
  if (product.saleUnit === "kg") return null;
  // Kits (produtos compostos) nao tem estoque proprio por unidade no MVP.
  if (product.isComposite) return null;
  if (product.stockQuantity === null) return null;
  if (product.stockQuantity === 0)
    return lowStockEnabled ? { label: "Sem estoque", variant: "danger" } : null;
  if (
    product.stockAlertThreshold !== null &&
    product.stockQuantity <= product.stockAlertThreshold
  )
    return lowStockEnabled ? { label: "Estoque baixo", variant: "warning" } : null;
  return { label: `${product.stockQuantity} un.`, variant: "success" };
}
