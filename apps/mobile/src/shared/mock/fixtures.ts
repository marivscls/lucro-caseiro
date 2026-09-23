import type {
  Client,
  FinanceEntry,
  Order,
  PaymentMethod,
  Product,
  Sale,
  UserProfile,
} from "@lucro-caseiro/contracts";

import { mockUuid } from "./storage";

/** Tudo o que a API simulada guarda para uma conta de demonstração. */
export interface DemoData {
  profile: UserProfile;
  products: Product[];
  clients: Client[];
  sales: Sale[];
  financeEntries: FinanceEntry[];
  orders: Order[];
}

interface DemoAccount {
  id: string;
  email: string;
  name: string;
  businessName?: string | null;
  businessType?: string | null;
  createdAt: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDaysFrom(now: number, days: number, hour = 10): string {
  const date = new Date(now + days * DAY_MS);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function dateOnly(iso: string): string {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildProfile(account: DemoAccount): UserProfile {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    phone: null,
    businessName: account.businessName ?? null,
    businessType: account.businessType ?? null,
    avatarUrl: null,
    plan: "free",
    planExpiresAt: null,
    createdAt: account.createdAt,
  };
}

export function buildProduct(
  userId: string,
  input: Partial<Product> & Pick<Product, "name" | "salePrice">,
  createdAt: string,
  uuid: () => string = mockUuid,
): Product {
  return {
    id: uuid(),
    userId,
    description: null,
    category: "Doces",
    photoUrl: null,
    extraPhotos: [],
    code: null,
    saleUnit: "unit",
    costPrice: null,
    recipeId: null,
    stockQuantity: null,
    stockAlertThreshold: null,
    isComposite: false,
    isActive: true,
    publicEnabled: true,
    createdAt,
    ...input,
  };
}

export function buildClient(
  userId: string,
  input: Partial<Client> & Pick<Client, "name">,
  createdAt: string,
  uuid: () => string = mockUuid,
): Client {
  return {
    id: uuid(),
    userId,
    phone: null,
    address: null,
    birthday: null,
    notes: null,
    tags: [],
    nextContactAt: null,
    nextContactReason: null,
    nextContactNotes: null,
    totalSpent: 0,
    createdAt,
    ...input,
  };
}

export interface SaleLine {
  product: Product;
  quantity: number;
}

export function buildSale(
  userId: string,
  input: {
    lines: SaleLine[];
    paymentMethod: PaymentMethod;
    client?: Client | null;
    soldAt: string;
    discount?: number;
    notes?: string | null;
  },
  uuid: () => string = mockUuid,
): Sale {
  const items = input.lines.map(({ product, quantity }) => ({
    id: uuid(),
    productId: product.id,
    serviceId: null,
    productName: product.name,
    productPhotoUrl: product.photoUrl,
    quantity,
    unitPrice: product.salePrice,
    subtotal: roundMoney(product.salePrice * quantity),
  }));
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.subtotal, 0));
  const discount = roundMoney(Math.min(input.discount ?? 0, subtotal));
  const total = roundMoney(subtotal - discount);
  // Fiado ("credit") nasce pendente: o cliente paga depois.
  const pending = input.paymentMethod === "credit";
  return {
    id: uuid(),
    userId,
    clientId: input.client?.id ?? null,
    clientName: input.client?.name ?? null,
    status: pending ? "pending" : "paid",
    paymentMethod: input.paymentMethod,
    subtotal,
    discount,
    discountType: discount > 0 ? "fixed" : null,
    discountValue: discount,
    total,
    paidAmount: pending ? 0 : total,
    sourceOrderId: null,
    notes: input.notes ?? null,
    items,
    soldAt: input.soldAt,
    createdAt: input.soldAt,
  };
}

export function buildSaleIncome(sale: Sale, uuid: () => string = mockUuid): FinanceEntry {
  const first = sale.items[0]?.productName ?? "Venda";
  const extra = sale.items.length > 1 ? ` +${sale.items.length - 1}` : "";
  return {
    id: uuid(),
    userId: sale.userId,
    type: "income",
    category: "sale",
    amount: sale.total,
    description: `Venda: ${first}${extra}`,
    isFixed: false,
    saleId: sale.id,
    date: dateOnly(sale.soldAt),
    createdAt: sale.soldAt,
  };
}

export function buildOrder(
  userId: string,
  input: Partial<Order> & Pick<Order, "title" | "deliveryDate">,
  createdAt: string,
  uuid: () => string = mockUuid,
): Order {
  return {
    id: uuid(),
    userId,
    clientId: null,
    clientName: null,
    serviceId: null,
    serviceName: null,
    serviceVariationId: null,
    serviceVariationName: null,
    serviceAddOnIds: [],
    serviceAddOnNames: [],
    servicePackagePurchaseId: null,
    durationMinutes: null,
    deliveryTime: null,
    status: "pending",
    amount: null,
    deposit: null,
    theme: null,
    honoree: null,
    colors: null,
    photoUrl: null,
    notes: null,
    appointmentStatus: null,
    locationMode: null,
    locationDetails: null,
    actualCost: null,
    completedAt: null,
    saleId: null,
    createdAt,
    ...input,
  };
}

/** Conta nova: só o perfil. É o caminho de quem acabou de se cadastrar. */
export function emptyDemoData(account: DemoAccount): DemoData {
  return {
    profile: buildProfile(account),
    products: [],
    clients: [],
    sales: [],
    financeEntries: [],
    orders: [],
  };
}

/**
 * Confeitaria de exemplo ("Doces da Ana") para quem entra por "Entrar": produtos,
 * clientes, vendas das últimas duas semanas (com fiado), despesas e encomendas.
 */
export function seededDemoData(
  account: DemoAccount,
  now: number,
  uuid: () => string = mockUuid,
): DemoData {
  const userId = account.id;
  const since = isoDaysFrom(now, -45);
  const product = (input: Partial<Product> & Pick<Product, "name" | "salePrice">) =>
    buildProduct(userId, input, since, uuid);
  const client = (input: Partial<Client> & Pick<Client, "name">) =>
    buildClient(userId, input, since, uuid);

  const brigadeiro = product({
    name: "Brigadeiro gourmet",
    description: "Chocolate belga com granulado.",
    salePrice: 3.5,
    costPrice: 1.2,
    stockQuantity: 120,
    stockAlertThreshold: 30,
  });
  const boloPote = product({
    name: "Bolo de pote ninho com morango",
    salePrice: 12,
    costPrice: 4.8,
    stockQuantity: 18,
    stockAlertThreshold: 5,
  });
  const brownie = product({
    name: "Brownie recheado",
    salePrice: 8,
    costPrice: 3,
    stockQuantity: 25,
    stockAlertThreshold: 6,
  });
  const boloCenoura = product({
    name: "Bolo de cenoura com chocolate",
    category: "Bolos",
    salePrice: 45,
    costPrice: 18,
  });
  const caixa = product({
    name: "Caixa com 12 brigadeiros",
    category: "Presentes",
    salePrice: 38,
    costPrice: 14,
    stockQuantity: 6,
    stockAlertThreshold: 2,
  });
  const pudim = product({
    name: "Pudim de leite",
    category: "Sobremesas",
    salePrice: 35,
    costPrice: 12,
    stockQuantity: 2,
    stockAlertThreshold: 3,
  });
  const products = [brigadeiro, boloPote, brownie, boloCenoura, caixa, pudim];

  const mariana = client({
    name: "Mariana Costa",
    phone: "11987654321",
    address: "Rua das Flores, 120 - Vila Mariana",
    tags: ["frequente"],
  });
  const juliana = client({
    name: "Juliana Pereira",
    phone: "11976543210",
    notes: "Prefere retirar no fim da tarde.",
  });
  const cida = client({
    name: "Dona Cida",
    phone: "11965432109",
    tags: ["vizinha"],
  });
  const rafael = client({ name: "Rafael Lima", phone: "11954321098" });
  const birthday = new Date(now + 4 * DAY_MS);
  const carla = client({
    name: "Carla Mendes",
    phone: "11943210987",
    birthday: `1990-${String(birthday.getMonth() + 1).padStart(2, "0")}-${String(
      birthday.getDate(),
    ).padStart(2, "0")}`,
  });
  const clients = [mariana, juliana, cida, rafael, carla];

  const sale = (
    days: number,
    hour: number,
    paymentMethod: PaymentMethod,
    lines: SaleLine[],
    buyer: Client | null = null,
  ) =>
    buildSale(
      userId,
      { lines, paymentMethod, client: buyer, soldAt: isoDaysFrom(now, days, hour) },
      uuid,
    );

  const sales = [
    sale(0, 9, "pix", [{ product: boloPote, quantity: 2 }], mariana),
    sale(0, 8, "cash", [{ product: brigadeiro, quantity: 10 }]),
    sale(-1, 16, "credit", [{ product: caixa, quantity: 2 }], juliana),
    sale(-2, 15, "card", [{ product: boloCenoura, quantity: 1 }], cida),
    sale(-3, 11, "pix", [
      { product: brownie, quantity: 4 },
      { product: brigadeiro, quantity: 6 },
    ]),
    sale(-5, 17, "credit", [{ product: brownie, quantity: 3 }], rafael),
    sale(-6, 10, "pix", [{ product: pudim, quantity: 1 }], carla),
    sale(-8, 14, "cash", [{ product: boloPote, quantity: 3 }]),
    sale(-10, 9, "transfer", [{ product: caixa, quantity: 1 }], mariana),
    sale(-13, 15, "pix", [{ product: brigadeiro, quantity: 25 }], cida),
  ];

  for (const buyer of clients) {
    buyer.totalSpent = roundMoney(
      sales
        .filter((item) => item.clientId === buyer.id && item.status === "paid")
        .reduce((sum, item) => sum + item.total, 0),
    );
  }

  const expense = (
    days: number,
    category: FinanceEntry["category"],
    amount: number,
    description: string,
    isFixed = false,
  ): FinanceEntry => {
    const createdAt = isoDaysFrom(now, days, 12);
    return {
      id: uuid(),
      userId,
      type: "expense",
      category,
      amount,
      description,
      isFixed,
      saleId: null,
      date: dateOnly(createdAt),
      createdAt,
    };
  };

  const financeEntries = [
    ...sales
      .filter((item) => item.status === "paid")
      .map((item) => buildSaleIncome(item, uuid)),
    expense(-1, "material", 89.9, "Leite condensado, chocolate e creme de leite"),
    expense(-4, "packaging", 34.9, "Potes, forminhas e fitas"),
    expense(-7, "utility", 115, "Botijão de gás", true),
    expense(-9, "transport", 18, "Entrega por motoboy"),
  ];

  const order = (input: Partial<Order> & Pick<Order, "title" | "deliveryDate">) =>
    buildOrder(userId, input, isoDaysFrom(now, -2), uuid);
  const orders = [
    order({
      title: "Bolo de aniversário 15 anos",
      clientId: carla.id,
      clientName: carla.name,
      deliveryDate: dateOnly(isoDaysFrom(now, 3)),
      deliveryTime: "15:00",
      status: "in_production",
      amount: 220,
      deposit: 100,
      theme: "Jardim encantado",
      honoree: "Sofia",
      colors: "Rosa e dourado",
    }),
    order({
      title: "100 docinhos para casamento",
      clientId: mariana.id,
      clientName: mariana.name,
      deliveryDate: dateOnly(isoDaysFrom(now, 7)),
      deliveryTime: "10:00",
      amount: 180,
      deposit: 90,
      notes: "Forminhas brancas.",
    }),
    order({
      title: "Bolo de cenoura para café da empresa",
      clientId: rafael.id,
      clientName: rafael.name,
      deliveryDate: dateOnly(isoDaysFrom(now, 1)),
      deliveryTime: "08:30",
      status: "ready",
      amount: 45,
      deposit: 0,
    }),
  ];

  return {
    profile: buildProfile({
      ...account,
      businessName: account.businessName ?? "Doces da Ana",
      businessType: account.businessType ?? "food",
    }),
    products,
    clients,
    sales,
    financeEntries,
    orders,
  };
}
