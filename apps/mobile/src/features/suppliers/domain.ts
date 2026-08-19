import type {
  Purchase,
  Supplier,
  SupplierCategory,
  SupplierOverviewItem,
  SuppliersOverview,
} from "@lucro-caseiro/contracts";

import { isValidEmail } from "../../shared/utils/email";
import { isValidBrazilPhone } from "../../shared/utils/phone";

export type SupplierCategoryFilter = "all" | SupplierCategory;
export type SupplierAdvancedFilter =
  | "preferred"
  | "followUp"
  | "openOrder"
  | "restockSoon";
export type SupplierSort = "recent" | "mostPurchased" | "highestValue" | "az";

export const SUPPLIER_CATEGORY_LABELS: Record<SupplierCategory, string> = {
  supplies: "Insumos",
  packaging: "Embalagens",
  food: "Alimentos",
  other: "Outros",
};

export function buildLegacySuppliersOverview(
  suppliers: readonly Supplier[],
  purchases: readonly Purchase[],
  now = new Date(),
): SuppliersOverview {
  const activeSuppliers = suppliers.filter((supplier) => supplier.isActive);
  const activeIds = new Set(activeSuppliers.map((supplier) => supplier.id));
  const linkedPurchases = purchases.filter(
    (purchase) => purchase.supplierId && activeIds.has(purchase.supplierId),
  );
  const monthPrefix = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-`;
  const monthPurchases = purchases.filter(
    (purchase) => purchase.supplierId && purchase.purchasedAt.startsWith(monthPrefix),
  );

  return {
    month: {
      totalAmount:
        monthPurchases.reduce(
          (totalInCents, purchase) => totalInCents + Math.round(purchase.amount * 100),
          0,
        ) / 100,
      purchaseCount: monthPurchases.length,
      supplierCount: new Set(monthPurchases.map((purchase) => purchase.supplierId)).size,
      planningStatus: "none",
    },
    items: activeSuppliers.map((supplier) => {
      const supplierPurchases = linkedPurchases.filter(
        (purchase) => purchase.supplierId === supplier.id,
      );
      const lastPurchase = supplierPurchases.reduce<Purchase | null>(
        (latest, purchase) => {
          if (!latest) return purchase;
          const purchaseKey = `${purchase.purchasedAt}:${purchase.createdAt}`;
          const latestKey = `${latest.purchasedAt}:${latest.createdAt}`;
          return purchaseKey > latestKey ? purchase : latest;
        },
        null,
      );
      return {
        ...supplier,
        lastPurchase: lastPurchase
          ? {
              id: lastPurchase.id,
              description: lastPurchase.description,
              amount: lastPurchase.amount,
              category: lastPurchase.category,
              purchasedAt: lastPurchase.purchasedAt,
              items: lastPurchase.items,
            }
          : null,
        totalPurchaseCount: supplierPurchases.length,
        totalPurchaseAmount:
          supplierPurchases.reduce(
            (totalInCents, purchase) => totalInCents + Math.round(purchase.amount * 100),
            0,
          ) / 100,
        hasOpenOrder: supplierPurchases.some(
          (purchase) => purchase.paymentStatus === "pending",
        ),
      };
    }),
  };
}

export function normalizeSupplierSearch(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function supplierInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase("pt-BR") ?? "")
      .join("") || "?"
  );
}

const SUPPLIER_INITIALS_BACKGROUNDS = [
  "#F5E5E8",
  "#F0ECF7",
  "#F2F5CD",
  "#FFF3CE",
  "#F5F3F1",
] as const;

export function supplierInitialsBackground(name: string): string {
  const hash = [...normalizeSupplierSearch(name)].reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
  return SUPPLIER_INITIALS_BACKGROUNDS[hash % SUPPLIER_INITIALS_BACKGROUNDS.length];
}

export function supplierHeroIllustrationWidth(viewportWidth: number): number {
  return Math.min(190, Math.max(108, (Math.min(viewportWidth, 768) - 32) * 0.38));
}

export function supplierImageValidationError(input: {
  mimeType?: string | null;
  uri: string;
  fileSize?: number | null;
}): string | null {
  const supportedMime = new Set(["image/png", "image/jpeg", "image/webp"]);
  const supported = input.mimeType
    ? supportedMime.has(input.mimeType.toLowerCase())
    : /\.(png|jpe?g|webp)(?:\?|$)/i.test(input.uri);
  if (!supported) return "Use uma imagem PNG, JPEG ou WebP.";
  if (input.fileSize && input.fileSize > 5 * 1024 * 1024) {
    return "A imagem deve ter no máximo 5 MB.";
  }
  return null;
}

export function supplierPurchasePrefill(
  supplier: SupplierOverviewItem,
):
  | Pick<Purchase, "supplierId" | "description" | "amount" | "items" | "category">
  | undefined {
  if (!supplier.lastPurchase) return undefined;
  return {
    supplierId: supplier.id,
    description: supplier.lastPurchase.description,
    amount: supplier.lastPurchase.amount,
    items: supplier.lastPurchase.items,
    category: supplier.lastPurchase.category as
      | "sale"
      | "material"
      | "packaging"
      | "transport"
      | "fee"
      | "utility"
      | "other",
  };
}

export function supplierMatchesSearch(
  supplier: SupplierOverviewItem,
  search: string,
): boolean {
  const query = normalizeSupplierSearch(search);
  if (!query) return true;
  const searchable = [
    supplier.name,
    SUPPLIER_CATEGORY_LABELS[supplier.category],
    supplier.purchaseDescription,
    supplier.lastPurchase?.description,
    ...(supplier.lastPurchase?.items.map((item) => item.productName) ?? []),
  ]
    .filter((value): value is string => !!value)
    .map(normalizeSupplierSearch)
    .join(" ");
  return searchable.includes(query);
}

export function supplierMatchesAdvancedFilters(
  supplier: SupplierOverviewItem,
  filters: ReadonlySet<SupplierAdvancedFilter>,
): boolean {
  return (
    (!filters.has("preferred") || supplier.isPreferred) &&
    (!filters.has("followUp") || supplier.needsFollowUp) &&
    (!filters.has("openOrder") || supplier.hasOpenOrder) &&
    (!filters.has("restockSoon") || supplier.restockSoon)
  );
}

export function filterAndSortSuppliers(
  suppliers: readonly SupplierOverviewItem[],
  options: {
    search: string;
    category: SupplierCategoryFilter;
    advanced: ReadonlySet<SupplierAdvancedFilter>;
    sort: SupplierSort;
  },
): SupplierOverviewItem[] {
  const filtered = suppliers.filter(
    (supplier) =>
      (options.category === "all" || supplier.category === options.category) &&
      supplierMatchesSearch(supplier, options.search) &&
      supplierMatchesAdvancedFilters(supplier, options.advanced),
  );

  return filtered.sort((a, b) => {
    if (options.sort === "az") return a.name.localeCompare(b.name, "pt-BR");
    if (options.sort === "mostPurchased") {
      return (
        b.totalPurchaseCount - a.totalPurchaseCount ||
        a.name.localeCompare(b.name, "pt-BR")
      );
    }
    if (options.sort === "highestValue") {
      return (
        b.totalPurchaseAmount - a.totalPurchaseAmount ||
        a.name.localeCompare(b.name, "pt-BR")
      );
    }
    const aDate = a.lastPurchase?.purchasedAt ?? "";
    const bDate = b.lastPurchase?.purchasedAt ?? "";
    return bDate.localeCompare(aDate) || a.name.localeCompare(b.name, "pt-BR");
  });
}

export function supplierCategoryCounts(
  suppliers: readonly SupplierOverviewItem[],
): Record<SupplierCategoryFilter, number> {
  return suppliers.reduce<Record<SupplierCategoryFilter, number>>(
    (counts, supplier) => {
      counts.all += 1;
      counts[supplier.category] += 1;
      return counts;
    },
    { all: 0, supplies: 0, packaging: 0, food: 0, other: 0 },
  );
}

export type SupplierFormValidationInput = {
  name: string;
  category: SupplierCategory | null;
  phone: string;
  hasWhatsApp: boolean;
  email: string;
};

export function validateSupplierForm(
  input: SupplierFormValidationInput,
): Partial<Record<keyof SupplierFormValidationInput, string>> {
  const errors: Partial<Record<keyof SupplierFormValidationInput, string>> = {};
  const normalizedName = input.name.trim();
  if (!normalizedName) errors.name = "Informe o nome do fornecedor.";
  else if (normalizedName.length < 2) {
    errors.name = "O nome deve ter pelo menos 2 caracteres.";
  } else if (normalizedName.length > 200) {
    errors.name = "O nome deve ter no máximo 200 caracteres.";
  }
  if (!input.category) errors.category = "Selecione uma categoria.";
  if (input.phone.trim() && !isValidBrazilPhone(input.phone)) {
    errors.phone = "Use DDD + número, por exemplo (11) 99999-9999.";
  }
  if (input.hasWhatsApp && !input.phone.trim()) {
    errors.phone = "Informe o telefone para ativar o WhatsApp.";
  }
  if (input.email.trim() && !isValidEmail(input.email)) {
    errors.email = "Confira o email informado.";
  }
  return errors;
}
