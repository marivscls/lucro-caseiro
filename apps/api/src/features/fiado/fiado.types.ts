import type { PixSettings } from "@lucro-caseiro/contracts";

export interface StatementSale {
  soldAt: Date;
  total: number;
  paidAmount: number;
  description: string;
}

export interface FiadoStatement {
  brandId: string;
  owner: {
    name: string;
    businessName: string | null;
    phone: string | null;
    pix: PixSettings;
  };
  clientName: string;
  sales: StatementSale[];
}

export interface IFiadoRepo {
  getPixSettings(userId: string): Promise<PixSettings | null>;
  updatePixSettings(userId: string, data: PixSettings): Promise<PixSettings>;
  clientExists(userId: string, clientId: string): Promise<boolean>;
  findLinkToken(userId: string, clientId: string): Promise<string | null>;
  insertLink(
    userId: string,
    clientId: string,
    token: string,
    brandId: string,
  ): Promise<string>;
  findStatement(token: string): Promise<FiadoStatement | null>;
}
