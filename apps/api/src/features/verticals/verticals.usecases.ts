import {
  parseVerticalPayload,
  type CreateResaleSerial,
  type CreateVerticalAsset,
  type CreateVerticalDocument,
  type PublishedVerticalDomain,
  type UpdateVerticalDocument,
  type VerticalDocumentKind,
} from "@lucro-caseiro/contracts";

import { ConflictError, NotFoundError, ValidationError } from "../../shared/errors";
import {
  canTransitionVerticalDocument,
  initialVerticalStatus,
  verticalDocumentTotals,
} from "./verticals.domain";
import type { IVerticalsRepo } from "./verticals.types";

export class VerticalsUseCases {
  constructor(private repo: IVerticalsRepo) {}

  touchMembership(userId: string, brandId: string, domain: PublishedVerticalDomain) {
    return this.repo.touchMembership(userId, brandId, domain);
  }

  listMemberships(userId: string) {
    return this.repo.listMemberships(userId);
  }

  listDocuments(
    userId: string,
    domain: PublishedVerticalDomain,
    kind?: VerticalDocumentKind,
    status?: string,
  ) {
    return this.repo.listDocuments(userId, domain, kind, status);
  }

  async getDocument(userId: string, domain: PublishedVerticalDomain, id: string) {
    const document = await this.repo.findDocument(userId, domain, id);
    if (!document) throw new NotFoundError("Documento operacional não encontrado");
    return document;
  }

  async createDocument(userId: string, data: CreateVerticalDocument) {
    const payload = parseVerticalPayload(data.domain, data.kind, data.payload);
    await this.validateDocumentReferences(userId, data, payload);
    const totals = data.items.length
      ? verticalDocumentTotals(data.items)
      : { amount: data.amount, cost: data.cost };
    return this.repo.createDocument(
      userId,
      { ...data, ...totals, payload },
      initialVerticalStatus(data.domain, data.kind),
    );
  }

  async updateDocument(
    userId: string,
    domain: PublishedVerticalDomain,
    id: string,
    data: UpdateVerticalDocument,
  ) {
    const current = await this.getDocument(userId, domain, id);
    const mergedPayload = data.payload
      ? { ...current.payload, ...data.payload }
      : current.payload;
    const payload = parseVerticalPayload(domain, current.kind, mergedPayload);
    await this.validateDocumentReferences(
      userId,
      {
        domain,
        kind: current.kind,
        clientId: current.clientId ?? undefined,
        parentId: current.parentId ?? undefined,
        items: (data.items ?? current.items).map((item) => ({
          ...item,
          productId: item.productId ?? undefined,
        })),
      },
      payload,
    );
    const totals = data.items ? verticalDocumentTotals(data.items) : undefined;
    const updated = await this.repo.updateDocument(userId, domain, id, {
      ...data,
      ...(totals ?? {}),
      payload,
    });
    if (!updated) throw new ConflictError("O documento foi alterado em outro acesso");
    return updated;
  }

  async transitionDocument(
    userId: string,
    domain: PublishedVerticalDomain,
    id: string,
    status: string,
    idempotencyKey: string,
    payload: Record<string, unknown>,
  ) {
    const current = await this.getDocument(userId, domain, id);
    if (!canTransitionVerticalDocument(current, status)) {
      throw new ValidationError([
        `Transição inválida para ${current.kind}: ${current.status} → ${status}`,
      ]);
    }
    const updated = await this.repo.transitionDocument(
      userId,
      domain,
      id,
      current.status,
      status,
      idempotencyKey,
      payload,
    );
    if (!updated) throw new ConflictError("O estado do documento mudou");
    return updated;
  }

  dashboard(userId: string, domain: PublishedVerticalDomain) {
    return this.repo.dashboard(userId, domain);
  }

  async createAsset(
    userId: string,
    domain: PublishedVerticalDomain,
    data: CreateVerticalAsset,
  ) {
    if (domain !== "oficina") throw new ValidationError(["Ativos pertencem à Oficina"]);
    if (data.clientId && !(await this.repo.ownsClient(userId, data.clientId))) {
      throw new ValidationError(["Cliente não pertence a esta conta"]);
    }
    return this.repo.createAsset(userId, data);
  }

  listAssets(userId: string, domain: PublishedVerticalDomain) {
    if (domain !== "oficina") throw new ValidationError(["Ativos pertencem à Oficina"]);
    return this.repo.listAssets(userId, domain);
  }

  async createSerial(
    userId: string,
    domain: PublishedVerticalDomain,
    data: CreateResaleSerial,
  ) {
    if (domain !== "revenda") throw new ValidationError(["Seriais pertencem à Revenda"]);
    if (!(await this.repo.ownsProducts(userId, [data.productId]))) {
      throw new ValidationError(["Produto não pertence a esta conta"]);
    }
    if (
      data.lotDocumentId &&
      !(await this.repo.ownsDocumentKind(
        userId,
        domain,
        data.lotDocumentId,
        "inventory_lot",
      ))
    ) {
      throw new ValidationError(["Lote não pertence a esta conta"]);
    }
    return this.repo.createSerial(userId, data);
  }

  listSerials(userId: string, domain: PublishedVerticalDomain, status?: string) {
    if (domain !== "revenda") throw new ValidationError(["Seriais pertencem à Revenda"]);
    return this.repo.listSerials(userId, status);
  }

  async updateSerialStatus(
    userId: string,
    domain: PublishedVerticalDomain,
    id: string,
    expectedStatus: string,
    status: string,
    saleId?: string,
  ) {
    if (domain !== "revenda") throw new ValidationError(["Seriais pertencem à Revenda"]);
    const allowedStatuses: Record<string, readonly string[]> = {
      available: ["reserved", "sold", "warranty"],
      reserved: ["available", "sold"],
      sold: ["returned", "warranty"],
      returned: ["available", "warranty"],
      warranty: ["available", "returned"],
    };
    if (!allowedStatuses[expectedStatus]?.includes(status)) {
      throw new ValidationError([
        `Transição de serial inválida: ${expectedStatus} → ${status}`,
      ]);
    }
    if (status === "sold" && (!saleId || !(await this.repo.ownsSale(userId, saleId)))) {
      throw new ValidationError(["Informe uma venda válida desta conta"]);
    }
    const updated = await this.repo.updateSerialStatus(
      userId,
      id,
      expectedStatus,
      status,
      saleId,
    );
    if (!updated) throw new ConflictError("O serial não está mais no estado informado");
    return updated;
  }

  private async validateDocumentReferences(
    userId: string,
    data: Pick<
      CreateVerticalDocument,
      "domain" | "kind" | "clientId" | "parentId" | "items"
    >,
    payload: Record<string, unknown>,
  ) {
    if (data.clientId && !(await this.repo.ownsClient(userId, data.clientId))) {
      throw new ValidationError(["Cliente não pertence a esta conta"]);
    }
    const productIds = data.items
      .map((item) => item.productId)
      .filter((id): id is string => !!id);
    if (!(await this.repo.ownsProducts(userId, productIds))) {
      throw new ValidationError(["Um dos produtos não pertence a esta conta"]);
    }
    if (
      data.parentId &&
      !(await this.repo.ownsDocumentKind(userId, data.domain, data.parentId))
    ) {
      throw new ValidationError(["Documento pai não pertence a esta conta"]);
    }

    const assetId = typeof payload.assetId === "string" ? payload.assetId : undefined;
    if (assetId && !(await this.repo.ownsAsset(userId, assetId))) {
      throw new ValidationError(["Ativo não pertence a esta conta"]);
    }
    const serviceOrderId =
      typeof payload.serviceOrderId === "string" ? payload.serviceOrderId : undefined;
    if (
      serviceOrderId &&
      !(await this.repo.ownsDocumentKind(
        userId,
        "oficina",
        serviceOrderId,
        "service_order",
      ))
    ) {
      throw new ValidationError(["Ordem de serviço não pertence a esta conta"]);
    }
    const projectId =
      typeof payload.projectId === "string" ? payload.projectId : undefined;
    if (
      projectId &&
      !(await this.repo.ownsDocumentKind(userId, "obra", projectId, "project"))
    ) {
      throw new ValidationError(["Obra vinculada não pertence a esta conta"]);
    }
  }
}
