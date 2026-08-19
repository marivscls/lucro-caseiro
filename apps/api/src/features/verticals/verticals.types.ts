import type {
  AppMembership,
  CreateResaleSerialDto,
  CreateVerticalAsset,
  CreateVerticalDocument,
  PublishedVerticalDomain,
  ResaleSerial,
  UpdateVerticalDocument,
  VerticalAsset,
  VerticalDashboard,
  VerticalDocument,
  VerticalDocumentKind,
} from "@lucro-caseiro/contracts";
import type { z } from "zod";

export type CreateResaleSerialData = z.infer<typeof CreateResaleSerialDto>;

export interface IVerticalsRepo {
  touchMembership(
    userId: string,
    brandId: string,
    domain: PublishedVerticalDomain,
  ): Promise<AppMembership>;
  listMemberships(userId: string): Promise<AppMembership[]>;
  createDocument(
    userId: string,
    data: CreateVerticalDocument,
    status: string,
  ): Promise<VerticalDocument>;
  findDocument(
    userId: string,
    domain: PublishedVerticalDomain,
    id: string,
  ): Promise<VerticalDocument | null>;
  listDocuments(
    userId: string,
    domain: PublishedVerticalDomain,
    kind?: VerticalDocumentKind,
    status?: string,
  ): Promise<VerticalDocument[]>;
  updateDocument(
    userId: string,
    domain: PublishedVerticalDomain,
    id: string,
    data: UpdateVerticalDocument & { payload?: Record<string, unknown> },
  ): Promise<VerticalDocument | null>;
  transitionDocument(
    userId: string,
    domain: PublishedVerticalDomain,
    id: string,
    fromStatus: string,
    toStatus: string,
    idempotencyKey: string,
    payload: Record<string, unknown>,
  ): Promise<VerticalDocument | null>;
  dashboard(userId: string, domain: PublishedVerticalDomain): Promise<VerticalDashboard>;
  createAsset(userId: string, data: CreateVerticalAsset): Promise<VerticalAsset>;
  listAssets(userId: string, domain: "oficina"): Promise<VerticalAsset[]>;
  createSerial(userId: string, data: CreateResaleSerialData): Promise<ResaleSerial>;
  listSerials(userId: string, status?: string): Promise<ResaleSerial[]>;
  updateSerialStatus(
    userId: string,
    id: string,
    expectedStatus: string,
    status: string,
    saleId?: string,
  ): Promise<ResaleSerial | null>;
  ownsClient(userId: string, id: string): Promise<boolean>;
  ownsProducts(userId: string, ids: string[]): Promise<boolean>;
  ownsAsset(userId: string, id: string): Promise<boolean>;
  ownsDocumentKind(
    userId: string,
    domain: PublishedVerticalDomain,
    id: string,
    kind?: VerticalDocumentKind,
  ): Promise<boolean>;
  ownsSale(userId: string, id: string): Promise<boolean>;
}
