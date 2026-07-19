import type { Product } from "@lucro-caseiro/contracts";
import { availableProductStock } from "./variations";

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
  const quantity = availableProductStock(product);
  if (quantity === null) return null;
  if (quantity === 0)
    return lowStockEnabled ? { label: "Sem estoque", variant: "danger" } : null;
  if (
    product.stockAlertThreshold !== null &&
    (product.variations?.some(
      (variation) =>
        variation.stockQuantity !== undefined &&
        variation.stockQuantity <= product.stockAlertThreshold!,
    ) ??
      quantity <= product.stockAlertThreshold)
  )
    return lowStockEnabled ? { label: "Estoque baixo", variant: "warning" } : null;
  return { label: `${quantity} un.`, variant: "success" };
}
