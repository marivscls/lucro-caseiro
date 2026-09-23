import { afterEach, describe, expect, it, vi } from "vitest";

import { handleMockRequest, paginate, type MockRequest } from "./api";
import { emptyDemoData, seededDemoData, type DemoData } from "./fixtures";

const NOW = new Date("2026-09-23T12:00:00").getTime();
const account = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "ana@exemplo.com",
  name: "Ana",
  createdAt: new Date(NOW).toISOString(),
};

function makeSut(data: DemoData = emptyDemoData(account)) {
  const request = (
    method: string,
    pathWithQuery: string,
    body: Record<string, unknown> = {},
  ) => {
    const url = new URL(pathWithQuery, "https://demo.local");
    const input: MockRequest = {
      method,
      path: url.pathname,
      query: url.searchParams,
      body,
      data,
      now: NOW,
    };
    return handleMockRequest(input);
  };
  return { data, request };
}

function productBody(name = "Brigadeiro gourmet", salePrice = 3.5) {
  return { name, category: "Doces", salePrice, stockQuantity: 40 };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("mock api — produtos e vendas", () => {
  it("cria um produto e passa a listá-lo", () => {
    // Arrange
    const { request } = makeSut();

    // Act
    const created = request("POST", "/api/v1/products", productBody());
    const list = request("GET", "/api/v1/products?page=1&limit=100");

    // Assert
    expect(created.status).toBe(201);
    expect(created.changed).toBe(true);
    expect((list.body as { items: { name: string }[] }).items.map((p) => p.name)).toEqual(
      ["Brigadeiro gourmet"],
    );
  });

  it("venda paga gera entrada no financeiro e baixa o estoque", () => {
    // Arrange
    const { data, request } = makeSut();
    const product = request("POST", "/api/v1/products", productBody()).body as {
      id: string;
    };

    // Act
    const sale = request("POST", "/api/v1/sales", {
      paymentMethod: "pix",
      items: [{ productId: product.id, quantity: 4, unitPrice: 3.5 }],
    });

    // Assert
    expect(sale.body).toMatchObject({ status: "paid", total: 14, paidAmount: 14 });
    expect(data.financeEntries).toHaveLength(1);
    expect(data.financeEntries[0]).toMatchObject({ type: "income", amount: 14 });
    expect(data.products[0]?.stockQuantity).toBe(36);
  });

  it("fiado nasce pendente e só entra no financeiro quando é recebido", () => {
    // Arrange
    const { data, request } = makeSut();
    const product = request("POST", "/api/v1/products", productBody()).body as {
      id: string;
    };
    const sale = request("POST", "/api/v1/sales", {
      paymentMethod: "credit",
      items: [{ productId: product.id, quantity: 2, unitPrice: 3.5 }],
    }).body as { id: string; status: string };

    const createdStatus = sale.status;
    const pendingEntries = data.financeEntries.length;

    // Act
    const paid = request("PATCH", `/api/v1/sales/${sale.id}/status`, { status: "paid" });

    // Assert
    expect(createdStatus).toBe("pending");
    expect(pendingEntries).toBe(0);
    expect(paid.body).toMatchObject({ status: "paid", paidAmount: 7 });
    expect(data.financeEntries).toHaveLength(1);
  });

  it("resume as vendas de hoje sem contar canceladas", () => {
    // Arrange
    const { request } = makeSut(seededDemoData(account, NOW));

    // Act
    const summary = request("GET", "/api/v1/sales/summary/today");

    // Assert
    expect(summary.body).toEqual({ totalSales: 2, totalAmount: 59, averageTicket: 29.5 });
  });
});

describe("mock api — dados da confeitaria de exemplo", () => {
  it("traz fiado pendente, estoque baixo e encomendas na agenda", () => {
    // Arrange
    const { request } = makeSut(seededDemoData(account, NOW));

    // Act
    const pending = request("GET", "/api/v1/sales?status=pending").body as {
      total: number;
    };
    const lowStock = request("GET", "/api/v1/products/low-stock").body as {
      name: string;
    }[];
    const orders = request("GET", "/api/v1/orders").body as { items: unknown[] };

    // Assert
    expect(pending.total).toBe(2);
    expect(lowStock.map((product) => product.name)).toEqual(["Pudim de leite"]);
    expect(orders.items).toHaveLength(3);
  });

  it("calcula limites do plano gratuito com as contagens da conta", () => {
    // Arrange
    const { request } = makeSut(seededDemoData(account, NOW));

    // Act
    const limits = request("GET", "/api/v1/subscription/limits").body;

    // Assert
    expect(limits).toMatchObject({
      maxProducts: 30,
      maxClients: 50,
      currentProducts: 6,
      currentClients: 5,
    });
  });

  it("resume o financeiro do mês com entradas e despesas", () => {
    // Arrange
    const { request } = makeSut(seededDemoData(account, NOW));

    // Act
    const summary = request("GET", "/api/v1/finance/summary?month=9&year=2026").body as {
      totalIncome: number;
      totalExpenses: number;
      profit: number;
    };

    // Assert
    expect(summary.totalIncome).toBeGreaterThan(summary.totalExpenses);
    expect(summary.profit).toBeCloseTo(summary.totalIncome - summary.totalExpenses, 2);
  });
});

describe("mock api — rotas não simuladas", () => {
  it("devolve coleção vazia que serve como lista e como paginação", () => {
    // Arrange
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { request } = makeSut();

    // Act
    const result = request("GET", "/api/v1/recipes?page=1");
    const body = result.body as unknown[] & { items: unknown[]; total: number };

    // Assert
    expect(result.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("GET /api/v1/recipes"));
  });

  it("ecoa escritas desconhecidas com id", () => {
    // Arrange
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { request } = makeSut();

    // Act
    const result = request("POST", "/api/v1/suppliers", { name: "Atacadão" });

    // Assert
    expect(result.status).toBe(201);
    expect(result.body).toMatchObject({ name: "Atacadão", id: expect.any(String) });
  });

  it("trata coleta de uso como no-op", () => {
    // Arrange
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { request } = makeSut();

    // Act
    const result = request("POST", "/api/v1/analytics/events/identify", { events: [] });

    // Assert
    expect(result.status).toBe(204);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("paginate", () => {
  it("fatia a lista e informa o total de páginas", () => {
    // Arrange
    const items = Array.from({ length: 45 }, (_, index) => index);

    // Act
    const page = paginate(items, new URLSearchParams("page=3&limit=20"));

    // Assert
    expect(page).toEqual({
      items: [40, 41, 42, 43, 44],
      total: 45,
      page: 3,
      limit: 20,
      totalPages: 3,
    });
  });
});
