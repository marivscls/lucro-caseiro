import type {
  BusinessAccount,
  CreateBusinessAccountDto,
  CreateRetailDocument,
  CreateRetailPromotion,
  Product,
  PublicCatalogOrderDto,
  ReplenishmentSuggestion,
  RetailCheckoutDto,
  RetailCheckoutQuoteDto,
  RetailDocument,
  RetailDocumentKind,
  RetailPromotion,
  UpdateBusinessAccountDto,
  UpdateRetailDocument,
} from "@lucro-caseiro/contracts";
import type { z } from "zod";

import { NotFoundError, ValidationError } from "../../shared/errors";
import type { IClientsRepo } from "../clients/clients.types";
import type { IProductsRepo } from "../products/products.types";
import type { SalesUseCases } from "../sales/sales.usecases";
import {
  canTransitionRetailDocument,
  distributeManualDiscount,
  escapeRetailHtml,
  INITIAL_RETAIL_STATUS,
  quoteRetailLine,
  type QuotedRetailLine,
} from "./retail.domain";
import type { CreateCashMovementData, IRetailRepo } from "./retail.types";

type CheckoutData = z.infer<typeof RetailCheckoutDto>;
type CheckoutQuoteData = z.infer<typeof RetailCheckoutQuoteDto>;
type PublicCatalogOrderData = z.infer<typeof PublicCatalogOrderDto>;
type BusinessAccountData = z.infer<typeof CreateBusinessAccountDto>;
type BusinessAccountUpdate = z.infer<typeof UpdateBusinessAccountDto>;

export class RetailUseCases {
  constructor(
    private repo: IRetailRepo,
    private productsRepo: IProductsRepo,
    private salesUseCases: SalesUseCases,
    private clientsRepo: IClientsRepo,
  ) {}

  async createDocument(
    userId: string,
    data: CreateRetailDocument,
  ): Promise<RetailDocument> {
    if (data.deposit !== undefined && data.deposit > (data.amount ?? 0)) {
      throw new ValidationError(["O sinal não pode superar o valor total"]);
    }
    const items = await this.normalizeDocumentItems(userId, data);
    return this.repo.createDocument(
      userId,
      { ...data, items },
      data.status ?? INITIAL_RETAIL_STATUS[data.kind],
    );
  }

  listDocuments(userId: string, kind: RetailDocumentKind): Promise<RetailDocument[]> {
    return this.repo.listDocuments(userId, kind);
  }

  async getDocument(userId: string, id: string): Promise<RetailDocument> {
    const document = await this.repo.findDocument(userId, id);
    if (!document) throw new NotFoundError("Documento de varejo não encontrado");
    return document;
  }

  async updateDocument(
    userId: string,
    id: string,
    data: UpdateRetailDocument,
  ): Promise<RetailDocument> {
    const current = await this.getDocument(userId, id);
    if (data.status && !canTransitionRetailDocument(current, data.status)) {
      throw new ValidationError([
        `Transição inválida de ${current.status} para ${data.status}`,
      ]);
    }
    const amount = data.amount ?? current.amount;
    const deposit = data.deposit ?? current.deposit;
    if (deposit > amount)
      throw new ValidationError(["O sinal não pode superar o valor total"]);
    if (data.items && ["cash_session", "fiscal_document"].includes(current.kind)) {
      throw new ValidationError(["Este documento não aceita itens"]);
    }
    const items = data.items
      ? await this.normalizeDocumentItems(userId, {
          kind: current.kind as CreateRetailDocument["kind"],
          title: data.title ?? current.title,
          payload: data.payload ?? current.payload,
          items: data.items,
        })
      : undefined;
    const updated = await this.repo.updateDocument(userId, id, {
      ...data,
      ...(items ? { items } : {}),
    });
    if (!updated) throw new NotFoundError("Documento de varejo não encontrado");
    return updated;
  }

  async removeDocument(userId: string, id: string): Promise<void> {
    const document = await this.getDocument(userId, id);
    if (
      ["finalized", "received", "completed", "authorized", "closed"].includes(
        document.status,
      )
    ) {
      throw new ValidationError(["Documento concluído não pode ser excluído"]);
    }
    if (!(await this.repo.deleteDocument(userId, id))) {
      throw new NotFoundError("Documento de varejo não encontrado");
    }
  }

  async openCashSession(userId: string, openingFloat: number, note?: string) {
    if (await this.repo.findOpenCashSession(userId)) {
      throw new ValidationError(["Já existe um caixa aberto"]);
    }
    const session = await this.repo.createDocument(
      userId,
      {
        kind: "cash_session",
        title: `Caixa ${new Date().toLocaleDateString("pt-BR")}`,
        amount: openingFloat,
        deposit: 0,
        payload: { openingFloat, ...(note ? { openingNote: note } : {}) },
        items: [],
      },
      "open",
    );
    return this.cashSummary(session);
  }

  async currentCashSession(userId: string) {
    const session = await this.repo.findOpenCashSession(userId);
    return session ? this.cashSummary(session) : null;
  }

  async addCashMovement(userId: string, data: CreateCashMovementData) {
    const session = await this.repo.findOpenCashSession(userId);
    if (!session) throw new ValidationError(["Abra o caixa antes de movimentá-lo"]);
    if (data.type === "withdrawal" && data.paymentMethod === "cash") {
      const summary = await this.cashSummary(session);
      if (data.amount > summary.expectedCash) {
        throw new ValidationError(["Sangria maior que o dinheiro esperado em caixa"]);
      }
    }
    await this.repo.createCashMovement(session.id, data);
    return this.cashSummary(session);
  }

  async closeCashSession(userId: string, countedCash: number, note?: string) {
    const session = await this.repo.findOpenCashSession(userId);
    if (!session) throw new ValidationError(["Nenhum caixa aberto"]);
    const summary = await this.cashSummary(session);
    const difference = Math.round((countedCash - summary.expectedCash) * 100) / 100;
    const updated = await this.repo.updateDocument(userId, session.id, {
      status: "closed",
      payload: {
        ...session.payload,
        countedCash,
        difference,
        closedAt: new Date().toISOString(),
        ...(note ? { closingNote: note } : {}),
      },
    });
    return this.cashSummary(updated!);
  }

  createPromotion(userId: string, data: CreateRetailPromotion) {
    this.validatePromotion(data);
    return this.repo.createPromotion(userId, data);
  }

  listPromotions(userId: string) {
    return this.repo.listPromotions(userId);
  }

  async updatePromotion(
    userId: string,
    id: string,
    data: Partial<CreateRetailPromotion>,
  ) {
    const current = (await this.repo.listPromotions(userId)).find(
      (item) => item.id === id,
    );
    if (!current) throw new NotFoundError("Promoção não encontrada");
    const merged = { ...current, ...data };
    this.validatePromotion(merged);
    const updated = await this.repo.updatePromotion(userId, id, data);
    if (!updated) throw new NotFoundError("Promoção não encontrada");
    return updated;
  }

  async removePromotion(userId: string, id: string) {
    if (!(await this.repo.deletePromotion(userId, id))) {
      throw new NotFoundError("Promoção não encontrada");
    }
  }

  async createBusinessAccount(userId: string, data: BusinessAccountData) {
    if (!(await this.clientsRepo.findById(userId, data.clientId))) {
      throw new ValidationError(["Cliente não encontrado"]);
    }
    return this.repo.createBusinessAccount(userId, data);
  }

  listBusinessAccounts(userId: string) {
    return this.repo.listBusinessAccounts(userId);
  }

  async updateBusinessAccount(userId: string, id: string, data: BusinessAccountUpdate) {
    if (data.clientId && !(await this.clientsRepo.findById(userId, data.clientId))) {
      throw new ValidationError(["Cliente não encontrado"]);
    }
    const updated = await this.repo.updateBusinessAccount(userId, id, data);
    if (!updated) throw new NotFoundError("Convênio não encontrado");
    return updated;
  }

  async checkout(userId: string, data: CheckoutData) {
    const session = await this.repo.findOpenCashSession(userId);
    if (!session || session.id !== data.sessionId) {
      throw new ValidationError(["O caixa informado não está aberto"]);
    }
    const quote = await this.prepareCheckoutQuote(userId, data);
    const { businessAccount, lines, total } = quote;
    const paid =
      Math.round(data.payments.reduce((sum, payment) => sum + payment.amount, 0) * 100) /
      100;
    if (paid !== total) {
      throw new ValidationError([
        `Os pagamentos somam R$ ${paid.toFixed(2)}, mas o total é R$ ${total.toFixed(2)}`,
      ]);
    }
    const creditAmount = data.payments
      .filter((payment) => payment.method === "credit")
      .reduce((sum, payment) => sum + payment.amount, 0);
    if (creditAmount && !businessAccount && !data.clientId) {
      throw new ValidationError(["Venda fiada exige cliente ou convênio"]);
    }
    if (
      businessAccount &&
      creditAmount > businessAccount.creditLimit - businessAccount.usedCredit
    ) {
      throw new ValidationError(["Limite de crédito do convênio excedido"]);
    }

    const sale = await this.salesUseCases.createSale(userId, {
      clientId: data.clientId,
      paymentMethod: data.payments[0]!.method,
      items: lines.map((line) => ({
        productId: line.product.id,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        variationId: line.variationId,
        variationName: line.variationName,
      })),
      notes: data.notes,
    });
    let credited = false;
    const recordedPayments: CheckoutData["payments"] = [];
    try {
      if (businessAccount && creditAmount) {
        credited = await this.repo.incrementUsedCredit(
          userId,
          businessAccount.id,
          creditAmount,
        );
        if (!credited)
          throw new ValidationError(["Limite de crédito do convênio excedido"]);
      }
      for (const payment of data.payments) {
        await this.repo.createCashMovement(session.id, {
          type: "sale",
          paymentMethod: payment.method,
          amount: payment.amount,
          referenceId: sale.id,
        });
        recordedPayments.push(payment);
      }
      if (data.catalogOrderId) {
        await this.updateDocument(userId, data.catalogOrderId, { status: "completed" });
      }
    } catch (error) {
      if (businessAccount && credited) {
        await this.repo.incrementUsedCredit(userId, businessAccount.id, -creditAmount);
      }
      for (const payment of recordedPayments) {
        await this.repo.createCashMovement(session.id, {
          type: "refund",
          paymentMethod: payment.method,
          amount: payment.amount,
          referenceId: sale.id,
          note: "Estorno automático de venda não concluída",
        });
      }
      await this.salesUseCases.updateStatus(userId, sale.id, "cancelled");
      throw error;
    }
    const fiscalDocument = data.requestFiscalDocument
      ? await this.createFiscalDocument(userId, sale.id, "nfce")
      : null;
    return {
      sale,
      payments: data.payments,
      discount: quote.discount,
      fiscalDocument,
    };
  }

  async quoteCheckout(userId: string, data: CheckoutQuoteData) {
    const quote = await this.prepareCheckoutQuote(userId, data);
    return {
      total: quote.total,
      discount: quote.discount,
      originalTotal: quote.originalTotal,
    };
  }

  async createCatalogOrder(userId: string, data: PublicCatalogOrderData) {
    const lines = await this.quoteItems(userId, data.items);
    return this.repo.createDocument(
      userId,
      {
        kind: "catalog_order",
        title: `Pedido de ${data.customerName}`,
        amount: this.linesTotal(lines),
        reservedUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        payload: {
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          fulfillment: data.fulfillment,
          slug: data.slug,
          ...(data.notes ? { notes: data.notes } : {}),
        },
        items: lines.map((line) => ({
          productId: line.product.id,
          variationId: line.variationId,
          name: line.product.name,
          variationName: line.variationName,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
      },
      "new",
    );
  }

  async finalizeInventory(userId: string, id: string) {
    const document = await this.getDocument(userId, id);
    if (document.kind !== "inventory_count" || document.status !== "counting") {
      throw new ValidationError(["Inventário não está aberto para contagem"]);
    }
    const changes: Array<{ productId: string; variationId?: string; delta: number }> = [];
    for (const item of document.items) {
      if (!item.productId) continue;
      const counted = Number(item.metadata.counted);
      const reason =
        typeof item.metadata.reason === "string" ? item.metadata.reason.trim() : "";
      if (!Number.isInteger(counted) || counted < 0) {
        throw new ValidationError([`Contagem inválida para ${item.name}`]);
      }
      const product = await this.productsRepo.findById(userId, item.productId);
      if (!product) throw new ValidationError([`Produto ${item.name} não encontrado`]);
      const current = item.variationId
        ? product.variations?.find((variation) => variation.id === item.variationId)
            ?.stockQuantity
        : product.stockQuantity;
      if (current === null || current === undefined) continue;
      const delta = counted - current;
      if (delta && !reason)
        throw new ValidationError([`Informe o motivo do ajuste de ${item.name}`]);
      if (delta)
        changes.push({
          productId: item.productId,
          variationId: item.variationId ?? undefined,
          delta,
        });
    }
    const applied: typeof changes = [];
    try {
      for (const change of changes) {
        if (
          !(await this.productsRepo.adjustStock(
            userId,
            change.productId,
            change.delta,
            change.variationId,
          ))
        ) {
          throw new ValidationError(["Não foi possível ajustar o estoque"]);
        }
        applied.push(change);
      }
      return await this.updateDocument(userId, id, {
        status: "finalized",
        payload: { ...document.payload, finalizedAt: new Date().toISOString() },
      });
    } catch (error) {
      applied.reverse();
      for (const change of applied) {
        await this.productsRepo.adjustStock(
          userId,
          change.productId,
          -change.delta,
          change.variationId,
        );
      }
      throw error;
    }
  }

  async replenishment(userId: string): Promise<ReplenishmentSuggestion[]> {
    const { items } = await this.productsRepo.findAll(userId, {
      page: 1,
      limit: 500,
      activeOnly: true,
    });
    const reserved = await this.repo.reservedQuantities(userId);
    const suggestions: ReplenishmentSuggestion[] = [];
    for (const product of items) {
      const minimum = product.stockAlertThreshold ?? 0;
      if (product.variations?.length) {
        for (const variation of product.variations) {
          if (variation.stockQuantity === undefined) continue;
          const held = reserved.get(`${product.id}:${variation.id}`)?.quantity ?? 0;
          const available = variation.stockQuantity - held;
          if (available <= minimum) {
            suggestions.push({
              productId: product.id,
              productName: product.name,
              variationId: variation.id,
              variationName: variation.name,
              available,
              minimum,
              suggestedQuantity: Math.max(1, minimum * 2 - available),
              lastCost: product.costPrice,
            });
          }
        }
      } else if (product.stockQuantity !== null) {
        const held = reserved.get(`${product.id}:product`)?.quantity ?? 0;
        const available = product.stockQuantity - held;
        if (available <= minimum) {
          suggestions.push({
            productId: product.id,
            productName: product.name,
            variationId: null,
            variationName: null,
            available,
            minimum,
            suggestedQuantity: Math.max(1, minimum * 2 - available),
            lastCost: product.costPrice,
          });
        }
      }
    }
    return suggestions;
  }

  async createPurchaseOrderFromSuggestions(userId: string, supplierId?: string) {
    const suggestions = await this.replenishment(userId);
    if (!suggestions.length)
      throw new ValidationError(["Não há itens sugeridos para reposição"]);
    return this.repo.createDocument(
      userId,
      {
        kind: "purchase_order",
        title: `Reposição ${new Date().toLocaleDateString("pt-BR")}`,
        partyId: supplierId,
        payload: { generatedFrom: "stock_minimum" },
        items: suggestions.map((item) => ({
          productId: item.productId,
          variationId: item.variationId ?? undefined,
          name: item.productName,
          variationName: item.variationName ?? undefined,
          quantity: item.suggestedQuantity,
          unitPrice: item.lastCost ?? 0,
        })),
      },
      "draft",
    );
  }

  async bulkUpdatePrices(
    userId: string,
    data: {
      category?: string;
      productIds?: string[];
      percentage?: number;
      markupOnCost?: number;
    },
  ) {
    const { items } = await this.productsRepo.findAll(userId, { page: 1, limit: 500 });
    const selected = items.filter(
      (product) =>
        (data.category ? product.category === data.category : true) &&
        (data.productIds?.length ? data.productIds.includes(product.id) : true),
    );
    if (!selected.length) throw new ValidationError(["Nenhum produto encontrado"]);
    const changed: Array<{ product: Product; newPrice: number }> = [];
    for (const product of selected) {
      const calculated =
        data.markupOnCost !== undefined
          ? (product.costPrice ?? 0) * (1 + data.markupOnCost / 100)
          : product.salePrice * (1 + (data.percentage ?? 0) / 100);
      const newPrice = Math.round(calculated * 100) / 100;
      if (newPrice <= 0)
        throw new ValidationError([`Preço inválido para ${product.name}`]);
      changed.push({ product, newPrice });
    }
    const applied: typeof changed = [];
    try {
      for (const change of changed) {
        await this.productsRepo.update(userId, change.product.id, {
          salePrice: change.newPrice,
        });
        await this.repo.recordPriceChange(
          userId,
          change.product.id,
          change.product.salePrice,
          change.newPrice,
          data.markupOnCost !== undefined ? "markup_on_cost" : "percentage_adjustment",
        );
        applied.push(change);
      }
      return { updated: applied.length };
    } catch (error) {
      applied.reverse();
      for (const change of applied) {
        await this.productsRepo.update(userId, change.product.id, {
          salePrice: change.product.salePrice,
        });
      }
      throw error;
    }
  }

  async batchLabels(userId: string, productIds: string[], template: "product" | "shelf") {
    const products: Product[] = [];
    for (const id of productIds) {
      const product = await this.productsRepo.findById(userId, id);
      if (!product) throw new ValidationError(["Produto de etiqueta não encontrado"]);
      products.push(product);
    }
    const labels = products
      .flatMap((product) => {
        const variants = product.variations?.length ? product.variations : [null];
        return variants.map((variation) => {
          const code = escapeRetailHtml(
            product.code ?? product.id.slice(0, 12).toUpperCase(),
          );
          const name = escapeRetailHtml(
            variation ? `${product.name} — ${variation.name}` : product.name,
          );
          return `<article class="label ${template}"><strong>${name}</strong><span>R$ ${product.salePrice.toFixed(2).replace(".", ",")}</span><code>${code}</code></article>`;
        });
      })
      .join("");
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Etiquetas</title><style>body{font-family:Arial;display:grid;grid-template-columns:repeat(auto-fill,240px);gap:8px}.label{border:1px solid #222;padding:10px;display:grid;gap:6px;break-inside:avoid}.label span{font-size:22px;font-weight:700}.shelf{min-height:90px}code{letter-spacing:2px}@media print{button{display:none}}</style></head><body>${labels}<script>window.print()</script></body></html>`;
  }

  async createFiscalDocument(
    userId: string,
    saleId: string,
    type: "nfce" | "nfe",
    provider?: string,
  ) {
    await this.salesUseCases.getById(userId, saleId);
    return this.repo.createDocument(
      userId,
      {
        kind: "fiscal_document",
        title: `${type.toUpperCase()} da venda`,
        payload: { saleId, type, provider: provider ?? null },
        items: [],
      },
      provider ? "processing" : "waiting_configuration",
    );
  }

  private async cashSummary(session: RetailDocument) {
    const movements = await this.repo.listCashMovements(session.id);
    const expectedByMethod: Record<string, number> = { cash: session.amount };
    for (const movement of movements) {
      const direction =
        movement.type === "withdrawal" || movement.type === "refund" ? -1 : 1;
      expectedByMethod[movement.paymentMethod] =
        (expectedByMethod[movement.paymentMethod] ?? 0) + movement.amount * direction;
    }
    const expectedCash = Math.round((expectedByMethod.cash ?? 0) * 100) / 100;
    const countedCash =
      typeof session.payload.countedCash === "number"
        ? session.payload.countedCash
        : null;
    return {
      session,
      movements,
      expectedByMethod,
      expectedCash,
      countedCash,
      difference:
        countedCash === null
          ? null
          : Math.round((countedCash - expectedCash) * 100) / 100,
    };
  }

  private async normalizeDocumentItems(userId: string, data: CreateRetailDocument) {
    return Promise.all(
      data.items.map(async (item) => {
        if (!item.productId) return item;
        const product = await this.productsRepo.findById(userId, item.productId);
        if (!product) throw new ValidationError([`Produto ${item.name} não encontrado`]);
        const variation = item.variationId
          ? product.variations?.find((candidate) => candidate.id === item.variationId)
          : undefined;
        if (item.variationId && !variation) {
          throw new ValidationError([`Variação inválida para ${product.name}`]);
        }
        const metadata = { ...(item.metadata ?? {}) };
        if (data.kind === "inventory_count") {
          metadata.expected = variation?.stockQuantity ?? product.stockQuantity ?? 0;
        }
        return {
          ...item,
          name: product.name,
          variationName: variation?.name,
          metadata,
        };
      }),
    );
  }

  private validatePromotion(data: CreateRetailPromotion | RetailPromotion) {
    if (new Date(data.endsAt) <= new Date(data.startsAt)) {
      throw new ValidationError(["O fim da promoção deve ser posterior ao início"]);
    }
    if (!data.productId && !data.category) {
      throw new ValidationError(["Informe produto ou categoria da promoção"]);
    }
    if (
      data.type === "buy_x_pay_y" &&
      (!(data.buyQuantity && data.payQuantity) || data.buyQuantity <= data.payQuantity)
    ) {
      throw new ValidationError(["Em leve-X-pague-Y, X deve ser maior que Y"]);
    }
  }

  private async quoteItems(
    userId: string,
    items: Array<{ productId: string; variationId?: string; quantity: number }>,
    excludeReservationId?: string,
  ): Promise<QuotedRetailLine[]> {
    const promotions = await this.repo.listPromotions(userId, new Date());
    const reserved = await this.repo.reservedQuantities(userId, excludeReservationId);
    const lines: QuotedRetailLine[] = [];
    for (const item of items) {
      const product = await this.productsRepo.findById(userId, item.productId);
      if (!product || !product.isActive)
        throw new ValidationError(["Produto indisponível"]);
      const variation = item.variationId
        ? product.variations?.find((candidate) => candidate.id === item.variationId)
        : undefined;
      if (product.variations?.length && !variation) {
        throw new ValidationError([`Escolha uma variação para ${product.name}`]);
      }
      const physical = variation?.stockQuantity ?? product.stockQuantity;
      const held =
        reserved.get(`${product.id}:${variation?.id ?? "product"}`)?.quantity ?? 0;
      if (physical !== null && physical - held < item.quantity) {
        throw new ValidationError([
          `Estoque disponível insuficiente para ${product.name}`,
        ]);
      }
      lines.push(quoteRetailLine(product, item.quantity, item.variationId, promotions));
    }
    return lines;
  }

  private async prepareCheckoutQuote(userId: string, data: CheckoutQuoteData) {
    if (data.catalogOrderId) {
      const order = await this.getDocument(userId, data.catalogOrderId);
      if (order.kind !== "catalog_order" || order.status !== "ready") {
        throw new ValidationError([
          "O pedido do catálogo precisa estar pronto para recebimento",
        ]);
      }
      const expected = order.items
        .map((item) => `${item.productId}:${item.variationId}:${item.quantity}`)
        .sort((left, right) => left.localeCompare(right));
      const received = data.items
        .map((item) => `${item.productId}:${item.variationId ?? null}:${item.quantity}`)
        .sort((left, right) => left.localeCompare(right));
      if (expected.join("|") !== received.join("|")) {
        throw new ValidationError(["Os itens da venda diferem da reserva do catálogo"]);
      }
    }
    let lines = await this.quoteItems(userId, data.items, data.catalogOrderId);
    let businessAccount: BusinessAccount | undefined;
    let accountDiscount = 0;
    if (data.businessAccountId) {
      businessAccount = (await this.repo.listBusinessAccounts(userId)).find(
        (account) => account.id === data.businessAccountId && account.active,
      );
      if (!businessAccount || businessAccount.clientId !== data.clientId) {
        throw new ValidationError(["Convênio inválido para o cliente selecionado"]);
      }
      accountDiscount =
        lines.reduce((sum, line) => sum + line.subtotal, 0) *
        (businessAccount.discountPercent / 100);
    }
    try {
      lines = distributeManualDiscount(lines, data.manualDiscount + accountDiscount);
    } catch (error) {
      throw new ValidationError([
        error instanceof Error ? error.message : "Desconto inválido",
      ]);
    }
    return {
      lines,
      businessAccount,
      total: this.linesTotal(lines),
      originalTotal:
        Math.round(
          lines.reduce((sum, line) => sum + line.originalUnitPrice * line.quantity, 0) *
            100,
        ) / 100,
      discount:
        Math.round(lines.reduce((sum, line) => sum + line.discount, 0) * 100) / 100,
    };
  }

  private linesTotal(lines: QuotedRetailLine[]): number {
    return (
      Math.round(
        lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) * 100,
      ) / 100
    );
  }
}
