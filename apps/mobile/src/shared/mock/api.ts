import { DEFAULT_BRAND_ID } from "@lucro-caseiro/brands";
import {
  PLAN_LIMITS,
  type CatalogSettings,
  type Client,
  type CreateSale,
  type FinanceEntry,
  type Order,
  type Product,
  type Sale,
  type SuppliersOverview,
} from "@lucro-caseiro/contracts";

import { currentDemoAccount, userIdFromToken } from "./auth";
import { loadDemoData, saveDemoData } from "./db";
import {
  buildClient,
  buildOrder,
  buildProduct,
  buildSaleIncome,
  emptyDemoData,
  type DemoData,
} from "./fixtures";
import { mockUuid } from "./storage";

// API simulada do modo demonstração: rotas em memória com os dados da conta
// (produtos, clientes, vendas, financeiro, agenda, perfil e limites).

const API_DELAY_MS = 180;

type Json = Record<string, unknown>;

export interface MockRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  body: Json;
  data: DemoData;
  now: number;
}

export interface MockResult {
  status: number;
  body?: unknown;
  /** true quando `data` mudou e precisa ser persistido. */
  changed?: boolean;
}

type Handler = (request: MockRequest, params: string[]) => MockResult;

const ok = (body: unknown, changed = false): MockResult => ({
  status: 200,
  body,
  changed,
});
const created = (body: unknown): MockResult => ({ status: 201, body, changed: true });
const noContent = (changed = false): MockResult => ({ status: 204, changed });
const notFound = (): MockResult => ({
  status: 404,
  body: { error: "NOT_FOUND", message: "Registro não encontrado na demonstração." },
});

function text(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function paginate<T>(items: T[], query: URLSearchParams) {
  const page = Math.max(1, Number(query.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.get("limit")) || 20));
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    total: items.length,
    page,
    limit,
    totalPages: Math.ceil(items.length / limit),
  };
}

/**
 * Resposta vazia para rotas ainda não simuladas: funciona tanto para quem espera
 * lista (`[]`) quanto para quem espera paginação (`{ items, total, ... }`).
 */
export function emptyCollection() {
  return Object.assign([], { items: [], total: 0, page: 1, limit: 20, totalPages: 0 });
}

/** Resumo de fornecedores vazio (`SuppliersOverviewDto`). */
function emptySuppliersOverview(): SuppliersOverview {
  return {
    month: { totalAmount: 0, purchaseCount: 0, supplierCount: 0, planningStatus: "none" },
    items: [],
  };
}

function isEmptyCollection(value: unknown[]): boolean {
  return Array.isArray((value as { items?: unknown }).items);
}

const byNewest = (a: { createdAt: string }, b: { createdAt: string }) =>
  b.createdAt.localeCompare(a.createdAt);

function matches(text: string | null | undefined, search: string | null): boolean {
  if (!search) return true;
  return (text ?? "").toLowerCase().includes(search.toLowerCase());
}

function sameLocalDay(iso: string, now: number): boolean {
  return new Date(iso).toDateString() === new Date(now).toDateString();
}

function monthRange(query: URLSearchParams, now: number) {
  const today = new Date(now);
  const month = Number(query.get("month")) || today.getMonth() + 1;
  const year = Number(query.get("year")) || today.getFullYear();
  return { month, year, period: `${year}-${String(month).padStart(2, "0")}` };
}

function financeSummary(data: DemoData, query: URLSearchParams, now: number) {
  const { period } = monthRange(query, now);
  const entries = data.financeEntries.filter((entry) => entry.date.startsWith(period));
  const sum = (list: FinanceEntry[]) =>
    roundMoney(list.reduce((total, entry) => total + entry.amount, 0));
  const expenses = entries.filter((entry) => entry.type === "expense");
  const totalIncome = sum(entries.filter((entry) => entry.type === "income"));
  const totalExpenses = sum(expenses);
  return {
    totalIncome,
    totalExpenses,
    fixedExpenses: sum(expenses.filter((entry) => entry.isFixed)),
    variableExpenses: sum(expenses.filter((entry) => !entry.isFixed)),
    profit: roundMoney(totalIncome - totalExpenses),
    period,
  };
}

function limits(data: DemoData, now: number) {
  const plan = PLAN_LIMITS[data.profile.plan];
  const month = new Date(now).toISOString().slice(0, 7);
  return {
    ...plan,
    currentSalesThisMonth: data.sales.filter((sale) => sale.soldAt.startsWith(month))
      .length,
    currentClients: data.clients.length,
    currentRecipes: 0,
    currentPackaging: 0,
    currentProducts: data.products.length,
    currentSuppliers: 0,
  };
}

function refreshClientTotals(data: DemoData): void {
  for (const client of data.clients) {
    client.totalSpent = roundMoney(
      data.sales
        .filter((sale) => sale.clientId === client.id && sale.status === "paid")
        .reduce((sum, sale) => sum + sale.total, 0),
    );
  }
}

function createSale({ body, data, now }: MockRequest): MockResult {
  const input = body as unknown as CreateSale;
  const client = data.clients.find((item) => item.id === input.clientId) ?? null;
  const items = (input.items ?? []).map((item) => {
    const product = data.products.find((entry) => entry.id === item.productId);
    if (product?.stockQuantity != null) {
      product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
    }
    return {
      id: mockUuid(),
      productId: item.productId,
      serviceId: null,
      productName: product?.name ?? "Produto",
      productPhotoUrl: product?.photoUrl ?? null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      ...(item.variationId ? { variationId: item.variationId } : {}),
      ...(item.variationName ? { variationName: item.variationName } : {}),
      subtotal: roundMoney(item.quantity * item.unitPrice),
    };
  });
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.subtotal, 0));
  const value = input.discountValue ?? 0;
  const discount = roundMoney(
    Math.min(
      subtotal,
      input.discountType === "percentage" ? subtotal * (value / 100) : value,
    ),
  );
  const total = roundMoney(subtotal - discount);
  const pending = input.paymentMethod === "credit";
  const soldAt = input.soldAt ?? new Date(now).toISOString();
  const sale: Sale = {
    id: mockUuid(),
    userId: data.profile.id,
    clientId: client?.id ?? null,
    clientName: client?.name ?? null,
    status: pending ? "pending" : "paid",
    paymentMethod: input.paymentMethod,
    subtotal,
    discount,
    discountType: input.discountType ?? null,
    discountValue: value,
    total,
    paidAmount: pending ? 0 : total,
    sourceOrderId: null,
    notes: input.notes ?? null,
    items,
    soldAt,
    createdAt: new Date(now).toISOString(),
  };
  data.sales.unshift(sale);
  if (!pending) data.financeEntries.unshift(buildSaleIncome(sale));
  refreshClientTotals(data);
  return created(sale);
}

function updateSaleStatus({ body, data }: MockRequest, [id]: string[]): MockResult {
  const sale = data.sales.find((item) => item.id === id);
  if (!sale) return notFound();
  const status = body.status as Sale["status"];
  const wasPaid = sale.status === "paid";
  sale.status = status;
  sale.paidAmount = status === "paid" ? sale.total : 0;
  if (status === "paid" && !wasPaid) data.financeEntries.unshift(buildSaleIncome(sale));
  if (status !== "paid") {
    data.financeEntries = data.financeEntries.filter((entry) => entry.saleId !== sale.id);
  }
  refreshClientTotals(data);
  return ok(sale, true);
}

function listSales({ query, data }: MockRequest): MockResult {
  const status = query.get("status");
  const clientId = query.get("clientId");
  const from = query.get("dateFrom");
  const to = query.get("dateTo");
  const sales = data.sales
    .filter((sale) => !status || sale.status === status)
    .filter((sale) => !clientId || sale.clientId === clientId)
    .filter((sale) => !from || new Date(sale.soldAt) >= new Date(from))
    .filter((sale) => !to || new Date(sale.soldAt) <= new Date(to))
    .sort((a, b) => b.soldAt.localeCompare(a.soldAt));
  return ok(paginate(sales, query));
}

function todaySummary({ data, now }: MockRequest): MockResult {
  const sales = data.sales.filter(
    (sale) => sale.status !== "cancelled" && sameLocalDay(sale.soldAt, now),
  );
  const totalAmount = roundMoney(sales.reduce((sum, sale) => sum + sale.total, 0));
  return ok({
    totalSales: sales.length,
    totalAmount,
    averageTicket: sales.length ? roundMoney(totalAmount / sales.length) : 0,
  });
}

function listProducts({ query, data }: MockRequest): MockResult {
  const category = query.get("category");
  const composite = query.get("isComposite");
  const products = data.products
    .filter((product) => product.isActive)
    .filter((product) => !category || product.category === category)
    .filter((product) => composite === null || String(product.isComposite) === composite)
    .filter(
      (product) =>
        matches(product.name, query.get("search")) ||
        matches(product.code, query.get("search")),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return ok(paginate(products, query));
}

function createProduct({ body, data, now }: MockRequest): MockResult {
  const product = buildProduct(
    data.profile.id,
    {
      ...(body as Partial<Product>),
      name: text(body.name, "Produto"),
      salePrice: Number(body.salePrice ?? 0),
      description: (body.description as string | undefined) ?? null,
      photoUrl: (body.photoUrl as string | undefined) ?? null,
      code: (body.code as string | undefined) ?? null,
      costPrice: (body.costPrice as number | undefined) ?? null,
      recipeId: (body.recipeId as string | undefined) ?? null,
      stockQuantity: (body.stockQuantity as number | undefined) ?? null,
      stockAlertThreshold: (body.stockAlertThreshold as number | undefined) ?? null,
      components: undefined,
      variations: undefined,
    },
    new Date(now).toISOString(),
  );
  data.products.push(product);
  return created(product);
}

function patchById<T extends { id: string }>(
  list: T[],
  id: string,
  body: Json,
): MockResult {
  const item = list.find((entry) => entry.id === id);
  if (!item) return notFound();
  Object.assign(item, body);
  return ok(item, true);
}

function removeById<T extends { id: string }>(list: T[], id: string): MockResult {
  const index = list.findIndex((entry) => entry.id === id);
  if (index < 0) return notFound();
  list.splice(index, 1);
  return noContent(true);
}

function listClients({ query, data }: MockRequest): MockResult {
  const search = query.get("search");
  const clients = data.clients
    .filter((client) => matches(client.name, search) || matches(client.phone, search))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return ok(paginate(clients, query));
}

function birthdays({ data, now }: MockRequest): MockResult {
  const soon = (birthday: string | null) => {
    if (!birthday) return false;
    const [, month, day] = birthday.split("-").map(Number);
    const today = new Date(now);
    const next = new Date(today.getFullYear(), (month ?? 1) - 1, day ?? 1);
    if (next.getTime() < new Date(today.toDateString()).getTime()) {
      next.setFullYear(today.getFullYear() + 1);
    }
    return next.getTime() - now <= 7 * 24 * 60 * 60 * 1000;
  };
  return ok(data.clients.filter((client) => soon(client.birthday)));
}

function createClientRoute({ body, data, now }: MockRequest): MockResult {
  const client = buildClient(
    data.profile.id,
    {
      ...(body as Partial<Client>),
      name: text(body.name, "Cliente"),
      tags: (body.tags as string[] | undefined) ?? [],
    },
    new Date(now).toISOString(),
  );
  data.clients.push(client);
  return created(client);
}

function listFinance({ query, data }: MockRequest): MockResult {
  const type = query.get("type");
  const category = query.get("category");
  const fixed = query.get("fixed");
  const start = query.get("startDate");
  const end = query.get("endDate");
  const entries = data.financeEntries
    .filter((entry) => !type || entry.type === type)
    .filter((entry) => !category || entry.category === category)
    .filter((entry) => fixed === null || String(entry.isFixed) === fixed)
    .filter((entry) => !start || entry.date >= start.slice(0, 10))
    .filter((entry) => !end || entry.date <= end.slice(0, 10))
    .sort((a, b) => b.date.localeCompare(a.date) || byNewest(a, b));
  return ok(paginate(entries, query));
}

function createFinance({ body, data, now }: MockRequest): MockResult {
  const createdAt = new Date(now).toISOString();
  const entry: FinanceEntry = {
    id: mockUuid(),
    userId: data.profile.id,
    type: body.type === "income" ? "income" : "expense",
    category: (body.category as FinanceEntry["category"] | undefined) ?? "other",
    amount: Number(body.amount ?? 0),
    description: text(body.description, ""),
    isFixed: Boolean(body.isFixed),
    saleId: null,
    date: text(body.date, createdAt).slice(0, 10),
    createdAt,
  };
  data.financeEntries.unshift(entry);
  return created(entry);
}

function listOrders({ query, data }: MockRequest): MockResult {
  const status = query.get("status");
  const from = query.get("from");
  const to = query.get("to");
  const orders = data.orders
    .filter((order) => !status || order.status === status)
    .filter((order) => !from || order.deliveryDate >= from.slice(0, 10))
    .filter((order) => !to || order.deliveryDate <= to.slice(0, 10))
    .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));
  return ok({ items: orders });
}

function ordersSummary({ data }: MockRequest): MockResult {
  const active = data.orders.filter((order) => order.status !== "cancelled");
  const totalAmount = roundMoney(
    active.reduce((sum, order) => sum + (order.amount ?? 0), 0),
  );
  const received = roundMoney(
    active.reduce((sum, order) => sum + (order.deposit ?? 0), 0),
  );
  return ok({
    totalOrders: active.length,
    totalAmount,
    received,
    toReceive: roundMoney(totalAmount - received),
  });
}

function createOrder({ body, data, now }: MockRequest): MockResult {
  const client = data.clients.find((item) => item.id === body.clientId);
  const order = buildOrder(
    data.profile.id,
    {
      ...(body as Partial<Order>),
      title: text(body.title, "Encomenda"),
      deliveryDate: text(body.deliveryDate, new Date(now).toISOString()).slice(0, 10),
      clientName: client?.name ?? null,
    },
    new Date(now).toISOString(),
  );
  data.orders.push(order);
  return created(order);
}

function prolabore({ data, query, now }: MockRequest): MockResult {
  const summary = financeSummary(data, query, now);
  const config = data.prolaboreGoal ?? null;
  if (!config) {
    return ok({
      config: null,
      progress: {
        requiredRevenue: 0,
        currentRevenue: summary.totalIncome,
        remainingRevenue: 0,
        progressPct: 0,
        salesNeeded: null,
        salesRemaining: null,
        avgTicket: null,
        reached: false,
        period: summary.period,
      },
    });
  }
  // Mesma conta do servidor: meta + max(despesas do mês, custos estimados).
  const requiredRevenue = roundMoney(
    config.monthlyProlaboreGoal +
      Math.max(summary.totalExpenses, config.estimatedMonthlyCosts ?? 0),
  );
  const paid = data.sales.filter(
    (sale) => sale.status === "paid" && sale.soldAt.startsWith(summary.period),
  );
  const avgTicket =
    config.avgTicketOverride ?? (paid.length ? summary.totalIncome / paid.length : null);
  const remainingRevenue = roundMoney(Math.max(0, requiredRevenue - summary.totalIncome));
  return ok({
    config,
    progress: {
      requiredRevenue,
      currentRevenue: summary.totalIncome,
      remainingRevenue,
      progressPct:
        requiredRevenue > 0
          ? Math.min(100, Math.round((summary.totalIncome / requiredRevenue) * 100))
          : 0,
      salesNeeded: avgTicket ? Math.ceil(requiredRevenue / avgTicket) : null,
      salesRemaining: avgTicket ? Math.ceil(remainingRevenue / avgTicket) : null,
      avgTicket,
      reached: requiredRevenue > 0 && summary.totalIncome >= requiredRevenue,
      period: summary.period,
    },
  });
}

function upsertProlabore({ data, body, now }: MockRequest): MockResult {
  const goal = {
    id: data.prolaboreGoal?.id ?? mockUuid(),
    userId: data.profile.id,
    monthlyProlaboreGoal: Number(body.monthlyProlaboreGoal ?? 0),
    estimatedMonthlyCosts:
      body.estimatedMonthlyCosts == null ? null : Number(body.estimatedMonthlyCosts),
    avgTicketOverride:
      body.avgTicketOverride == null ? null : Number(body.avgTicketOverride),
    updatedAt: new Date(now).toISOString(),
  };
  data.prolaboreGoal = goal;
  return ok(goal, true);
}

function insights({ data, query, now }: MockRequest): MockResult {
  const months = Math.min(12, Math.max(1, Math.trunc(Number(query.get("months")) || 6)));
  const today = new Date(now);
  const keys = Array.from({ length: months }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth() - (months - 1 - index),
      1,
    );
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
  const sales = data.sales.filter(
    (sale) => sale.status !== "cancelled" && keys.includes(sale.soldAt.slice(0, 7)),
  );
  const monthlyRevenue = keys.map((month) => {
    const inMonth = sales.filter((sale) => sale.soldAt.startsWith(month));
    return {
      month,
      revenue: roundMoney(inMonth.reduce((sum, sale) => sum + sale.total, 0)),
      salesCount: inMonth.length,
    };
  });
  const products = new Map<
    string,
    { productId: string; name: string; quantity: number; revenue: number }
  >();
  for (const item of sales.flatMap((sale) => sale.items)) {
    if (!item.productId) continue;
    const entry = products.get(item.productId) ?? {
      productId: item.productId,
      name: item.productName,
      quantity: 0,
      revenue: 0,
    };
    entry.quantity += item.quantity;
    entry.revenue = roundMoney(entry.revenue + item.subtotal);
    products.set(item.productId, entry);
  }
  const clients = new Map<
    string,
    { clientId: string; name: string; totalSpent: number; salesCount: number }
  >();
  for (const sale of sales) {
    if (!sale.clientId) continue;
    const entry = clients.get(sale.clientId) ?? {
      clientId: sale.clientId,
      name: sale.clientName ?? "Cliente",
      totalSpent: 0,
      salesCount: 0,
    };
    entry.totalSpent = roundMoney(entry.totalSpent + sale.total);
    entry.salesCount += 1;
    clients.set(sale.clientId, entry);
  }
  return ok({
    months,
    totalRevenue: roundMoney(
      monthlyRevenue.reduce((sum, month) => sum + month.revenue, 0),
    ),
    totalSales: sales.length,
    topProducts: [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    topClients: [...clients.values()]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5),
    monthlyRevenue,
  });
}

/** Mesmo slug que a API gera a partir do nome do negócio. */
function catalogSlug(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join("-")
    .slice(0, 40)
    .replace(/-$/, "");
  return slug || "meu-catalogo";
}

/** Vitrine da conta; na primeira leitura usa os padrões da API real. */
function catalogSettings(data: DemoData, now: number): CatalogSettings {
  data.catalogSettings ??= {
    brandId: DEFAULT_BRAND_ID,
    slug: catalogSlug(data.profile.businessName ?? "meu-catalogo"),
    enabled: false,
    whatsapp: data.profile.phone ?? null,
    coverUrl: null,
    logoUrl: null,
    accentColor: null,
    titleColor: null,
    descriptionColor: null,
    pattern: null,
    tagline: null,
    promoBanner: null,
    promoBannerEnabled: true,
    serviceCoverUrl: null,
    serviceTitleColor: null,
    serviceDescriptionColor: null,
    serviceTagline: null,
    servicePromoBanner: null,
    servicePromoBannerEnabled: true,
    customization: null,
    publishedCustomization: null,
    updatedAt: new Date(now).toISOString(),
  };
  return data.catalogSettings;
}

const getCatalogSettings: Handler = ({ data, now }) => {
  const created = !data.catalogSettings;
  return ok(catalogSettings(data, now), created);
};

const updateCatalogSettings: Handler = ({ data, body, now }) => {
  const { publishStorefront, ...changes } = body;
  const settings = Object.assign(catalogSettings(data, now), changes, {
    updatedAt: new Date(now).toISOString(),
  });
  if (publishStorefront === true && settings.customization) {
    settings.publishedCustomization = settings.customization;
  }
  return ok(settings, true);
};

const demoUnavailable = (): MockResult => ({
  status: 400,
  body: {
    error: "DEMO_MODE",
    message: "Assinaturas ficam desativadas no modo demonstração.",
  },
});

const ID = "([^/?]+)";

const routes: [string, RegExp, Handler][] = [
  // Assinatura e perfil
  ["GET", /^\/api\/v1\/subscription\/profile$/, ({ data }) => ok(data.profile)],
  [
    "PATCH",
    /^\/api\/v1\/subscription\/profile$/,
    ({ data, body }) => {
      Object.assign(data.profile, body);
      return ok(data.profile, true);
    },
  ],
  ["GET", /^\/api\/v1\/subscription\/limits$/, ({ data, now }) => ok(limits(data, now))],
  ["POST", /^\/api\/v1\/subscription\/sync-plan$/, ({ data }) => ok(data.profile)],
  ["POST", /^\/api\/v1\/payments\/stripe\/checkout$/, demoUnavailable],

  // Vendas
  ["GET", /^\/api\/v1\/sales$/, listSales],
  ["POST", /^\/api\/v1\/sales$/, createSale],
  ["GET", /^\/api\/v1\/sales\/summary\/today$/, todaySummary],
  ["PATCH", new RegExp(`^/api/v1/sales/${ID}/status$`), updateSaleStatus],
  [
    "GET",
    new RegExp(`^/api/v1/sales/${ID}$`),
    ({ data }, [id]) => {
      const sale = data.sales.find((item) => item.id === id);
      return sale ? ok(sale) : notFound();
    },
  ],
  [
    "PATCH",
    new RegExp(`^/api/v1/sales/${ID}$`),
    ({ data, body }, [id]) => patchById(data.sales, id, body),
  ],

  // Produtos
  ["GET", /^\/api\/v1\/products$/, listProducts],
  ["POST", /^\/api\/v1\/products$/, createProduct],
  [
    "GET",
    /^\/api\/v1\/products\/low-stock$/,
    ({ data }) =>
      ok(
        data.products.filter(
          (product) =>
            product.stockQuantity != null &&
            product.stockAlertThreshold != null &&
            product.stockQuantity <= product.stockAlertThreshold,
        ),
      ),
  ],
  ["GET", /^\/api\/v1\/products\/velocity$/, () => ok({ days: 30, fast: [], slow: [] })],
  [
    "GET",
    new RegExp(`^/api/v1/products/lookup/by-code/${ID}$`),
    () => ok({ status: "not_found" }),
  ],
  [
    "GET",
    new RegExp(`^/api/v1/products/${ID}/stock-movements$`),
    () => ok({ items: [] }),
  ],
  [
    "POST",
    new RegExp(`^/api/v1/products/${ID}/stock-adjustments$`),
    ({ data, body, now }, [id]) => {
      const product = data.products.find((item) => item.id === id);
      if (!product) return notFound();
      const quantity = Number(body.quantity ?? 0);
      product.stockQuantity = Math.max(0, (product.stockQuantity ?? 0) + quantity);
      return created({
        id: mockUuid(),
        productId: product.id,
        quantity,
        reason: body.reason ?? null,
        createdAt: new Date(now).toISOString(),
      });
    },
  ],
  [
    "GET",
    new RegExp(`^/api/v1/products/${ID}$`),
    ({ data }, [id]) => {
      const product = data.products.find((item) => item.id === id);
      return product ? ok(product) : notFound();
    },
  ],
  [
    "PATCH",
    new RegExp(`^/api/v1/products/${ID}$`),
    ({ data, body }, [id]) => patchById(data.products, id, body),
  ],
  [
    "DELETE",
    new RegExp(`^/api/v1/products/${ID}$`),
    ({ data }, [id]) => removeById(data.products, id),
  ],

  // Clientes
  ["GET", /^\/api\/v1\/clients$/, listClients],
  ["POST", /^\/api\/v1\/clients$/, createClientRoute],
  ["GET", /^\/api\/v1\/clients\/birthdays$/, birthdays],
  [
    "GET",
    new RegExp(`^/api/v1/clients/${ID}$`),
    ({ data }, [id]) => {
      const client = data.clients.find((item) => item.id === id);
      return client ? ok(client) : notFound();
    },
  ],
  [
    "PATCH",
    new RegExp(`^/api/v1/clients/${ID}$`),
    ({ data, body }, [id]) => patchById(data.clients, id, body),
  ],
  [
    "DELETE",
    new RegExp(`^/api/v1/clients/${ID}$`),
    ({ data }, [id]) => removeById(data.clients, id),
  ],

  // Financeiro
  ["GET", /^\/api\/v1\/finance$/, listFinance],
  ["POST", /^\/api\/v1\/finance$/, createFinance],
  [
    "GET",
    /^\/api\/v1\/finance\/summary$/,
    ({ data, query, now }) => ok(financeSummary(data, query, now)),
  ],
  [
    "PATCH",
    new RegExp(`^/api/v1/finance/${ID}$`),
    ({ data, body }, [id]) => patchById(data.financeEntries, id, body),
  ],
  [
    "DELETE",
    new RegExp(`^/api/v1/finance/${ID}$`),
    ({ data }, [id]) => removeById(data.financeEntries, id),
  ],

  // Agenda / encomendas
  ["GET", /^\/api\/v1\/orders$/, listOrders],
  ["POST", /^\/api\/v1\/orders$/, createOrder],
  ["GET", /^\/api\/v1\/orders\/summary$/, ordersSummary],
  [
    "PATCH",
    new RegExp(`^/api/v1/orders/${ID}/status$`),
    ({ data, body }, [id]) => patchById(data.orders, id, { status: body.status }),
  ],
  [
    "PATCH",
    new RegExp(`^/api/v1/orders/${ID}$`),
    ({ data, body }, [id]) => patchById(data.orders, id, body),
  ],
  [
    "DELETE",
    new RegExp(`^/api/v1/orders/${ID}$`),
    ({ data }, [id]) => removeById(data.orders, id),
  ],

  // Fornecedores: a demo não guarda fornecedores, então o resumo vem zerado,
  // no mesmo formato de `SuppliersOverviewDto` da API real.
  ["GET", /^\/api\/v1\/suppliers\/overview$/, () => ok(emptySuppliersOverview())],

  // Varejo: sem caixa aberto a API real responde `null` (não uma lista).
  ["GET", /^\/api\/v1\/retail\/cash\/current$/, () => ok(null)],

  // Catálogo: configurações da vitrine no formato de `CatalogSettingsDto`.
  ["GET", /^\/api\/v1\/catalog\/settings$/, getCatalogSettings],
  ["PUT", /^\/api\/v1\/catalog\/settings$/, updateCatalogSettings],
  [
    "GET",
    /^\/api\/v1\/catalog\/slug-availability$/,
    () => ok({ available: true, reason: null }),
  ],

  // Resultados e precificação
  ["GET", /^\/api\/v1\/insights$/, insights],
  ["GET", /^\/api\/v1\/pricing$/, ({ query }) => ok(paginate([], query))],

  // Meta de pró-labore
  ["GET", /^\/api\/v1\/goals\/prolabore$/, prolabore],
  ["PUT", /^\/api\/v1\/goals\/prolabore$/, upsertProlabore],
  [
    "DELETE",
    /^\/api\/v1\/goals\/prolabore$/,
    ({ data }) => {
      data.prolaboreGoal = null;
      return noContent(true);
    },
  ],
];

/** Rotas atendidas sem conta: coleta de uso e notificações viram no-op. */
function publicRoute(method: string, path: string): MockResult | null {
  if (path.startsWith("/api/v1/analytics/")) {
    return path === "/api/v1/analytics/admin/access"
      ? ok({ allowed: false })
      : noContent();
  }
  if (path.startsWith("/api/v1/notifications/")) return noContent();
  if (method === "GET" && path === "/health") return ok({ status: "ok" });
  return null;
}

/** Fallback para rotas não simuladas: vazio em leitura, eco em escrita. */
function fallback({ method, body, now }: MockRequest): MockResult {
  if (method === "GET") return ok(emptyCollection());
  if (method === "DELETE") return noContent();
  return {
    status: method === "POST" ? 201 : 200,
    body: { id: mockUuid(), ...body, createdAt: new Date(now).toISOString() },
  };
}

export function handleMockRequest(request: MockRequest): MockResult {
  const publicResult = publicRoute(request.method, request.path);
  if (publicResult) return publicResult;

  for (const [method, pattern, handler] of routes) {
    if (method !== request.method) continue;
    const match = pattern.exec(request.path);
    if (match) return handler(request, match.slice(1).map(decodeURIComponent));
  }

  console.warn(
    `[demo] rota sem mock: ${request.method} ${request.path} (resposta vazia)`,
  );
  return fallback(request);
}

function dataFor(userId: string | null): DemoData | null {
  if (!userId) return null;
  const stored = loadDemoData(userId);
  if (stored) return stored;
  const account = currentDemoAccount();
  if (!account || account.id !== userId) return null;
  const fresh = emptyDemoData(account);
  saveDemoData(userId, fresh);
  return fresh;
}

/** Cópia desacoplada do estado, como se tivesse passado pela rede. */
function detach(body: unknown): unknown {
  if (body === undefined) return undefined;
  // A coleção vazia do fallback mantém o formato híbrido (lista + paginação).
  if (Array.isArray(body) && body.length === 0 && isEmptyCollection(body)) {
    return emptyCollection();
  }
  return JSON.parse(JSON.stringify(body)) as unknown;
}

/**
 * Atende uma chamada do api-client no modo demonstração. Devolve status e corpo;
 * o api-client converte status de erro em `ApiError` como faria com a rede.
 */
export async function mockApiRequest(
  pathWithQuery: string,
  options: { method?: string; body?: unknown; token?: string },
): Promise<MockResult> {
  await new Promise((resolve) => setTimeout(resolve, API_DELAY_MS));
  const url = new URL(pathWithQuery, "https://demo.local");
  const method = (options.method ?? "GET").toUpperCase();
  const body =
    options.body && typeof options.body === "object"
      ? (JSON.parse(JSON.stringify(options.body)) as Json)
      : {};

  const publicResult = publicRoute(method, url.pathname);
  if (publicResult) return publicResult;

  const userId = userIdFromToken(options.token);
  const data = dataFor(userId);
  if (!data || !userId) {
    return { status: 401, body: { error: "UNAUTHORIZED", message: "Sessao invalida" } };
  }

  const result = handleMockRequest({
    method,
    path: url.pathname,
    query: url.searchParams,
    body,
    data,
    now: Date.now(),
  });
  if (result.changed) saveDemoData(userId, data);
  return { status: result.status, body: detach(result.body) };
}
