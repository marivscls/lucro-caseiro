import type { Insights, Order, Product, Sale } from "@lucro-caseiro/contracts";
import type { AppIconName } from "../../shared/components/app-icon";

export type QueryState = "loading" | "error" | "stale" | "ready";
export function queryState(query: { data: unknown; isError: boolean }): QueryState {
  if (query.data === undefined) return query.isError ? "error" : "loading";
  return query.isError ? "stale" : "ready";
}

export function nextAppointments(orders: Order[]): Order[] {
  return orders
    .filter(
      (order) =>
        !["done", "cancelled"].includes(order.status) &&
        !["completed", "cancelled", "no_show"].includes(order.appointmentStatus ?? ""),
    )
    .sort((a, b) =>
      `${a.deliveryDate.slice(0, 10)} ${a.deliveryTime ?? "23:59"}`.localeCompare(
        `${b.deliveryDate.slice(0, 10)} ${b.deliveryTime ?? "23:59"}`,
      ),
    );
}

export function pendingReceipts(sales: Sale[]) {
  return sales.reduce(
    (result, sale) => {
      const amount =
        sale.status === "pending" ? Math.max(0, sale.total - sale.paidAmount) : 0;
      return { total: result.total + amount, count: result.count + (amount > 0 ? 1 : 0) };
    },
    { total: 0, count: 0 },
  );
}

export function dayAppointments(orders: Order[], today: string): Order[] {
  const open = nextAppointments(orders);
  const past = open.filter((order) => order.deliveryDate.slice(0, 10) < today);
  const next = open.filter((order) => order.deliveryDate.slice(0, 10) >= today);
  return next.length
    ? [...past.slice(0, 2), ...next.slice(0, Math.max(1, 3 - past.length))]
    : past.slice(0, 3);
}

export type HomeAlert = {
  id: string;
  title: string;
  detail: string;
  route: string;
  icon: AppIconName;
};
export function homeAttention(products: Product[]): HomeAlert[] {
  const alerts: HomeAlert[] = [];
  for (const product of products) {
    if (product.isActive === false) continue;
    const tracked =
      product.saleUnit === "unit" &&
      !product.isComposite &&
      product.stockAlertThreshold != null;
    const low =
      tracked &&
      (product.variations?.length
        ? product.variations.some(
            (v) =>
              v.stockQuantity != null && v.stockQuantity <= product.stockAlertThreshold!,
          )
        : product.stockQuantity != null &&
          product.stockQuantity <= product.stockAlertThreshold!);
    if (low)
      alerts.push({
        id: `stock-${product.id}`,
        title: `Repor: ${product.name}`,
        detail: "Estoque no limite de reposição que você definiu.",
        route: `/products?productId=${encodeURIComponent(product.id)}`,
        icon: "cube-outline",
      });
  }
  return alerts.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Fases do Início
// ---------------------------------------------------------------------------

/** Dias distintos com venda a partir dos quais o Início mostra o mês. */
export const HOME_HISTORY_DAYS_FOR_MONTH = 7;

export type HomePhase = "setup" | "ready" | "month";

export type SetupSteps = { product: boolean; price: boolean; sale: boolean };

/**
 * Passos incompletos: fase 1. Passos completos com poucos dias de venda:
 * fase 2. Histórico suficiente (ou venda antes do histórico carregado): fase 3,
 * mesmo com algum passo pendente, para quem já vende não voltar ao começo.
 */
export function homePhase(input: {
  steps: SetupSteps;
  activeDays: number;
  olderHistory: boolean;
}): HomePhase {
  if (
    input.steps.sale &&
    (input.activeDays >= HOME_HISTORY_DAYS_FOR_MONTH || input.olderHistory)
  )
    return "month";
  const { product, price, sale } = input.steps;
  return product && price && sale ? "ready" : "setup";
}

export function setupSteps(input: {
  hasProduct: boolean;
  hasPricing: boolean;
  products: Pick<Product, "costPrice">[];
  hasSale: boolean;
}): SetupSteps {
  return {
    product: input.hasProduct,
    price:
      input.hasPricing || input.products.some((product) => product.costPrice != null),
    sale: input.hasSale,
  };
}

export type SetupStepId = keyof SetupSteps;
export const SETUP_ORDER: SetupStepId[] = ["product", "price", "sale"];

/** Primeiro passo ainda não feito, na ordem produto, preço, venda. */
export function currentSetupStep(steps: SetupSteps): SetupStepId | null {
  return SETUP_ORDER.find((id) => !steps[id]) ?? null;
}

export function doneSetupSteps(steps: SetupSteps): number {
  return SETUP_ORDER.filter((id) => steps[id]).length;
}

/** Venda anterior ao histórico carregado (conta antiga com pausa recente). */
export function hasOlderHistory(
  insights: Pick<Insights, "monthlyRevenue"> | undefined,
  historyStart: string,
): boolean {
  const startMonth = historyStart.slice(0, 7);
  return (insights?.monthlyRevenue ?? []).some(
    (month) => month.month < startMonth && month.salesCount > 0,
  );
}

// ---------------------------------------------------------------------------
// Datas locais
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

export function localDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function saleDay(sale: Pick<Sale, "soldAt">): string {
  return localDateKey(new Date(sale.soldAt));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
  return next;
}

/** Início do mês anterior, meia-noite local, em ISO. */
export function historyStart(now: Date): string {
  return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
}

export function greeting(now: Date, firstName?: string): string {
  const hour = now.getHours();
  let base = "Boa noite";
  if (hour >= 5 && hour < 12) base = "Bom dia";
  else if (hour >= 12 && hour < 18) base = "Boa tarde";
  return firstName ? `${base}, ${firstName}!` : `${base}!`;
}

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function monthName(date: Date): string {
  return MONTHS[date.getMonth()];
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// ---------------------------------------------------------------------------
// Vendas, lucro e hábito
// ---------------------------------------------------------------------------

export function validSales<T extends Pick<Sale, "status">>(sales: T[]): T[] {
  return sales.filter((sale) => sale.status !== "cancelled");
}

export type Profit = { amount: number; complete: boolean };

type CostLookup = Map<string, number | null | undefined>;

export function costLookup(products: Pick<Product, "id" | "costPrice">[]): CostLookup {
  return new Map(products.map((product) => [product.id, product.costPrice]));
}

/**
 * Lucro estimado: (preço vendido − custo cadastrado) × quantidade, menos o
 * desconto. Itens sem custo ficam fora e marcam o valor como incompleto.
 */
export function saleProfit(sale: Sale, costs: CostLookup): Profit {
  let amount = -(sale.discount ?? 0);
  let complete = true;
  for (const item of sale.items) {
    const cost = item.productId ? costs.get(item.productId) : undefined;
    if (cost == null) {
      complete = false;
      continue;
    }
    amount += (item.unitPrice - cost) * item.quantity;
  }
  return { amount: roundMoney(amount), complete };
}

export function salesProfit(sales: Sale[], costs: CostLookup): Profit {
  return validSales(sales).reduce<Profit>(
    (sum, sale) => {
      const profit = saleProfit(sale, costs);
      return {
        amount: roundMoney(sum.amount + profit.amount),
        complete: sum.complete && profit.complete,
      };
    },
    { amount: 0, complete: true },
  );
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function salesOnDay(sales: Sale[], day: string): Sale[] {
  return validSales(sales).filter((sale) => saleDay(sale) === day);
}

export function salesInMonth(sales: Sale[], date: Date): Sale[] {
  const month = localDateKey(date).slice(0, 7);
  return validSales(sales).filter((sale) => saleDay(sale).startsWith(month));
}

export function activeSaleDays(sales: Sale[]): number {
  return new Set(validSales(sales).map(saleDay)).size;
}

/** Dias seguidos com venda até hoje (ou até ontem, se hoje ainda não vendeu). */
export function salesStreak(sales: Sale[], now: Date): number {
  const days = new Set(validSales(sales).map(saleDay));
  let cursor = addDays(now, 0);
  if (!days.has(localDateKey(cursor))) cursor = addDays(now, -1);
  let streak = 0;
  while (days.has(localDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Últimos 7 dias (do mais antigo até hoje): teve venda? */
export function lastSevenDays(sales: Sale[], now: Date): boolean[] {
  const days = new Set(validSales(sales).map(saleDay));
  return Array.from({ length: 7 }, (_, index) =>
    days.has(localDateKey(addDays(now, index - 6))),
  );
}

export function total(sales: Pick<Sale, "total">[]): number {
  return roundMoney(sales.reduce((sum, sale) => sum + sale.total, 0));
}

/** Mês até hoje contra os mesmos dias do mês anterior. */
export function monthComparison(sales: Sale[], now: Date) {
  const current = total(salesInMonth(sales, now));
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 12);
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  const limit = Math.min(now.getDate(), lastDay);
  const previous = total(
    salesInMonth(sales, previousDate).filter(
      (sale) => new Date(sale.soldAt).getDate() <= limit,
    ),
  );
  const pct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
  return { current, previous, pct, previousMonth: monthName(previousDate), limit };
}

export const WEEKDAY_SHORT = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const WEEKDAY_LONG = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

/** Índice segunda=0 … domingo=6. */
function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** Total vendido em cada dia da semana atual (segunda a domingo). */
export function weekBars(sales: Sale[], now: Date) {
  const monday = addDays(now, -weekdayIndex(now));
  const today = localDateKey(now);
  return WEEKDAY_SHORT.map((label, index) => {
    const day = localDateKey(addDays(monday, index));
    return {
      label,
      day,
      total: total(salesOnDay(sales, day)),
      today: day === today,
      future: day > today,
    };
  });
}

/** Dia da semana com mais vendas no histórico; null sem vendas. */
export function bestWeekday(sales: Sale[]): string | null {
  const totals = Array.from({ length: 7 }, () => 0);
  for (const sale of validSales(sales))
    totals[weekdayIndex(new Date(sale.soldAt))] += sale.total;
  const max = Math.max(...totals);
  if (max <= 0) return null;
  return WEEKDAY_LONG[totals.indexOf(max)];
}

/** Clientes com compra no mês e pelo menos duas compras no histórico. */
export function returningClients(sales: Sale[], now: Date): number {
  const counts = new Map<string, number>();
  for (const sale of validSales(sales)) {
    if (sale.clientId) counts.set(sale.clientId, (counts.get(sale.clientId) ?? 0) + 1);
  }
  const inMonth = new Set(
    salesInMonth(sales, now)
      .map((sale) => sale.clientId)
      .filter((id): id is string => !!id),
  );
  return [...inMonth].filter((id) => (counts.get(id) ?? 0) >= 2).length;
}

export type Champion = {
  productId: string;
  name: string;
  quantity: number;
  profit: number;
};

/** Produtos do mês por lucro estimado; desconto rateado pelo subtotal. */
export function monthChampions(
  sales: Sale[],
  costs: CostLookup,
  now: Date,
  limit = 3,
): Champion[] {
  const map = new Map<string, Champion>();
  for (const sale of salesInMonth(sales, now)) {
    const share = sale.subtotal > 0 ? 1 - (sale.discount ?? 0) / sale.subtotal : 1;
    for (const item of sale.items) {
      const cost = item.productId ? costs.get(item.productId) : undefined;
      if (!item.productId || cost == null) continue;
      const entry = map.get(item.productId) ?? {
        productId: item.productId,
        name: item.productName,
        quantity: 0,
        profit: 0,
      };
      entry.quantity += item.quantity;
      entry.profit = roundMoney(
        entry.profit + item.subtotal * share - cost * item.quantity,
      );
      map.set(item.productId, entry);
    }
  }
  return [...map.values()].sort((a, b) => b.profit - a.profit).slice(0, limit);
}

/** Ritmo da meta: entradas por dia corrido projetadas até o fim do mês. */
export function goalPace(input: {
  currentRevenue: number;
  requiredRevenue: number;
  now: Date;
}) {
  const daysInMonth = new Date(
    input.now.getFullYear(),
    input.now.getMonth() + 1,
    0,
  ).getDate();
  const elapsed = input.now.getDate();
  const daysLeft = daysInMonth - elapsed;
  const projected = (input.currentRevenue / elapsed) * daysInMonth;
  return {
    daysLeft,
    onTrack: input.requiredRevenue > 0 && projected >= input.requiredRevenue,
  };
}

/** Mesma regra de Insights: margem abaixo de 20% do preço. */
export const LOW_MARGIN_RATIO = 0.2;

export type PriceAlert = {
  productId: string;
  name: string;
  salePrice: number;
  margin: number;
  ratio: number;
};

/** Produto vendido no mês com a menor margem abaixo de 20%; null se nenhum. */
export function priceAlert(
  products: Product[],
  sales: Sale[],
  now: Date,
): PriceAlert | null {
  const sold = new Set(
    salesInMonth(sales, now)
      .flatMap((sale) => sale.items.map((item) => item.productId))
      .filter(Boolean),
  );
  const candidates = products
    .filter(
      (product) =>
        product.isActive !== false &&
        sold.has(product.id) &&
        product.costPrice != null &&
        product.salePrice > 0,
    )
    .map((product) => {
      const margin = roundMoney(product.salePrice - product.costPrice!);
      return {
        productId: product.id,
        name: product.name,
        salePrice: product.salePrice,
        margin,
        ratio: margin / product.salePrice,
      };
    })
    .filter((item) => item.ratio < LOW_MARGIN_RATIO)
    .sort((a, b) => a.ratio - b.ratio);
  return candidates[0] ?? null;
}

/** Valor restante de compromissos da agenda ainda não registrados como venda. */
export function agendaCommitted(orders: Order[]): number {
  return roundMoney(
    nextAppointments(orders)
      .filter(
        (order) =>
          !order.saleId && order.amount != null && order.amount > (order.deposit ?? 0),
      )
      .reduce((sum, order) => sum + order.amount! - (order.deposit ?? 0), 0),
  );
}

/** "2 Bolo de pote +1" — resumo curto dos itens de uma venda. */
export function saleSummary(sale: Pick<Sale, "items">): string {
  const [first, ...rest] = sale.items;
  if (!first) return "Venda";
  const quantity = Number.isInteger(first.quantity)
    ? String(first.quantity)
    : String(first.quantity).replace(".", ",");
  const extra = rest.length ? ` +${rest.length}` : "";
  return `${quantity} ${first.productName}${extra}`;
}

export function daysSince(iso: string, now: Date): number {
  const start = new Date(iso);
  const from = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / DAY_MS));
}
