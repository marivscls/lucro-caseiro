import type {
  PublicCatalog,
  PublicCatalogProduct,
  PublicProductOrderInput,
} from "@lucro-caseiro/contracts";
import { CATALOG_SLUG_REGEX } from "@lucro-caseiro/contracts";

import { displayCatalogName, renderPublishedStorefrontHtml } from "./storefront-renderer";

/** Gera um slug a partir do nome do negocio (ex.: "Doces da Má" -> "doces-da-ma"). */
export function slugify(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join("-")
    .slice(0, 40)
    .replace(/-$/, "");
  return CATALOG_SLUG_REGEX.test(slug) ? slug : "meu-catalogo";
}

export function isValidSlug(slug: string): boolean {
  return CATALOG_SLUG_REGEX.test(slug);
}

export type CatalogSection = "all" | "products" | "services";

export function renderCatalogHtml(
  catalog: PublicCatalog,
  section: CatalogSection = "all",
  nonce = "",
  options: Readonly<{ preview?: boolean }> = {},
): string {
  return renderPublishedStorefrontHtml(catalog, section, nonce, options.preview === true);
}

export function renderCatalogErrorHtml(): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Catálogo indisponível — Lucro Caseiro</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#fff8f6;color:#2e2826;font-family:"Nunito Sans",system-ui,sans-serif}
main{width:min(100%,520px);padding:32px;background:#fff;border:1px solid #eadedb;border-radius:20px;text-align:center}
.mark{width:64px;height:64px;margin:0 auto 18px;display:grid;place-items:center;border-radius:50%;background:#fde8ec;color:#b45b6d;font-size:30px}
h1{margin:0;font:700 30px/1.15 "Nunito Sans",system-ui,sans-serif}p{margin:12px 0 22px;color:#716866;line-height:1.55}
a{min-height:48px;border:1px solid #b45b6d;border-radius:999px;background:#fff;color:#a94e61;padding:0 22px;display:inline-flex;align-items:center;text-decoration:none;font:800 15px "Nunito Sans",sans-serif;cursor:pointer}
</style>
</head>
<body><main><div class="mark" aria-hidden="true">!</div><h1>Não foi possível abrir o catálogo</h1><p>Verifique sua conexão e tente carregar novamente.</p><a href="">Tentar novamente</a></main></body>
</html>`;
}

export type CatalogOrderLine = {
  productId: string;
  variationId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type CatalogOrderDraft =
  | { ok: true; title: string; amount: number; lines: CatalogOrderLine[]; notes: string }
  | { ok: false; error: string };

const ORDER_TITLE_MAX = 200;
const ORDER_NOTES_MAX = 500;

function cut(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Data (YYYY-MM-DD) de `now` no fuso informado. */
export function isoDateInTimeZone(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Monta a encomenda a partir do pedido da cliente, usando só os produtos
 * visíveis na vitrine e os preços do servidor (o preço enviado pela página é
 * ignorado). Itens repetidos são somados. Função pura.
 */
export function buildCatalogOrder(
  products: readonly PublicCatalogProduct[],
  input: Pick<PublicProductOrderInput, "items" | "desiredDate" | "notes">,
  today: string,
): CatalogOrderDraft {
  if (input.desiredDate < today) {
    return { ok: false, error: "Escolha uma data a partir de hoje." };
  }
  const byId = new Map(products.map((product) => [product.id, product]));
  const lines: CatalogOrderLine[] = [];
  for (const item of input.items) {
    const product = byId.get(item.productId);
    if (!product) {
      return {
        ok: false,
        error:
          "Algum produto não está mais disponível. Atualize a página e tente de novo.",
      };
    }
    const productName = displayCatalogName(product.name);
    let variationId: string | null = null;
    let name = productName;
    if (product.variations.length > 0) {
      const variation = product.variations.find((v) => v.id === item.variationId);
      if (!variation || !variation.inStock) {
        return { ok: false, error: `Escolha uma opção disponível de ${productName}.` };
      }
      variationId = variation.id;
      name = `${productName} (${variation.name})`;
    }
    const existing = lines.find(
      (line) => line.productId === product.id && line.variationId === variationId,
    );
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + item.quantity);
    } else {
      lines.push({
        productId: product.id,
        variationId,
        name,
        quantity: item.quantity,
        unitPrice: product.salePrice,
      });
    }
  }
  const amount =
    Math.round(
      lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) * 100,
    ) / 100;
  const itemsText = lines.map((line) => `${line.quantity}× ${line.name}`);
  const title = cut(itemsText.join(", "), ORDER_TITLE_MAX);
  const customerNotes = input.notes?.trim();
  const notes = cut(
    [
      "Pedido feito pelo catálogo.",
      ...itemsText,
      customerNotes ? `Recado da cliente: ${customerNotes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    ORDER_NOTES_MAX,
  );
  return { ok: true, title, amount, lines, notes };
}
/** Dígitos do telefone sem o código do país (mesma regra do índice de clientes). */
export function nationalPhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return (digits.length === 12 || digits.length === 13) && digits.startsWith("55")
    ? digits.slice(2)
    : digits;
}
