import type {
  Supplier,
  SupplierAvatarType,
  SupplierCategory,
  SuppliersOverview,
} from "@lucro-caseiro/contracts";

export interface ISuppliersRepo {
  create(userId: string, data: CreateSupplierData): Promise<Supplier>;
  findById(userId: string, id: string): Promise<Supplier | null>;
  findDuplicate(
    userId: string,
    data: Pick<CreateSupplierData, "name" | "phone" | "email">,
    excludeId?: string,
  ): Promise<Supplier | null>;
  findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: Supplier[]; total: number }>;
  getOverview(userId: string, now: Date): Promise<SuppliersOverview>;
  update(
    userId: string,
    id: string,
    data: Partial<CreateSupplierData>,
  ): Promise<Supplier | null>;
  delete(userId: string, id: string): Promise<boolean>;
  countByUser(userId: string): Promise<number>;
}

export interface CreateSupplierData {
  name: string;
  category?: SupplierCategory;
  phone?: string | null;
  hasWhatsApp?: boolean;
  email?: string | null;
  address?: string | null;
  purchaseDescription?: string | null;
  notes?: string | null;
  isPreferred?: boolean;
  avatarType?: SupplierAvatarType;
  avatarPresetId?: string | null;
  avatarUrl?: string | null;
  needsFollowUp?: boolean;
  restockSoon?: boolean;
  isActive?: boolean;
}

export interface FindAllOpts {
  page: number;
  limit: number;
  search?: string;
}
